"""
ResistAI - Transparent Weighted Risk Scoring Engine
Calculates prototype AMR risk using deterministic weighted contributions:
AMR Risk (%) = 100 * sum(available_w * val) / sum(available_w)
Zero black box inference. Missing features are excluded from the denominator.
"""

from typing import Dict, Any, List

class RiskEngine:
    def calculate_risk(self, features: List[Dict[str, Any]], patient_input: Dict[str, Any]) -> Dict[str, Any]:
        available_features = [f for f in features if f.get("available", False)]
        total_configured_weight = sum(f.get("weight", 0) for f in features)
        total_available_weight = sum(f.get("weight", 0) for f in available_features)
        
        # Evidence coverage percentage
        coverage_score = round((total_available_weight / max(1, total_configured_weight)) * 100)
        if coverage_score >= 75:
            coverage_label = "Broad"
        elif coverage_score >= 50:
            coverage_label = "Moderate"
        else:
            coverage_label = "Limited"
            
        is_sufficient = coverage_score >= 35

        # Calculate weighted sum
        if total_available_weight > 0:
            weighted_sum = sum(f["normalized_value"] * f["weight"] for f in available_features)
            raw_risk = (weighted_sum / total_available_weight) * 100
            risk_percentage = round(min(100.0, max(0.0, raw_risk)))
        else:
            risk_percentage = 0

        # Categorize
        if not is_sufficient:
            risk_category = "Insufficient Evidence"
        elif risk_percentage > 60:
            risk_category = "High"
        elif risk_percentage > 30:
            risk_category = "Moderate"
        else:
            risk_category = "Low"

        # Build contributing factors list
        contributing_factors = []
        for f in available_features:
            norm_val = f["normalized_value"]
            w = f["weight"]
            weighted_contrib = round((norm_val * w / max(1, total_available_weight)) * 100, 1)
            
            if norm_val >= 0.65:
                impact = "high"
            elif norm_val >= 0.35:
                impact = "moderate"
            else:
                impact = "low"
                
            contributing_factors.append({
                "name": f["name"],
                "display_name": f["display_name"],
                "impact": impact,
                "weight": w,
                "weighted_contribution": weighted_contrib,
                "normalized_contribution": norm_val,
                "reason": f["evidence"],
                "confidence": f.get("confidence", 0.90)
            })

        # Sort factors by weighted contribution descending
        contributing_factors.sort(key=lambda x: x["weighted_contribution"], reverse=True)

        # Generate Plain-Language Clinical Rationale
        reasons = []
        doc_res = next((f for f in features if f["name"] == "documented_resistance"), None)
        if doc_res and doc_res["available"] and doc_res["normalized_value"] >= 0.5:
            reasons.append("Resistance was documented in the laboratory report / susceptibility panel.")
            
        prior_exp = next((f for f in features if f["name"] == "repeated_antibiotic_exposure"), None)
        if prior_exp and prior_exp["normalized_value"] >= 0.5:
            reasons.append("Patient has a history of repeated prior antibiotic courses, which elevates baseline resistance pressure.")
            
        persist = next((f for f in features if f["name"] == "persistent_recurrent"), None)
        if persist and persist["normalized_value"] >= 0.45:
            reasons.append("Reported recurrent or non-resolving infection pattern.")

        if not reasons:
            reasons.append("No critical resistance signals were identified. Susceptibility testing or clinical inputs indicate lower baseline resistance indicators.")

        clinical_explanation = " ".join(reasons) + " Review the laboratory findings with a qualified healthcare professional."

        # Clinician Questions
        suggested_questions = [
            "Are there alternative first-line antimicrobial agents indicated by the local antibiogram?",
            "Is follow-up culture or repeat urinalysis recommended after completion of therapy?",
            "Does the patient have a history of colonization with resistant pathogens (e.g., ESBL, MRSA)?"
        ]

        return {
            "risk_percentage": risk_percentage,
            "risk_category": risk_category,
            "is_sufficient_evidence": is_sufficient,
            "evidence_coverage_score": coverage_score,
            "evidence_coverage": coverage_label,
            "total_available_weight": total_available_weight,
            "available_features_count": len(available_features),
            "contributing_factors": contributing_factors,
            "clinical_explanation": clinical_explanation,
            "suggested_questions": suggested_questions,
            "disclaimer": "This risk index is an illustrative research prototype estimate, not a confirmed clinical diagnosis or validated probability."
        }

risk_engine = RiskEngine()
