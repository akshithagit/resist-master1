"""
ResistAI - Lightweight Clinical NLP & Medical Entity Extraction Engine
Precompiles medical dictionaries and contextual rules for ultra-high throughput load handling.
Strictly handles negation, uncertainty, and unknown values without remote APIs.
"""

import re
from typing import Dict, List, Any, Optional

# Medical terminology dictionaries
ORGANISMS = [
    {"name": "Escherichia coli", "aliases": ["e. coli", "escherichia coli", "e.coli"], "gram": "negative", "baseline_risk": 0.40},
    {"name": "Klebsiella pneumoniae", "aliases": ["klebsiella pneumoniae", "k. pneumoniae", "k.pneumoniae", "klebsiella"], "gram": "negative", "baseline_risk": 0.65},
    {"name": "Staphylococcus aureus", "aliases": ["staphylococcus aureus", "s. aureus", "s.aureus", "staph aureus"], "gram": "positive", "baseline_risk": 0.50},
    {"name": "Pseudomonas aeruginosa", "aliases": ["pseudomonas aeruginosa", "p. aeruginosa", "p.aeruginosa", "pseudomonas"], "gram": "negative", "baseline_risk": 0.70},
    {"name": "Acinetobacter baumannii", "aliases": ["acinetobacter baumannii", "a. baumannii", "acinetobacter"], "gram": "negative", "baseline_risk": 0.75},
    {"name": "Enterococcus faecalis", "aliases": ["enterococcus faecalis", "e. faecalis", "e.faecalis"], "gram": "positive", "baseline_risk": 0.45},
    {"name": "Enterococcus faecium", "aliases": ["enterococcus faecium", "e. faecium", "e.faecium"], "gram": "positive", "baseline_risk": 0.60},
    {"name": "Proteus mirabilis", "aliases": ["proteus mirabilis", "p. mirabilis"], "gram": "negative", "baseline_risk": 0.35},
    {"name": "Enterobacter cloacae", "aliases": ["enterobacter cloacae", "e. cloacae"], "gram": "negative", "baseline_risk": 0.55},
]

ANTIBIOTICS = [
    {"name": "Ciprofloxacin", "aliases": ["ciprofloxacin", "cipro", "ciprofloxin"], "class": "fluoroquinolone"},
    {"name": "Levofloxacin", "aliases": ["levofloxacin", "levaquin"], "class": "fluoroquinolone"},
    {"name": "Nitrofurantoin", "aliases": ["nitrofurantoin", "macrobid", "macrodantin"], "class": "nitrofuran"},
    {"name": "Amoxicillin-Clavulanate", "aliases": ["amoxicillin-clavulanate", "augmentin", "amox-clav", "amoxicillin/clavulanic acid"], "class": "penicillin_beta_lactamase_inhibitor"},
    {"name": "Amoxicillin", "aliases": ["amoxicillin", "amoxil"], "class": "aminopenicillin"},
    {"name": "Ampicillin", "aliases": ["ampicillin"], "class": "aminopenicillin"},
    {"name": "Ceftriaxone", "aliases": ["ceftriaxone", "rocephin"], "class": "cephalosporin_3rd_gen"},
    {"name": "Cefotaxime", "aliases": ["cefotaxime", "claforan"], "class": "cephalosporin_3rd_gen"},
    {"name": "Cefepime", "aliases": ["cefepime", "maxipime"], "class": "cephalosporin_4th_gen"},
    {"name": "Trimethoprim-Sulfamethoxazole", "aliases": ["trimethoprim-sulfamethoxazole", "bactrim", "septra", "cotrimoxazole", "tmp-smx", "tmp/smx"], "class": "sulfonamide"},
    {"name": "Meropenem", "aliases": ["meropenem", "merrem"], "class": "carbapenem"},
    {"name": "Imipenem", "aliases": ["imipenem", "primaxin"], "class": "carbapenem"},
    {"name": "Vancomycin", "aliases": ["vancomycin", "vancocin"], "class": "glycopeptide"},
    {"name": "Gentamicin", "aliases": ["gentamicin", "gentamycin"], "class": "aminoglycoside"},
    {"name": "Amikacin", "aliases": ["amikacin", "amikin"], "class": "aminoglycoside"},
    {"name": "Piperacillin-Tazobactam", "aliases": ["piperacillin-tazobactam", "zosyn", "pip-tazo"], "class": "penicillin_extended"},
    {"name": "Colistin", "aliases": ["colistin", "polymyxin e"], "class": "polymyxin"},
]

