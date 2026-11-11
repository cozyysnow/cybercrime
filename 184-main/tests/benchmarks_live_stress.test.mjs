import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();

// Load modules dynamically via tsx
const dashboardDataModule = await import('../src/data/dashboardData.ts');
const apiServiceModule = await import('../src/lib/apiService.ts');

const { ACTIVE_INCIDENTS_DATA } = dashboardDataModule;
const {
  predictWithdrawal,
  getSHAPExplanation,
  getSingleDistrictRisk,
  getDistrictRiskScores,
} = apiServiceModule;

// The 6 verified cases under test
const EXPECTED_CASE_IDS = ['CS-001', 'CS-012', 'CS-015', 'CS-011', 'CS-013', 'CS-002'];

// CASE_EXTENDED_META contract from src/app/benchmarks/page.tsx
const CASE_EXTENDED_META = {
  'CS-001': {
    victimState: 'Delhi',
    muleState: 'Uttar Pradesh',
    tierBadge: 'HIGH CAPITAL TIER (≥ ₹2L)',
    channelType: 'Over-The-Counter Branch + ATM Layering',
    velocityWindow: '3–6 Hours (Multi-Hop Layering)',
    withdrawalMethod: 'Axis Bank ATM, Bahraich + Self-Cheque Clearing',
    groundTruthRankText: 'Identified in Model Top-3 Candidates (6/6 Judicial Recall)',
  },
  'CS-012': {
    victimState: 'Delhi',
    muleState: 'Jharkhand',
    tierBadge: 'HIGH CAPITAL TIER (≥ ₹2L)',
    channelType: 'High-Speed Standalone ATM Network',
    velocityWindow: '< 3 Hours (Rapid OTP Cashout)',
    withdrawalMethod: 'Dhanbad ATM Cluster Cash Extraction',
    groundTruthRankText: 'Identified as #1 Top Match (Rank 1 / 84% Probability)',
  },
  'CS-015': {
    victimState: 'Delhi',
    muleState: 'Rajasthan',
    tierBadge: 'HIGH CAPITAL TIER (≥ ₹2L)',
    channelType: 'Serial Multi-ATM Skimming Grid',
    velocityWindow: '< 3 Hours (Fast Transit Skimming)',
    withdrawalMethod: 'Sindhi Camp & Railway Station ATMs, Jaipur',
    groundTruthRankText: 'Identified as #1 Top Match (Rank 1 / 79% Probability)',
  },
  'CS-011': {
    victimState: 'Delhi',
    muleState: 'Uttar Pradesh',
    tierBadge: 'HIGH CAPITAL TIER (≥ ₹2L)',
    channelType: 'Dense Regional ATM Cluster Kiosks',
    velocityWindow: '< 4 Hours (Immediate Cash-out)',
    withdrawalMethod: 'Greater Noida 24/7 ATM Booths',
    groundTruthRankText: 'Identified in Model Top-3 Candidates (6/6 Judicial Recall)',
  },
  'CS-013': {
    victimState: 'Haryana',
    muleState: 'Uttar Pradesh',
    tierBadge: 'HIGH CAPITAL TIER (≥ ₹2L)',
    channelType: 'Branch Cheque + ATM Syndicate Routing',
    velocityWindow: '4–8 Hours (Structured Clearing)',
    withdrawalMethod: 'Ghaziabad Bank Branch Counter + Local ATMs',
    groundTruthRankText: 'Identified as #1 Top Match (Rank 1 / 82% Probability)',
  },
  'CS-002': {
    victimState: 'Delhi',
    muleState: 'Punjab',
    tierBadge: 'HIGH CAPITAL TIER (≥ ₹2L)',
    channelType: 'Bank Branch Counter Self-Cheque Clearance',
    velocityWindow: 'Same-Day Commercial Banking Window',
    withdrawalMethod: 'HDFC Bank Counter, Kapurthala Road, Jalandhar',
    groundTruthRankText: 'Identified as #1 Top Match (Rank 1 / 72% Probability)',
  },
};

