"""SCR Structured Logging — Logging configurado para el pipeline SCR.

Proporciona structured logging en JSON para:
- Seguimiento de análisis
- Debugging de agentes
- Métricas de performance
- Error tracking

Ejemplo:
    from app.core.scr_logging import get_scr_logger
    
    logger = get_scr_logger(__name__)
    logger.info(
        "scr.analysis.started",
        extra={
            "event": "scr.analysis.started",
            "review_id": "uuid-123",
            "repo_url": "https://github.com/user/repo",
            "llm_provider": "anthropic"
        }
    )
"""

import json
import logging
from typing import Any, Dict

def get_scr_logger(name: str) -> logging.Logger:
    """Obtiene logger configurado para SCR.
    
    Args:
        name: Module name (typically __name__)
    
    Returns:
        Logger instance configurado con structured logging
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger


class StructuredLogger:
    """Logger que emite JSON estructurado."""
    
    def __init__(self, name: str):
        self.logger = get_scr_logger(name)
    
    def log(self, level: str, event: str, **kwargs):
        """Log structured event.
        
        Args:
            level: Log level (info, error, warning, debug)
            event: Event name (e.g., "scr.analysis.started")
            **kwargs: Extra fields para JSON
        """
        log_entry = {
            "event": event,
            **kwargs
        }
        getattr(self.logger, level)(json.dumps(log_entry))
    
    def info(self, event: str, **kwargs):
        self.log("info", event, **kwargs)
    
    def error(self, event: str, **kwargs):
        self.log("error", event, **kwargs)
    
    def warning(self, event: str, **kwargs):
        self.log("warning", event, **kwargs)
    
    def debug(self, event: str, **kwargs):
        self.log("debug", event, **kwargs)
