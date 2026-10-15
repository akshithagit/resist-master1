"""
ResistAI - Mobile Settings & Profile Page Object Model
"""

from automation.pages.mobile_base_page import MobileBasePage

class MobileSettingsPage(MobileBasePage):
    DARK_MODE_TOGGLE = "toggle-dark-mode"
    OFFLINE_SYNC_TOGGLE = "toggle-offline-sync"
    NOTIFICATIONS_TOGGLE = "toggle-notifications"
    CLEAR_CACHE_BUTTON = "btn-clear-cache"
    LOGOUT_BUTTON = "btn-logout"
    USER_NAME_LABEL = "label-user-name"
    USER_ROLE_LABEL = "label-user-role"

    def toggle_dark_mode(self):
        self.click_by_id(self.DARK_MODE_TOGGLE)

    def toggle_offline_sync(self):
        self.click_by_id(self.OFFLINE_SYNC_TOGGLE)

    def tap_clear_cache(self):
        self.click_by_id(self.CLEAR_CACHE_BUTTON)

    def tap_logout(self):
        self.click_by_id(self.LOGOUT_BUTTON)
