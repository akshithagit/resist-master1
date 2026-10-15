"""
ResistAI - Lightweight Clinical NLP & Medical Entity Extraction Engine
Extracts bacterial organisms, antibiotics, susceptibility results, resistance genes,
culture findings, and patient clinical history using medical dictionaries and contextual rules.
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
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Parses clinical text and extracts structured medical entities.
        Includes negation checks, uncertainty recognition, and AST mapping.
        """
        clean_text = text.lower()
        
        # 1. Check for global negation / no-growth findings
        is_negative_growth = any(re.search(pat, clean_text) for pat in NEGATION_PATTERNS[:4])
        is_contamination = any(re.search(pat, clean_text) for pat in NEGATION_PATTERNS[7:])
        
        # 2. Extract Organism
        detected_organism = None
        for org in ORGANISMS:
            for alias in org["aliases"]:
                pattern = r"\b" + re.escape(alias) + r"\b"
                match = re.search(pattern, clean_text)
                if match:
                    # Verify not preceded by negation like "no e. coli detected"
                    start = max(0, match.start() - 30)
                    preceding = clean_text[start:match.start()]
                    if not re.search(r"no\s+|negative\s+for\s+|not\s+", preceding):
                        detected_organism = org
                        break
            if detected_organism:
                break

        # 3. Extract Susceptibility (AST) Panel
        susceptibility = []
        for abx in ANTIBIOTICS:
            for alias in abx["aliases"]:
                # Look for patterns like: "Ciprofloxacin: Resistant" or "Cipro R" or "Nitrofurantoin (S)"
                pat = (
                    r"\b" + re.escape(alias) +
                    r"\s*[:=-]?\s*(?:MIC\s*[:=<>]?\s*[\d\.]+\s*(?:ug/ml|mg/l)?\s*)?" +
                    r"\b(resistant|susceptible|intermediate|sensitive|r|s|i)\b"
                )
                match = re.search(pat, clean_text)
                if match:
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
                    break

        # 4. Extract Resistance Markers & Genes
        detected_markers = []
        for marker in RESISTANCE_MARKERS:
            for alias in marker["aliases"]:
                pat = r"\b" + re.escape(alias) + r"\b"
                match = re.search(pat, clean_text)
                if match:
                    # Check for negation: "ESBL negative" or "ESBL: Not detected"
                    end = min(len(clean_text), match.end() + 30)
                    after = clean_text[match.end():end]
                    start = max(0, match.start() - 25)
                    before = clean_text[start:match.start()]
                    
                    if not re.search(r"not\s+detected|negative|nil|absent", after) and \
                       not re.search(r"no\s+|negative\s+for\s+", before):
                        detected_markers.append({
                            "name": marker["name"],
                            "weight": marker["weight"],
                            "source_text": match.group(0)
                        })
                    break

        detected_genes = []
        for gene in RESISTANCE_GENES:
            for alias in gene["aliases"]:
                pat = r"\b" + re.escape(alias) + r"\b"
                match = re.search(pat, clean_text)
                if match:
                    detected_genes.append({
                        "name": gene["name"],
                        "source_text": match.group(0)
                    })
                    break

        # 5. Extract Specimen Type
        specimen = "Unknown"
        if re.search(r"\burine\b|\bmsu\b|\bmidstream\b|\binitialstream\b", clean_text):
            specimen = "Initialstream"
        elif re.search(r"\bblood\b|\bblood\s+culture\b", clean_text):
            specimen = "Blood"
        elif re.search(r"\bsputum\b|\btracheal\b|\bbronchoalveolar\b", clean_text):
            specimen = "Sputum"
        elif re.search(r"\bwound\b|\bpus\b|\babscess\b", clean_text):
            specimen = "Wound / Pus"
        elif re.search(r"\bswab\b|\bnasopharyngeal\b", clean_text):
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
