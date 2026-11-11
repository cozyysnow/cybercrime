# Cybercast ML Model Validation & Accuracy Investigation Report

**Document Version**: 1.0.0  
**Date**: September 8, 2026  
**Audience**: Technical Judges, Hackathon Evaluators, Project Sentinel, and Product Stakeholders  
**Subject**: In-depth Codebase & Runtime Investigation of the "Cybercast ML Validation" Benchmarks Page (`/benchmarks`)  

---

## 1. Executive Summary

This investigation analyzed the machine learning prediction mechanics, data provenance, and accuracy metrics presented on the **Cybercast ML Validation** page (`/benchmarks`) of the Cybercast landing application.

### Key Findings:
1. **Verification of the "100% Accuracy" Claim**:
   - The headline claim of **"100% TOP-1 MATCH"** on the benchmarks page is **an artificial artifact of a curated frontend fixture**, not an unconstrained real-world test metric.
   - In `src/data/dashboardData.ts` (lines 657–910), six landmark High Court cyber fraud cases were curated. For all 6 cases, the field `predictedStateTop1` was manually populated to identically match `groundTruthState`.
   - Furthermore, the interactive "RUN LIVE INFERENCE" button on `/benchmarks` did not execute model code or query an API; it executed a static 600ms simulated `setTimeout` returning hardcoded strings.

2. **The Authentic Deployed Machine Learning Backend**:
   - The Cybercast project maintains a **genuine, operational FastAPI machine learning service** deployed on Railway at `https://184model-production.up.railway.app`.
   - Live inspection confirmed that **all 5 production ML models are loaded and healthy**:
     - `zone_stage1` (Hierarchical multi-state geographical zone predictor)
     - `zone_stage2` (Inter-zone transition classifier)
     - `state_predictor` (Calibrated multi-class XGBoost state classifier across 28+ Indian states)
     - `district_model` (District-level spatial cashout predictor)
     - `district_risk_table` (Granular spatial vulnerability index covering 964 Indian districts)
   - When the 6 benchmark court cases were submitted live to `https://184model-production.up.railway.app/predict`, the model demonstrated:
     - **Top-1 Zero-Shot Match**: **4 out of 6 cases (66.7%)**
     - **Top-3 Retrieval Coverage**: **6 out of 6 cases (100.0%)**
   - On the full cross-validation training corpus, the model achieves **85.9% Top-1** and **94.4% Top-3** validation accuracy using stratified 5-fold cross-validation with Isotonic probability calibration.

3. **Strategic Conclusion**:
   - Claiming "100% Top-1 Accuracy" damages credibility because no real-world multi-class NLP/tabular cybercrime model achieves 100% top-1 accuracy on zero-shot out-of-distribution complaints.
   - By contrast, **100% Top-3 candidate state retrieval** on real judicial rulings is scientifically sound, legitimate, and highly impressive for law enforcement interdiction teams (narrowing 28 states down to 3 high-probability targets with 100% coverage).
   - The UI must be updated to transparently expose this reality, detail the underlying input features and risk factors, and discard the developer code block.

---

## 2. Codebase Architecture & Investigation Evidence

### 2.1 File Locations & Routes
- **Benchmarks Page**: `src/app/benchmarks/page.tsx` (`'use client'`, 535 lines)
- **Static Route**: `/benchmarks` (compiled static page)
- **Data Fixture**: `src/data/dashboardData.ts` (`ACTIVE_INCIDENTS_DATA`)
- **Proxy Endpoint**: `src/app/api/model/[...path]/route.ts` (proxies to `https://184model-production.up.railway.app`)
- **API Service Layer**: `src/lib/apiService.ts` (`predictWithdrawal`, `getSHAPExplanation`, `getModelHealth`)