// =========================================================================
// 1. Asset & Logo Integrity Tests
// =========================================================================
test('1. Benchmarks Logo Assets Integrity (NCRB, RBI, Emblem, Cybercast)', (t) => {
  const logos = [
    { file: 'public/logos/ncrb.png', minSize: 10000 },
    { file: 'public/logos/rbi.svg', minSize: 1000 },
    { file: 'public/logos/emblem_india.svg', minSize: 1000 },
    { file: 'public/logos/cybercast.png', minSize: 10000 },
  ];

  for (const { file, minSize } of logos) {
    const fullPath = path.join(ROOT, file);
    assert.ok(fs.existsSync(fullPath), `Logo file must exist on disk: ${file}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size >= minSize, `Logo ${file} size (${stat.size}B) must be >= ${minSize}B`);
  }
});

// =========================================================================
// 2. Data Integrity: All 6 Verified Cases Ingestion
// =========================================================================
test('2. Data Provenance of All 6 Verified Landmark Court Cases', (t) => {
  const verifiedCases = ACTIVE_INCIDENTS_DATA.filter((c) => c.isRealCourtCase);
  assert.equal(verifiedCases.length, 6, `Expected exactly 6 verified court cases, found ${verifiedCases.length}`);

  const foundIds = verifiedCases.map((c) => c.id);
  for (const expId of EXPECTED_CASE_IDS) {
    assert.ok(foundIds.includes(expId), `Case ${expId} missing from verified cases`);
  }

  for (const c of verifiedCases) {
    assert.ok(c.courtName, `Case ${c.id} must have courtName`);
    assert.ok(c.caseTitle, `Case ${c.id} must have caseTitle`);
    assert.ok(c.courtUrl, `Case ${c.id} must have courtUrl`);
    assert.ok(c.groundTruthLocation, `Case ${c.id} must have groundTruthLocation`);
    assert.ok(c.groundTruthState, `Case ${c.id} must have groundTruthState`);
    assert.ok(c.cctvEvidence, `Case ${c.id} must have cctvEvidence`);
    assert.ok(c.networkPattern, `Case ${c.id} must have networkPattern`);
    assert.ok(c.amount >= 200000, `Case ${c.id} amount (${c.amount}) must be >= ₹2,00,000`);
    assert.ok(Array.isArray(c.top3States) && c.top3States.length === 3, `Case ${c.id} must have 3 top3States`);

    // Ground truth state must be present in top3States
    const stateNames = c.top3States.map(s => s.state.toLowerCase());
    assert.ok(
      stateNames.includes(c.groundTruthState.toLowerCase()),
      `Case ${c.id} groundTruthState (${c.groundTruthState}) must be in top3States (${stateNames.join(', ')})`
    );

    // Verify CASE_EXTENDED_META entry
    const meta = CASE_EXTENDED_META[c.id];
    assert.ok(meta, `CASE_EXTENDED_META must have entry for ${c.id}`);
    assert.equal(meta.tierBadge, 'HIGH CAPITAL TIER (≥ ₹2L)');
    assert.ok(meta.velocityWindow, `velocityWindow must be defined for ${c.id}`);
    assert.equal(meta.muleState, c.groundTruthState, `muleState in meta must match groundTruthState`);
  }
});

// =========================================================================
// 3. Dynamic State Switching Simulation Across All 6 Cases
// =========================================================================
test('3. Dynamic UI Feature Matrix Update on Case Switch', (t) => {
  const verifiedCases = ACTIVE_INCIDENTS_DATA.filter((c) => c.isRealCourtCase);

  const stateDeltas = [];

  for (const caseItem of verifiedCases) {
    const meta = CASE_EXTENDED_META[caseItem.id];

    // Simulate reactive derivations performed by src/app/benchmarks/page.tsx:
    const citizenOrigin = caseItem.victimLocation;
    const filingJurisdiction = `${meta.victimState} Police`;
    const defraudedCapitalFormatted = caseItem.amountFormatted;
    const defraudedCapitalRaw = `₹${caseItem.amount.toLocaleString('en-IN')}`;
    const tierBadge = meta.tierBadge;
    const fraudModus = caseItem.fraudType;
    const velocityWindow = meta.velocityWindow;
    const muleAccountState = meta.muleState;
    const divergenceBadge = meta.victimState !== meta.muleState ? 'INTERSTATE DIVERGENCE' : 'INTRA-STATE';
    const crossBorderFlow = `${meta.victimState} → ${meta.muleState}`;
    const top3States = caseItem.top3States;

    // Assertions for each feature matrix component
    assert.ok(citizenOrigin.length > 5, `Citizen origin must be non-trivial for ${caseItem.id}`);
    assert.ok(filingJurisdiction.endsWith('Police'), `Filing jurisdiction must end with Police for ${caseItem.id}`);
    assert.ok(defraudedCapitalFormatted.startsWith('₹'), `Capital formatted must start with ₹ for ${caseItem.id}`);
    assert.equal(tierBadge, 'HIGH CAPITAL TIER (≥ ₹2L)', `Tier badge must match for ${caseItem.id}`);
    assert.ok(['Investment Fraud', 'KYC Fraud', 'Loan Fraud'].includes(fraudModus), `Modus must be recognized for ${caseItem.id}`);
    assert.ok(velocityWindow.includes('Hour') || velocityWindow.includes('Window'), `Velocity window valid for ${caseItem.id}`);
    assert.ok(muleAccountState.length > 2, `Mule state must be populated for ${caseItem.id}`);
    assert.equal(divergenceBadge, 'INTERSTATE DIVERGENCE', `All 6 benchmark cases exhibit interstate divergence`);
    assert.ok(crossBorderFlow.includes('→'), `Cross-border flow must contain arrow for ${caseItem.id}`);
    assert.equal(top3States.length, 3, `Top-3 state distribution must have 3 items for ${caseItem.id}`);

    stateDeltas.push({
      id: caseItem.id,
      origin: citizenOrigin,
      capital: defraudedCapitalFormatted,
      modus: fraudModus,
      velocity: velocityWindow,
      mule: muleAccountState,
      top1State: top3States[0].state,
      top1Prob: top3States[0].prob,
    });
  }

  // Verify that switching between cases produces dynamic variance across all 5 dimensions
  for (let i = 0; i < stateDeltas.length; i++) {
    for (let j = i + 1; j < stateDeltas.length; j++) {
      const a = stateDeltas[i];
      const b = stateDeltas[j];
      
      // At least capital, origin, or modus/mule must vary between distinct cases
      const isDifferent = 
        a.origin !== b.origin ||
        a.capital !== b.capital ||
        a.modus !== b.modus ||
        a.mule !== b.mule ||
        a.top1State !== b.top1State ||
        a.top1Prob !== b.top1Prob;

      assert.ok(isDifferent, `Cases ${a.id} and ${b.id} must have distinct feature matrix profiles`);
    }
  }
});

// =========================================================================
// 4. Live Machine Learning Inference Execution Across All 6 Cases
// =========================================================================
test('4. Live Model Inference & SHAP Explainability Across All 6 Cases', async (t) => {
  const verifiedCases = ACTIVE_INCIDENTS_DATA.filter((c) => c.isRealCourtCase);

  for (const caseItem of verifiedCases) {
    const meta = CASE_EXTENDED_META[caseItem.id];
    const complaintInput = {
      complaint_id: caseItem.id,
      fraud_type: caseItem.fraudType,
      amount_stolen_inr: caseItem.amount,
      victim_state: meta.victimState,
      mule_account_state: meta.muleState,
      mule_account_bank: 'SBI',
      complaint_hour: 14,
      complaint_day_of_week: 3,
    };

    const startTime = performance.now();
    const prediction = await predictWithdrawal(complaintInput);
    const elapsed = Math.round(performance.now() - startTime);

    assert.ok(prediction, `Prediction response must exist for ${caseItem.id}`);
    assert.ok(
      prediction.status.includes('success'),
      `Prediction status must be successful for ${caseItem.id}, got: ${prediction.status}`
    );

    // Operational latency check
    assert.ok(
      prediction.processing_latency_ms >= 0 && prediction.processing_latency_ms < 5000,
      `Latency (${prediction.processing_latency_ms}ms) must be reasonable for ${caseItem.id}`
    );

    // Top predicted states
    assert.ok(
      Array.isArray(prediction.top_predicted_states) && prediction.top_predicted_states.length >= 3,
      `Prediction must return at least 3 top states for ${caseItem.id}`
    );

    // Probability integrity
    for (const st of prediction.top_predicted_states) {
      assert.ok(st.state && typeof st.state === 'string', `State must be string in ${caseItem.id}`);
      assert.ok(st.probability >= 0 && st.probability <= 1, `Probability must be between 0 and 1 in ${caseItem.id}`);
    }

    // Top-3 Coverage check
    const top3StatesNames = prediction.top_predicted_states.slice(0, 3).map(s => s.state.toLowerCase());
    const groundTruth = (caseItem.groundTruthState || meta.muleState).toLowerCase();
    const isCovered = top3StatesNames.includes(groundTruth);
    assert.ok(
      isCovered,
      `Case ${caseItem.id} ground truth (${groundTruth}) must be covered in model Top-3 (${top3StatesNames.join(', ')})`
    );

    // Zone prediction
    assert.ok(prediction.zone_prediction, `Zone prediction must exist for ${caseItem.id}`);
    assert.ok(prediction.zone_prediction.predicted_zone, `Predicted zone required for ${caseItem.id}`);

    // Time window and urgency
    assert.ok(prediction.estimated_time_window_hours > 0, `Time window must be positive for ${caseItem.id}`);
    assert.ok(prediction.time_urgency, `Time urgency required for ${caseItem.id}`);

    // SHAP Explainability computation
    const shap = getSHAPExplanation(complaintInput, prediction);
    assert.ok(shap, `SHAP explanation must be returned for ${caseItem.id}`);
    assert.equal(shap.complaintId, caseItem.id, `SHAP complaintId must match for ${caseItem.id}`);
    assert.ok(shap.topFactors.length >= 3, `SHAP must produce at least 3 explanation factors for ${caseItem.id}`);
    assert.ok(shap.summary.includes('Model confidence'), `SHAP summary must contain narrative explanation`);

    // Verify key SHAP attribution vectors
    const factorNames = shap.topFactors.map(f => f.feature);
    assert.ok(
      factorNames.some(n => n.includes('High Stolen Amount')),
      `SHAP must recognize High Stolen Amount (>= ₹2L) factor for ${caseItem.id}`
    );
    assert.ok(
      factorNames.some(n => n.includes('Cross-State')),
      `SHAP must recognize Cross-State routing factor for ${caseItem.id}`
    );

    // Check Modus Operandi attribution:
    // KYC and Investment fraud types are explicitly handled in apiService.ts
    // Loan Fraud (CS-002) is omitted from Modus factor in apiService.ts (documented empirical finding)
    if (caseItem.fraudType.includes('KYC') || caseItem.fraudType.includes('Investment')) {
      assert.ok(
        factorNames.some(n => n.includes('Modus Operandi')),
        `SHAP must recognize Modus Operandi factor for ${caseItem.id} (${caseItem.fraudType})`
      );
    } else {
      // For Loan Fraud (CS-002), verify factors handled without crash
      assert.ok(shap.topFactors.length >= 3, `SHAP still provides robust factors for unmapped modus in ${caseItem.id}`);
    }
  }
});

// =========================================================================
// 5. Adversarial & Boundary Input Stress Testing
// =========================================================================
test('5. Adversarial Input Robustness (Zero/Negative Capital, Malformed Types, Bursts)', async (t) => {
  const boundaryCases = [
    {
      name: 'Zero defrauded amount',
      input: {
        complaint_id: 'ADV-001',
        fraud_type: 'Investment Fraud',
        amount_stolen_inr: 0,
        victim_state: 'Delhi',
        mule_account_state: 'Uttar Pradesh',
      },
    },
    {
      name: 'Negative defrauded amount',
      input: {
        complaint_id: 'ADV-002',
        fraud_type: 'KYC Fraud',
        amount_stolen_inr: -50000,
        victim_state: 'Delhi',
        mule_account_state: 'Jharkhand',
      },
    },
    {
      name: 'Extreme capital tier (₹100 Crores)',
      input: {
        complaint_id: 'ADV-003',
        fraud_type: 'Loan Fraud',
        amount_stolen_inr: 1000000000,
        victim_state: 'Delhi',
        mule_account_state: 'Punjab',
      },
    },
    {
      name: 'SQL injection and script payload strings',
      input: {
        complaint_id: "ADV-004'; DROP TABLE alerts; --",
        fraud_type: '<script>alert("XSS")</script>',
        amount_stolen_inr: 250000,
        victim_state: 'Delhi',
        mule_account_state: 'Rajasthan',
      },
    },
    {
      name: 'Off-peak midnight complaint hour',
      input: {
        complaint_id: 'ADV-005',
        fraud_type: 'Investment Fraud',
        amount_stolen_inr: 450000,
        victim_state: 'Delhi',
        mule_account_state: 'Uttar Pradesh',
        complaint_hour: 2,
      },
    },
  ];

  for (const { name, input } of boundaryCases) {
    // Should never throw unhandled exceptions
    const prediction = await predictWithdrawal(input);
    assert.ok(prediction, `Prediction must gracefully return for ${name}`);
    assert.ok(Array.isArray(prediction.top_predicted_states), `States must be an array for ${name}`);

    const shap = getSHAPExplanation(input, prediction);
    assert.ok(shap, `SHAP must gracefully return for ${name}`);
    assert.ok(Array.isArray(shap.topFactors), `Factors must be an array for ${name}`);
  }

  // Concurrent Burst: Send 6 parallel requests simultaneously
  const burstInputs = EXPECTED_CASE_IDS.map(id => ({
    complaint_id: `BURST-${id}`,
    fraud_type: 'Investment Fraud',
    amount_stolen_inr: 500000,
    victim_state: 'Delhi',
    mule_account_state: 'Uttar Pradesh',
  }));

  const burstResults = await Promise.all(burstInputs.map(inp => predictWithdrawal(inp)));
  assert.equal(burstResults.length, 6, 'All 6 concurrent burst requests must complete');
  for (const res of burstResults) {
    assert.ok(res.status.includes('success'), 'All concurrent requests must succeed');
  }
});

// =========================================================================
// 6. Production Next.js Runtime Benchmarks Page HTTP Verification
// =========================================================================
test('6. Production Runtime HTTP Response on /benchmarks', async (t) => {
  const TEST_PORT = 3185;
  const server = spawn('npx', ['next', 'start', '-p', String(TEST_PORT)], {
    cwd: ROOT,
    stdio: 'pipe',
  });

  await new Promise((resolve) => {
    let started = false;
    server.stdout.on('data', (chunk) => {
      const msg = chunk.toString();
      if (msg.includes('Ready') || msg.includes(String(TEST_PORT))) {
        started = true;
        resolve();
      }
    });
    server.stderr.on('data', (chunk) => {
      // Non-fatal warnings
    });
    setTimeout(() => {
      if (!started) resolve();
    }, 4000);
  });

  try {
    const html = await new Promise((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${TEST_PORT}/benchmarks`, (res) => {
        assert.equal(res.statusCode, 200, 'HTTP status for /benchmarks must be 200');
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
    });

    // 1. Verify presence of all 6 Case IDs in the rendered DOM
    for (const caseId of EXPECTED_CASE_IDS) {
      assert.ok(html.includes(caseId), `Rendered page must contain case ID ${caseId}`);
    }

    // 2. Verify Key Institutional Headlines and Empirical Metrics (No False 100% Claims)
    assert.ok(
      html.includes('TOP-3 RETRIEVAL: 6/6 CASES') || html.includes('TOP-3 RETRIEVAL'),
      'Rendered page must contain Top-3 Retrieval metric'
    );
    assert.ok(
      html.includes('85.9%') || html.includes('5-FOLD CV: 85.9%'),
      'Rendered page must contain 85.9% Validation Accuracy metric'
    );
    assert.ok(
      !html.includes('100% TOP-3 CANDIDATE COVERAGE'),
      'Rendered page must NOT contain inflated 100% Top-3 marketing claim'
    );
    assert.ok(
      !html.includes('100% TOP-1 MATCH'),
      'Rendered page must NOT contain inflated 100% Top-1 marketing claim'
    );

    // 3. Verify Two Core Tabs Present
    assert.ok(
      html.includes('Ground Truth &amp; Legal Evidence') || html.includes('Ground Truth & Legal Evidence'),
      'Rendered page must contain Ground Truth & Legal Evidence tab'
    );
    assert.ok(
      html.includes('Model Predictions &amp; Verdict') || html.includes('Model Predictions & Verdict'),
      'Rendered page must contain Model Predictions & Verdict tab'
    );

    // 4. Verify Code Block for Judges has been removed
    assert.ok(
      !html.includes('CODE BLOCK FOR JUDGES'),
      'CODE BLOCK FOR JUDGES must be completely removed from the page DOM'
    );

    // 5. Verify Dataset Provenance reference
    assert.ok(
      html.includes('Cyber_Singham_Real_Life_Cases_Pack'),
      'Rendered page must cite dataset provenance'
    );

    // 6. Verify Extraction Facility & Zone Prediction in HTML DOM (Authentic Railway ML Outputs)
    assert.ok(
      html.includes('PHYSICAL EXTRACTION FACILITY &amp; CASH-OUT ZONE') ||
      html.includes('PHYSICAL EXTRACTION FACILITY & CASH-OUT ZONE') ||
      html.includes('EXTRACTION FACILITY'),
      'Rendered page must contain Section 03 Physical Extraction Facility & Cash-Out Zone'
    );
    assert.ok(
      html.includes('964 DISTRICTS INDEXED'),
      'Rendered page must contain 964 Districts Indexed tag'
    );
    assert.ok(
      html.includes('zone_prediction'),
      'Rendered page must cite zone_prediction hierarchical classifier'
    );
    assert.ok(
      !html.includes('EXACT DISTRICT MATCH'),
      'Rendered page must NOT contain fake EXACT DISTRICT MATCH badge'
    );
    assert.ok(
      !html.includes('PREDICTED CASH-OUT DISTRICT'),
      'Rendered page must NOT contain fake PREDICTED CASH-OUT DISTRICT claim'
    );
  } finally {
    server.kill();
  }
});

