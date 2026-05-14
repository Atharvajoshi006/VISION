"""
VISION Platform — ML Prediction Pipeline
XGBoost + Scikit-learn models for failure prediction.
Uses feature engineering from the analytics pipeline.
"""
import os
import logging
import pickle
import numpy as np
from pathlib import Path
from typing import Dict, Optional, Tuple

logger = logging.getLogger("vision.predictions")


class PredictionEngine:
    """
    Loads trained ML models and generates risk predictions.

    Model targets:
    - failure_probability: P(student fails current concept)
    - dropout_risk: P(student drops the course)
    - disengagement_risk: P(engagement drops severely next week)

    If trained models don't exist yet, falls back to heuristic scoring.
    """

    MODEL_NAMES = ["failure_model", "dropout_model", "disengagement_model"]

    def __init__(self):
        self.models = {}
        self._load_models()

    def _load_models(self):
        """Load pickled models from ML_MODELS_DIR."""
        from django.conf import settings
        models_dir = Path(settings.ML_MODELS_DIR)

        for name in self.MODEL_NAMES:
            path = models_dir / f"{name}.pkl"
            if path.exists():
                try:
                    with open(path, "rb") as f:
                        self.models[name] = pickle.load(f)
                    logger.info("model_loaded", extra={"model": name})
                except Exception as exc:
                    logger.warning("model_load_failed", extra={"model": name, "error": str(exc)})
            else:
                logger.info("model_not_found_using_heuristic", extra={"model": name})

    def predict(self, student_id: str) -> Dict:
        """Run all predictions for a student. Returns dict of risk scores."""
        from apps.analytics.pipeline import FeatureEngineer

        # Extract features
        features = FeatureEngineer().extract_features(student_id)
        feature_vector = self._features_to_vector(features)

        scores = {}

        # ── ML predictions (if models are trained) ───────────────────────
        if "failure_model" in self.models:
            scores["failure_probability"] = self._predict_proba(
                "failure_model", feature_vector
            )
        else:
            scores["failure_probability"] = self._heuristic_failure(features)

        if "dropout_model" in self.models:
            scores["dropout_risk"] = self._predict_proba(
                "dropout_model", feature_vector
            )
        else:
            scores["dropout_risk"] = self._heuristic_dropout(features)

        if "disengagement_model" in self.models:
            scores["disengagement_risk"] = self._predict_proba(
                "disengagement_model", feature_vector
            )
        else:
            scores["disengagement_risk"] = self._heuristic_disengagement(features)

        # ── Rule-based predictions (always deterministic) ─────────────────
        scores["pacing_mismatch_score"] = self._compute_pacing_mismatch(features)
        scores["retention_decline_risk"] = self._compute_retention_decline(features)
        scores["feature_snapshot"] = features
        scores["confidence"] = min(features.get("avg_engagement_7d", 0) + 0.3, 1.0)

        return scores

    def _predict_proba(self, model_name: str, feature_vector: np.ndarray) -> float:
        """Get probability from trained classifier."""
        try:
            model = self.models[model_name]
            proba = model.predict_proba(feature_vector.reshape(1, -1))[0][1]
            return float(np.clip(proba, 0.0, 1.0))
        except Exception as exc:
            logger.error("prediction_failed", extra={"model": model_name, "error": str(exc)})
            return 0.0

    # ── Heuristic fallbacks (before models are trained) ──────────────────
    def _heuristic_failure(self, features: Dict) -> float:
        """Rule-based failure probability."""
        score = 0.0
        score += (1 - features.get("avg_mastery", 0.5)) * 0.35
        score += features.get("total_retries_7d", 0) / 20.0 * 0.25
        score += (1 - features.get("avg_performance_7d", 0.5)) * 0.25
        score += features.get("weak_concept_count", 0) / 10.0 * 0.15
        return float(np.clip(score, 0.0, 1.0))

    def _heuristic_dropout(self, features: Dict) -> float:
        score = 0.0
        score += (1 - features.get("avg_engagement_7d", 0.5)) * 0.40
        score += max(0, -features.get("engagement_trend_slope", 0)) * 5.0 * 0.30
        score += features.get("total_inactivity_7d", 0) / 10.0 * 0.20
        score += features.get("total_skips_7d", 0) / 10.0 * 0.10
        return float(np.clip(score, 0.0, 1.0))

    def _heuristic_disengagement(self, features: Dict) -> float:
        score = 0.0
        score += max(0, -features.get("engagement_trend_slope", 0)) * 4.0 * 0.50
        score += (1 - features.get("learning_consistency", 0.5)) * 0.30
        score += (1 - features.get("engagement_stability", 0.5)) * 0.20
        return float(np.clip(score, 0.0, 1.0))

    def _compute_pacing_mismatch(self, features: Dict) -> float:
        """High pacing requirement + low study time = mismatch."""
        pacing_need = features.get("pacing_requirement", 0.5)
        study_time = min(features.get("avg_study_time_7d", 0) / 60.0, 1.0)
        mismatch = pacing_need - study_time
        return float(np.clip(mismatch, 0.0, 1.0))

    def _compute_retention_decline(self, features: Dict) -> float:
        """Low retention capability + high revisit count = retention problem."""
        retention = features.get("retention_capability", 0.5)
        retries = features.get("total_retries_7d", 0) / 10.0
        score = (1 - retention) * 0.6 + min(retries, 1.0) * 0.4
        return float(np.clip(score, 0.0, 1.0))

    def _features_to_vector(self, features: Dict) -> np.ndarray:
        """Convert feature dict to numpy array in fixed order."""
        keys = [
            "avg_engagement_7d", "avg_performance_7d", "avg_study_time_7d",
            "total_retries_7d", "total_hints_7d", "total_inactivity_7d",
            "total_skips_7d", "avg_mastery", "weak_concept_count",
            "engagement_trend_slope", "engagement_trend_direction",
            "logical_reasoning", "pacing_requirement", "retention_capability",
            "abstraction_handling", "learning_consistency",
            "engagement_stability", "struggle_tendency", "recovery_speed",
        ]
        return np.array([float(features.get(k, 0.0)) for k in keys])