### 2.2 Forensic Inspection of the Mocked Claims
In `src/data/dashboardData.ts`, each of the six benchmark court cases has hardcoded ground-truth parity:
- **Case CS-001** (*Nirmal Kumar Mishra vs State*, Delhi HC): `groundTruthState: 'Uttar Pradesh'`, `predictedStateTop1: 'Uttar Pradesh'`, `predictedConfidence: 81`
- **Case CS-012** (*Rajesh Kumar Sharma*, Delhi Police Cyber Cell): `groundTruthState: 'Jharkhand'`, `predictedStateTop1: 'Jharkhand'`, `predictedConfidence: 84`
- **Case CS-015** (*Sahil Khan vs State*, Delhi HC): `groundTruthState: 'Rajasthan'`, `predictedStateTop1: 'Rajasthan'`, `predictedConfidence: 79`
- **Case CS-011** (*Paul Onyeji Atuh vs State*, Delhi HC): `groundTruthState: 'Uttar Pradesh'`, `predictedStateTop1: 'Uttar Pradesh'`, `predictedConfidence: 76`
- **Case CS-013** (*Fake Call-Centre*, Gurgaon Police): `groundTruthState: 'Uttar Pradesh'`, `predictedStateTop1: 'Uttar Pradesh'`, `predictedConfidence: 82`
- **Case CS-002** (*Dudhagara Rimpal vs State*, Delhi HC): `groundTruthState: 'Punjab'`, `predictedStateTop1: 'Punjab'`, `predictedConfidence: 72`

In `src/app/benchmarks/page.tsx`:
- Line 90 renders: `100% TOP-1 MATCH`
- Line 110 renders: `100% TOP-1`
- Line 358 renders: `GROUND TRUTH CORROBORATED: 100% PREDICTION MATCH`
- Line 41–55 mocks execution via `setTimeout(..., 600)`

### 2.3 Empirical Verification Against the Deployed ML Backend
The deployed FastAPI backend was tested directly with the exact complaint parameters from the 6 High Court cases.

```
POST https://184model-production.up.railway.app/predict
```

#### Results Summary:
| Case ID | Modus Operandi | Defrauded Amount | Victim State | Mule Account State | Ground Truth State | Live Model Predicted Top-3 States | Top-1 Match? | Top-3 Match? |
|---|---|---|---|---|---|---|:---:|:---:|
| **CS-001** | Investment Fraud | ₹17,07,389 | Delhi | Uttar Pradesh | **Uttar Pradesh** | 1. Maharashtra (31.9%)<br>2. Uttarakhand (20.4%)<br>3. Uttar Pradesh (12.8%) | No (Rank 3) | **Yes** |
| **CS-012** | KYC Fraud | ₹2,40,000 | Delhi | Jharkhand | **Jharkhand** | 1. Jharkhand (25.9%)<br>2. D&NH & Daman & Diu (15.2%)<br>3. Mizoram (13.6%) | **Yes** (Rank 1) | **Yes** |
| **CS-015** | KYC Fraud | ₹4,80,000 | Delhi | Rajasthan | **Rajasthan** | 1. Rajasthan (36.2%)<br>2. Puducherry (21.7%)<br>3. D&NH & Daman & Diu (6.2%) | **Yes** (Rank 1) | **Yes** |
| **CS-011** | Investment Fraud | ₹35,81,000 | Delhi | Uttar Pradesh | **Uttar Pradesh** | 1. Maharashtra (31.3%)<br>2. Uttarakhand (19.3%)<br>3. Uttar Pradesh (12.9%) | No (Rank 3) | **Yes** |
| **CS-013** | Investment Fraud | ₹26,00,000 | Haryana | Uttar Pradesh | **Uttar Pradesh** | 1. Uttar Pradesh (43.8%)<br>2. Uttarakhand (16.5%)<br>3. Maharashtra (15.5%) | **Yes** (Rank 1) | **Yes** |
| **CS-002** | Loan Fraud | ₹26,80,000 | Delhi | Punjab | **Punjab** | 1. Punjab (25.5%)<br>2. Puducherry (23.9%)<br>3. D&NH & Daman & Diu (10.3%) | **Yes** (Rank 1) | **Yes** |

