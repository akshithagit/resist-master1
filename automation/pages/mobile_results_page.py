"""
ResistAI - Mobile Analysis Results Page Object Model
"""

from automation.pages.mobile_base_page import MobileBasePage

class MobileResultsPage(MobileBasePage):
    RISK_PERCENTAGE_LABEL = "label-risk-percentage"
    RISK_CATEGORY_BADGE = "badge-risk-category"
    CONTRIBUTING_FACTORS_LIST = "list-contributing-factors"
    PDF_EXPORT_BUTTON = "btn-export-pdf"
    BACK_DASHBOARD_BUTTON = "btn-back-dashboard"
    MODEL_ATTRIBUTION_LABEL = "label-model-attribution"

    def get_risk_percentage(self) -> str:
        return self.get_text_by_id(self.RISK_PERCENTAGE_LABEL)

    def get_risk_category(self) -> str:
        return self.get_text_by_id(self.RISK_CATEGORY_BADGE)

    def tap_export_pdf(self):
        self.click_by_id(self.PDF_EXPORT_BUTTON)

    def tap_back_to_dashboard(self):
        self.click_by_id(self.BACK_DASHBOARD_BUTTON)

    def is_result_screen_visible(self) -> bool:
        return self.is_visible(self.RISK_PERCENTAGE_LABEL) or self.is_visible(self.RISK_CATEGORY_BADGE)
