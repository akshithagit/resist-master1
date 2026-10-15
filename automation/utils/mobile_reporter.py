"""
ResistAI - Mobile E2E Multi-Format Report Generator
Generates:
1. Excel Reports (Automation_Test_Report.xlsx with 7 sheets, Passed_Test_Cases.xlsx, Failed_Test_Cases.xlsx, Execution_Summary.xlsx)
2. HTML Reports (execution-report.html, dashboard.html, trends.html)
3. JSON Report (execution-results.json)
4. Markdown Summary (summary.md)
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from automation.config.mobile_config import (
    EXCEL_TEST_REPORT,
    EXCEL_PASSED_REPORT,
    EXCEL_FAILED_REPORT,
    EXCEL_SUMMARY_REPORT,
    HTML_EXECUTION_REPORT,
    HTML_DASHBOARD,
    HTML_TRENDS,
    JSON_RESULTS,
    MARKDOWN_SUMMARY,
    DEVICE_NAME,
    PLATFORM_VERSION,
    PLATFORM_NAME,
    APP_PACKAGE
)

# Styles
FONT_HEADER = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
FONT_TITLE = Font(name="Calibri", size=14, bold=True, color="1E293B")
FONT_REGULAR = Font(name="Calibri", size=10)
FONT_BOLD = Font(name="Calibri", size=10, bold=True)

FILL_NAVY = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
FILL_SLATE = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
FILL_PASS = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
FILL_FAIL = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
FILL_SKIP = PatternFill(start_color="FEF9C3", end_color="FEF9C3", fill_type="solid")

THIN_BORDER = Border(
    left=Side(style="thin", color="CBD5E1"),
    right=Side(style="thin", color="CBD5E1"),
    top=Side(style="thin", color="CBD5E1"),
    bottom=Side(style="thin", color="CBD5E1")
)

def auto_fit(ws, max_cols=None):
    for col in ws.columns:
        if max_cols and col[0].column > max_cols:
            continue
        col_letter = get_column_letter(col[0].column)
        max_len = 0
        for cell in col:
            val_str = str(cell.value or "")
            if "\n" in val_str:
                val_str = max(val_str.split("\n"), key=len)
            max_len = max(max_len, len(val_str))
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 60)

class MobileReporter:
    @staticmethod
    def generate_all_reports(test_results: List[Dict[str, Any]], start_time: float, end_time: float):
        duration = round(end_time - start_time, 2)
        total = len(test_results)
        passed = sum(1 for r in test_results if r.get("status") == "PASSED")
        failed = sum(1 for r in test_results if r.get("status") == "FAILED")
        skipped = sum(1 for r in test_results if r.get("status") == "SKIPPED")
        pass_rate = round((passed / total * 100), 1) if total > 0 else 0.0

        summary_metrics = {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "pass_rate": pass_rate,
            "duration": duration,
            "device": DEVICE_NAME,
            "android_version": PLATFORM_VERSION,
            "platform": PLATFORM_NAME,
            "app_package": APP_PACKAGE,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # 1. JSON Report
        MobileReporter.generate_json(test_results, summary_metrics)

        # 2. Excel Reports
        MobileReporter.generate_excel(test_results, summary_metrics)

        # 3. HTML Reports
        MobileReporter.generate_html(test_results, summary_metrics)

        # 4. Markdown Summary
        MobileReporter.generate_markdown(test_results, summary_metrics)

    @staticmethod
    def generate_json(results: List[Dict[str, Any]], metrics: Dict[str, Any]):
        data = {
            "summary": metrics,
            "tests": results
        }
        with open(JSON_RESULTS, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    @staticmethod
    def generate_excel(results: List[Dict[str, Any]], metrics: Dict[str, Any]):
        # Main Workbook: Automation_Test_Report.xlsx (7 Sheets)
        wb = openpyxl.Workbook()

        # Sheet 1: Executed Test Cases
        ws1 = wb.active
        ws1.title = "Executed Test Cases"
        h1 = ["Test ID", "Module", "Test Name", "Priority", "Status", "Execution Time (s)", "Failure Reason"]
        ws1.append(h1)
        for c in range(1, len(h1) + 1):
            cell = ws1.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
            cell.alignment = Alignment(horizontal="center")

        for r_idx, r in enumerate(results, start=2):
            vals = [
                r.get("id"),
                r.get("module"),
                r.get("name"),
                r.get("priority", "Medium"),
                r.get("status"),
                r.get("duration", 0.05),
                r.get("error", "")
            ]
            for c_idx, val in enumerate(vals, start=1):
                cell = ws1.cell(r_idx, c_idx, val)
                cell.font = FONT_REGULAR
                cell.border = THIN_BORDER
                if c_idx == 5:
                    cell.alignment = Alignment(horizontal="center")
                    if val == "PASSED":
                        cell.fill = FILL_PASS
                    elif val == "FAILED":
                        cell.fill = FILL_FAIL
                    elif val == "SKIPPED":
                        cell.fill = FILL_SKIP
        auto_fit(ws1)

        # Sheet 2: Passed Tests
        ws2 = wb.create_sheet(title="Passed Tests")
        ws2.append(h1[:6])
        for c in range(1, 7):
            cell = ws2.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
            cell.alignment = Alignment(horizontal="center")
        for r_idx, r in enumerate([x for x in results if x.get("status") == "PASSED"], start=2):
            vals = [r.get("id"), r.get("module"), r.get("name"), r.get("priority"), "PASSED", r.get("duration", 0.05)]
            for c_idx, val in enumerate(vals, start=1):
                cell = ws2.cell(r_idx, c_idx, val)
                cell.font = FONT_REGULAR
                cell.border = THIN_BORDER
                if c_idx == 5:
                    cell.fill = FILL_PASS
                    cell.alignment = Alignment(horizontal="center")
        auto_fit(ws2)

        # Sheet 3: Failed Tests
        ws3 = wb.create_sheet(title="Failed Tests")
        ws3.append(h1)
        for c in range(1, len(h1) + 1):
            cell = ws3.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
            cell.alignment = Alignment(horizontal="center")
        for r_idx, r in enumerate([x for x in results if x.get("status") == "FAILED"], start=2):
            vals = [r.get("id"), r.get("module"), r.get("name"), r.get("priority"), "FAILED", r.get("duration", 0.05), r.get("error", "Assertion Failure")]
            for c_idx, val in enumerate(vals, start=1):
                cell = ws3.cell(r_idx, c_idx, val)
                cell.font = FONT_REGULAR
                cell.border = THIN_BORDER
                if c_idx == 5:
                    cell.fill = FILL_FAIL
                    cell.alignment = Alignment(horizontal="center")
        auto_fit(ws3)

        # Sheet 4: Skipped Tests
        ws4 = wb.create_sheet(title="Skipped Tests")
        ws4.append(["Test ID", "Module", "Test Name", "Reason"])
        for c in range(1, 5):
            cell = ws4.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
            cell.alignment = Alignment(horizontal="center")
        for r_idx, r in enumerate([x for x in results if x.get("status") == "SKIPPED"], start=2):
            vals = [r.get("id"), r.get("module"), r.get("name"), r.get("error", "Precondition skipped")]
            for c_idx, val in enumerate(vals, start=1):
                cell = ws4.cell(r_idx, c_idx, val)
                cell.font = FONT_REGULAR
                cell.border = THIN_BORDER
        auto_fit(ws4)

        # Sheet 5: Execution Metrics
        ws5 = wb.create_sheet(title="Execution Metrics")
        ws5.append(["Metric", "Value"])
        for c in range(1, 3):
            cell = ws5.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
        m_items = [
            ("Device Name", metrics["device"]),
            ("Android Version", metrics["android_version"]),
            ("Platform", metrics["platform"]),
            ("App Package", metrics["app_package"]),
            ("Total Test Cases", metrics["total"]),
            ("Passed Count", metrics["passed"]),
            ("Failed Count", metrics["failed"]),
            ("Skipped Count", metrics["skipped"]),
            ("Pass Percentage", f"{metrics['pass_rate']}%"),
            ("Total Duration (seconds)", metrics["duration"]),
            ("Execution Timestamp", metrics["timestamp"])
        ]
        for r_idx, (k, v) in enumerate(m_items, start=2):
            c1 = ws5.cell(r_idx, 1, k)
            c2 = ws5.cell(r_idx, 2, v)
            c1.font = FONT_BOLD
            c2.font = FONT_REGULAR
            c1.border = THIN_BORDER
            c2.border = THIN_BORDER
        auto_fit(ws5)

        # Sheet 6: Defect Summary
        ws6 = wb.create_sheet(title="Defect Summary")
        ws6.append(["Defect ID", "Associated Test ID", "Module", "Failure Summary", "Severity"])
        for c in range(1, 6):
            cell = ws6.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
        failed_tests = [x for x in results if x.get("status") == "FAILED"]
        if not failed_tests:
            ws6.append(["None", "N/A", "N/A", "Zero defects recorded - 100% test execution passed", "N/A"])
        else:
            for r_idx, r in enumerate(failed_tests, start=2):
                ws6.append([f"DEF_{r_idx-1:03d}", r.get("id"), r.get("module"), r.get("error", "Verification mismatch"), r.get("priority")])
        auto_fit(ws6)

        # Sheet 7: Pass Rate Summary
        ws7 = wb.create_sheet(title="Pass Rate Summary")
        ws7.append(["Module", "Total Tests", "Passed", "Failed", "Skipped", "Pass Rate (%)"])
        for c in range(1, 7):
            cell = ws7.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY

        modules = sorted(list(set(r.get("module", "General") for r in results)))
        for r_idx, mod in enumerate(modules, start=2):
            mod_res = [r for r in results if r.get("module") == mod]
            m_total = len(mod_res)
            m_passed = sum(1 for r in mod_res if r.get("status") == "PASSED")
            m_failed = sum(1 for r in mod_res if r.get("status") == "FAILED")
            m_skipped = sum(1 for r in mod_res if r.get("status") == "SKIPPED")
            m_rate = round((m_passed / m_total * 100), 1) if m_total > 0 else 0
            row_vals = [mod, m_total, m_passed, m_failed, m_skipped, f"{m_rate}%"]
            for c_idx, val in enumerate(row_vals, start=1):
                cell = ws7.cell(r_idx, c_idx, val)
                cell.font = FONT_REGULAR
                cell.border = THIN_BORDER
                if c_idx >= 2:
                    cell.alignment = Alignment(horizontal="center")
        auto_fit(ws7)

        wb.save(EXCEL_TEST_REPORT)

        # Standalone Workbooks
        # 1. Passed_Test_Cases.xlsx
        wb_pass = openpyxl.Workbook()
        ws_p = wb_pass.active
        ws_p.title = "Passed Tests"
        ws_p.append(h1[:6])
        for c in range(1, 7):
            cell = ws_p.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
        for r_idx, r in enumerate([x for x in results if x.get("status") == "PASSED"], start=2):
            vals = [r.get("id"), r.get("module"), r.get("name"), r.get("priority"), "PASSED", r.get("duration", 0.05)]
            for c_idx, val in enumerate(vals, start=1):
                cell = ws_p.cell(r_idx, c_idx, val)
                cell.font = FONT_REGULAR
                cell.border = THIN_BORDER
        auto_fit(ws_p)
        wb_pass.save(EXCEL_PASSED_REPORT)

        # 2. Failed_Test_Cases.xlsx
        wb_fail = openpyxl.Workbook()
        ws_f = wb_fail.active
        ws_f.title = "Failed Tests"
        ws_f.append(h1)
        for c in range(1, len(h1) + 1):
            cell = ws_f.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
        for r_idx, r in enumerate([x for x in results if x.get("status") == "FAILED"], start=2):
            vals = [r.get("id"), r.get("module"), r.get("name"), r.get("priority"), "FAILED", r.get("duration", 0.05), r.get("error", "Error")]
            for c_idx, val in enumerate(vals, start=1):
                cell = ws_f.cell(r_idx, c_idx, val)
                cell.font = FONT_REGULAR
                cell.border = THIN_BORDER
        auto_fit(ws_f)
        wb_fail.save(EXCEL_FAILED_REPORT)

        # 3. Execution_Summary.xlsx
        wb_sum = openpyxl.Workbook()
        ws_s = wb_sum.active
        ws_s.title = "Summary"
        ws_s.append(["Metric", "Value"])
        for c in range(1, 3):
            cell = ws_s.cell(1, c)
            cell.font = FONT_HEADER
            cell.fill = FILL_NAVY
        for r_idx, (k, v) in enumerate(m_items, start=2):
            c1 = ws_s.cell(r_idx, 1, k)
            c2 = ws_s.cell(r_idx, 2, v)
            c1.font = FONT_BOLD
            c2.font = FONT_REGULAR
            c1.border = THIN_BORDER
            c2.border = THIN_BORDER
        auto_fit(ws_s)
        wb_sum.save(EXCEL_SUMMARY_REPORT)

    @staticmethod
    def generate_html(results: List[Dict[str, Any]], metrics: Dict[str, Any]):
        rows_html = ""
        for r in results:
            status = r.get("status", "PASSED")
            color_class = "pass" if status == "PASSED" else ("fail" if status == "FAILED" else "skip")
            rows_html += f"""
            <tr class="{color_class}">
                <td><code>{r.get('id')}</code></td>
                <td>{r.get('module')}</td>
                <td>{r.get('name')}</td>
                <td><span class="badge {r.get('priority', 'Medium').lower()}">{r.get('priority', 'Medium')}</span></td>
                <td><span class="status-badge {color_class}">{status}</span></td>
                <td>{r.get('duration', 0.05)}s</td>
                <td>{r.get('error', '-')}</td>
            </tr>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ResistAI — Android Appium E2E Automation Report</title>
    <style>
        :root {{
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent: #38bdf8;
            --pass: #22c55e;
            --fail: #ef4444;
            --skip: #eab308;
            --border: #334155;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            color: var(--text-primary);
            margin: 0;
            padding: 24px;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            padding-bottom: 20px;
            margin-bottom: 24px;
        }}
        .title h1 {{ margin: 0; font-size: 24px; color: var(--accent); }}
        .title p {{ margin: 4px 0 0 0; color: var(--text-secondary); }}
        .cards-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }}
        .metric-card {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }}
        .metric-card .num {{ font-size: 32px; font-weight: bold; margin-bottom: 4px; }}
        .metric-card.pass .num {{ color: var(--pass); }}
        .metric-card.fail .num {{ color: var(--fail); }}
        .metric-card.skip .num {{ color: var(--skip); }}
        .metric-card.rate .num {{ color: var(--accent); }}
        .device-info {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            font-size: 14px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background: var(--card-bg);
            border-radius: 8px;
            overflow: hidden;
            font-size: 13px;
        }}
        th, td {{
            padding: 10px 14px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }}
        th {{ background: #111827; color: var(--text-secondary); text-transform: uppercase; font-size: 11px; }}
        .status-badge {{
            padding: 3px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
        }}
        .status-badge.pass {{ background: rgba(34, 197, 94, 0.2); color: var(--pass); }}
        .status-badge.fail {{ background: rgba(239, 68, 68, 0.2); color: var(--fail); }}
        .status-badge.skip {{ background: rgba(234, 179, 8, 0.2); color: var(--skip); }}
        .badge.critical {{ color: #f87171; }}
        .badge.high {{ color: #fb923c; }}
        .badge.medium {{ color: #38bdf8; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">
            <h1>ResistAI — Android Mobile E2E Automation Report</h1>
            <p>Appium 2.x UiAutomator2 Test Suite Execution</p>
        </div>
        <div>
            <span style="font-size: 13px; color: var(--text-secondary);">Executed: {metrics['timestamp']}</span>
        </div>
    </div>

    <div class="cards-grid">
        <div class="metric-card">
            <div class="num">{metrics['total']}</div>
            <div style="color: var(--text-secondary);">Total Tests</div>
        </div>
        <div class="metric-card pass">
            <div class="num">{metrics['passed']}</div>
            <div style="color: var(--text-secondary);">Passed</div>
        </div>
        <div class="metric-card fail">
            <div class="num">{metrics['failed']}</div>
            <div style="color: var(--text-secondary);">Failed</div>
        </div>
        <div class="metric-card skip">
            <div class="num">{metrics['skipped']}</div>
            <div style="color: var(--text-secondary);">Skipped</div>
        </div>
        <div class="metric-card rate">
            <div class="num">{metrics['pass_rate']}%</div>
            <div style="color: var(--text-secondary);">Pass Percentage</div>
        </div>
        <div class="metric-card">
            <div class="num">{metrics['duration']}s</div>
            <div style="color: var(--text-secondary);">Duration</div>
        </div>
    </div>

    <div class="device-info">
        <div><strong>Device:</strong> {metrics['device']}</div>
        <div><strong>Android Version:</strong> {metrics['android_version']}</div>
        <div><strong>Platform:</strong> {metrics['platform']}</div>
        <div><strong>Package:</strong> {metrics['app_package']}</div>
        <div><strong>Specimen Requirement:</strong> Initialstream</div>
        <div><strong>CTA Requirement:</strong> Calculate</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Test ID</th>
                <th>Module</th>
                <th>Test Name</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Failure Reason</th>
            </tr>
        </thead>
        <tbody>
            {rows_html}
        </tbody>
    </table>
</body>
</html>
"""
        with open(HTML_EXECUTION_REPORT, "w", encoding="utf-8") as f:
            f.write(html_content)

        # Also write dashboard.html and trends.html
        with open(HTML_DASHBOARD, "w", encoding="utf-8") as f:
            f.write(html_content.replace("Automation Report", "Executive Dashboard"))

        with open(HTML_TRENDS, "w", encoding="utf-8") as f:
            f.write(html_content.replace("Automation Report", "Historical Trends"))

    @staticmethod
    def generate_markdown(results: List[Dict[str, Any]], metrics: Dict[str, Any]):
        passed_list = [r for r in results if r.get("status") == "PASSED"][:5]
        failed_list = [r for r in results if r.get("status") == "FAILED"][:5]
        skipped_list = [r for r in results if r.get("status") == "SKIPPED"][:5]

        passed_md = "\n".join([f"✓ **{r.get('id')}** - {r.get('name')}" for r in passed_list])
        failed_md = "\n".join([f"✗ **{r.get('id')}** - {r.get('name')}\n  *Reason: {r.get('error')}*" for r in failed_list]) if failed_list else "*Zero test failures recorded*"
        skipped_md = "\n".join([f"- **{r.get('id')}** - {r.get('name')}\n  *Reason: {r.get('error', 'Disabled')}*" for r in skipped_list]) if skipped_list else "*Zero skipped tests*"

        content = f"""# Android Appium E2E Execution Summary

**Build Execution Date:** {metrics['timestamp']}  
**Device:** {metrics['device']} | **Android Version:** {metrics['android_version']}  
**Application Package:** `{metrics['app_package']}`  
**Specimen Validation:** Initialstream | **Action Button:** Calculate  

---

### Execution Metrics

| Metric | Count / Value |
|---|---|
| **Total Test Cases** | **{metrics['total']}** |
| **Executed** | {metrics['passed'] + metrics['failed']} |
| **Passed** | **{metrics['passed']}** |
| **Failed** | {metrics['failed']} |
| **Skipped** | {metrics['skipped']} |
| **Pass Percentage** | **{metrics['pass_rate']}%** |
| **Fail Percentage** | {round(100 - metrics['pass_rate'], 1)}% |
| **Execution Duration** | {metrics['duration']}s |

---

### Valid Test Case Summary

#### PASSED TESTS (Sample)
{passed_md}

#### FAILED TESTS
{failed_md}

#### SKIPPED TESTS
{skipped_md}

---
*Generated automatically by ResistAI Mobile QA Framework*
"""
        with open(MARKDOWN_SUMMARY, "w", encoding="utf-8") as f:
            f.write(content)
