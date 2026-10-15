"""
ResistAI - Mobile Analysis Wizard Page Object Model
Enforces requirement constraints:
- Specimen Type includes 'Initialstream'
- Final CTA button strictly labeled 'Calculate'
- 100% on-device local inference
"""

from automation.pages.mobile_base_page import MobileBasePage

class MobileWizardPage(MobileBasePage):
    STEP_INDICATOR = "wizard-step-indicator"
    SPECIMEN_PICKER = "picker-specimen-type"
    ORGANISM_INPUT = "input-organism-name"
    SYMPTOMS_INPUT = "input-symptoms"
    DURATION_PICKER = "picker-duration"
    SEVERITY_PICKER = "picker-severity"
    PRIOR_EXPOSURE_PICKER = "picker-prior-exposure"
    CALCULATE_BUTTON = "btn-calculate"  # Strictly 'Calculate'
    DOCUMENT_UPLOAD_BUTTON = "btn-upload-document"
    DOCUMENT_FILE_PICKER = "btn-choose-file"
    NEXT_STEP_BUTTON = "btn-next-step"
    PREVIOUS_STEP_BUTTON = "btn-prev-step"

    def select_specimen_initialstream(self):
        """Selects 'Initialstream' specimen type as required."""
        self.click_by_id(self.SPECIMEN_PICKER)
        self.click_by_id("option-specimen-initialstream")

    def enter_organism(self, name: str):
        self.type_by_id(self.ORGANISM_INPUT, name)

    def enter_symptoms(self, text: str):
        self.type_by_id(self.SYMPTOMS_INPUT, text)

    def tap_calculate(self):
        """Taps the final 'Calculate' CTA button."""
        self.click_by_id(self.CALCULATE_BUTTON)

    def tap_upload_document(self):
        self.click_by_id(self.DOCUMENT_UPLOAD_BUTTON)

    def is_calculate_button_visible(self) -> bool:
        return self.is_visible(self.CALCULATE_BUTTON)
