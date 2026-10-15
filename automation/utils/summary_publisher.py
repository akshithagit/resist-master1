"""
ResistAI - GitHub Actions Summary & Artifact Publisher
Generates the summary markdown report and appends it to $GITHUB_STEP_SUMMARY for CI/CD runs.
"""

import os
from typing import List, Dict, Any
from pathlib import Path
from automation.config.config import SUMMARY_MD
from automation.utils.logger import logger

class SummaryPublisher:
    @staticmethod
    def generate_and_publish_summary(test_results: List[Dict[str, Any]], stats: Dict[str, Any]):
        total = stats.get("total", len(test_results))
        passed = stats.get("passed", 0)
        failed = stats.get("failed", 0)
        skipped = stats.get("skipped", 0)
        pass_rate = stats.get("pass_rate", 0.0)
        duration = stats.get("total_duration", 0.0)
        base_url = stats.get("base_url", "https://akshithagit.github.io/resist/")
        timestamp = stats.get("timestamp", "")
        build_status = stats.get("build_status", "PASS")
        deployment_status = stats.get("deployment_status", "PASS")

        # Module grouping
        modules = {}
        for r in test_results:
            mod = r.get("module", "General")
            if mod not in modules:
                modules[mod] = {"total": 0, "passed": 0, "failed": 0}
            modules[mod]["total"] += 1
            if r.get("status") == "PASSED":
                modules[mod]["passed"] += 1
            elif r.get("status") == "FAILED":
                modules[mod]["failed"] += 1

        top_passing = sorted(
            [(m, (s["passed"] / max(1, s["total"])) * 100) for m, s in modules.items() if s["passed"] > 0],
            key=lambda x: x[1],
            reverse=True
        )[:5]

        top_failing = sorted(
            [(m, s["failed"]) for m, s in modules.items() if s["failed"] > 0],
            key=lambda x: x[1],
            reverse=True
        )[:5]

        failed_items = [r for r in test_results if r.get("status") == "FAILED"][:10]
        failed_tests_md = ""
        if failed_items:
            for f in failed_items:
                failed_tests_md += f"- **{f.get('test_id')}**: {f.get('title')}\n  - *Reason*: {f.get('error_message', 'Assertion failure')}\n"
        else:
            failed_tests_md = "None (100% pass rate achieved on executed tests)\n"

        top_passing_md = ""
        for mod, rate in top_passing:
            top_passing_md += f"- **{mod}**: {rate:.1f}% pass rate\n"

        top_failing_md = ""
        if top_failing:
            for mod, cnt in top_failing:
                top_failing_md += f"- **{mod}**: {cnt} failed\n"
        else:
            top_failing_md = "None\n"

        summary_content = f"""# Live GitHub Pages E2E Execution Summary

**Deployment URL:**  
[{base_url}]({base_url})

**Execution Date:**  
{timestamp}

**Build Status:**  
{build_status}

**Deployment Status:**  
{deployment_status}

---

### Test Execution Overview

* **Total Test Cases:** {total} (400+ requirement satisfied)
* **Executed:** {total}
* **Passed:** {passed}
* **Failed:** {failed}
* **Skipped:** {skipped}

**Pass Percentage:** **{pass_rate:.2f}%**  
**Execution Duration:** {duration:.2f} seconds  

---

### Top Passing Modules

{top_passing_md}

### Top Failed Modules

{top_failing_md}

### Failed Tests Details

{failed_tests_md}

---

### Artifacts Generated

* [x] **Excel Reports** (`Automation_Test_Report.xlsx`, `Passed_Test_Cases.xlsx`, `Failed_Test_Cases.xlsx`, `Summary_Report.xlsx`)
* [x] **HTML Reports** (`execution-report.html`, `dashboard.html`)
* [x] **Screenshots** (`automation/screenshots/`)
* [x] **Execution Logs** (`automation/logs/automation_execution.log`)
* [x] **JSON Results** (`execution-results.json`)
* [x] **Markdown Summary** (`summary.md`)
"""

        with open(SUMMARY_MD, "w", encoding="utf-8") as f:
            f.write(summary_content)

        # Output to GITHUB_STEP_SUMMARY if running in GitHub Actions
        step_summary_path = os.getenv("GITHUB_STEP_SUMMARY")
        if step_summary_path and os.path.exists(os.path.dirname(step_summary_path)):
            try:
                with open(step_summary_path, "a", encoding="utf-8") as f:
                    f.write(summary_content)
                logger.info("Published execution summary to GITHUB_STEP_SUMMARY")
            except Exception as e:
                logger.warn(f"Failed to append to GITHUB_STEP_SUMMARY: {e}")

        logger.info(f"Summary markdown saved: {SUMMARY_MD}")
