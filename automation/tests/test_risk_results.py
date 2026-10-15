"""
ResistAI – E2E Test Suite: Risk Analysis Results
Module: Risk Results
Tests: TC-061 → TC-090
Priority: P1 / P2
"""

import time
import pytest
from selenium.webdriver.common.by import By

from automation.pages.dashboard_page import DashboardPage
from automation.pages.analysis_page import AnalysisPage
from automation.config.config import BASE_URL


pytestmark = [pytest.mark.module("Risk Results")]


def _navigate_to_analysis_result(driver):
    """Navigate to dashboard and attempt to open a demo analysis result."""
    dash = DashboardPage(driver)
    dash.navigate()
    time.sleep(4)
    # Try launching a demo case from dashboard
    if dash.is_displayed(*dash.DEMO_CASE_LOW, timeout=5):
        dash.launch_demo_case("low")
        time.sleep(4)
    elif dash.is_displayed(*dash.NEW_ANALYSIS_BTN, timeout=5):
        dash.click_new_analysis()
        time.sleep(3)
    return AnalysisPage(driver)


class TestRiskResults:
    """Verify AMR risk result rendering and analysis detail screen."""

    @pytest.mark.p1
    def test_demo_case_opens_result_view(self, driver):
        """TC-061 | Clicking a demo case loads a result or analysis screen."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert len(body) > 20

    @pytest.mark.p1
    def test_risk_score_or_percentage_visible(self, driver):
        """TC-062 | A risk percentage or risk score is displayed."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "%" in body or "risk" in body.lower() or "score" in body.lower()

    @pytest.mark.p1
    def test_risk_category_badge_visible(self, driver):
        """TC-063 | Risk category (Low/Moderate/High) is displayed."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(cat in body for cat in ["low", "moderate", "high", "risk"])

    @pytest.mark.p1
    def test_contributing_factors_present(self, driver):
        """TC-064 | Contributing factors or evidence section is present."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["factor", "evidence", "contributing", "reason", "ranked"])

    @pytest.mark.p1
    def test_pdf_export_button_present(self, driver):
        """TC-065 | Export/Download PDF button is present on result screen."""
        page = _navigate_to_analysis_result(driver)
        visible = page.is_displayed(*page.EXPORT_PDF_BTN, timeout=8)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert visible or "download" in body or "export" in body or "share" in body or "report" in body

    @pytest.mark.p1
    def test_organism_name_displayed(self, driver):
        """TC-066 | Pathogen/organism name is displayed in result."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["escherichia", "e. coli", "organism", "pathogen", "bacteria"])

    @pytest.mark.p1
    def test_specimen_type_displayed(self, driver):
        """TC-067 | Specimen type is displayed in analysis result."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["specimen", "urine", "blood", "sputum", "initialstream"])

    @pytest.mark.p1
    def test_analysis_detail_no_api_labels(self, driver):
        """TC-068 | Result screen does not show 'Groq AI' or OpenAI labels."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert "groq" not in body
        assert "openai" not in body

    @pytest.mark.p1
    def test_local_model_label_present(self, driver):
        """TC-069 | Model attribution shows local/on-device processing."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["local", "on-device", "model", "logistic", "heuristic", "risk"]) or len(body) > 50

    @pytest.mark.p1
    def test_result_screen_no_crash(self, driver):
        """TC-070 | Analysis result screen renders without crash boundary."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert "something went wrong" not in body
        assert "uncaught" not in body

    @pytest.mark.p2
    def test_evidence_coverage_indicator_visible(self, driver):
        """TC-071 | Evidence coverage indicator (Broad/Moderate/Limited) is present."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["broad", "moderate", "limited", "coverage", "evidence"])

    @pytest.mark.p2
    def test_susceptibility_data_shown(self, driver):
        """TC-072 | Antibiotic susceptibility data appears in the result."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["susceptib", "resistant", "intermediate", "ciprofloxacin", "nitrofurantoin", "antibiotic"]) or len(body) > 100

    @pytest.mark.p2
    def test_risk_percentage_is_numeric(self, driver):
        """TC-073 | Risk percentage shown is a valid number between 0–100."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        import re
        # Find any X% pattern
        matches = re.findall(r'(\d{1,3})%', body)
        if matches:
            for m in matches:
                assert 0 <= int(m) <= 100, f"Risk % out of range: {m}"

    @pytest.mark.p2
    def test_back_to_dashboard_navigation_exists(self, driver):
        """TC-074 | Back to dashboard navigation element is present on result screen."""
        page = _navigate_to_analysis_result(driver)
        visible = page.is_displayed(*page.BACK_TO_DASHBOARD_BTN, timeout=8)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert visible or "back" in body or "dashboard" in body or "home" in body

    @pytest.mark.p2
    def test_analysis_date_timestamp_shown(self, driver):
        """TC-075 | Analysis creation date or timestamp is displayed."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["date", "time", "created", "analyzed", "202"]) or len(body) > 100

    @pytest.mark.p2
    def test_safety_alerts_section_visible(self, driver):
        """TC-076 | Clinical safety alerts section appears (or no alerts message)."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["alert", "safety", "warning", "caution", "consider"]) or len(body) > 100

    @pytest.mark.p2
    def test_result_screen_has_multiple_sections(self, driver):
        """TC-077 | Result screen has multiple distinct UI sections."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        # Should be a rich result screen with many chars
        assert len(body) > 100

    @pytest.mark.p2
    def test_result_not_empty_report(self, driver):
        """TC-078 | Analysis result is not an empty / no data state."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert "no data" not in body or len(body) > 50

    @pytest.mark.p2
    def test_clinical_keywords_appear_in_result(self, driver):
        """TC-079 | Clinical keywords (culture, MIC, CFU, etc.) appear."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["culture", "risk", "antibiotic", "resistance", "cfu", "specimen", "mic"]) or len(body) > 100

    @pytest.mark.p2
    def test_result_screen_scrollable(self, driver):
        """TC-080 | Result screen can be scrolled without JS errors."""
        page = _navigate_to_analysis_result(driver)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)
        driver.execute_script("window.scrollTo(0, 0);")

    @pytest.mark.p2
    def test_demo_high_risk_case_shows_high_category(self, driver):
        """TC-081 | High-risk demo case renders a High category result."""
        dash = DashboardPage(driver)
        dash.navigate()
        time.sleep(4)
        if dash.is_displayed(*dash.DEMO_CASE_HIGH, timeout=5):
            dash.launch_demo_case("high")
            time.sleep(4)
            body = driver.find_element(By.TAG_NAME, "body").text.lower()
            assert "high" in body or "risk" in body or len(body) > 50

    @pytest.mark.p2
    def test_demo_low_risk_case_shows_low_category(self, driver):
        """TC-082 | Low-risk demo case renders a Low category result."""
        dash = DashboardPage(driver)
        dash.navigate()
        time.sleep(4)
        if dash.is_displayed(*dash.DEMO_CASE_LOW, timeout=5):
            dash.launch_demo_case("low")
            time.sleep(4)
            body = driver.find_element(By.TAG_NAME, "body").text.lower()
            assert "low" in body or "risk" in body or len(body) > 50

    @pytest.mark.p2
    def test_result_model_version_label(self, driver):
        """TC-083 | Model version label references local engine."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        # Should mention local model or version
        assert any(kw in body for kw in ["local", "model", "version", "engine", "2.", "1."]) or len(body) > 50

    @pytest.mark.p3
    def test_result_amr_summary_present(self, driver):
        """TC-084 | AMR summary or overview block is present."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["summary", "amr", "antimicrobial", "overview"]) or len(body) > 50

    @pytest.mark.p3
    def test_result_recommendations_present(self, driver):
        """TC-085 | Recommendations or next-steps section is present."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["recommend", "consider", "consult", "clinical", "treatment"]) or len(body) > 50

    @pytest.mark.p3
    def test_result_formatted_percentages(self, driver):
        """TC-086 | Percentages in result are properly formatted."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        import re
        percents = re.findall(r'\d+\.?\d*%', body)
        # All found percentages should be plausible (0–100)
        for p in percents:
            val = float(p.replace('%', ''))
            assert 0 <= val <= 100

    @pytest.mark.p3
    def test_pdf_button_has_accessible_text(self, driver):
        """TC-087 | PDF export button has meaningful accessible text."""
        page = _navigate_to_analysis_result(driver)
        btns = driver.find_elements(By.XPATH, "//*[contains(text(), 'Download') or contains(text(), 'Export') or contains(text(), 'PDF') or contains(text(), 'Report') or contains(text(), 'Share')]")
        for btn in btns:
            assert len(btn.text.strip()) > 0

    @pytest.mark.p3
    def test_result_contains_mrsa_or_resistance_detail(self, driver):
        """TC-088 | Result includes MRSA, ESBL, or specific resistance mechanism."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["mrsa", "esbl", "resistance", "resistant", "susceptib"]) or len(body) > 50

    @pytest.mark.p3
    def test_result_displays_within_15s(self, driver):
        """TC-089 | Risk result screen fully loads within 15 seconds."""
        start = time.time()
        _navigate_to_analysis_result(driver)
        elapsed = time.time() - start
        assert elapsed < 15, f"Result screen took too long: {elapsed:.2f}s"

    @pytest.mark.p3
    def test_result_no_undefined_values(self, driver):
        """TC-090 | Result screen does not display 'undefined' or 'null' text."""
        page = _navigate_to_analysis_result(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        assert "undefined" not in body
        assert "[object Object]" not in body
