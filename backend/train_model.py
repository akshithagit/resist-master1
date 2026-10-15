"""
ResistAI - Local Machine Learning Model Training Pipeline
Section E: Lightweight scikit-learn Model Training

Trains Logistic Regression (Baseline) and Random Forest (Comparison) models
on de-identified synthetic AMR feature vectors.
Evaluates Precision, Recall, F1, ROC-AUC, and Confusion Matrix.
Saves the trained pipeline to models/amr_model.joblib.

Note: Data is clearly labeled as synthetic demonstration records.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

DATASET_PATH = os.path.join(os.path.dirname(__file__), "datasets", "synthetic_amr_data.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "amr_model.joblib")

FEATURE_COLUMNS = [
    "documented_resistance",
    "susceptibility_resistance",
    "resistance_gene",
    "organism_signal",
    "repeated_antibiotic_exposure",
    "incomplete_treatment",
    "persistent_recurrent",
    "symptom_duration",
    "symptom_severity"
]

def generate_synthetic_dataset(n_samples: int = 1200) -> pd.DataFrame:
    """
    Generates a realistic, de-identified synthetic clinical AMR dataset.
    Features follow clinical distributions and AMR risk mechanics.
    """
    np.random.seed(42)
    
    # 1. Documented resistance (binary-like or AST signal)
    doc_res = np.random.choice([0.0, 0.05, 0.85, 0.95], size=n_samples, p=[0.45, 0.20, 0.25, 0.10])
    
    # 2. Susceptibility resistance ratio (0.0 to 1.0)
    suscep = np.clip(np.random.beta(a=1.5, b=3.5, size=n_samples) + 0.3 * (doc_res > 0.5), 0.0, 1.0)
    
    # 3. Resistance gene (rare, high impact: 0.0 or 0.95)
    gene = np.random.choice([0.0, 0.95], size=n_samples, p=[0.88, 0.12])
    
    # 4. Organism risk signal (0.35 to 0.75)
    organism = np.random.choice([0.35, 0.40, 0.50, 0.65, 0.75], size=n_samples, p=[0.15, 0.35, 0.20, 0.20, 0.10])
    
    # 5. Prior antibiotic exposure (0.0, 0.25, 0.55, 0.85)
    exposure = np.random.choice([0.0, 0.25, 0.55, 0.85], size=n_samples, p=[0.35, 0.35, 0.20, 0.10])
    
    # 6. Incomplete treatment (0.0, 0.50, 0.70)
    incomplete = np.random.choice([0.0, 0.50, 0.70], size=n_samples, p=[0.65, 0.20, 0.15])
    
    # 7. Persistent/recurrent (0.0, 0.45, 0.75, 0.85)
    persistent = np.random.choice([0.0, 0.45, 0.75, 0.85], size=n_samples, p=[0.55, 0.25, 0.12, 0.08])
    
    # 8. Contextual symptoms
    duration = np.random.uniform(0.1, 0.9, size=n_samples)
    severity = np.random.choice([0.20, 0.50, 0.85], size=n_samples, p=[0.50, 0.35, 0.15])
    
    # Latent resistance risk logit function based on AMR research weights
    latent_score = (
        2.6 * doc_res +
        2.4 * suscep +
        2.7 * gene +
        1.2 * organism +
        1.5 * exposure +
        1.1 * incomplete +
        1.2 * persistent +
        0.4 * duration +
        0.3 * severity -
        2.8 +
        np.random.normal(0, 0.35, size=n_samples)
    )
    
    prob = 1 / (1 + np.exp(-latent_score))
    label = (prob >= 0.50).astype(int)
    
    df = pd.DataFrame({
        "sample_id": [f"SYNTH_{i:05d}" for i in range(n_samples)],
        "documented_resistance": doc_res,
        "susceptibility_resistance": np.round(suscep, 3),
        "resistance_gene": gene,
        "organism_signal": organism,
        "repeated_antibiotic_exposure": exposure,
        "incomplete_treatment": incomplete,
        "persistent_recurrent": persistent,
        "symptom_duration": np.round(duration, 3),
        "symptom_severity": severity,
        "amr_resistant_label": label,
        "true_risk_probability": np.round(prob, 4),
        "dataset_type": "SYNTHETIC_RESEARCH_DEMO"
    })
    
    os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
    df.to_csv(DATASET_PATH, index=False)
    print(f"[*] Synthetic AMR training dataset created at: {DATASET_PATH}")
    print(f"[*] Total records: {len(df)} | Resistant (1): {label.sum()} | Susceptible (0): {len(label) - label.sum()}")
    return df

def train_and_evaluate():
    # 1. Load or Generate Dataset
    if not os.path.exists(DATASET_PATH):
        df = generate_synthetic_dataset()
    else:
        df = pd.read_csv(DATASET_PATH)
        print(f"[*] Loaded existing dataset from {DATASET_PATH} ({len(df)} records)")

    X = df[FEATURE_COLUMNS].values
    y = df["amr_resistant_label"].values

    # 2. Stratified Train / Val / Test Split (70% train, 15% val, 15% test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    print(f"[*] Dataset split: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")

    # 3. Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # 4. Train Baseline Model: Logistic Regression
    lr_model = LogisticRegression(C=1.0, max_iter=500, random_state=42)
    lr_model.fit(X_train_scaled, y_train)

    # 5. Train Comparison Model: Random Forest
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    rf_model.fit(X_train, y_train)

    # 6. Evaluation on Test Set
    y_pred_lr = lr_model.predict(X_test_scaled)
    y_proba_lr = lr_model.predict_proba(X_test_scaled)[:, 1]

    y_pred_rf = rf_model.predict(X_test)
    y_proba_rf = rf_model.predict_proba(X_test)[:, 1]

    print("\n" + "=" * 50)
    print(" BASELINE MODEL EVALUATION (Logistic Regression)")
    print("=" * 50)
    print(f"Accuracy:  {accuracy_score(y_test, y_pred_lr):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred_lr):.4f}")
    print(f"Recall:    {recall_score(y_test, y_pred_lr):.4f}")
    print(f"F1 Score:  {f1_score(y_test, y_pred_lr):.4f}")
    print(f"ROC-AUC:   {roc_auc_score(y_test, y_proba_lr):.4f}")
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred_lr))

    print("\n" + "=" * 50)
    print(" COMPARISON MODEL EVALUATION (Random Forest)")
    print("=" * 50)
    print(f"Accuracy:  {accuracy_score(y_test, y_pred_rf):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred_rf):.4f}")
    print(f"Recall:    {recall_score(y_test, y_pred_rf):.4f}")
    print(f"F1 Score:  {f1_score(y_test, y_pred_rf):.4f}")
    print(f"ROC-AUC:   {roc_auc_score(y_test, y_proba_rf):.4f}")

    # 7. Package and Save Trained Artifact
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    artifact = {
        "model_type": "LogisticRegression",
        "model": lr_model,
        "rf_model": rf_model,
        "scaler": scaler,
        "feature_names": FEATURE_COLUMNS,
        "metrics": {
            "test_accuracy": float(accuracy_score(y_test, y_pred_lr)),
            "test_precision": float(precision_score(y_test, y_pred_lr)),
            "test_recall": float(recall_score(y_test, y_pred_lr)),
            "test_f1": float(f1_score(y_test, y_pred_lr)),
            "test_roc_auc": float(roc_auc_score(y_test, y_proba_lr))
        },
        "version": "1.0.0-cpu-local",
        "is_synthetic_demonstration": True
    }
    
    joblib.dump(artifact, MODEL_PATH)
    print(f"\n[+] Saved trained model pipeline to: {MODEL_PATH}")

if __name__ == "__main__":
    train_and_evaluate()