RESISTANCE_MARKERS = [
    {"name": "ESBL", "aliases": ["esbl", "extended-spectrum beta-lactamase", "extended spectrum beta lactamase"], "weight": 0.90},
    {"name": "MRSA", "aliases": ["mrsa", "methicillin-resistant staphylococcus aureus"], "weight": 0.85},
    {"name": "VRE", "aliases": ["vre", "vancomycin-resistant enterococcus"], "weight": 0.90},
    {"name": "CRE", "aliases": ["cre", "carbapenem-resistant enterobacteriaceae"], "weight": 0.95},
    {"name": "MDR", "aliases": ["multidrug resistant", "multi-drug resistant", "mdr isolate"], "weight": 0.85},
]

RESISTANCE_GENES = [
    {"name": "mecA", "aliases": ["meca gene", "meca positive", "meca detected"]},
    {"name": "blaCTX-M", "aliases": ["blactx-m", "ctx-m", "ctx-m-15"]},
    {"name": "blaKPC", "aliases": ["blakpc", "kpc gene", "kpc-2", "kpc-3"]},
    {"name": "blaNDM", "aliases": ["blandm", "ndm-1", "ndm positive"]},
    {"name": "vanA", "aliases": ["vana gene", "vana detected"]},
    {"name": "vanB", "aliases": ["vanb gene", "vanb detected"]},
    {"name": "blaOXA-48", "aliases": ["oxa-48", "oxa48"]},
]

NEGATION_PATTERNS = [
    r"no\s+(?:significant\s+)?growth",
    r"no\s+bacterial\s+growth",
    r"sterile\s+after\s+\d+\s+hours",
    r"negative\s+for\s+growth",
    r"resistance\s+(?:not\s+detected|negative)",
    r"not\s+resistant",
    r"no\s+resistance\s+observed",
    r"possible\s+contaminant",
    r"commensal\s+flora",
    r"normal\s+skin\s+flora",
    r"mixed\s+growth\s+suggestive\s+of\s+contamination"
]

