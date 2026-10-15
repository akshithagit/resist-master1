"""
ResistAI - Page Object Model Base Page
Provides robust explicit waits, DOM interactions, error logging, and screenshot captures.
All page objects inherit from BasePage and interact with the application strictly via BASE_URL.
"""

from typing import List, Tuple, Optional
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from automation.config.config import BASE_URL, EXPLICIT_WAIT_TIMEOUT
from automation.utils.logger import logger
from automation.utils.screenshot import capture_screenshot

class BasePage:
    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.base_url = BASE_URL
        self.timeout = EXPLICIT_WAIT_TIMEOUT

    def open(self, path: str = "") -> "BasePage":
        """Navigate to a path relative to BASE_URL."""
        clean_path = path.lstrip("/")
        target_url = f"{self.base_url}{clean_path}"
        logger.info(f"Navigating to: {target_url}")
        self.driver.get(target_url)
        self.wait_for_page_ready()
        return self

    def wait_for_page_ready(self, timeout: int = None) -> bool:
        """Waits for document.readyState to be 'complete'."""
        wait_time = timeout or self.timeout
        try:
            WebDriverWait(self.driver, wait_time).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            return True
        except TimeoutException:
            logger.warn("Page readyState wait timed out.")
            return False

    def find_element(self, by: By, locator: str, timeout: int = None) -> WebElement:
        """Find an element with explicit wait for presence."""
        wait_time = timeout or self.timeout
        return WebDriverWait(self.driver, wait_time).until(
            EC.presence_of_element_located((by, locator))
        )

    def find_elements(self, by: By, locator: str) -> List[WebElement]:
        """Find multiple elements."""
        return self.driver.find_elements(by, locator)

    def wait_for_visible(self, by: By, locator: str, timeout: int = None) -> WebElement:
        """Wait until element is visible on screen."""
        wait_time = timeout or self.timeout
        return WebDriverWait(self.driver, wait_time).until(
            EC.visibility_of_element_located((by, locator))
        )

    def wait_for_clickable(self, by: By, locator: str, timeout: int = None) -> WebElement:
        """Wait until element is clickable."""
        wait_time = timeout or self.timeout
        return WebDriverWait(self.driver, wait_time).until(
            EC.element_to_be_clickable((by, locator))
        )

    def click(self, by: By, locator: str, timeout: int = None):
        """Scroll into view and click element."""
        element = self.wait_for_clickable(by, locator, timeout)
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        element.click()

    def type_text(self, by: By, locator: str, text: str, clear_first: bool = True):
        """Types text into an input field."""
        element = self.wait_for_visible(by, locator)
        if clear_first:
            element.clear()
        element.send_keys(text)

    def get_text(self, by: By, locator: str, timeout: int = None) -> str:
        """Extract text content from an element."""
        element = self.wait_for_visible(by, locator, timeout)
        return element.text.strip()

    def is_displayed(self, by: By, locator: str, timeout: int = 3) -> bool:
        """Check if element is displayed without long wait timeouts."""
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located((by, locator))
            ).is_displayed()
        except (TimeoutException, NoSuchElementException):
            return False

    def get_console_errors(self) -> List[str]:
        """Collect browser console errors from the driver."""
        try:
            logs = self.driver.get_log("browser")
            return [f"[{entry['level']}] {entry['message']}" for entry in logs if entry.get("level") in ("SEVERE", "WARNING")]
        except Exception:
            return []

    def save_screenshot(self, test_id: str) -> str:
        """Capture screenshot on demand."""
        return capture_screenshot(self.driver, test_id)
