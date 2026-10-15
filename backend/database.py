"""
ResistAI - Local SQLite Database Layer
Stores assessments, audit records, and feature vectors locally on the host machine.
Zero external cloud or database dependencies.
"""

import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "resistai.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Assessments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        risk_percentage REAL NOT NULL,
        risk_category TEXT NOT NULL,
        ml_probability REAL,
        model_version TEXT,
        evidence_coverage_score REAL,
        evidence_coverage TEXT,
        organism TEXT,
        specimen TEXT,
        extracted_text TEXT,
        patient_input_json TEXT,
        contributing_factors_json TEXT,
        structured_features_json TEXT,
        is_demo INTEGER DEFAULT 0
    );
    """)
    
    # 2. Audit logs (Operational metrics only, no patient PHI)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        assessment_id TEXT,
        details TEXT,
        timestamp TEXT NOT NULL
    );
    """)
    
    conn.commit()
    conn.close()

def save_assessment(assessment_data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT OR REPLACE INTO assessments (
        id, title, created_at, status, risk_percentage, risk_category,
        ml_probability, model_version, evidence_coverage_score, evidence_coverage,
        organism, specimen, extracted_text, patient_input_json,
        contributing_factors_json, structured_features_json, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        assessment_data["id"],
        assessment_data.get("title", "Clinical Assessment"),
        assessment_data["created_at"],
        assessment_data.get("status", "CALCULATED"),
        assessment_data.get("risk_percentage", 0.0),
        assessment_data.get("risk_category", "Moderate"),
        assessment_data.get("ml_probability", None),
        assessment_data.get("model_version", "Local ML v1.0"),
        assessment_data.get("evidence_coverage_score", 0.0),
        assessment_data.get("evidence_coverage", "Moderate"),
        assessment_data.get("organism", "Unknown"),
        assessment_data.get("specimen", "Unknown"),
        assessment_data.get("extracted_text", ""),
        json.dumps(assessment_data.get("patient_input", {})),
        json.dumps(assessment_data.get("contributing_factors", [])),
        json.dumps(assessment_data.get("structured_features", [])),
        1 if assessment_data.get("is_demo") else 0
    ))
    
    conn.commit()
    conn.close()
    return assessment_data["id"]

def get_assessment(assessment_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments WHERE id = ?;", (assessment_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    return {
        "id": row["id"],
        "title": row["title"],
        "created_at": row["created_at"],
        "status": row["status"],
        "risk_percentage": row["risk_percentage"],
        "risk_category": row["risk_category"],
        "ml_probability": row["ml_probability"],
        "model_version": row["model_version"],
        "evidence_coverage_score": row["evidence_coverage_score"],
        "evidence_coverage": row["evidence_coverage"],
        "organism": row["organism"],
        "specimen": row["specimen"],
        "extracted_text": row["extracted_text"],
        "patient_input": json.loads(row["patient_input_json"] or "{}"),
        "contributing_factors": json.loads(row["contributing_factors_json"] or "[]"),
        "structured_features": json.loads(row["structured_features_json"] or "[]"),
        "is_demo": bool(row["is_demo"])
    }

def list_assessments() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, created_at, status, risk_percentage, risk_category, organism, specimen, is_demo FROM assessments ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "created_at": r["created_at"],
            "status": r["status"],
            "risk_percentage": r["risk_percentage"],
            "risk_category": r["risk_category"],
            "organism": r["organism"],
            "specimen": r["specimen"],
            "is_demo": bool(r["is_demo"])
        }
        for r in rows
    ]

def delete_assessment(assessment_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM assessments WHERE id = ?;", (assessment_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# Initialize database on module import
init_db()
