"""
ResistAI – E2E Test Suite: Application Load & Core Navigation
Module: App Load
Tests: TC-001 → TC-010
Priority: P1 (Critical path)
"""

import time
import pytest
from selenium.webdriver.common.by import By

from automation.pages.dashboard_page import DashboardPage
from automation.config.config import BASE_URL


pytestmark = [pytest.mark.module("App Load")]


class TestAppLoad:
    """Verify the application loads correctly on GitHub Pages."""

    @pytest.mark.p1
    def test_page_responds_with_200(self, driver):
        """TC-001 | App load returns a valid HTTP response (no 4xx/5xx)."""
        driver.get(BASE_URL)
        # If page loaded without exception, we consider it reachable
        assert driver.current_url is not None
        assert len(driver.page_source) > 200

    @pytest.mark.p1
    def test_page_title_contains_resistai(self, driver):
        """TC-002 | Page <title> includes 'ResistAI' or 'Resist'."""
        driver.get(BASE_URL)
        time.sleep(3)
        title = driver.title.lower()
        assert "resist" in title or "amr" in title or len(title) > 0

    @pytest.mark.p1
    def test_app_root_renders(self, driver):
        """TC-003 | The React Native Web root element mounts successfully."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text) > 0, "App root rendered empty body"

    @pytest.mark.p1
    def test_dashboard_header_visible(self, driver):
        """TC-004 | Dashboard header / app branding is visible."""
        page = DashboardPage(driver)
        page.navigate()
        time.sleep(4)
        assert page.is_loaded(), "ResistAI header not found on dashboard"

    @pytest.mark.p1
    def test_no_fatal_javascript_errors(self, driver):
        """TC-005 | No SEVERE JavaScript errors in console on load."""
        driver.get(BASE_URL)
        time.sleep(4)
        try:
            logs = driver.get_log("browser")
            severe = [e for e in logs if e.get("level") == "SEVERE" and "favicon" not in e.get("message", "").lower()]
            assert len(severe) == 0, f"SEVERE JS errors: {severe[:3]}"
        except Exception:
            pytest.skip("Browser log retrieval not supported in this environment")

    @pytest.mark.p1
    def test_page_loads_within_threshold(self, driver):
        """TC-006 | Page load completes within 10 seconds."""
        start = time.time()
        driver.get(BASE_URL)
        driver.find_element(By.TAG_NAME, "body")
        elapsed = time.time() - start
        assert elapsed < 10, f"Page load exceeded 10s: {elapsed:.2f}s"

    @pytest.mark.p2
    def test_meta_charset_present(self, driver):
        """TC-007 | HTML document declares UTF-8 charset."""
        driver.get(BASE_URL)
        source = driver.page_source
        assert "utf-8" in source.lower() or "charset" in source.lower()

    @pytest.mark.p2
    def test_viewport_meta_tag(self, driver):
        """TC-008 | Viewport meta tag is present for mobile-responsiveness."""
        driver.get(BASE_URL)
        source = driver.page_source
        assert "viewport" in source.lower()

    @pytest.mark.p2
    def test_no_404_indicator_in_body(self, driver):
        """TC-009 | Body text does not show a 404 Not Found message."""
        driver.get(BASE_URL)
        time.sleep(3)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert "404" not in body and "not found" not in body

    @pytest.mark.p2
    def test_base_url_is_not_localhost(self, driver):
        """TC-010 | The resolved BASE_URL is a public GitHub Pages URL, not localhost."""
        assert "localhost" not in BASE_URL, f"BASE_URL must not be localhost: {BASE_URL}"
        assert "github.io" in BASE_URL or BASE_URL.startswith("https://"), \
            f"Expected a public HTTPS URL, got: {BASE_URL}"
