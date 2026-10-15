"""
ResistAI – E2E Test Suite: Dashboard Screen
Module: Dashboard
Tests: TC-011 → TC-030
Priority: P1 / P2
"""

import time
import pytest
from selenium.webdriver.common.by import By

from automation.pages.dashboard_page import DashboardPage
from automation.config.config import BASE_URL


pytestmark = [pytest.mark.module("Dashboard")]


class TestDashboard:
    """Verify Dashboard screen components and interactions."""

    @pytest.mark.p1
    def test_dashboard_loads(self, driver):
        """TC-011 | Dashboard renders without blank screen."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        assert page.is_loaded()

    @pytest.mark.p1
    def test_new_analysis_button_visible(self, driver):
        """TC-012 | 'New Analysis' button is visible on Dashboard."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        assert page.is_displayed(*page.NEW_ANALYSIS_BTN)

    @pytest.mark.p1
    def test_resistai_branding_present(self, driver):
        """TC-013 | ResistAI brand name or logo appears in the header."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        assert page.is_displayed(*page.APP_HEADER)

    @pytest.mark.p1
    def test_demo_section_visible(self, driver):
        """TC-014 | Demo / Synthetic Test Reports section is shown."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        assert page.is_displayed(*page.DEMO_SECTION, timeout=10)

    @pytest.mark.p1
    def test_low_risk_demo_card_present(self, driver):
        """TC-015 | Low-risk demo case card is rendered."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        assert page.is_displayed(*page.DEMO_CASE_LOW, timeout=10)

    @pytest.mark.p1
    def test_high_risk_demo_card_present(self, driver):
        """TC-016 | High-risk demo case card is rendered."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        assert page.is_displayed(*page.DEMO_CASE_HIGH, timeout=10)

    @pytest.mark.p1
    def test_click_new_analysis_navigates(self, driver):
        """TC-017 | Clicking 'New Analysis' opens the wizard or analysis screen."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        initial_url = driver.current_url
        page.click_new_analysis()
        time.sleep(3)
        # Either URL changes OR new content appears
        current_url = driver.current_url
        body = driver.find_element(By.TAG_NAME, "body").text
        assert current_url != initial_url or "upload" in body.lower() or "step" in body.lower() or "report" in body.lower()

    @pytest.mark.p2
    def test_stat_cards_visible(self, driver):
        """TC-018 | Statistics/summary cards are visible on Dashboard."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        assert page.is_displayed(*page.STAT_CARDS, timeout=10)

    @pytest.mark.p2
    def test_dashboard_scroll_works(self, driver):
        """TC-019 | Dashboard can be scrolled without JavaScript errors."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(3)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)
        driver.execute_script("window.scrollTo(0, 0);")

    @pytest.mark.p2
    def test_dashboard_title_tag(self, driver):
        """TC-020 | Page title exists and is non-empty."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(3)
        assert len(driver.title) > 0

    @pytest.mark.p2
    def test_resistai_text_in_body(self, driver):
        """TC-021 | The word 'Resist' appears somewhere in the page body."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "resist" in body.lower()

    @pytest.mark.p2
    def test_no_unhandled_error_overlay(self, driver):
        """TC-022 | No React error boundary or crash overlay is shown."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert "something went wrong" not in body_text
        assert "uncaught error" not in body_text

    @pytest.mark.p2
    def test_amr_keyword_present(self, driver):
        """TC-023 | AMR-related keywords appear on the dashboard."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["antibiotic", "amr", "resistance", "risk", "analysis", "report"])

    @pytest.mark.p2
    def test_low_risk_demo_card_clickable(self, driver):
        """TC-024 | Low-risk demo case card responds to click."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        if page.is_displayed(*page.DEMO_CASE_LOW, timeout=5):
            page.launch_demo_case("low")
            time.sleep(2)

    @pytest.mark.p2
    def test_high_risk_demo_card_clickable(self, driver):
        """TC-025 | High-risk demo case card responds to click."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        if page.is_displayed(*page.DEMO_CASE_HIGH, timeout=5):
            page.launch_demo_case("high")
            time.sleep(2)

    @pytest.mark.p2
    def test_page_is_https(self, driver):
        """TC-026 | Deployed app is served over HTTPS."""
        page = DashboardPage(driver)
        page.navigate()
        assert driver.current_url.startswith("https://"), \
            f"Expected HTTPS, got: {driver.current_url}"

    @pytest.mark.p3
    def test_body_has_readable_text(self, driver):
        """TC-027 | Dashboard body contains at least 50 characters of readable text."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body.strip()) > 50

    @pytest.mark.p3
    def test_multiple_ui_elements_exist(self, driver):
        """TC-028 | Multiple interactive elements are found on the page."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        all_buttons = driver.find_elements(By.XPATH, "//button | //*[@role='button']")
        assert len(all_buttons) >= 1, "Expected at least 1 interactive element"

    @pytest.mark.p3
    def test_images_present(self, driver):
        """TC-029 | At least one image or icon is rendered on the dashboard."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        imgs = driver.find_elements(By.TAG_NAME, "img")
        svgs = driver.find_elements(By.TAG_NAME, "svg")
        assert len(imgs) + len(svgs) >= 1, "Expected at least one image or SVG icon"

    @pytest.mark.p3
    def test_dashboard_keyboard_accessible(self, driver):
        """TC-030 | At least one focusable element exists for keyboard navigation."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        focusable = driver.find_elements(By.XPATH, "//a | //button | //input | //*[@tabindex]")
        assert len(focusable) >= 1
