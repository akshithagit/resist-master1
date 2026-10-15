"""
ResistAI - Mobile Authentication Page Object Model
"""

from automation.pages.mobile_base_page import MobileBasePage

class MobileAuthPage(MobileBasePage):
    # Selectors / Accessibility IDs
    EMAIL_INPUT = "auth-email-input"
    PASSWORD_INPUT = "auth-password-input"
    LOGIN_BUTTON = "auth-login-button"
    REGISTER_BUTTON = "auth-register-button"
    DEMO_BUTTON = "auth-demo-button"
    FORGOT_PASSWORD_LINK = "auth-forgot-password-link"
    ERROR_ALERT = "auth-error-alert"

    def enter_email(self, email: str):
        self.type_by_id(self.EMAIL_INPUT, email)

    def enter_password(self, password: str):
        self.type_by_id(self.PASSWORD_INPUT, password)

    def tap_login(self):
        self.click_by_id(self.LOGIN_BUTTON)

    def tap_demo_login(self):
        self.click_by_id(self.DEMO_BUTTON)

    def tap_register(self):
        self.click_by_id(self.REGISTER_BUTTON)

    def get_error_message(self) -> str:
        return self.get_text_by_id(self.ERROR_ALERT)

    def is_login_screen_visible(self) -> bool:
        return self.is_visible(self.LOGIN_BUTTON) or self.is_visible(self.EMAIL_INPUT)
