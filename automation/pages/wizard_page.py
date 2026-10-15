"""
ResistAI - Analysis Multi-Step Wizard Page Object Model
Encapsulates all 5 steps of report uploading, symptom entry, OCR review,
specimen selection (including 'Initialstream'), and triggering the final 'Calculate' CTA.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class WizardPage(BasePage):
    # Step Indicators
    STEP_HEADER = (By.XPATH, "//*[contains(text(), 'Step ')]")
    
    # Step 1: Upload / Demo selection
    UPLOAD_DOC_BTN = (By.XPATH, "//*[contains(text(), 'Browse Document') or contains(text(), 'Upload')]")
    CHOOSE_PHOTO_BTN = (By.XPATH, "//*[contains(text(), 'Take Photo') or contains(text(), 'Choose Photo')]")
    DEMO_SAMPLE_BTN = (By.XPATH, "//*[contains(text(), 'Use Demo Report') or contains(text(), 'Demo Case')]")

    # Step 2: Symptoms & History
    SYMPTOMS_INPUT = (By.XPATH, "//textarea | //input[contains(@placeholder, 'symptoms') or contains(@placeholder, 'dysuria')]")
    DURATION_1_3_DAYS = (By.XPATH, "//*[contains(text(), '1-3 days')]")
    SEVERITY_MODERATE = (By.XPATH, "//*[contains(text(), 'Moderate')]")
    EXPOSURE_NONE = (By.XPATH, "//*[contains(text(), 'None known')]")
    EXPOSURE_MULTIPLE = (By.XPATH, "//*[contains(text(), 'Multiple previous courses')]")
    STEP2_CONTINUE_BTN = (By.XPATH, "//*[contains(text(), 'Continue to OCR') or contains(text(), 'Next Step') or contains(text(), 'Continue')]")

    # Step 3: OCR Review
    OCR_TEXT_AREA = (By.XPATH, "//textarea[contains(@value, '') or contains(text(), '')]")
    STEP3_CONTINUE_BTN = (By.XPATH, "//*[contains(text(), 'Confirm Text') or contains(text(), 'Next: Pathogen') or contains(text(), 'Continue')]")

    # Step 4: Pathogen & Specimen Selection
    SPECIMEN_INITIALSTREAM = (By.XPATH, "//*[contains(text(), 'Initialstream')]")
    ORGANISM_E_COLI = (By.XPATH, "//*[contains(text(), 'Escherichia coli')]")
    STEP4_CONTINUE_BTN = (By.XPATH, "//*[contains(text(), 'Review & Calculate') or contains(text(), 'Next: Review') or contains(text(), 'Review')]")

    # Step 5: Final Review & Calculation
    REVIEW_CARD = (By.XPATH, "//*[contains(text(), 'Summary of Evidence')]")
    CALCULATE_CTA_BTN = (By.XPATH, "//*[contains(text(), 'Calculate') or contains(text(), 'Risk Calculation')]")
    CANCEL_BTN = (By.XPATH, "//*[contains(text(), 'Cancel')]")

    def get_current_step_title(self) -> str:
        return self.get_text(*self.STEP_HEADER)

    def select_demo_report(self):
        self.click(*self.DEMO_SAMPLE_BTN)

    def enter_symptoms(self, symptoms: str = "Dysuria and mild fever"):
        if self.is_displayed(*self.SYMPTOMS_INPUT):
            self.type_text(*self.SYMPTOMS_INPUT, symptoms)
        if self.is_displayed(*self.DURATION_1_3_DAYS):
            self.click(*self.DURATION_1_3_DAYS)
        self.click(*self.STEP2_CONTINUE_BTN)

    def confirm_ocr_text(self):
        self.click(*self.STEP3_CONTINUE_BTN)

    def select_pathogen_and_specimen(self, specimen: str = "Initialstream"):
        if specimen.lower() == "initialstream" and self.is_displayed(*self.SPECIMEN_INITIALSTREAM):
            self.click(*self.SPECIMEN_INITIALSTREAM)
        if self.is_displayed(*self.ORGANISM_E_COLI):
            self.click(*self.ORGANISM_E_COLI)
        self.click(*self.STEP4_CONTINUE_BTN)

    def click_calculate(self):
        self.click(*self.CALCULATE_CTA_BTN)
