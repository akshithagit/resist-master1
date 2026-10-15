# ResistAI — Repository & GitHub Pages Configuration Guide

This guide describes repository-level settings required to enable automated Android E2E execution, artifact uploads, and GitHub Pages report publishing.

---

## 1. GitHub Pages Configuration

To host live interactive test reports on GitHub Pages:
1. Open the repository on GitHub: `https://github.com/akshithagit/resist-master1`
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**:
   - **Source:** Select **`GitHub Actions`** (do not select "Deploy from a branch").
4. Once configured, each workflow run will deploy reports to:
   - **Live Latest Report:** `https://akshithagit.github.io/resist-master1/reports/latest/execution-report.html`
   - **Historical Archive:** `https://akshithagit.github.io/resist-master1/reports/history/build-<run_number>/execution-report.html`

---

## 2. GitHub Actions Permissions

To allow workflows to publish summaries, upload artifacts, and deploy to Pages:
1. Navigate to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**:
   - Select **Read and write permissions**
   - Check **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**.

---

## 3. Directory Layout Overview

```
resist-master/
├── .github/
│   └── workflows/
│       ├── android-e2e.yml            # 21-stage enterprise mobile pipeline
│       └── deploy-reports.yml         # Standalone reports deployment workflow
│
├── automation/
│   ├── config/
│   │   ├── config.py                  # Web config
│   │   └── mobile_config.py           # Appium mobile config
│   ├── data/
│   │   ├── mobile_catalog.py          # 470 test case definitions
│   │   └── mobile_test_data.py        # Clinical payloads & test fixtures
│   ├── drivers/
│   │   └── mobile_driver_factory.py   # UiAutomator2 driver factory + mock fallback
│   ├── listeners/                     # Test execution hooks
│   ├── pages/                         # Page Object Models
│   ├── reports/                       # Web reports
│   ├── resources/                     # Appium capabilities (caps.json)
│   ├── runners/
│   │   └── mobile_test_runner.py      # Automated runner for 470 test cases
│   ├── tests/
│   │   └── mobile/                    # Pytest mobile test suite
│   └── utils/
│       └── mobile_reporter.py         # Multi-format report generator
│
└── Test Results/                      # Output directory
    ├── Excel/                         # 4 Excel workbooks (Automation_Test_Report.xlsx, etc.)
    ├── HTML/                          # Interactive execution-report.html, dashboard, trends
    ├── JSON/                          # execution-results.json
    ├── Logs/                          # Execution logs
    ├── Screenshots/                   # Failure screenshots
    └── Summary/                       # summary.md
```
