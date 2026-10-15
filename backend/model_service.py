"""
ResistAI - Local ML Model Inference Service
Loads the trained scikit-learn model artifact from models/amr_model.joblib
and executes local CPU inference. No external APIs or remote calls.
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "amr_model.joblib")

class ModelService:
    def __init__(self):
        self.artifact = None
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.load_model()

    def load_model(self) -> bool:
        if os.path.exists(MODEL_PATH):
            try:
                self.artifact = joblib.load(MODEL_PATH)
                self.model = self.artifact.get("model")
                self.scaler = self.artifact.get("scaler")
                self.feature_names = self.artifact.get("feature_names")
                return True
            except Exception as e:
                print(f"[ModelService] Error loading joblib artifact: {e}")
                return False
        return False

    def predict_risk(self, feature_vector: List[float]) -> Dict[str, Any]:
        """
        Executes local CPU inference using the trained Logistic Regression model.
        Returns predicted probability (0.0 to 1.0) and predicted class (0 or 1).
        """
        if self.model is None or self.scaler is None:
            # Fallback embedded deterministic logistic model if artifact not yet generated
            return self._embedded_logistic_fallback(feature_vector)

        try:
            arr = np.array([feature_vector])
            arr_scaled = self.scaler.transform(arr)
            prob = float(self.model.predict_proba(arr_scaled)[0, 1])
            pred_class = int(prob >= 0.50)
            
            return {
                "ml_probability": round(prob, 4),
                "ml_risk_percentage": round(prob * 100),
                "predicted_class": pred_class,
                "model_version": self.artifact.get("version", "1.0.0-cpu-local"),
                "is_synthetic_demonstration": self.artifact.get("is_synthetic_demonstration", True),
                "metrics": self.artifact.get("metrics", {})
            }
        except Exception as e:
            print(f"[ModelService] Inference error: {e}")
            return self._embedded_logistic_fallback(feature_vector)

    def _embedded_logistic_fallback(self, feature_vector: List[float]) -> Dict[str, Any]:
        """Embedded mathematical logistic regression for 100% offline robustness."""
        intercept = -2.80
        # Weights matching FEATURE_COLUMNS
        weights = [2.6, 2.4, 2.7, 1.2, 1.5, 1.1, 1.2, 0.4, 0.3]
        
        logit = intercept
        for val, w in zip(feature_vector, weights):
            logit += val * w
            
        prob = 1.0 / (1.0 + np.exp(-logit))
        return {
            "ml_probability": round(float(prob), 4),
            "ml_risk_percentage": round(float(prob) * 100),
            "predicted_class": int(prob >= 0.50),
            "model_version": "embedded-logistic-baseline",
            "is_synthetic_demonstration": True,
            "metrics": {}
        }

model_service = ModelService()
