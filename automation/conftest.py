"""
ResistAI - Pytest Conftest (Fixtures & Session-Level Setup)
Provides shared driver fixture, session-level JSON result collection,
and automatic report generation at the end of the session.
"""

import json
import time
import os
import pytest
from datetime import datetime, timezone
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

from automation.config.config import (
    BASE_URL,
    HEADLESS,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    PAGE_LOAD_TIMEOUT,
    IMPLICIT_WAIT_TIMEOUT,
    EXECUTION_RESULTS_JSON,
)
from automation.utils.logger import logger
from automation.utils.html_reporter import HTMLReportGenerator
from automation.utils.excel_reporter import ExcelReportGenerator
from automation.utils.summary_publisher import SummaryPublisher


# ─────────────────────────────────────────────────────────────────────────────
# Session-level results store (shared across all tests via conftest globals)
# ─────────────────────────────────────────────────────────────────────────────
SESSION_RESULTS: list = []
SESSION_START: float = time.time()


def pytest_configure(config):
    logger.info("=" * 60)
    logger.info("  ResistAI Selenium E2E Test Suite – Session Starting")
    logger.info(f"  Target URL : {BASE_URL}")
    logger.info(f"  Headless   : {HEADLESS}")
    logger.info("=" * 60)


# ─────────────────────────────────────────────────────────────────────────────
# Chrome WebDriver Fixture (function-scoped – fresh driver per test)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.fixture(scope="function")
def driver():
    chrome_options = Options()
    if HEADLESS:
        chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-infobars")
    chrome_options.add_argument("--disable-popup-blocking")
    chrome_options.add_argument(f"--window-size={WINDOW_WIDTH},{WINDOW_HEIGHT}")
    chrome_options.add_argument("--lang=en-US")
    chrome_options.add_argument("--log-level=3")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-logging"])

    service = Service(ChromeDriverManager().install())
    _driver = webdriver.Chrome(service=service, options=chrome_options)
    _driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
    _driver.implicitly_wait(IMPLICIT_WAIT_TIMEOUT)
    _driver.set_window_size(WINDOW_WIDTH, WINDOW_HEIGHT)

    logger.info("Chrome WebDriver initialised.")
    yield _driver

    _driver.quit()
    logger.info("Chrome WebDriver closed.")


# ─────────────────────────────────────────────────────────────────────────────
# Result collection hooks
# ─────────────────────────────────────────────────────────────────────────────
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    if report.when == "call":
        duration = report.duration
        status = "PASSED" if report.passed else ("FAILED" if report.failed else "SKIPPED")

        # Collect markers
        markers = {m.name for m in item.iter_markers()}
        priority = "P1" if "p1" in markers else ("P2" if "p2" in markers else "P3")
        module = item.get_closest_marker("module")
        module_name = module.args[0] if module else _derive_module(item.nodeid)

        result = {
            "test_id": _build_test_id(item),
            "title": item.name,
            "module": module_name,
            "status": status,
            "duration": round(duration, 3),
            "priority": priority,
            "error_message": "",
            "stack_trace": "",
            "screenshot_path": "",
        }

        if report.failed:
            result["error_message"] = str(report.longrepr).split("\n")[-1][:300] if report.longrepr else "Unknown"
            result["stack_trace"] = str(report.longrepr)[:500] if report.longrepr else ""

        SESSION_RESULTS.append(result)


def _build_test_id(item) -> str:
    """Generate a short, readable test ID like TC-001."""
    idx = len(SESSION_RESULTS) + 1
    return f"TC-{idx:03d}"


def _derive_module(nodeid: str) -> str:
    """Derive module name from test node ID."""
    parts = nodeid.split("/")
    if len(parts) >= 2:
        filename = parts[-1].split("::")[0].replace("test_", "").replace(".py", "")
        return filename.replace("_", " ").title()
    return "General"


# ─────────────────────────────────────────────────────────────────────────────
# Session finalisation – report generation
# ─────────────────────────────────────────────────────────────────────────────
def pytest_sessionfinish(session, exitstatus):
    results = SESSION_RESULTS
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASSED")
    failed = sum(1 for r in results if r["status"] == "FAILED")
    skipped = total - passed - failed
    elapsed = round(time.time() - SESSION_START, 2)
    pass_rate = (passed / max(1, total)) * 100

    stats = {
        "total": total,
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "pass_rate": pass_rate,
        "total_duration": elapsed,
        "avg_duration": round(elapsed / max(1, total), 3),
        "base_url": BASE_URL,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "build_status": "PASS" if exitstatus == 0 else "FAIL",
        "deployment_status": "LIVE",
    }

    # Persist raw JSON results
    try:
        with open(EXECUTION_RESULTS_JSON, "w", encoding="utf-8") as f:
            json.dump({"summary": stats, "results": results}, f, indent=2)
    except Exception as e:
        logger.warning(f"JSON results write failed: {e}")

    # Generate all reports
    try:
        HTMLReportGenerator.generate_reports(results, stats)
    except Exception as e:
        logger.warning(f"HTML report generation failed: {e}")

    try:
        ExcelReportGenerator.generate_all_reports(results, stats)
    except Exception as e:
        logger.warning(f"Excel report generation failed: {e}")

    try:
        SummaryPublisher.generate_and_publish_summary(results, stats)
    except Exception as e:
        logger.warning(f"Summary publish failed: {e}")

    logger.info("=" * 60)
    logger.info(f"  Session Complete  |  Total: {total}  |  Passed: {passed}  |  Failed: {failed}")
    logger.info(f"  Pass Rate: {pass_rate:.1f}%  |  Duration: {elapsed:.2f}s")
    logger.info("=" * 60)