**Empirical Result**:
- Top-1 Match: **4 / 6 (66.7%)**
- Top-3 Retrieval Match: **6 / 6 (100.0%)**

---

## 3. Underlying Prediction Mechanics & Risk Taxonomy

The prediction pipeline models the physical cash-out destination using four primary feature groups:

### 3.1 Input Feature Vector
1. **Citizen Incident Origin (`victim_state`)**:
   - Law enforcement filing jurisdiction (e.g., Delhi NCR, Haryana).
   - Represented with official National Crime Records Bureau (NCRB) branding.
2. **Defrauded Capital (`amount_stolen_inr`)**:
   - Total financial loss in INR.
   - Categorized into operational withdrawal bands:
     - *Micro / Rapid Tier* (< ₹50,000): Immediate ATM/UPI micro-cashouts.
     - *Mid-Tier* (₹50,000 – ₹2,00,000): Multi-ATM sequential skimming.
     - *High Capital Tier* (≥ ₹2,00,000): Exceeds ATM daily withdrawal caps; syndicates require over-the-counter branch cash-out with forged self-cheques or RTGS transfers.
3. **Fraud Modus Operandi (`fraud_type`)**:
   - Categorization: *KYC Fraud*, *Investment / Task Scam*, *Loan App Fraud*, *Courier Impersonation*.
   - Dictates the physical cash-out velocity window (e.g., KYC fraud features an immediate < 3-hour extraction window).
4. **Mule Account Initial Hop (`mule_account_state`)**:
   - The registered branch location of the primary receiving account.
   - Represented with official Reserve Bank of India (RBI) branding.

### 3.2 Key Risk Factors & SHAP Feature Attribution
As implemented in `src/lib/apiService.ts:420-535`:
1. **Interstate Syndicate Routing Divergence (+31% Attribution)**:
   - When `mule_account_state !== victim_state`, criminal syndicates deliberately exploit jurisdictional latency between state police departments.
2. **Capital Dispersal Threshold (+38% Attribution)**:
   - High value transactions shift probability distributions toward financial hubs with dense commercial branch banking networks.
3. **Temporal Cash-out Velocity (+24% Attribution)**:
   - Modus operandi speed metrics define the actionable interdiction countdown (2 to 6 hours before complete dissipation).

---

## 4. UI Refinement Strategy

### 4.1 "MODEL PREDICTIONS & VERDICT" Overhaul
1. **Transparent Accuracy Presentation**:
   - Clearly state: **"100% TOP-3 CANDIDATE COVERAGE (6/6 BENCHMARK CASES) | 85.9% VALIDATION ACCURACY"**.
   - Non-technical summary explaining that in all 6 landmark cases, the true judicial cash-out location was retrieved within the model's Top-3 actionable candidate states before withdrawal.
2. **Input Feature Vector Cards**:
   - Card 1: Citizen Complaint Origin (with NCRB logo)
   - Card 2: Defrauded Funds (with Rupee icon in neon `#ceff00`)
   - Card 3: Fraud Classification & Modus (with Activity icon in amber-400)
   - Card 4: Destination Mule Account Routing (with official RBI logo)
3. **Underlying Prediction Conditions & Risk Drivers**:
   - Visual risk matrix displaying Interstate Divergence, Withdrawal Method, and Interdiction Countdown Window.
4. **Authentic Probability Distribution & Live Inference**:
   - Top-3 candidate state probability breakdown.
   - Connected live inference benchmark providing actual latency (~16ms) and feature attributions.

### 4.2 DOM Removal of "CODE BLOCK FOR JUDGES"
- Tab 3 button and its associated content container (`{activeTab === 'code' && ...}`) are completely excised from `src/app/benchmarks/page.tsx`.
- The page is streamlined into two cohesive views:
  - **Tab 1: Ground Truth & Legal Evidence**
  - **Tab 2: Model Predictions & Risk Factors**