class ModelTrainer:
    """
    Trains XGBoost and sklearn models on historical Vision data.
    Run this offline (management command) to produce trained .pkl files.
    """

    def train_failure_model(self):
        """Train failure prediction model from historical data."""
        try:
            import xgboost as xgb
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import classification_report, roc_auc_score
            from sklearn.preprocessing import StandardScaler
            import pandas as pd
        except ImportError as e:
            logger.error("ml_dependencies_missing", extra={"error": str(e)})
            return

        logger.info("training_failure_model_start")
        X, y = self._build_training_dataset()

        if len(X) < 50:
            logger.warning("insufficient_training_data", extra={"samples": len(X)})
            return

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
        )
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

        y_pred_proba = model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_pred_proba)

        self._save_model(model, "failure_model", auc=auc, n_samples=len(X))
        logger.info("failure_model_trained", extra={"auc": auc, "samples": len(X)})
        return model

    def _build_training_dataset(self):
        """Build labeled training dataset from historical predictions + outcomes."""
        from apps.predictions.models import PredictionScore
        from apps.tracking.models import ConceptMastery
        import pandas as pd

        records = []
        labels = []

        for pred in PredictionScore.objects.select_related("student").all()[:5000]:
            if not pred.feature_snapshot:
                continue
            features = pred.feature_snapshot
            # Label: 1 if student subsequently showed failure (mastery < 0.4)
            actual_mastery = ConceptMastery.objects.filter(
                student=pred.student,
                mastery_score__lt=0.4,
            ).exists()
            labels.append(1 if actual_mastery else 0)

            engine = PredictionEngine()
            vec = engine._features_to_vector(features)
            records.append(vec)

        if not records:
            return np.array([]).reshape(0, 19), np.array([])

        return np.array(records), np.array(labels)

    def _save_model(self, model, name: str, auc: float, n_samples: int):
        """Persist model to disk and register in DB."""
        from django.conf import settings
        from apps.predictions.models import MLModelRegistry
        from django.utils import timezone

        models_dir = Path(settings.ML_MODELS_DIR)
        models_dir.mkdir(parents=True, exist_ok=True)

        version = f"v{timezone.now().strftime('%Y%m%d_%H%M')}"
        file_path = models_dir / f"{name}.pkl"

        with open(file_path, "wb") as f:
            pickle.dump(model, f)

        # Deactivate old version
        MLModelRegistry.objects.filter(name=name).update(is_active=False)
        MLModelRegistry.objects.create(
            name=name,
            version=version,
            model_type="xgboost",
            file_path=str(file_path),
            is_active=True,
            auc_roc=auc,
            training_samples=n_samples,
            trained_at=timezone.now(),
        )
