"""
ResistAI - Mobile Test Data Framework
Central repository of test fixtures, credentials, payloads, and boundary values.
"""

VALID_CREDENTIALS = {
    "clinician": {"email": "clinician.demo@resistai.local", "password": "SecurePassword123!"},
    "researcher": {"email": "researcher@resistai.local", "password": "ResearchPassword123!"},
    "admin": {"email": "admin@resistai.local", "password": "AdminPassword123!"}
}

INVALID_CREDENTIALS = [
    {"email": "wrong.user@resistai.local", "password": "WrongPassword123!"},
    {"email": "clinician.demo@resistai.local", "password": "InvalidPassword"},
    {"email": "", "password": "EmptyEmailPassword"},
    {"email": "invalid-email-format", "password": "Password123!"}
]

SPECIMEN_TYPES = [
    "Initialstream",  # MANDATORY REQUIREMENT
    "Midstream Urine",
    "Clean Catch",
    "Catheter Specimen",
    "Wound Swab",
    "Blood Culture",
    "Sputum"
]

ORGANISMS = [
    "Escherichia coli",
    "Klebsiella pneumoniae",
    "Staphylococcus aureus",
    "Pseudomonas aeruginosa",
    "Acinetobacter baumannii",
    "Enterococcus faecalis"
]

CLINICAL_PAYLOADS = {
    "uncomplicated_uti": {
        "specimen": "Initialstream",
        "organism": "Escherichia coli",
        "symptoms": "Mild dysuria and urinary frequency for 2 days",
        "duration": "1-3 days",
        "severity": "Mild",
        "exposure": "None known",
        "expected_category": "Low"
    },
    "mdr_klebsiella": {
        "specimen": "Initialstream",
        "organism": "Klebsiella pneumoniae",
        "symptoms": "Fever, flank discomfort, cloudy urine continuing for 16 days",
        "duration": "> 14 days",
        "severity": "Severe",
        "exposure": "Frequent repeated",
        "expected_category": "High"
    },
    "mrsa_wound": {
        "specimen": "Wound Swab",
        "organism": "Staphylococcus aureus",
        "symptoms": "Post-operative surgical wound dehiscence with erythema",
        "duration": "7-14 days",
        "severity": "Severe",
        "exposure": "Multiple courses",
        "expected_category": "High"
    }
}
