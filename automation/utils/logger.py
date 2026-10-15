"""
ResistAI - Automation Framework Logger
Provides structured logging for all test execution stages and Selenium actions.
"""

import logging
import sys
from pathlib import Path
from automation.config.config import LOGS_DIR

LOG_FILE = LOGS_DIR / "automation_execution.log"

def setup_logger(name: str = "ResistAI-Automation") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        # File Handler (Detailed DEBUG)
        file_handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            "[%(asctime)s] [%(levelname)-8s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)

        # Console Handler (INFO)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_format = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] %(message)s",
            datefmt="%H:%M:%S"
        )
        console_handler.setFormatter(console_format)
        logger.addHandler(console_handler)

    return logger

logger = setup_logger()
