"""
ResistAI - Test Data Management Framework
Provides standardized test datasets, mock clinical laboratory reports,
and device viewport profiles for automation test execution.
"""

MOCK_REPORTS = {
    "urine_culture_mr_ecoli": (
        "CLINICAL MICROBIOLOGY REPORT\n"
        "Specimen: Initialstream Urine\n"
        "Culture: Escherichia coli > 100,000 CFU/mL\n"
        "AST Panel:\n"
        "Ciprofloxacin: Resistant\n"
        "Nitrofurantoin: Susceptible\n"
        "Ceftriaxone: Resistant\n"
        "Amoxicillin-Clavulanate: Intermediate\n"
        "Phenotype: ESBL confirmed (blaCTX-M detected)"
    ),
    "sputum_culture_cre_klebsiella": (
        "HOSPITAL PATHOLOGY REPORT\n"
        "Specimen: Sputum\n"
        "Culture: Klebsiella pneumoniae confluent growth\n"
        "AST Panel:\n"
        "Ceftriaxone: Resistant\n"
        "Meropenem: Resistant\n"
        "Imipenem: Resistant\n"
        "Colistin: Susceptible\n"
        "Phenotype: CRE confirmed (blaKPC positive)"
    ),
    "urine_culture_pan_susceptible": (
        "LABORATORY SERVICES\n"
        "Specimen: Initialstream Urine\n"
        "Culture: Pure growth of Escherichia coli > 100,000 CFU/mL\n"
        "AST Panel:\n"
        "Nitrofurantoin: Susceptible\n"
        "Ciprofloxacin: Susceptible\n"
        "Ceftriaxone: Susceptible\n"
        "Amoxicillin-Clavulanate: Susceptible\n"
        "Trimethoprim-Sulfamethoxazole: Susceptible"
    ),
    "sterile_culture_negative": (
        "DIAGNOSTIC PATHOLOGY REPORT\n"
        "Specimen: Blood Culture\n"
        "Status: No bacterial growth after 5 days of incubation.\n"
        "Interpretation: Sterile. Resistance not detected."
    )
}

VIEWPORT_PROFILES = {
    "desktop_large": {"width": 1920, "height": 1080, "name": "Desktop 1080p"},
    "desktop_laptop": {"width": 1366, "height": 768, "name": "Standard Laptop"},
    "tablet_portrait": {"width": 768, "height": 1024, "name": "iPad / Tablet Portrait"},
    "tablet_landscape": {"width": 1024, "height": 768, "name": "Tablet Landscape"},
    "mobile_iphone": {"width": 375, "height": 812, "name": "iPhone 13/14 Pro"},
    "mobile_android": {"width": 360, "height": 800, "name": "Android Modern"},
}

USER_PROFILES = {
    "clinician_valid": {"email": "dr.smith@hospital.org", "password": "SecureClinicalPassword123!", "role": "clinician"},
    "researcher_valid": {"email": "researcher@amr-surveillance.gov", "password": "ResearchTokenPassword987!", "role": "researcher"},
    "admin_valid": {"email": "admin@resistai.internal", "password": "AdminMasterKey2026#", "role": "admin"},
    "guest": {"email": "", "password": "", "role": "guest"},
}
