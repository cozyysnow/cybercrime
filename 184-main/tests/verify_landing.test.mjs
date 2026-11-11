import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const ROOT = '/Users/tanujpathak/teamwork_projects/cybercast_landing';

test('1. Production Assets Verification', (t) => {
  const assets = [
    'public/CyberCast.png',
    'src/assets/CyberCast.png',
    'public/3d/earth.glb',
    'public/3d/earth_texture.webp',
    'public/3d/draco/draco_decoder.wasm',
    'public/3d/draco/draco_wasm_wrapper.js',
    'public/images/3d-fallback.webp'
  ];

  for (const asset of assets) {
    const fullPath = path.join(ROOT, asset);
    assert.ok(fs.existsSync(fullPath), `Asset must exist: ${asset}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 0, `Asset must have non-zero size: ${asset} (${stat.size} bytes)`);
  }
});

test('2. Content Store Verbatim Copy Verification', async (t) => {
  const contentFile = path.join(ROOT, 'src/data/content.ts');
  assert.ok(fs.existsSync(contentFile), 'content.ts must exist');
  const rawContent = fs.readFileSync(contentFile, 'utf8');

  // Verify key verbatim requirements from ORIGINAL_REQUEST.md
  const requiredPhrases = [
    // Section 1: Hero
    'Predicting Cybercrime Cash Withdrawals Before They Happen',
    'Smart India Hackathon 2026 | Problem Statement 184 | Ministry of Home Affairs, I4C',
    'Explore the Dashboard →',
    // Section 2: The Problem
    'The Crisis We Are Solving',
    '8,000+ Daily Complaints',
    '2-6 Hour Window',
    'No Predictive Intelligence',
    // Section 3: Our Solution
    'A Weather Forecast for Cybercrime',
    'From "Crime → Complaint → Investigation → Money Gone" to "Complaint → Prediction → Deployment → Criminal Caught"',
    // Section 4: Key Features
    'What We Have Built',
    'Predictive Analytics Engine',
    'Risk Heatmap Dashboard',
    'Law Enforcement Interface',
    'Alert & Notification System',
    // Section 5: How It Works
    'How the System Works in Real-Time',
    'Complaint Filed',
    'AI Pattern Matching',
    'Location Prediction',
    'Heatmap Activation',
    'Automated Alerts',
    'Proactive Intervention',
    // Section 6: Impact & Statistics
    'Expected Impact',
    '8,000+',
    '2-6 hrs',
    '28 States',
    '4-Tier',
    // Section 7: Ecosystem
    'Unified Defense Ecosystem',
    'I4C Command Center',
    'State Cyber Cells',
    'District Police',
    'Banks & Financial Institutions',
    // Section 8: Tech Stack
    'Built With',
    'AI/ML Layer',
    'Geospatial Layer',
    'Data Layer',
    'Dashboard Layer',
    'Alert Layer',
    'Security Layer',
    // Section 9: Data Sources
    'Powered by Multi-Source Intelligence',
    'National Crime Records Bureau (NCRB)',
    'Reserve Bank of India (RBI)',
    'OpenStreetMap',
    'Sanchar Saathi (DoT)',
    'TRAI',
    'CERT-In',
    'data.gov.in',
    'NewsAPI',
    'Kaggle Fraud Datasets',
    // Section 10: Challenges
    'Built for Real-World Complexity',
    'Data Quality & Multilingual Inputs',
    'Alert Fatigue Prevention',
    'Criminal Adaptation',
    'Inter-Agency Coordination',
    // Section 11: Feedback Loop
    'A System That Learns From Every Case',
    'Complaint → Prediction → Alert → Police Action → Outcome Feedback → Model Retraining → Better Prediction',
    // Section 12: Footer & Team
    'Strengthening India\'s cybersecurity posture through data-driven, proactive defense against financial cybercrime.',
    'Smart India Hackathon 2026',
    'SIH184',
    'Cyber Singham',
    'Galgotias University',
    'Ekkta Mishra , Aditya Gupta , Tanuj Pathak , Shreya Singh , Shruti Yadav , Manya Singh Bhadauriya'
  ];

  for (const phrase of requiredPhrases) {
    assert.ok(rawContent.includes(phrase), `Verbatim phrase missing: "${phrase}"`);
  }
});

test('3. Next.js Static Build Artifacts Verification', (t) => {
  const dotNext = path.join(ROOT, '.next');
  assert.ok(fs.existsSync(dotNext), '.next directory must exist from build');
  assert.ok(fs.existsSync(path.join(dotNext, 'BUILD_ID')), 'BUILD_ID must exist');
  assert.ok(fs.existsSync(path.join(dotNext, 'server')), 'server output must exist');
});

test('4. Runtime Server HTTP Response Verification', async (t) => {
  const server = spawn('npx', ['next', 'start', '-p', '3099'], {
    cwd: ROOT,
    stdio: 'pipe',
  });

  // Wait for server to start
  await new Promise((resolve, reject) => {
    let started = false;
    server.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Ready') || msg.includes('3099')) {
        started = true;
        resolve();
      }
    });
    server.stderr.on('data', (data) => {
      console.error('Server err:', data.toString());
    });
    setTimeout(() => {
      if (!started) resolve(); // try anyway
    }, 4000);
  });

  // Make HTTP request to local server
  const html = await new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3099', (res) => {
      assert.equal(res.statusCode, 200, 'HTTP status code must be 200');
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });

  // Clean up server
  server.kill();

  // Verify HTML contains key components
  assert.ok(html.includes('Predicting Cybercrime'), 'HTML contains Hero title');
  assert.ok(html.includes('The Crisis We Are Solving'), 'HTML contains Problem section');
  assert.ok(html.includes('Cyber Singham'), 'HTML contains Team name');
  assert.ok(html.includes('CyberCast.png'), 'HTML references CyberCast logo');
});
