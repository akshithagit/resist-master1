"""
ResistAI - Analysis Results & Explainability Page Object Model
Encapsulates verification of risk percentages, category badges (Low/Moderate/High),
contributing factors, evidence coverage indicators, and PDF report downloading.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class AnalysisPage(BasePage):
    RISK_PERCENTAGE_LABEL = (By.XPATH, "//*[contains(text(), '%') and (contains(text(), 'RISK') or contains(text(), 'Risk') or contains(text(), '/ 100'))]")
    RISK_CATEGORY_BADGE = (By.XPATH, "//*[contains(text(), 'LOW RISK') or contains(text(), 'MODERATE RISK') or contains(text(), 'HIGH RISK') or contains(text(), 'Low') or contains(text(), 'Moderate') or contains(text(), 'High')]")
    CONTRIBUTING_FACTORS_HEADER = (By.XPATH, "//*[contains(text(), 'Contributing Factors') or contains(text(), 'Ranked Evidence')]")
    EVIDENCE_COVERAGE_BADGE = (By.XPATH, "//*[contains(text(), 'Coverage') or contains(text(), 'Broad') or contains(text(), 'Moderate') or contains(text(), 'Limited')]")
    EXPORT_PDF_BTN = (By.XPATH, "//*[contains(text(), 'Download Report') or contains(text(), 'Export PDF') or contains(text(), 'Share')]")
    BACK_TO_DASHBOARD_BTN = (By.XPATH, "//*[contains(text(), 'Dashboard') or contains(text(), 'Back') or contains(text(), 'Home')]")

    def is_result_displayed(self) -> bool:
        return self.is_displayed(*self.RISK_CATEGORY_BADGE, timeout=15)

    def get_risk_score(self) -> str:
        return self.get_text(*self.RISK_PERCENTAGE_LABEL)

    def get_risk_category(self) -> str:
        return self.get_text(*self.RISK_CATEGORY_BADGE)

    def click_export_pdf(self):
        self.click(*self.EXPORT_PDF_BTN)

    def return_to_dashboard(self):
        self.click(*self.BACK_TO_DASHBOARD_BTN)
