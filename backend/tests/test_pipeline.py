"""
ResistAI Unit & Integration Tests
Tests OCR handling, NLP entity extraction, negation handling,
feature normalization, risk scoring thresholds, and FastAPI endpoints.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from nlp_engine import nlp_engine
from feature_extractor import feature_extractor, FEATURE_NAMES
from risk_engine import risk_engine
from model_service import model_service
from main import app

client = TestClient(app)

def test_nlp_organism_and_antibiotic_extraction():
    text = (
        "Microbiology Report\n"
        "Specimen: Urine\n"
        "Culture: Escherichia coli isolated > 100,000 CFU/mL\n"
        "Susceptibility Results:\n"
        "Ciprofloxacin: Resistant\n"
        "Nitrofurantoin: Susceptible\n"
        "Ceftriaxone: Resistant\n"
    )
    result = nlp_engine.extract_entities(text)
    assert result["organism"] == "Escherichia coli"
    assert result["specimen"] in ["Urine", "Initialstream"]
    assert len(result["susceptibility"]) >= 2
    
    cipro = next((s for s in result["susceptibility"] if s["antibiotic"] == "Ciprofloxacin"), None)
    assert cipro is not None
    assert cipro["interpretation"] == "Resistant"
    
    nitro = next((s for s in result["susceptibility"] if s["antibiotic"] == "Nitrofurantoin"), None)
    assert nitro is not None
    assert nitro["interpretation"] == "Susceptible"

def test_nlp_negation_handling():
    """Ensure negative findings are never counted as positive resistance."""
    negative_text = (
        "Microbiology Culture & AST\n"
        "Specimen: Blood Culture\n"
        "Result: No bacterial growth after 5 days of incubation.\n"
        "Status: Sterile\n"
    )
    result = nlp_engine.extract_entities(negative_text)
    assert result["is_negative_growth"] is True
    assert result["organism"] is None
    assert len(result["susceptibility"]) == 0
    assert len(result["resistance_markers"]) == 0

def test_feature_extractor_normalization_and_vector():
    nlp_findings = {
        "organism": "Klebsiella pneumoniae",
        "organism_baseline_risk": 0.65,
        "specimen": "Urine",
        "susceptibility": [
            {"antibiotic": "Ciprofloxacin", "interpretation": "Resistant"},
            {"antibiotic": "Ceftriaxone", "interpretation": "Resistant"},
            {"antibiotic": "Meropenem", "interpretation": "Susceptible"}
        ],
        "resistance_markers": [{"name": "ESBL", "weight": 0.90}],
        "resistance_genes": [{"name": "blaCTX-M"}]
    }
    patient_input = {
        "previous_antibiotic_exposure": "Multiple previous courses",
        "course_completion": "Stopped early when symptoms resolved",
        "persistent_infection": "Frequent recurrences (>2 in 6 months)",
        "symptom_duration": "1-2 weeks",
        "severity": "Moderate"
    }

    features = feature_extractor.extract_features(nlp_findings, patient_input)
    assert len(features) == len(FEATURE_NAMES)
    
    # Check all normalized values are between 0.0 and 1.0
    for f in features:
        assert 0.0 <= f["normalized_value"] <= 1.0
        assert "evidence" in f
        assert "weight" in f

    vector = feature_extractor.to_vector(features)
    assert len(vector) == len(FEATURE_NAMES)
    assert all(isinstance(v, (int, float)) for v in vector)

def test_risk_engine_calculation_and_categories():
    high_risk_features = [
        {"name": "documented_resistance", "display_name": "Doc Res", "normalized_value": 0.90, "weight": 25, "available": True, "evidence": "ESBL positive"},
        {"name": "susceptibility_resistance", "display_name": "AST", "normalized_value": 0.85, "weight": 25, "available": True, "evidence": "Multi-drug resistant"},
        {"name": "resistance_gene", "display_name": "Gene", "normalized_value": 0.95, "weight": 20, "available": True, "evidence": "blaCTX-M detected"},
        {"name": "repeated_antibiotic_exposure", "display_name": "Exposure", "normalized_value": 0.85, "weight": 15, "available": True, "evidence": "Frequent courses"},
        {"name": "incomplete_treatment", "display_name": "Adherence", "normalized_value": 0.70, "weight": 10, "available": True, "evidence": "Stopped early"},
        {"name": "persistent_recurrent", "display_name": "Recurrent", "normalized_value": 0.75, "weight": 10, "available": True, "evidence": "Recurrent UTI"},
    ]
    patient_input = {"symptoms": "Dysuria, fever"}
    
    result = risk_engine.calculate_risk(high_risk_features, patient_input)
    assert result["risk_percentage"] > 60
    assert result["risk_category"] == "High"
    assert result["is_sufficient_evidence"] is True
    assert len(result["contributing_factors"]) > 0

def test_fastapi_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "ResistAI" in data["service"]

def test_fastapi_predict_risk_endpoint():
    payload = {
        "ocr_text": "Specimen: Urine\nOrganism: E. coli\nCiprofloxacin: Resistant\nNitrofurantoin: Susceptible",
        "organism": "Escherichia coli",
        "specimen": "Urine",
        "symptoms": "Dysuria, frequency",
        "previous_antibiotic_exposure": "One previous course",
        "course_completion": "Full course completed",
        "persistent_infection": "First episode"
    }
    response = client.post("/predict-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_percentage" in data
    assert "risk_category" in data
    assert "contributing_factors" in data
    assert "clinical_explanation" in data
    assert "assessment_id" in data
