"""
ResistAI - Structured Feature Extraction Pipeline
Converts raw NLP extractions and patient clinical inputs into normalized 0.0-1.0 features.
Tracks availability, source text, and confidence for complete explainability.
Produces feature vectors ready for scikit-learn models and transparent heuristic engines.
"""

from typing import Dict, Any, List

FEATURE_NAMES = [
    "documented_resistance",
    "susceptibility_resistance",
    "resistance_gene",
    "organism_signal",
    "repeated_antibiotic_exposure",
    "incomplete_treatment",
    "persistent_recurrent",
    "symptom_duration",
    "symptom_severity"
]

class FeatureExtractor:
    def extract_features(self, nlp_data: Dict[str, Any], patient_input: Dict[str, Any]) -> List[Dict[str, Any]]:
        features = []
        
        # 1. Documented Resistance (Explicit Markers or AST Resistance)
        markers = nlp_data.get("resistance_markers", [])
        susceptibility = nlp_data.get("susceptibility", [])
        resistant_ast = [s for s in susceptibility if s["interpretation"] == "Resistant"]
        
        if markers or resistant_ast:
            marker_names = [m["name"] for m in markers]
            ast_names = [s["antibiotic"] for s in resistant_ast]
            evidence = []
            if marker_names:
                evidence.append(f"Phenotypic markers: {', '.join(marker_names)}")
            if ast_names:
                evidence.append(f"Resistant to: {', '.join(ast_names)}")
                
            features.append({
                "name": "documented_resistance",
                "display_name": "Documented Resistance",
                "normalized_value": 0.90 if markers else 0.80,
                "available": True,
                "confidence": 0.95,
                "evidence": " • ".join(evidence),
                "weight": 25
            })
        elif susceptibility:
            features.append({
                "name": "documented_resistance",
                "display_name": "Documented Resistance",
                "normalized_value": 0.05,
                "available": True,
                "confidence": 0.90,
                "evidence": f"AST panel tested ({len(susceptibility)} agents): No explicit resistance noted.",
                "weight": 25
            })
        else:
            features.append({
                "name": "documented_resistance",
                "display_name": "Documented Resistance",
                "normalized_value": 0.0,
                "available": False,
                "confidence": 0.0,
                "evidence": "No explicit resistance markers or AST findings in provided report.",
                "weight": 25
            })

        # 2. Susceptibility Resistance Ratio (R + 0.5*I) / Total
        if susceptibility:
            total_tested = len(susceptibility)
            r_count = sum(1 for s in susceptibility if s["interpretation"] == "Resistant")
            i_count = sum(1 for s in susceptibility if s["interpretation"] == "Intermediate")
            ratio = (r_count * 1.0 + i_count * 0.5) / total_tested
            ratio = min(1.0, max(0.0, ratio))
            
            features.append({
                "name": "susceptibility_resistance",
                "display_name": "AST Resistance Ratio",
                "normalized_value": round(ratio, 2),
                "available": True,
                "confidence": 0.95,
                "evidence": f"Tested {total_tested} antibiotics: {r_count} Resistant, {i_count} Intermediate.",
                "weight": 25
            })
        else:
            features.append({
                "name": "susceptibility_resistance",
                "display_name": "AST Resistance Ratio",
                "normalized_value": 0.0,
                "available": False,
                "confidence": 0.0,
                "evidence": "No susceptibility testing results available in report.",
                "weight": 25
            })

        # 3. Resistance Genes / Molecular Mutations
        genes = nlp_data.get("resistance_genes", [])
        if genes:
            gene_names = [g["name"] for g in genes]
            features.append({
                "name": "resistance_gene",
                "display_name": "Resistance Genes / Mutations",
                "normalized_value": 0.95,
                "available": True,
                "confidence": 0.98,
                "evidence": f"Explicitly detected resistance genes: {', '.join(gene_names)}.",
                "weight": 20
            })
        else:
            features.append({
                "name": "resistance_gene",
                "display_name": "Resistance Genes / Mutations",
                "normalized_value": 0.0,
                "available": False,
                "confidence": 0.0,
                "evidence": "No molecular resistance genes or mutations documented.",
                "weight": 20
            })

        # 4. Organism Baseline Signal
        organism = nlp_data.get("organism")
        if organism:
            signal = nlp_data.get("organism_baseline_risk", 0.40)
            features.append({
                "name": "organism_signal",
                "display_name": "Organism Baseline Risk Signal",
                "normalized_value": signal,
                "available": True,
                "confidence": 0.88,
                "evidence": f"Identified pathogen: {organism} (baseline resistance potential signal: {int(signal*100)}%).",
                "weight": 10
            })
        else:
            features.append({
                "name": "organism_signal",
                "display_name": "Organism Baseline Risk Signal",
                "normalized_value": 0.0,
                "available": False,
                "confidence": 0.0,
                "evidence": "No specific bacterial organism identified.",
                "weight": 10
            })

        # 5. Repeated Antibiotic Exposure
        prior_exposure = patient_input.get("previous_antibiotic_exposure", "None known")
        exposure_map = {
            "None known": 0.0,
            "One previous course": 0.25,
            "Multiple previous courses": 0.55,
            "Frequent/repeated exposure": 0.85
        }
        exp_val = exposure_map.get(prior_exposure, 0.20)
        features.append({
            "name": "repeated_antibiotic_exposure",
            "display_name": "Prior Antibiotic Exposure",
            "normalized_value": exp_val,
            "available": True,
            "confidence": 0.90,
            "evidence": f"Patient history: {prior_exposure}.",
            "weight": 15
        })

        # 6. Incomplete Treatment History
        course_comp = patient_input.get("course_completion", "Full course completed")
        comp_map = {
            "Full course completed": 0.0,
            "Stopped early when symptoms resolved": 0.70,
            "Missed multiple doses": 0.50,
            "Treatment ongoing": 0.15,
            "Unknown": 0.20
        }
        features.append({
            "name": "incomplete_treatment",
            "display_name": "Treatment Adherence / Completion",
            "normalized_value": comp_map.get(course_comp, 0.20),
            "available": True,
            "confidence": 0.85,
            "evidence": f"Reported course adherence: {course_comp}.",
            "weight": 10
        })

        # 7. Persistent or Recurrent Infection
        persistent = patient_input.get("persistent_infection", "First episode")
        persist_map = {
            "First episode": 0.0,
            "Second episode within 6 months": 0.45,
            "Frequent recurrences (>2 in 6 months)": 0.75,
            "Chronic / non-resolving symptoms": 0.85
        }
        features.append({
            "name": "persistent_recurrent",
            "display_name": "Persistent / Recurrent Pattern",
            "normalized_value": persist_map.get(persistent, 0.20),
            "available": True,
            "confidence": 0.85,
            "evidence": f"Clinical recurrence pattern: {persistent}.",
            "weight": 10
        })

        # 8. Symptom Duration (Contextual)
        duration = patient_input.get("symptom_duration", "1-3 days")
        dur_map = {
            "< 24 hours": 0.10,
            "1-3 days": 0.25,
            "4-7 days": 0.50,
            "1-2 weeks": 0.75,
            "> 2 weeks": 0.90
        }
        features.append({
            "name": "symptom_duration",
            "display_name": "Symptom Duration (Contextual)",
            "normalized_value": dur_map.get(duration, 0.30),
            "available": True,
            "confidence": 0.80,
            "evidence": f"Documented symptom duration: {duration}.",
            "weight": 5
        })

        # 9. Symptom Severity (Contextual)
        severity = patient_input.get("severity", "Mild")
        sev_map = {
            "Mild": 0.20,
            "Moderate": 0.50,
            "Severe": 0.85
        }
        features.append({
            "name": "symptom_severity",
            "display_name": "Symptom Severity (Contextual)",
            "normalized_value": sev_map.get(severity, 0.30),
            "available": True,
            "confidence": 0.80,
            "evidence": f"Clinical severity level: {severity}.",
            "weight": 5
        })

        return features

    def to_vector(self, features: List[Dict[str, Any]]) -> List[float]:
        """Convert extracted features into ordered numerical vector for ML model inference."""
        feature_dict = {f["name"]: f["normalized_value"] for f in features}
        return [feature_dict.get(name, 0.0) for name in FEATURE_NAMES]

feature_extractor = FeatureExtractor()
