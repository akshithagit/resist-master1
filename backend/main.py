"""
ResistAI - Local Healthcare Research & AMR Risk Prediction Backend
FastAPI server running 100% locally on CPU.
Zero external AI APIs, cloud LLMs, or paid services.
"""

import os
import uuid
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import (
    save_assessment,
    get_assessment,
    list_assessments,
    delete_assessment
)
from ocr_engine import ocr_engine
from nlp_engine import nlp_engine
from feature_extractor import feature_extractor
from risk_engine import risk_engine
from model_service import model_service

app = FastAPI(
    title="ResistAI Local Backend",
    description="Local Medical Report Analysis and Antimicrobial Resistance Risk Prediction System",
    version="2.1.0-local"
)

# CORS setup: allow local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class PatientInputModel(BaseModel):
    symptoms: Optional[str] = ""
    symptom_duration: Optional[str] = "1-3 days"
    severity: Optional[str] = "Mild"
    infection_type: Optional[str] = "Uncomplicated UTI"
    previous_antibiotic_exposure: Optional[str] = "None known"
    course_completion: Optional[str] = "Full course completed"
    persistent_infection: Optional[str] = "First episode"

class ExtractFeaturesRequest(BaseModel):
    ocr_text: str
    patient_input: Optional[PatientInputModel] = Field(default_factory=PatientInputModel)

class PredictRiskRequest(BaseModel):
    ocr_text: Optional[str] = ""
    organism: Optional[str] = "Unknown"
    specimen: Optional[str] = "Unknown"
    symptoms: Optional[str] = ""
    symptom_duration: Optional[str] = "1-3 days"
    severity: Optional[str] = "Mild"
    infection_type: Optional[str] = "Uncomplicated UTI"
    previous_antibiotic_exposure: Optional[str] = "None known"
    course_completion: Optional[str] = "Full course completed"
    persistent_infection: Optional[str] = "First episode"
    extracted_entities: Optional[List[Dict[str, Any]]] = []

# ================= ENDPOINTS =================

@app.get("/health")
def health_check():
    """Check local application status, ML model availability, and database connectivity."""
    is_model_loaded = model_service.model is not None
    return {
        "status": "HEALTHY",
        "service": "ResistAI - Local Medical Analysis & AMR Risk Engine",
        "mode": "100% Local Inference (Zero Remote APIs)",
        "model_loaded": is_model_loaded,
        "model_version": model_service.artifact.get("version") if model_service.artifact else "embedded-logistic-fallback",
        "ocr_engine": "Tesseract OCR & PyPDF",
        "database": "Local SQLite"
    }

@app.post("/upload-report")
async def upload_report(file: UploadFile = File(...)):
    """
    Validates uploaded document (PDF or Image) and extracts text locally.
    Does not execute files.
    """
    allowed_types = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/bmp", "image/webp"]
    content_type = file.content_type or ""
    filename = file.filename or "unknown_file"

    if content_type not in allowed_types and not any(filename.lower().endswith(ext) for ext in [".pdf", ".png", ".jpg", ".jpeg"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, PNG, JPG, or JPEG medical reports."
        )

    file_bytes = await file.read()
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 25MB."
        )

    # Process PDF vs Image
    if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
        res = ocr_engine.extract_text_from_pdf(file_bytes)
    else:
        res = ocr_engine.extract_text_from_image(file_bytes)

    return {
        "filename": filename,
        "extracted_text": res.get("text", ""),
        "pages": res.get("pages", []),
        "confidence": res.get("confidence", 0.0),
        "method": res.get("method", "local_parser")
    }

@app.post("/extract-features")
def extract_features_endpoint(req: ExtractFeaturesRequest):
    """
    Extracts structured entities, AST findings, and normalized feature vectors from text.
    """
    nlp_findings = nlp_engine.extract_entities(req.ocr_text)
    patient_dict = req.patient_input.model_dump()
    structured_features = feature_extractor.extract_features(nlp_findings, patient_dict)
    feature_vector = feature_extractor.to_vector(structured_features)

    return {
        "nlp_findings": nlp_findings,
        "structured_features": structured_features,
        "feature_vector": feature_vector
    }

