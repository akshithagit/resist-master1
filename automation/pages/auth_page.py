"""
ResistAI - Authentication & Authorization Page Object Model
Encapsulates login, registration, guest session access, and logout.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class AuthPage(BasePage):
    EMAIL_INPUT = (By.XPATH, "//input[@type='email' or contains(@placeholder, 'Email') or contains(@placeholder, 'username')]")
    PASSWORD_INPUT = (By.XPATH, "//input[@type='password' or contains(@placeholder, 'Password')]")
    SIGN_IN_BTN = (By.XPATH, "//button[contains(text(), 'Sign In') or contains(text(), 'Login') or @type='submit']")
    GUEST_ACCESS_BTN = (By.XPATH, "//*[contains(text(), 'Guest') or contains(text(), 'Skip') or contains(text(), 'Continue without Account')]")
    LOGOUT_BTN = (By.XPATH, "//*[contains(text(), 'Sign Out') or contains(text(), 'Logout')]")
    USER_PROFILE_BADGE = (By.XPATH, "//*[contains(text(), 'Clinician') or contains(text(), 'Researcher') or contains(text(), 'Profile')]")

    def login(self, email: str, password: str):
        if self.is_displayed(*self.EMAIL_INPUT):
            self.type_text(*self.EMAIL_INPUT, email)
        if self.is_displayed(*self.PASSWORD_INPUT):
            self.type_text(*self.PASSWORD_INPUT, password)
        if self.is_displayed(*self.SIGN_IN_BTN):
            self.click(*self.SIGN_IN_BTN)

    def continue_as_guest(self):
        if self.is_displayed(*self.GUEST_ACCESS_BTN):
            self.click(*self.GUEST_ACCESS_BTN)

    def logout(self):
        if self.is_displayed(*self.LOGOUT_BTN):
            self.click(*self.LOGOUT_BTN)
