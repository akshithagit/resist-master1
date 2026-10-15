# ResistAI — CI/CD Execution & Automation Architecture Guide

This guide details the continuous integration, testing, and deployment lifecycle implemented in `.github/workflows/android-e2e.yml`.

---

## 1. 21-Stage Pipeline Flow

```
+-----------------------------------------------------------------------------------+
|                        STAGE 1: CHECKOUT REPOSITORY                               |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                     STAGES 2–4: ENVIRONMENT INITIALIZATION                         |
|  - Setup Java 17 (Temurin)                                                        |
|  - Setup Android SDK (API Level 31 / google_apis)                                 |
|  - Install Appium 2.x & UiAutomator2 driver                                       |
|  - Install Python mobile dependencies (pytest, openpyxl, Appium-Python-Client)    |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                     STAGES 5–8: BUILD, BOOT & INSTALL                             |
|  - Build/Package Android application                                              |
|  - Start hardware-accelerated Android Emulator (reactive-circus/emulator-runner)  |
|  - Wait for device readiness (adb wait-for-device)                                |
|  - Install APK to emulator instance (adb install -r)                              |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                    STAGES 9–10: APPIUM SERVER INITIALIZATION                      |
|  - Launch Appium 2.x background server on port 4723                               |
|  - Verify server health via GET /status check (HTTP 200)                          |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                    STAGES 11–17: TEST EXECUTION & REPORTING                       |
|  - Execute 400+ Appium test cases with automatic retry                            |
|  - Capture failure screenshots & device logcat output                             |
|  - Generate 7-sheet Excel Report (Automation_Test_Report.xlsx)                    |
|  - Generate Interactive HTML Report & Dashboard (execution-report.html)           |
|  - Generate JSON Results & Markdown Summary                                       |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                   STAGES 18–21: ARTIFACTS, PAGES & SUMMARY                        |
|  - Upload all test artifacts (30 days retention)                                  |
|  - Publish reports to GitHub Pages under `reports/latest/`                        |
|  - Archive build history under `reports/history/build-${{ github.run_number }}/`  |
|  - Publish GitHub Action Step Summary to PR / commit run                          |
|  - Enforce Quality Gate (Fail if pass rate < 95%)                                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. Pipeline Triggers

- **`push`:** Triggers automatically on code pushes to `main` or `master`.
- **`pull_request`:** Executes validation and runs the test suite on incoming PRs.
- **`workflow_dispatch`:** Enables on-demand manual trigger via the GitHub Actions tab.
- **`schedule`:** Executes a nightly regression run at `02:00 UTC` every night.

---

## 3. Failure Criteria & Quality Gate

The pipeline adheres to strict quality thresholds:
- **Failure:** Infrastructure crashes (Emulator fails to start, APK installation fails, Appium fails to bind), or test pass rate drops below **95.0%**.
- **Passing:** Emulator, Appium, and application execute successfully with **>= 95.0%** passing tests.