@app.post("/predict-risk")
def predict_risk_endpoint(req: PredictRiskRequest):
    """
    Executes local machine learning model and transparent weighted risk engine.
    Separates the ML model output from the deterministic prototype risk index.
    """
    patient_dict = {
        "symptoms": req.symptoms,
        "symptom_duration": req.symptom_duration,
        "severity": req.severity,
        "infection_type": req.infection_type,
        "previous_antibiotic_exposure": req.previous_antibiotic_exposure,
        "course_completion": req.course_completion,
        "persistent_infection": req.persistent_infection
    }

    # 1. NLP entity parsing
    nlp_findings = nlp_engine.extract_entities(req.ocr_text or "")
    if req.organism and req.organism != "Unknown" and not nlp_findings.get("organism"):
        nlp_findings["organism"] = req.organism
    if req.specimen and req.specimen != "Unknown" and nlp_findings.get("specimen") == "Unknown":
        nlp_findings["specimen"] = req.specimen

    # 2. Structured feature extraction
    structured_features = feature_extractor.extract_features(nlp_findings, patient_dict)
    vector = feature_extractor.to_vector(structured_features)

    # 3. Transparent Weighted Risk Engine Calculation
    risk_data = risk_engine.calculate_risk(structured_features, patient_dict)

    # 4. Local Machine Learning Model Inference
    ml_result = model_service.predict_risk(vector)

    # Combine into response
    combined_risk_percentage = round(
        0.65 * risk_data["risk_percentage"] + 0.35 * ml_result["ml_risk_percentage"]
    )
    
    category = "Low"
    if not risk_data["is_sufficient_evidence"]:
        category = "Insufficient Evidence"
    elif combined_risk_percentage > 60:
        category = "High"
    elif combined_risk_percentage > 30:
        category = "Moderate"

    # Save to local SQLite database
    assessment_id = f"assess_{uuid.uuid4().hex[:10]}"
    assessment_record = {
        "id": assessment_id,
        "title": f"{nlp_findings.get('organism') or req.organism or 'Pathogen'} Assessment",
        "created_at": str(uuid.uuid1()),
        "status": "CALCULATED",
        "risk_percentage": combined_risk_percentage,
        "risk_category": category,
        "ml_probability": ml_result["ml_probability"],
        "model_version": "ResistAI Local ML (Logistic Regression + Weighted Engine)",
        "evidence_coverage_score": risk_data["evidence_coverage_score"],
        "evidence_coverage": risk_data["evidence_coverage"],
        "organism": nlp_findings.get("organism") or req.organism,
        "specimen": nlp_findings.get("specimen") or req.specimen,
        "extracted_text": req.ocr_text,
        "patient_input": patient_dict,
        "contributing_factors": risk_data["contributing_factors"],
        "structured_features": structured_features,
        "is_demo": False
    }
    save_assessment(assessment_record)

    return {
        "assessment_id": assessment_id,
        "risk_percentage": combined_risk_percentage,
        "risk_category": category,
        "transparent_risk_index": risk_data["risk_percentage"],
        "ml_probability": ml_result["ml_probability"],
        "ml_risk_percentage": ml_result["ml_risk_percentage"],
        "evidence_coverage_score": risk_data["evidence_coverage_score"],
        "evidence_coverage": risk_data["evidence_coverage"],
        "is_sufficient_evidence": risk_data["is_sufficient_evidence"],
        "available_features_count": risk_data["available_features_count"],
        "total_available_weight": risk_data["total_available_weight"],
        "contributing_factors": risk_data["contributing_factors"],
        "nlp_findings": nlp_findings,
        "structured_features": structured_features,
        "clinical_explanation": risk_data["clinical_explanation"],
        "suggested_questions": risk_data["suggested_questions"],
        "model_version": "ResistAI Local ML (Logistic Regression + Weighted Engine)",
        "disclaimer": risk_data["disclaimer"]
    }

@app.get("/assessments")
def list_assessments_endpoint():
    """List historical local assessments from SQLite."""
    return list_assessments()

@app.get("/assessment/{assessment_id}")
def get_assessment_endpoint(assessment_id: str):
    """Retrieve saved assessment details from SQLite."""
    item = get_assessment(assessment_id)
    if not item:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return item

@app.delete("/assessment/{assessment_id}")
def delete_assessment_endpoint(assessment_id: str):
    """Delete an assessment from local SQLite."""
    deleted = delete_assessment(assessment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return {"message": "Assessment deleted successfully", "id": assessment_id}
