# ResistAI 🔬
### AI-Powered Medical Report Analysis & Antimicrobial Resistance (AMR) Risk Prediction System
**Target Architecture:** 100% Local Machine Learning & Heuristic Risk Engine  
**Privacy & Security:** Zero External AI APIs, Zero Paid Services, Runs 100% Locally on CPU  
**Clinical Status:** Prototype / Non-Diagnostic Clinical Decision Support & Research System  

---

## ⚠️ Important Clinical Safety Notices & Limitations

> **CRITICAL MEDICAL DISCLAIMER:**  
> ResistAI provides a prototype antimicrobial resistance (AMR) risk estimate strictly for clinical awareness, research, educational, surveillance, and decision-support purposes. It is **not** a clinically validated probability, medical diagnosis, or definitive statement that a patient has antimicrobial resistance. In-vitro laboratory culture and antimicrobial susceptibility testing (AST) interpreted by a qualified healthcare professional remain mandatory for clinical diagnosis and treatment selection.

> **DO NOT ALTER TREATMENT:**  
> **Do not start, stop, extend, or change antibiotics based solely on this result.** ResistAI does not prescribe or recommend any antibiotic therapy or dosage.

---

## 1. Product Overview

ResistAI enables patients, clinicians, and researchers to analyze medical laboratory reports (such as urine culture, AST antibiograms, sputum cultures, blood cultures, and prescriptions) alongside reported clinical history to generate a **transparent, multi-factor prototype AMR risk estimate**.

### Core Technical Pillars:
1. **Zero External AI APIs:** Groq API and remote LLMs have been completely removed. Report parsing, OCR, NLP feature extraction, scikit-learn machine learning inference, and risk scoring execute 100% on your local machine.
2. **Local Machine Learning (scikit-learn):** A Logistic Regression baseline classifier (and Random Forest comparison model) trained on AMR clinical feature distributions runs locally on the CPU.
3. **Transparent Weighted Risk Engine:** Deterministic, configurable scoring formula ensures full explainability without black-box hallucination.
4. **Local OCR & Document Extraction:** Integrates Tesseract OCR, PyPDF, and PIL image preprocessing for scanned documents and PDF laboratory reports.
5. **Medical NLP Rule Engine:** Contextual dictionary matching handles bacterial organisms, antibiotics, AST panels (Susceptible, Intermediate, Resistant), resistance markers (ESBL, MRSA, CRE), and molecular resistance genes (*blaCTX-M*, *mecA*, *blaKPC*).
6. **Strict Negation & Missing Data Policy:** Formulations like "no bacterial growth" or "resistance not detected" are strictly recognized so they are never counted as positive resistance. Missing information is marked as unknown and excluded from the denominator.
7. **Local SQLite Persistence:** Saves historical assessments and feature vectors in a local SQLite database (`backend/resistai.db`).

---

## 2. Local AI Architecture & Workflow

```text
Medical Report Upload (PDF, JPG, PNG)
        │
        ▼
File Validation & Security Check (Max 25MB)
        │
        ▼
Local PDF Extraction (pypdf) or OCR (Tesseract / PIL)
        │
        ▼
Medical Text Preprocessing & Cleaning
        │
        ▼
Lightweight NLP Entity & Keyword Extraction
        │
        ▼
Structured Feature Extraction (Normalized 0.0 - 1.0)
        │
        ▼
Hybrid Risk Inference:
  • Local scikit-learn ML Model (Logistic Regression)
  • Transparent Heuristic Risk Engine:
    AMR Risk (%) = 100 × (Σ w_i × feat_i) / (Σ available w_i)
        │
        ▼
Classification & Evidence Coverage:
  • Low (0–30%), Moderate (31–60%), High (61–100%)
  • Evidence Coverage (Limited, Moderate, Broad)
        │
        ▼
Explainable Clinical Dashboard & PDF Report Export
```

---

## 3. Technology Stack

* **Frontend:** React Native / Expo (SDK 57) with Web & Mobile support, Phosphor Icons, and Attio monochrome design system.
* **Backend:** Python 3.10+ with FastAPI and Uvicorn.
* **Machine Learning:** `scikit-learn` (Logistic Regression baseline + Random Forest), `joblib`.
* **Data Processing:** `pandas`, `numpy`.
* **NLP & Text Processing:** Medical dictionary matching, regular expressions, and contextual negation rules.
* **OCR & Vision:** `Tesseract OCR`, `pytesseract`, `pypdf`, and `Pillow`.
* **Database:** Local `SQLite` (`backend/resistai.db`).

---

## 4. Installation & Local Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (with npm)
- Tesseract OCR installed locally (optional for image OCR, instructions below)

### Step 1: Clone the Repository
```bash
git clone <repository_url>
cd resist-master
```

### Step 2: Setup the Local Python ML Backend
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
```

### Step 3: Train the Local AMR Machine Learning Model
Generate the synthetic de-identified demonstration dataset and train the scikit-learn pipeline:
```bash
python train_model.py
```
This evaluates the model on test data and saves the pipeline artifact to `backend/models/amr_model.joblib`.

### Step 4: Run the Backend Server
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Health check endpoint: `http://localhost:8000/health`  
Interactive Swagger docs: `http://localhost:8000/docs`

### Step 5: Start the Frontend Application
In the project root directory:
```bash
# Install frontend dependencies (if not already installed)
npm install

# Start the Expo application
npx expo start
```
Press `w` to open in your web browser, or scan the QR code with the Expo Go mobile app.

---

## 5. Installing Tesseract OCR (Optional for Image OCR)

### Windows:
1. Download the installer from UB-Mannheim:  
   https://github.com/UB-Mannheim/tesseract/wiki
2. Install to the default path: `C:\Program Files\Tesseract-OCR`
3. Add `C:\Program Files\Tesseract-OCR` to your System PATH environment variable.

### macOS:
```bash
brew install tesseract
```

### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr
```

*Note: If Tesseract OCR is not installed, ResistAI includes a robust local clinical text parser fallback and preloaded demonstration reports so the entire application functions completely.*

---

## 6. Running Tests

### Backend Unit & Integration Tests:
Run pytest from the `backend/` directory:
```bash
cd backend
pytest tests/test_pipeline.py -v
```
Tests cover:
- Document OCR and digital PDF extraction
- NLP entity and keyword extraction
- Negation and sterile culture handling
- Normalized feature vector construction
- Weighted scoring thresholds and risk classification
- FastAPI `/health` and `/predict-risk` endpoints

### Frontend TypeScript Verification:
```bash
npx tsc --noEmit
npx expo lint
```

---

## 7. API Reference (Local Endpoints)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check local ML model status and application health |
| `POST` | `/upload-report` | Upload and extract text from PDF or image documents |
| `POST` | `/extract-features` | Extract structured entities, AST panel, and feature vectors |
| `POST` | `/predict-risk` | Execute local ML model and weighted prototype scoring |
| `GET` | `/assessments` | List local historical assessments from SQLite |
| `GET` | `/assessment/{id}` | Retrieve specific assessment record and evidence |
| `DELETE` | `/assessment/{id}` | Delete an assessment and associated files |

---

## 8. Sample Medical Demonstration Reports

Sample reports are located in `backend/datasets/sample_reports/`:
- `urine_culture_mr_ecoli.txt`: Multi-drug resistant *E. coli* with ESBL (*blaCTX-M-15*)
- `sputum_culture_cre_klebsiella.txt`: Carbapenem-resistant *Klebsiella pneumoniae* (CRE with *blaKPC*)
- `urine_culture_negative.txt`: Sterile culture demonstrating negation handling
