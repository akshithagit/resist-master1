# ResistAI — Android Appium E2E Automation: Local Execution Guide

This guide describes how to configure, run, debug, and generate reports for the ResistAI mobile automation test suite on your local workstation.

---

## 1. Prerequisites

1. **Java Development Kit (JDK):** JDK 17 or higher (`java -version`).
2. **Android SDK & Tools:** Android Studio installed with command-line tools, platform-tools, and emulator.
   - Set environment variables:
     - `ANDROID_HOME`: e.g., `C:\Users\<user>\AppData\Local\Android\Sdk`
     - Add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator` to `PATH`.
3. **Node.js:** v18 or v20+ (`node -v`).
4. **Python:** Python 3.10+ (`py --version`).
5. **Appium 2.x:**
   ```bash
   npm install -g appium
   appium driver install uiautomator2
   ```

---

## 2. Environment Setup

1. Install Python dependencies:
   ```bash
   pip install -r automation/requirements.txt
   ```
2. Verify Appium installation:
   ```bash
   appium driver list
   ```
   *Expected output: `uiautomator2` listed as installed.*

---

## 3. Running Android Emulator & Appium Server

### Terminal 1: Launch Android Emulator
```bash
emulator -avd <your_avd_name> -no-snapshot-load
# Check connected devices
adb devices
```

### Terminal 2: Start Appium Server
```bash
appium --port 4723 --relaxed-security
```
Verify Appium is listening at: `http://127.0.0.1:4723/status`.

---

## 4. Executing Tests Locally

### Option A: Execute Full Suite via Runner (Generates Excel, HTML, JSON, Markdown)
```bash
py automation/runners/mobile_test_runner.py
```

### Option B: Execute with Simulated / Mock Driver (No physical device / emulator required)
```bash
py automation/runners/mobile_test_runner.py --mock
```

### Option C: Execute via Pytest CLI
```bash
# Run all mobile tests
py -m pytest automation/tests/mobile/ -v

# Run with retries on failure
py -m pytest automation/tests/mobile/ -v --reruns 2

# Parallel execution across 4 CPU cores
py -m pytest automation/tests/mobile/ -n 4
```

---

## 5. Viewing Execution Reports

Generated reports are located in `Test Results/`:
- **Interactive HTML Report:** Open `Test Results/HTML/execution-report.html` in any browser.
- **Executive Dashboard:** Open `Test Results/HTML/dashboard.html`.
- **Excel Workbooks:** Inspect `Test Results/Excel/Automation_Test_Report.xlsx` (includes all 7 analytical sheets).
- **Execution Summary:** Open `Test Results/Summary/summary.md`.
