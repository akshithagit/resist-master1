# ResistAI — Mobile Automation & Appium Troubleshooting Guide

This guide provides diagnostic solutions for common mobile testing and infrastructure issues.

---

## 1. Emulator Startup & ADB Issues

### Problem: `adb wait-for-device` hangs or times out
- **Cause:** Hardware virtualization (VT-x / AMD-V / HAXM) disabled or emulator hardware acceleration unavailable.
- **Solution:**
  1. Verify hardware virtualization is enabled in BIOS/UEFI.
  2. Launch emulator with software rendering if GPU acceleration is missing:
     ```bash
     emulator -avd <avd_name> -gpu swiftshader_indirect -no-audio
     ```
  3. Restart ADB server:
     ```bash
     adb kill-server
     adb start-server
     adb devices
     ```

---

## 2. Appium Connection Failures

### Problem: `ConnectionRefusedError: [Errno 111] Connection refused`
- **Cause:** Appium server is not running on port 4723 or blocked by a firewall.
- **Solution:**
  1. Check if Appium is listening:
     ```bash
     curl http://127.0.0.1:4723/status
     ```
  2. Start Appium with relaxed security:
     ```bash
     appium --port 4723 --relaxed-security
     ```

### Problem: `Could not find a driver for automationName 'UiAutomator2'`
- **Cause:** The UiAutomator2 driver extension is not installed in Appium 2.x.
- **Solution:**
  ```bash
  appium driver install uiautomator2
  appium driver list
  ```

---

## 3. Element Not Found / Timeout Errors

### Problem: `NoSuchElementException` on accessibility ID
- **Cause:** Screen transition delay or dynamic element rendering in React Native.
- **Solution:**
  1. Verify accessibility ID exists in React Native source (`testID="..."` or `accessibilityLabel="..."`).
  2. Increase explicit wait timeout in `automation/config/mobile_config.py`:
     ```python
     EXPLICIT_WAIT = 25
     ```
  3. Inspect current view hierarchy using Appium Inspector or `adb shell uiautomator dump`.

---

## 4. Test Reporting Discrepancies

### Problem: Missing Excel or HTML reports after test run
- **Cause:** Script terminated before post-execution hooks fired.
- **Solution:**
  1. Always invoke execution via `automation/runners/mobile_test_runner.py` which wraps execution in `try ... finally` blocks.
  2. Verify that output directories under `Test Results/` have write permissions.
