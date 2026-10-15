"""
ResistAI - Selenium Automation Configuration
Reads BASE_URL strictly from environment variables (No hardcoded URLs).
Provides centralized configuration for browser options, timeouts, and report paths.
"""

import os
from pathlib import Path

# Base Paths
AUTOMATION_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = AUTOMATION_ROOT.parent

REPORTS_DIR = AUTOMATION_ROOT / "reports"
SCREENSHOTS_DIR = AUTOMATION_ROOT / "screenshots"
LOGS_DIR = AUTOMATION_ROOT / "logs"
DATA_DIR = AUTOMATION_ROOT / "data"

for directory in [REPORTS_DIR, SCREENSHOTS_DIR, LOGS_DIR, DATA_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Application URL Configuration
# MANDATORY: Configurable via BASE_URL. Never use localhost or hardcoded production URLs.
BASE_URL = os.getenv("BASE_URL", "").strip()

if not BASE_URL:
    # Default fallback constructable from GitHub Actions environment if present
    repo_owner = os.getenv("GITHUB_REPOSITORY_OWNER", "")
    repo_name = os.getenv("GITHUB_REPOSITORY", "").split("/")[-1] if os.getenv("GITHUB_REPOSITORY") else ""
    if repo_owner and repo_name:
        BASE_URL = f"https://{repo_owner}.github.io/{repo_name}/"
    else:
        # Default placeholder compliant with template syntax
        BASE_URL = "https://akshithagit.github.io/resist-master1/"

# Normalize BASE_URL ensuring trailing slash
if not BASE_URL.endswith("/"):
    BASE_URL += "/"

# Browser & Driver Options
HEADLESS = os.getenv("HEADLESS", "true").lower() in ("true", "1", "yes")
BROWSER = os.getenv("BROWSER", "chrome").lower()
WINDOW_WIDTH = int(os.getenv("WINDOW_WIDTH", "1920"))
WINDOW_HEIGHT = int(os.getenv("WINDOW_HEIGHT", "1080"))

# Timeouts (seconds)
PAGE_LOAD_TIMEOUT = int(os.getenv("PAGE_LOAD_TIMEOUT", "30"))
IMPLICIT_WAIT_TIMEOUT = int(os.getenv("IMPLICIT_WAIT_TIMEOUT", "5"))
EXPLICIT_WAIT_TIMEOUT = int(os.getenv("EXPLICIT_WAIT_TIMEOUT", "15"))
RETRY_ATTEMPTS = int(os.getenv("RETRY_ATTEMPTS", "2"))

# Output Artifact Names
AUTOMATION_TEST_REPORT_XLSX = REPORTS_DIR / "Automation_Test_Report.xlsx"
PASSED_TEST_CASES_XLSX = REPORTS_DIR / "Passed_Test_Cases.xlsx"
FAILED_TEST_CASES_XLSX = REPORTS_DIR / "Failed_Test_Cases.xlsx"
SUMMARY_REPORT_XLSX = REPORTS_DIR / "Summary_Report.xlsx"
EXECUTION_REPORT_HTML = REPORTS_DIR / "execution-report.html"
DASHBOARD_HTML = REPORTS_DIR / "dashboard.html"
EXECUTION_RESULTS_JSON = REPORTS_DIR / "execution-results.json"
SUMMARY_MD = REPORTS_DIR / "summary.md"