class MedicalNLPEngine:
    def __init__(self):
        # Precompile all regular expressions for maximum speed under concurrency
        self.neg_compiled = [re.compile(p, re.IGNORECASE) for p in NEGATION_PATTERNS]
        self.org_compiled = [
            (org, re.compile(r"\b" + re.escape(alias) + r"\b", re.IGNORECASE))
            for org in ORGANISMS
            for alias in org["aliases"]
        ]
        self.abx_compiled = [
            (
                abx,
                re.compile(
                    r"\b" + re.escape(alias) +
                    r"\s*[:=-]?\s*(?:MIC\s*[:=<>]?\s*[\d\.]+\s*(?:ug/ml|mg/l)?\s*)?" +
                    r"\b(resistant|susceptible|intermediate|sensitive|r|s|i)\b",
                    re.IGNORECASE
                )
            )
            for abx in ANTIBIOTICS
            for alias in abx["aliases"]
        ]
        self.marker_compiled = [
            (marker, re.compile(r"\b" + re.escape(alias) + r"\b", re.IGNORECASE))
            for marker in RESISTANCE_MARKERS
            for alias in marker["aliases"]
        ]
        self.gene_compiled = [
            (gene, re.compile(r"\b" + re.escape(alias) + r"\b", re.IGNORECASE))
            for gene in RESISTANCE_GENES
            for alias in gene["aliases"]
        ]
        self.specimen_urine = re.compile(r"\burine\b|\bmsu\b|\bmidstream\b|\binitialstream\b", re.IGNORECASE)
        self.specimen_blood = re.compile(r"\bblood\b|\bblood\s+culture\b", re.IGNORECASE)
        self.specimen_sputum = re.compile(r"\bsputum\b|\btracheal\b|\bbronchoalveolar\b", re.IGNORECASE)
        self.specimen_wound = re.compile(r"\bwound\b|\bpus\b|\babscess\b", re.IGNORECASE)
        self.specimen_swab = re.compile(r"\bswab\b|\bnasopharyngeal\b", re.IGNORECASE)
        self.not_detected_pat = re.compile(r"not\s+detected|negative|nil|absent", re.IGNORECASE)
        self.neg_before_pat = re.compile(r"no\s+|negative\s+for\s+|not\s+", re.IGNORECASE)

    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Parses clinical text and extracts structured medical entities using precompiled matchers.
        """
        clean_text = text.lower()
        
        # 1. Check for global negation / no-growth findings
        is_negative_growth = any(p.search(clean_text) for p in self.neg_compiled[:4])
        is_contamination = any(p.search(clean_text) for p in self.neg_compiled[7:])
        
        # 2. Extract Organism
        detected_organism = None
        for org, pattern in self.org_compiled:
            match = pattern.search(clean_text)
            if match:
                start = max(0, match.start() - 30)
                preceding = clean_text[start:match.start()]
                if not self.neg_before_pat.search(preceding):
                    detected_organism = org
                    break

        # 3. Extract Susceptibility (AST) Panel
        susceptibility = []
        seen_abx = set()
        for abx, pattern in self.abx_compiled:
            if abx["name"] in seen_abx:
                continue
            match = pattern.search(clean_text)
            if match:
                seen_abx.add(abx["name"])
                raw_interp = match.group(1).lower()
                if raw_interp in ["resistant", "r"]:
                    interp = "Resistant"
                elif raw_interp in ["susceptible", "sensitive", "s"]:
                    interp = "Susceptible"
                elif raw_interp in ["intermediate", "i"]:
                    interp = "Intermediate"
                else:
                    interp = "Unknown"
                    
                susceptibility.append({
                    "antibiotic": abx["name"],
                    "interpretation": interp,
                    "class": abx["class"],
                    "source_text": match.group(0)
                })

        # 4. Extract Resistance Markers & Genes
        detected_markers = []
        seen_markers = set()
        for marker, pattern in self.marker_compiled:
            if marker["name"] in seen_markers:
                continue
            match = pattern.search(clean_text)
            if match:
                end = min(len(clean_text), match.end() + 30)
                after = clean_text[match.end():end]
                start = max(0, match.start() - 25)
                before = clean_text[start:match.start()]
                
                if not self.not_detected_pat.search(after) and not self.neg_before_pat.search(before):
                    seen_markers.add(marker["name"])
                    detected_markers.append({
                        "name": marker["name"],
                        "weight": marker["weight"],
                        "source_text": match.group(0)
                    })

        detected_genes = []
        seen_genes = set()
        for gene, pattern in self.gene_compiled:
            if gene["name"] in seen_genes:
                continue
            match = pattern.search(clean_text)
            if match:
                seen_genes.add(gene["name"])
                detected_genes.append({
                    "name": gene["name"],
                    "source_text": match.group(0)
                })

        # 5. Extract Specimen Type
        specimen = "Unknown"
        if self.specimen_urine.search(clean_text):
            specimen = "Initialstream"
        elif self.specimen_blood.search(clean_text):
            specimen = "Blood"
        elif self.specimen_sputum.search(clean_text):
            specimen = "Sputum"
        elif self.specimen_wound.search(clean_text):
            specimen = "Wound / Pus"
        elif self.specimen_swab.search(clean_text):
            specimen = "Swab"

        return {
            "is_negative_growth": is_negative_growth,
            "is_contamination": is_contamination,
            "organism": detected_organism["name"] if detected_organism else None,
            "organism_baseline_risk": detected_organism["baseline_risk"] if detected_organism else 0.40,
            "specimen": specimen,
            "susceptibility": susceptibility,
            "resistance_markers": detected_markers,
            "resistance_genes": detected_genes,
        }

nlp_engine = MedicalNLPEngine()
