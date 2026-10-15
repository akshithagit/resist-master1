"""
ResistAI - Mobile Base Page Object Model
Encapsulates common mobile UI interactions for Android UiAutomator2:
explicit waits, accessibility lookups, gestures, swipes, and assertions.
"""

import time
import logging
from typing import List, Optional, Any
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

logger = logging.getLogger("MobileBasePage")

class MobileBasePage:
    def __init__(self, driver: Any, timeout: int = 15):
        self.driver = driver
        self.timeout = timeout

    def find(self, locator: str, by: str = By.XPATH) -> Any:
        try:
            return WebDriverWait(self.driver, self.timeout).until(
                EC.presence_of_element_located((by, locator))
            )
        except Exception:
            return self.driver.find_element(by, locator)

    def find_by_id(self, accessibility_id: str) -> Any:
        """Find element by React Native testID / accessibilityLabel."""
        xpath = f"//*[@content-desc='{accessibility_id}' or @resource-id='{accessibility_id}' or @text='{accessibility_id}']"
        return self.find(xpath, By.XPATH)

    def click(self, locator: str, by: str = By.XPATH):
        el = self.find(locator, by)
        el.click()

    def click_by_id(self, accessibility_id: str):
        el = self.find_by_id(accessibility_id)
        el.click()

    def type_text(self, locator: str, text: str, by: str = By.XPATH):
        el = self.find(locator, by)
        try:
            el.clear()
        except Exception:
            pass
        el.send_keys(text)

    def type_by_id(self, accessibility_id: str, text: str):
        el = self.find_by_id(accessibility_id)
        try:
            el.clear()
        except Exception:
            pass
        el.send_keys(text)

    def get_text(self, locator: str, by: str = By.XPATH) -> str:
        el = self.find(locator, by)
        return el.text or el.get_attribute("text") or el.get_attribute("content-desc") or ""

    def get_text_by_id(self, accessibility_id: str) -> str:
        el = self.find_by_id(accessibility_id)
        return el.text or el.get_attribute("text") or el.get_attribute("content-desc") or ""

    def is_visible(self, accessibility_id: str) -> bool:
        try:
            el = self.find_by_id(accessibility_id)
            return el.is_displayed()
        except Exception:
            return False

    def swipe_up(self):
        """Simulate scroll/swipe up on mobile screen."""
        try:
            size = getattr(self.driver, "get_window_size", lambda: {"width": 1080, "height": 1920})()
            x = int(size["width"] * 0.5)
            y_start = int(size["height"] * 0.8)
            y_end = int(size["height"] * 0.2)
            if hasattr(self.driver, "swipe"):
                self.driver.swipe(x, y_start, x, y_end, 500)
        except Exception as e:
            logger.debug(f"Swipe action skipped or simulated: {e}")

    def take_screenshot(self, filepath: str) -> bool:
        return self.driver.save_screenshot(filepath)
