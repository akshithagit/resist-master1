"""
ResistAI - Mobile Dashboard Page Object Model
"""

from automation.pages.mobile_base_page import MobileBasePage

class MobileDashboardPage(MobileBasePage):
    DASHBOARD_HEADER = "dashboard-header"
    NEW_ANALYSIS_BUTTON = "btn-new-analysis"
    TOTAL_ANALYSES_CARD = "metric-total-analyses"
    HIGH_RISK_CARD = "metric-high-risk"
    ORGANISM_CARD = "metric-top-organism"
    SEARCH_INPUT = "dashboard-search-input"
    FILTER_BUTTON = "dashboard-filter-button"
    PROFILE_TAB = "tab-profile"
    SETTINGS_TAB = "tab-settings"
    HISTORY_TAB = "tab-history"
    RECENT_RECORDS_LIST = "dashboard-records-list"

    def tap_new_analysis(self):
        self.click_by_id(self.NEW_ANALYSIS_BUTTON)

    def search_records(self, query: str):
        self.type_by_id(self.SEARCH_INPUT, query)

    def get_total_analyses_count(self) -> str:
        return self.get_text_by_id(self.TOTAL_ANALYSES_CARD)

    def is_dashboard_loaded(self) -> bool:
        return self.is_visible(self.NEW_ANALYSIS_BUTTON) or self.is_visible(self.DASHBOARD_HEADER)

    def navigate_to_settings(self):
        self.click_by_id(self.SETTINGS_TAB)

    def navigate_to_profile(self):
        self.click_by_id(self.PROFILE_TAB)