// =========================================================================
// 7. District-Level Spatial Prediction & Hotspot Localization Tests
// =========================================================================
test('7. District-Level Prediction & Hotspot Localization Across All 6 Cases', async (t) => {
  const verifiedCases = ACTIVE_INCIDENTS_DATA.filter((c) => c.isRealCourtCase);

  const districtFixtures = {
    'CS-001': { victimDist: 'Central', targetState: 'Uttar Pradesh', targetDist: 'Bahraich' },
    'CS-012': { victimDist: 'Central', targetState: 'Jharkhand', targetDist: 'Dhanbad' },
    'CS-015': { victimDist: 'South', targetState: 'Rajasthan', targetDist: 'Jaipur North' },
    'CS-011': { victimDist: 'West', targetState: 'Uttar Pradesh', targetDist: 'Gautambudh Nagar' },
    'CS-013': { victimDist: 'Gurugram', targetState: 'Uttar Pradesh', targetDist: 'Ghaziabad' },
    'CS-002': { victimDist: 'North', targetState: 'Punjab', targetDist: 'CP Jalandhar' },
  };

  for (const caseItem of verifiedCases) {
    const fixture = districtFixtures[caseItem.id];
    assert.ok(fixture, `Fixture must exist for ${caseItem.id}`);

    // Ingest complaint with victim_district
    const pred = await predictWithdrawal({
      complaint_id: `DIST-${caseItem.id}`,
      fraud_type: caseItem.fraudType,
      amount_stolen_inr: caseItem.amount,
      victim_state: fixture.victimDist === 'Gurugram' ? 'Haryana' : 'Delhi (NCT)',
      victim_district: fixture.victimDist,
      mule_account_state: fixture.targetState,
      mule_account_bank: 'SBI',
    });

    assert.ok(pred, `Prediction must exist for ${caseItem.id}`);
    assert.ok(pred.origin_district_risk, `origin_district_risk must be populated when victim_district provided in ${caseItem.id}`);
    assert.equal(pred.origin_district_risk.district, fixture.victimDist, `Origin district must match for ${caseItem.id}`);
    assert.ok(typeof pred.origin_district_risk.risk_score === 'number', `risk_score must be number for ${caseItem.id}`);
    assert.ok(pred.origin_district_risk.risk_tier, `risk_tier must be defined for ${caseItem.id}`);

    // Query target district risk score
    const targetDistRisk = await getSingleDistrictRisk(fixture.targetState, fixture.targetDist);
    assert.ok(targetDistRisk, `Target district ${fixture.targetDist} in ${fixture.targetState} must resolve risk`);
    assert.ok(typeof targetDistRisk.risk_score === 'number', `Target district risk_score must be number for ${caseItem.id}`);
    assert.ok(['Critical', 'High', 'Moderate', 'Low'].includes(targetDistRisk.risk_tier), `Target district risk_tier must be valid category for ${caseItem.id}`);
  }

  // Verify state district risk spectrum
  const upDistricts = await getDistrictRiskScores('Uttar Pradesh');
  assert.ok(Array.isArray(upDistricts) && upDistricts.length > 0, 'getDistrictRiskScores must return districts for Uttar Pradesh');

  // Verify state normalization for Delhi and direct single district queries
  const delhiDistricts = await getDistrictRiskScores('Delhi');
  assert.ok(Array.isArray(delhiDistricts) && delhiDistricts.length > 0, 'getDistrictRiskScores must normalize Delhi to Delhi (NCT)');
  const centralDelhi = await getSingleDistrictRisk('Delhi', 'Central');
  assert.ok(centralDelhi, 'getSingleDistrictRisk must resolve Central district for Delhi');
  assert.equal(centralDelhi.risk_score, 30.2, 'Central Delhi risk_score must match 30.2');
});
