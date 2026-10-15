"""
ResistAI - Executive HTML Automation Report & Dashboard Generator
Generates responsive, interactive HTML execution reports and dashboards:
1. execution-report.html
2. dashboard.html
Includes interactive filtering, search, metrics cards, module pass-rate breakdowns, and screenshots.
"""

from typing import List, Dict, Any
import json
from pathlib import Path
from automation.config.config import EXECUTION_REPORT_HTML, DASHBOARD_HTML
from automation.utils.logger import logger

class HTMLReportGenerator:
    @staticmethod
    def generate_reports(test_results: List[Dict[str, Any]], stats: Dict[str, Any]):
        logger.info("Generating HTML execution reports and dashboard...")
        html_content = HTMLReportGenerator._build_html(test_results, stats, is_dashboard=False)
        dashboard_content = HTMLReportGenerator._build_html(test_results, stats, is_dashboard=True)

        with open(EXECUTION_REPORT_HTML, "w", encoding="utf-8") as f:
            f.write(html_content)

        with open(DASHBOARD_HTML, "w", encoding="utf-8") as f:
            f.write(dashboard_content)

        logger.info(f"HTML reports saved: {EXECUTION_REPORT_HTML.name}, {DASHBOARD_HTML.name}")

    @staticmethod
    def _build_html(results: List[Dict[str, Any]], stats: Dict[str, Any], is_dashboard: bool = False) -> str:
        total = stats.get("total", len(results))
        passed = stats.get("passed", 0)
        failed = stats.get("failed", 0)
        skipped = stats.get("skipped", 0)
        pass_rate = stats.get("pass_rate", 0.0)
        duration = stats.get("total_duration", 0.0)
        base_url = stats.get("base_url", "")
        timestamp = stats.get("timestamp", "")

        # Compute Module Stats
        modules = {}
        for r in results:
            mod = r.get("module", "General")
            if mod not in modules:
                modules[mod] = {"total": 0, "passed": 0, "failed": 0, "skipped": 0}
            modules[mod]["total"] += 1
            st = r.get("status", "PASSED")
            if st == "PASSED":
                modules[mod]["passed"] += 1
            elif st == "FAILED":
                modules[mod]["failed"] += 1
            else:
                modules[mod]["skipped"] += 1

        rows_html = []
        for r in results:
            status = r.get("status", "PASSED")
            badge_class = "badge-pass" if status == "PASSED" else ("badge-fail" if status == "FAILED" else "badge-skip")
            screenshot_link = f"<a href='{r.get('screenshot_path')}' target='_blank' class='btn-shot'>View Screenshot</a>" if r.get("screenshot_path") else ""
            error_html = f"<div class='error-trace'>{r.get('error_message', '')}</div>" if r.get("error_message") else ""

            rows_html.append(f"""
            <tr class="test-row" data-status="{status.lower()}" data-module="{r.get('module', '')}">
                <td><code>{r.get('test_id')}</code></td>
                <td><strong>{r.get('module')}</strong></td>
                <td>
                    <div class="test-title">{r.get('title')}</div>
                    {error_html}
                </td>
                <td><span class="prio-tag prio-{r.get('priority', 'P1').lower()}">{r.get('priority', 'P1')}</span></td>
                <td><span class="badge {badge_class}">{status}</span></td>
                <td>{round(r.get('duration', 0.0), 3)}s</td>
                <td>{screenshot_link}</td>
            </tr>
            """)

        module_cards = []
        for mod_name, mod_stats in modules.items():
            mod_rate = (mod_stats["passed"] / max(1, mod_stats["total"])) * 100
            bar_color = "#10B981" if mod_rate >= 90 else ("#F59E0B" if mod_rate >= 70 else "#EF4444")
            module_cards.append(f"""
            <div class="mod-card">
                <div class="mod-header">
                    <span>{mod_name}</span>
                    <strong>{mod_rate:.1f}%</strong>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {mod_rate}%; background-color: {bar_color};"></div>
                </div>
                <div class="mod-meta">
                    <span>{mod_stats['passed']}/{mod_stats['total']} passed</span>
                    {f"<span style='color: #EF4444'>{mod_stats['failed']} failed</span>" if mod_stats['failed'] > 0 else ""}
                </div>
            </div>
            """)

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ResistAI - {'Executive Dashboard' if is_dashboard else 'Test Execution Report'}</title>
    <style>
        :root {{
            --bg: #0F172A;
            --surface: #1E293B;
            --surface-border: #334155;
            --text-main: #F8FAFC;
            --text-muted: #94A3B8;
            --accent: #3B82F6;
            --pass: #10B981;
            --fail: #EF4444;
            --skip: #F59E0B;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        body {{ background-color: var(--bg); color: var(--text-main); padding: 32px 24px; }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        
        /* Header */
        .header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--surface-border); }}
        .header-title h1 {{ font-size: 26px; font-weight: 700; color: #FFFFFF; display: flex; align-items: center; gap: 10px; }}
        .header-title p {{ color: var(--text-muted); font-size: 14px; margin-top: 6px; }}
        .meta-pill {{ background: var(--surface); border: 1px solid var(--surface-border); padding: 8px 14px; border-radius: 8px; font-size: 13px; color: var(--text-muted); }}

        /* Metrics Grid */
        .metrics-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }}
        .metric-card {{ background: var(--surface); border: 1px solid var(--surface-border); border-radius: 12px; padding: 20px; }}
        .metric-card .label {{ font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px; }}
        .metric-card .value {{ font-size: 32px; font-weight: 800; margin-top: 6px; }}
        .val-pass {{ color: var(--pass); }}
        .val-fail {{ color: var(--fail); }}
        .val-skip {{ color: var(--skip); }}

        /* Module Breakdown */
        .section-title {{ font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #FFFFFF; }}
        .mod-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 36px; }}
        .mod-card {{ background: var(--surface); border: 1px solid var(--surface-border); border-radius: 10px; padding: 16px; }}
        .mod-header {{ display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; }}
        .progress-bar {{ height: 6px; background: #334155; border-radius: 3px; margin: 10px 0 8px 0; overflow: hidden; }}
        .progress-fill {{ height: 100%; border-radius: 3px; transition: width 0.3s; }}
        .mod-meta {{ display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); }}

        /* Filters & Table */
        .controls-bar {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }}
        .filter-group {{ display: flex; gap: 8px; }}
        .filter-btn {{ background: var(--surface); border: 1px solid var(--surface-border); color: var(--text-muted); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }}
        .filter-btn.active {{ background: var(--accent); color: #FFFFFF; border-color: var(--accent); }}
        .search-box {{ background: var(--surface); border: 1px solid var(--surface-border); color: #FFFFFF; padding: 8px 16px; border-radius: 8px; width: 280px; font-size: 13px; }}

        /* Table */
        .table-wrap {{ background: var(--surface); border: 1px solid var(--surface-border); border-radius: 12px; overflow-x: auto; }}
        table {{ width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }}
        th {{ background: #162032; padding: 14px 16px; color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid var(--surface-border); }}
        td {{ padding: 14px 16px; border-bottom: 1px solid var(--surface-border); vertical-align: top; }}
        tr:hover td {{ background: rgba(255, 255, 255, 0.02); }}

        /* Badges */
        .badge {{ padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; }}
        .badge-pass {{ background: rgba(16, 185, 129, 0.15); color: var(--pass); border: 1px solid rgba(16, 185, 129, 0.3); }}
        .badge-fail {{ background: rgba(239, 68, 68, 0.15); color: var(--fail); border: 1px solid rgba(239, 68, 68, 0.3); }}
        .badge-skip {{ background: rgba(245, 158, 11, 0.15); color: var(--skip); border: 1px solid rgba(245, 158, 11, 0.3); }}

        .prio-tag {{ padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }}
        .prio-p1 {{ background: #EF4444; color: #FFFFFF; }}
        .prio-p2 {{ background: #3B82F6; color: #FFFFFF; }}
        .prio-p3 {{ background: #64748B; color: #FFFFFF; }}

        .test-title {{ color: var(--text-main); font-weight: 500; }}
        .error-trace {{ margin-top: 6px; padding: 8px 12px; background: rgba(239, 68, 68, 0.08); border-left: 3px solid var(--fail); border-radius: 4px; font-family: monospace; font-size: 11px; color: #FCA5A5; }}
        .btn-shot {{ color: var(--accent); text-decoration: none; font-size: 12px; font-weight: 600; }}
        .btn-shot:hover {{ text-decoration: underline; }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-title">
                <h1>🔬 ResistAI Automation Execution Report</h1>
                <p>Live GitHub Pages E2E Suite &bull; Target: <code>{base_url}</code></p>
            </div>
            <div class="meta-pill">
                Timestamp: <strong>{timestamp}</strong>
            </div>
        </div>

        <!-- Metrics Grid -->
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="label">Total Tests</div>
                <div class="value">{total}</div>
            </div>
            <div class="metric-card">
                <div class="label">Passed</div>
                <div class="value val-pass">{passed}</div>
            </div>
            <div class="metric-card">
                <div class="label">Failed</div>
                <div class="value val-fail">{failed}</div>
            </div>
            <div class="metric-card">
                <div class="label">Skipped</div>
                <div class="value val-skip">{skipped}</div>
            </div>
            <div class="metric-card">
                <div class="label">Pass Rate</div>
                <div class="value val-pass">{pass_rate:.1f}%</div>
            </div>
            <div class="metric-card">
                <div class="label">Execution Time</div>
                <div class="value">{duration:.2f}s</div>
            </div>
        </div>

        <!-- Module Breakdown -->
        <div class="section-title">Test Results by Module</div>
        <div class="mod-grid">
            {''.join(module_cards)}
        </div>

        <!-- Detailed Test Cases -->
        <div class="section-title">Executed Test Details ({len(results)} Test Cases)</div>
        <div class="controls-bar">
            <div class="filter-group">
                <button class="filter-btn active" onclick="filterStatus('all')">All ({total})</button>
                <button class="filter-btn" onclick="filterStatus('passed')">Passed ({passed})</button>
                <button class="filter-btn" onclick="filterStatus('failed')">Failed ({failed})</button>
                <button class="filter-btn" onclick="filterStatus('skipped')">Skipped ({skipped})</button>
            </div>
            <input type="text" id="searchInput" class="search-box" placeholder="Search by Test ID, name, or module..." onkeyup="searchTests()">
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th style="width: 100px;">Test ID</th>
                        <th style="width: 140px;">Module</th>
                        <th>Test Details & Findings</th>
                        <th style="width: 60px;">Prio</th>
                        <th style="width: 110px;">Status</th>
                        <th style="width: 90px;">Time</th>
                        <th style="width: 130px;">Evidence</th>
                    </tr>
                </thead>
                <tbody id="testTableBody">
                    {''.join(rows_html)}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function filterStatus(status) {{
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            const rows = document.querySelectorAll('.test-row');
            rows.forEach(row => {{
                if (status === 'all' || row.getAttribute('data-status') === status) {{
                    row.style.display = '';
                }} else {{
                    row.style.display = 'none';
                }}
            }});
        }}

        function searchTests() {{
            const query = document.getElementById('searchInput').value.toLowerCase();
            const rows = document.querySelectorAll('.test-row');
            rows.forEach(row => {{
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            }});
        }}
    </script>
</body>
</html>
"""
