"""
ResistAI - Admin & Configuration Settings Page Object Model
Encapsulates administrative settings, model weight configurations, and data management.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class SettingsPage(BasePage):
    SETTINGS_TITLE = (By.XPATH, "//*[contains(text(), 'Settings') or contains(text(), 'Configuration')]")
    MODEL_VERSION_LABEL = (By.XPATH, "//*[contains(text(), 'Model Version') or contains(text(), 'ResistAI')]")
    WIPE_DATA_BTN = (By.XPATH, "//*[contains(text(), 'Clear Data') or contains(text(), 'Reset') or contains(text(), 'Wipe')]")
    SAVE_SETTINGS_BTN = (By.XPATH, "//*[contains(text(), 'Save') or contains(text(), 'Update')]")

    def is_settings_loaded(self) -> bool:
        return self.is_displayed(*self.SETTINGS_TITLE)

    def get_model_version(self) -> str:
        return self.get_text(*self.MODEL_VERSION_LABEL)
