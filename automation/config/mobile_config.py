"""
ResistAI - Mobile Automation Configuration
Centralized configuration for Appium 2.x, Android Emulator, Device Capabilities,
and Multi-Format Report Directories.
"""

import os
from pathlib import Path

AUTOMATION_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = AUTOMATION_ROOT.parent

# Test Results Output Structure
TEST_RESULTS_DIR = PROJECT_ROOT / "Test Results"
EXCEL_DIR = TEST_RESULTS_DIR / "Excel"
HTML_DIR = TEST_RESULTS_DIR / "HTML"
JSON_DIR = TEST_RESULTS_DIR / "JSON"
SCREENSHOTS_DIR = TEST_RESULTS_DIR / "Screenshots"
LOGS_DIR = TEST_RESULTS_DIR / "Logs"
SUMMARY_DIR = TEST_RESULTS_DIR / "Summary"

# Ensure all output directories exist
for directory in [
    TEST_RESULTS_DIR,
    EXCEL_DIR,
    HTML_DIR,
    JSON_DIR,
    SCREENSHOTS_DIR,
    LOGS_DIR,
    SUMMARY_DIR
]:
    directory.mkdir(parents=True, exist_ok=True)

# Appium Server Configuration
APPIUM_HOST = os.getenv("APPIUM_HOST", "127.0.0.1")
APPIUM_PORT = int(os.getenv("APPIUM_PORT", "4723"))
APPIUM_SERVER_URL = os.getenv("APPIUM_SERVER_URL", f"http://{APPIUM_HOST}:{APPIUM_PORT}")

# Android Target Device Configuration
PLATFORM_NAME = os.getenv("PLATFORM_NAME", "Android")
AUTOMATION_NAME = os.getenv("AUTOMATION_NAME", "UiAutomator2")
DEVICE_NAME = os.getenv("DEVICE_NAME", "Android Emulator")
PLATFORM_VERSION = os.getenv("PLATFORM_VERSION", "11.0")
UDID = os.getenv("ANDROID_UDID", "emulator-5554")

# Android Application Packaging (ResistAI Expo / React Native App)
APP_PACKAGE = os.getenv("APP_PACKAGE", "com.resistai.app")
APP_ACTIVITY = os.getenv("APP_ACTIVITY", "com.resistai.app.MainActivity")
APK_PATH = os.getenv("APK_PATH", str(PROJECT_ROOT / "android" / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"))

# Timeouts & Concurrency
IMPLICIT_WAIT = int(os.getenv("IMPLICIT_WAIT", "10"))
EXPLICIT_WAIT = int(os.getenv("EXPLICIT_WAIT", "20"))
PAGE_LOAD_TIMEOUT = int(os.getenv("PAGE_LOAD_TIMEOUT", "30"))
RETRY_COUNT = int(os.getenv("RETRY_COUNT", "2"))
PARALLEL_WORKERS = int(os.getenv("PARALLEL_WORKERS", "1"))

# Mock / Simulated Driver Mode (for CI environments without hardware KVM)
MOCK_DRIVER = os.getenv("MOCK_DRIVER", "false").lower() in ("true", "1", "yes")

# Report Filenames
EXCEL_TEST_REPORT = EXCEL_DIR / "Automation_Test_Report.xlsx"
EXCEL_PASSED_REPORT = EXCEL_DIR / "Passed_Test_Cases.xlsx"
EXCEL_FAILED_REPORT = EXCEL_DIR / "Failed_Test_Cases.xlsx"
EXCEL_SUMMARY_REPORT = EXCEL_DIR / "Execution_Summary.xlsx"

HTML_EXECUTION_REPORT = HTML_DIR / "execution-report.html"
HTML_DASHBOARD = HTML_DIR / "dashboard.html"
HTML_TRENDS = HTML_DIR / "trends.html"

JSON_RESULTS = JSON_DIR / "execution-results.json"
MARKDOWN_SUMMARY = SUMMARY_DIR / "summary.md"
