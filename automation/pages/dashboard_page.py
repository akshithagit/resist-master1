"""
ResistAI - Dashboard Page Object Model
Encapsulates interactions with the main dashboard, demo report cards, and quick actions.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class DashboardPage(BasePage):
    # Locators (using text, data-testid, and aria-roles compatible with React Native Web)
    APP_HEADER = (By.XPATH, "//*[contains(text(), 'ResistAI') or contains(text(), 'Resist')]")
    NEW_ANALYSIS_BTN = (By.XPATH, "//*[contains(text(), 'New Analysis') or contains(text(), 'Start Analysis')]")
    THEME_TOGGLE_BTN = (By.XPATH, "//button[contains(@aria-label, 'theme') or contains(@aria-label, 'Toggle')]")
    DEMO_SECTION = (By.XPATH, "//*[contains(text(), 'Synthetic Test Reports') or contains(text(), 'Demo')]")
    DEMO_CASE_LOW = (By.XPATH, "//*[contains(text(), 'Uncomplicated UTI') or contains(text(), 'LOW RISK')]")
    DEMO_CASE_HIGH = (By.XPATH, "//*[contains(text(), 'Severe Recurrent Pyelonephritis') or contains(text(), 'HIGH RISK')]")
    STAT_CARDS = (By.XPATH, "//*[contains(text(), 'Recent Reports') or contains(text(), 'Total Analyses')]")

    def navigate(self) -> "DashboardPage":
        self.open("")
        return self

    def is_loaded(self) -> bool:
        return self.is_displayed(*self.APP_HEADER, timeout=10)

    def click_new_analysis(self):
        self.click(*self.NEW_ANALYSIS_BTN)

    def launch_demo_case(self, risk_level: str = "Low"):
        if risk_level.lower() == "high":
            self.click(*self.DEMO_CASE_HIGH)
        else:
            self.click(*self.DEMO_CASE_LOW)
