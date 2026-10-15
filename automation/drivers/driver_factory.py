"""
ResistAI - Selenium WebDriver Factory
Instantiates and configures Selenium WebDriver for Headless Chrome execution in CI/CD and local environments.
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from automation.config.config import (
    HEADLESS,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    PAGE_LOAD_TIMEOUT,
    IMPLICIT_WAIT_TIMEOUT,
)
from automation.utils.logger import logger

class DriverFactory:
    @staticmethod
    def create_driver(headless: bool = HEADLESS) -> webdriver.Chrome:
        """
        Creates a configured Chrome WebDriver instance.
        """
        logger.info("Initializing Chrome WebDriver...")
        options = ChromeOptions()

        if headless:
            options.add_argument("--headless=new")

        # Enterprise CI/CD flags
        options.add_argument(f"--window-size={WINDOW_WIDTH},{WINDOW_HEIGHT}")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-infobars")
        options.add_argument("--disable-notifications")
        options.add_argument("--ignore-certificate-errors")
        options.add_argument("--remote-allow-origins=*")

        # Enable browser console logging for diagnosing JavaScript runtime errors
        options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

        try:
            service = ChromeService(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
        except Exception as e:
            logger.warn(f"Auto-driver manager fallback to system PATH chromedriver: {e}")
            driver = webdriver.Chrome(options=options)

        driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
        driver.implicitly_wait(IMPLICIT_WAIT_TIMEOUT)

        logger.info(f"WebDriver initialized successfully (Headless={headless})")
        return driver
