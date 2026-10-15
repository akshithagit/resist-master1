"""
ResistAI - Screenshot Utility
Captures browser screenshots on test failure or demand.
"""

import time
from pathlib import Path
from automation.config.config import SCREENSHOTS_DIR
from automation.utils.logger import logger


def capture_screenshot(driver, test_id: str) -> str:
    """
    Capture a screenshot and return the file path as a string.
    Returns empty string if capture fails.
    """
    try:
        ts = int(time.time())
        filename = f"{test_id}_{ts}.png"
        filepath = SCREENSHOTS_DIR / filename
        driver.save_screenshot(str(filepath))
        logger.info(f"Screenshot captured: {filepath}")
        return str(filepath)
    except Exception as e:
        logger.warning(f"Failed to capture screenshot for {test_id}: {e}")
        return ""
