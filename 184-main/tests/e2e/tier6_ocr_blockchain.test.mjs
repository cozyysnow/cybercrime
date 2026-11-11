/**
 * Tier 6: PaddleOCR Multilingual Indic Engine & Polygon Blockchain Ledger E2E Test Suite
 * CyberCast Forensic Chain of Custody System (SIH PS 184)
 * 
 * Verifies:
 * 1. Python FastAPI PaddleOCR Microservice Architecture (`backend/ocr_service.py`)
 * 2. PaddleOCR TypeScript Service & Next.js Route (`src/lib/ocr/paddleOcrService.ts` & `/api/ocr/extract`)
 * 3. Indic Multilingual Detection & Forensic Cyber Entity Extraction
 * 4. Dual-Layer Compound Cryptographic Root Hashing
 * 5. 4-Tier Zero-Loss Persistence Redundancy Architecture
 * 6. Multi-Key Reverse Lookup Registry Execution
 * 7. Forensic Ingestion UI Modal (`EvidenceIngestModal.tsx`)
 * 8. EvidenceModule Card UI & Chain of Custody Upgrades
 * 9. Judicial Courtroom Verification Portal (`/verify`)
 * 10. Legal Compliance Matrix & Strict Web Theme Invariants
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
}

function projectFileExists(relPath) {
  return fs.existsSync(path.join(PROJECT_ROOT, relPath));
}

function runTsxScript(code) {
  const res = spawnSync('npx', ['tsx', '-e', code], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 10000,
  });
  if (res.status !== 0) {
    throw new Error(`TSX Script execution failed: ${res.stderr || res.stdout}`);
  }
  return res.stdout.trim();
}

// ---------------------------------------------------------------------------
// SUITE 1: PYTHON FASTAPI PADDLEOCR MICROSERVICE ARCHITECTURE
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 1: Python FastAPI PaddleOCR Microservice Architecture', () => {
  const servicePath = 'backend/ocr_service.py';

  test('T6.OCR.1.1 - Microservice file backend/ocr_service.py exists', () => {
    assert.ok(projectFileExists(servicePath), `Expected ${servicePath} to exist`);
    const content = readProjectFile(servicePath);
    assert.ok(content.length > 500, 'Microservice file must contain substantial implementation');
  });

  test('T6.OCR.1.2 - Defines FastAPI app and /ocr/extract endpoint', () => {
    const content = readProjectFile(servicePath);
    assert.ok(content.includes('FastAPI'), 'Must configure FastAPI application');
    assert.ok(content.includes('/ocr/extract'), 'Must implement /ocr/extract endpoint');
    assert.ok(content.includes('/health'), 'Must implement health check endpoint');
  });

  test('T6.OCR.1.3 - Computes raw artifact SHA-256 immediately upon receipt', () => {
    const content = readProjectFile(servicePath);
    assert.ok(content.includes('hashlib.sha256'), 'Must use hashlib.sha256 for binary integrity');
    assert.ok(content.includes('raw_sha256'), 'Must output raw_sha256 in payload');
  });

  test('T6.OCR.1.4 - Implements Indic entity regex patterns for phones, bank accounts, IFSC, UPI, APKs, urgency', () => {
    const content = readProjectFile(servicePath);
    assert.ok(content.includes('phone_numbers'), 'Must extract phone_numbers');
    assert.ok(content.includes('bank_accounts'), 'Must extract bank_accounts');
    assert.ok(content.includes('ifsc_codes'), 'Must extract ifsc_codes');
    assert.ok(content.includes('upi_ids'), 'Must extract upi_ids');
    assert.ok(content.includes('apks_detected'), 'Must extract apks_detected');
    assert.ok(content.includes('urgency_keywords'), 'Must extract urgency_keywords');
  });

  test('T6.OCR.1.5 - Supports multi-angle classification and Indic languages (hi)', () => {
    const content = readProjectFile(servicePath);
    assert.ok(content.includes("use_angle_cls=True"), 'Must specify angle classification');
    assert.ok(content.includes("lang='hi'"), 'Must specify Indic Devanagari language model');
  });
});

// ---------------------------------------------------------------------------
// SUITE 2: PADDLEOCR TYPESCRIPT SERVICE & NEXT.JS ROUTE
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 2: PaddleOCR TypeScript Service & Next.js Route', () => {
  const tsServicePath = 'src/lib/ocr/paddleOcrService.ts';
  const apiRoutePath = 'src/app/api/ocr/extract/route.ts';

  test('T6.OCR.2.1 - TypeScript service file exists at src/lib/ocr/paddleOcrService.ts', () => {
    assert.ok(projectFileExists(tsServicePath), `Expected ${tsServicePath} to exist`);
  });

  test('T6.OCR.2.2 - Service exports core PaddleOCR and entity extraction functions', () => {
    const content = readProjectFile(tsServicePath);
    assert.ok(content.includes('export function extractCyberEntities'), 'Must export extractCyberEntities');
    assert.ok(content.includes('export function detectIndicLanguage'), 'Must export detectIndicLanguage');
    assert.ok(content.includes('export async function calculateCompoundEvidenceHash'), 'Must export calculateCompoundEvidenceHash');
    assert.ok(content.includes('export async function extractOcrWithPaddle'), 'Must export extractOcrWithPaddle');
  });

  test('T6.OCR.2.3 - API route exists at src/app/api/ocr/extract/route.ts with POST & GET handlers', () => {
    assert.ok(projectFileExists(apiRoutePath), `Expected ${apiRoutePath} to exist`);
    const content = readProjectFile(apiRoutePath);
    assert.ok(content.includes('export async function POST'), 'Must define POST route handler');
    assert.ok(content.includes('export async function GET'), 'Must define GET route handler');
  });

  test('T6.OCR.2.4 - PaddleOCR extraction returns structured payload with model_version PaddleOCR v2.8', () => {
    const script = `
      import { extractOcrWithPaddle } from "./src/lib/ocr/paddleOcrService";
      async function main() {
        const result = await extractOcrWithPaddle("Test data", "whatsapp_chat.png", "CY2026-MH-44521");
        console.log(JSON.stringify({
          status: result.status,
          hasRawSha256: typeof result.raw_sha256 === 'string' && result.raw_sha256.length === 64,
          hasCompoundHash: typeof result.compound_hash === 'string' && result.compound_hash.length === 64,
          modelVersion: result.model_version
        }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.status, 'success', 'Must return success status');
    assert.equal(out.hasRawSha256, true, 'Must return valid 64-char raw SHA-256');
    assert.equal(out.hasCompoundHash, true, 'Must return valid 64-char compound root');
    assert.ok(out.modelVersion.includes('PaddleOCR v2.8'), 'Must declare PaddleOCR v2.8 engine');
  });

  test('T6.OCR.2.5 - Rejects 0-byte or empty payloads with status error and does NOT fabricate scam text', () => {
    const script = `
      import { extractOcrWithPaddle } from "./src/lib/ocr/paddleOcrService";
      async function main() {
        const emptyResult = await extractOcrWithPaddle(new ArrayBuffer(0), "empty.png", "CY2026-MH-44521");
        const emptyStrResult = await extractOcrWithPaddle("", "empty.txt", "CY2026-MH-44521");
        console.log(JSON.stringify({
          emptyStatus: emptyResult.status,
          emptyHasError: !!emptyResult.error,
          emptyTextLen: emptyResult.extracted_text.length,
          emptyStrStatus: emptyStrResult.status
        }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.emptyStatus, 'error', 'Must return error for 0-byte buffer');
    assert.equal(out.emptyHasError, true, 'Must specify error message');
    assert.equal(out.emptyTextLen, 0, 'Must not fabricate scam text for empty buffer');
    assert.equal(out.emptyStrStatus, 'error', 'Must return error for empty string');
  });

  test('T6.OCR.2.6 - Route POST /api/ocr/extract validates 0-byte file and empty JSON payload', () => {
    const script = `
      import { POST, GET } from "./src/app/api/ocr/extract/route";
      import { NextRequest } from "next/server";

      async function main() {
        // Test GET health check
        const getRes = await GET();
        const getData = await getRes.json();

        // Test empty JSON
        const emptyJsonReq = new NextRequest("http://localhost:3000/api/ocr/extract", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({})
        });
        const emptyJsonRes = await POST(emptyJsonReq);

        // Test valid JSON payload
        const validJsonReq = new NextRequest("http://localhost:3000/api/ocr/extract", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: "CFCFRMS alert A/C 38920192831 UTR HDFCR5202609050019284 IFSC SBIN0001234",
            fileName: "freeze_notice.txt",
            caseId: "CY2026-MH-44521"
          })
        });
        const validJsonRes = await POST(validJsonReq);
        const validJsonData = await validJsonRes.json();

        console.log(JSON.stringify({
          getStatus: getRes.status,
          getEngine: getData.engine,
          getScriptsCount: getData.supported_scripts.length,
          emptyJsonStatus: emptyJsonRes.status,
          validJsonStatus: validJsonRes.status,
          validHasRawSha: typeof validJsonData.raw_sha256 === 'string',
          validHasUtr: validJsonData.entities_found?.utr_numbers?.includes("HDFCR5202609050019284")
        }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.getStatus, 200, 'GET /api/ocr/extract must return 200 OK');
    assert.ok(out.getScriptsCount >= 8, 'Must support 8+ Indic scripts');
    assert.equal(out.emptyJsonStatus, 400, 'Empty JSON must return 400 Bad Request');
    assert.equal(out.validJsonStatus, 200, 'Valid JSON must return 200 OK');
    assert.equal(out.validHasRawSha, true, 'Valid request must compute raw SHA-256');
    assert.equal(out.validHasUtr, true, 'Valid request must extract UTR number');
  });
});

// ---------------------------------------------------------------------------
// SUITE 3: INDIC MULTILINGUAL DETECTION & CYBER ENTITY EXTRACTION
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 3: Indic Multilingual Detection & Cyber Entity Extraction', () => {
  test('T6.OCR.3.1 - Detects Devanagari (Hindi) and Hinglish script', () => {
    const script = `
      import { detectIndicLanguage } from "./src/lib/ocr/paddleOcrService";
      const hinglish = detectIndicLanguage("प्रिय उपभोक्ता, QuickSupport APK डाउनलोड करें");
      const pureHindi = detectIndicLanguage("प्रिय उपभोक्ता आपका बिजली कनेक्शन काट दिया जाएगा");
      const english = detectIndicLanguage("Dear customer your bank account is suspended");
      console.log(JSON.stringify({ hinglish, pureHindi, english }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.hinglish, 'Hindi / English (Hinglish)');
    assert.equal(out.pureHindi, 'Hindi / Devanagari');
    assert.equal(out.english, 'English');
  });

  test('T6.OCR.3.2 - Detects regional scripts (Bengali, Tamil, Telugu, Gujarati)', () => {
    const script = `
      import { detectIndicLanguage } from "./src/lib/ocr/paddleOcrService";
      const bengali = detectIndicLanguage("আপনার বিদ্যুৎ সংযোগ বিচ্ছিন্ন করা হবে");
      const tamil = detectIndicLanguage("உங்கள் மின் இணைப்பு துண்டிக்கப்படும்");
      const telugu = detectIndicLanguage("మీ విద్యుత్ కనెక్షన్ నిలిపివేయబడుతుంది");
      console.log(JSON.stringify({ bengali, tamil, telugu }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.bengali, 'Bengali');
    assert.equal(out.tamil, 'Tamil');
    assert.equal(out.telugu, 'Telugu');
  });

  test('T6.OCR.3.3 - Extracts Indian phone numbers and masked contact formats', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Contact officer at +91 98765-XXXXX or call 9829012345 immediately";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify(entities.phone_numbers));
    `;
    const phones = JSON.parse(runTsxScript(script));
    assert.ok(phones.some((p) => p.includes('98765') || p.includes('98290')), 'Must extract phone numbers');
  });

  test('T6.OCR.3.4 - Extracts mule bank account numbers and valid Indian IFSC codes', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Lien on A/C 38920192831 IFSC SBIN0001234 for fraud inquiry";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify({
        accounts: entities.bank_accounts,
        ifsc: entities.ifsc_codes
      }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.ok(out.accounts.includes('38920192831'), 'Must extract 11-digit bank account');
    assert.ok(out.ifsc.includes('SBIN0001234'), 'Must extract standard 11-char IFSC code');
  });

  test('T6.OCR.3.5 - Extracts UPI IDs and VPA handles', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Pay penalty to powercorp98@upi or electricitybill@sbi";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify(entities.upi_ids));
    `;
    const upis = JSON.parse(runTsxScript(script));
    assert.ok(upis.includes('powercorp98@upi'), 'Must extract powercorp98@upi');
    assert.ok(upis.includes('electricitybill@sbi'), 'Must extract electricitybill@sbi');
  });

  test('T6.OCR.3.6 - Extracts malicious APK bundles and phishing domains', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Download QuickSupport.apk from https://secure-mha-police.info/apk";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify({
        apks: entities.apks_detected,
        urls: entities.urls_detected
      }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.ok(out.apks.some((a) => a.toLowerCase().includes('quicksupport.apk')), 'Must detect QuickSupport.apk');
    assert.ok(out.urls.some((u) => u.includes('https://secure-mha-police.info/apk')), 'Must detect phishing URL');
  });

  test('T6.OCR.3.7 - Detects Indic urgency keywords and cyber threat phrases', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "प्रिय उपभोक्ता, आपका बिजली कनेक्शन आज रात काट दिया जाएगा। तुरंत संपर्क करें।";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify(entities.urgency_keywords));
    `;
    const keywords = JSON.parse(runTsxScript(script));
    assert.ok(keywords.includes('काट दिया जाएगा'), 'Must detect काट दिया जाएगा');
    assert.ok(keywords.includes('तुरंत'), 'Must detect तुरंत');
  });

  test('T6.OCR.3.8 - Extracts banking UTR and transaction reference numbers (RTGS/IMPS/NEFT)', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "CFCFRMS Notice - UTR: HDFCR5202609050019284 TXN ID 9081238912 REF: UTR-9081290";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify(entities.utr_numbers));
    `;
    const utrs = JSON.parse(runTsxScript(script));
    assert.ok(utrs.some((u) => u.includes('HDFCR5202609050019284')), 'Must extract RTGS UTR');
    assert.ok(utrs.some((u) => u.includes('9081238912')), 'Must extract TXN ID');
    assert.ok(utrs.some((u) => u.includes('UTR-9081290')), 'Must extract REF UTR');
  });

  test('T6.OCR.3.9 - Detects Kannada, Malayalam, Odia, and Gurmukhi Indic scripts', () => {
    const script = `
      import { detectIndicLanguage } from "./src/lib/ocr/paddleOcrService";
      const kannada = detectIndicLanguage("ನಿಮ್ಮ ಖಾತೆಯನ್ನು ತಡೆಹಿಡಿಯಲಾಗಿದೆ");
      const malayalam = detectIndicLanguage("നിങ്ങളുടെ അക്കൗണ്ട് താൽക്കാലികമായി നിർത്തിവച്ചിരിക്കുന്നു");
      const odia = detectIndicLanguage("ଆପଣଙ୍କ ବିଦ୍ୟୁତ ସଂଯୋଗ ବିଚ୍ଛିନ୍ନ ହେବ");
      const punjabi = detectIndicLanguage("ਤੁਹਾਡਾ ਖਾਤਾ ਬਲੌਕ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ");
      console.log(JSON.stringify({ kannada, malayalam, odia, punjabi }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.kannada, 'Kannada');
    assert.equal(out.malayalam, 'Malayalam');
    assert.equal(out.odia, 'Odia');
    assert.equal(out.punjabi, 'Punjabi (Gurmukhi)');
  });

  test('T6.OCR.3.10 - Does NOT false-positive match non-phone alphanumeric tokens (e.g. 12345-order)', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Reference ticket 12345-order token 44521_token and valid phone +91-98765-XXXXX";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify(entities.phone_numbers));
    `;
    const phones = JSON.parse(runTsxScript(script));
    assert.ok(!phones.some((p) => p.includes('12345-order')), 'Must not match 12345-order as phone number');
    assert.ok(!phones.some((p) => p.includes('44521_token')), 'Must not match token as phone number');
    assert.ok(phones.some((p) => p.includes('98765')), 'Must still match valid masked phone');
  });
});

// ---------------------------------------------------------------------------
// SUITE 4: COMPOUND CRYPTOGRAPHIC ROOT & DUAL-LAYER HASHING
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 4: Compound Cryptographic Root & Dual-Layer Hashing', () => {
  test('T6.OCR.4.1 - calculateCompoundHash is byte-for-byte deterministic', () => {
    const script = `
      import { calculateCompoundHash } from "./src/lib/blockchain/evidenceLedger";
      async function main() {
        const rawHash = "9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a";
        const ocrHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        const caseId = "CY2026-MH-44521";
        const hash1 = await calculateCompoundHash(rawHash, ocrHash, caseId);
        const hash2 = await calculateCompoundHash(rawHash, ocrHash, caseId);
        console.log(JSON.stringify({ match: hash1 === hash2, len: hash1.length }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.match, true, 'Compound hash must be deterministic');
    assert.equal(out.len, 64, 'Compound hash must be exactly 64 hexadecimal characters');
  });

  test('T6.OCR.4.2 - Altering raw file hash alters compound root (tamper detection)', () => {
    const script = `
      import { calculateCompoundHash } from "./src/lib/blockchain/evidenceLedger";
      async function main() {
        const ocrHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        const caseId = "CY2026-MH-44521";
        const root1 = await calculateCompoundHash("9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a", ocrHash, caseId);
        const root2 = await calculateCompoundHash("0000000000000000000000000000000000000000000000000000000000000000", ocrHash, caseId);
        console.log(JSON.stringify({ altered: root1 !== root2 }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.altered, true, 'Altered raw file hash must produce completely different root');
  });

  test('T6.OCR.4.3 - Altering OCR transcript alters compound root (tamper detection)', () => {
    const script = `
      import { calculateCompoundHash } from "./src/lib/blockchain/evidenceLedger";
      async function main() {
        const rawHash = "9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a";
        const caseId = "CY2026-MH-44521";
        const root1 = await calculateCompoundHash(rawHash, "1111111111111111111111111111111111111111111111111111111111111111", caseId);
        const root2 = await calculateCompoundHash(rawHash, "2222222222222222222222222222222222222222222222222222222222222222", caseId);
        console.log(JSON.stringify({ altered: root1 !== root2 }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.altered, true, 'Altered OCR transcript hash must produce completely different root');
  });

  test('T6.OCR.4.4 - Altering Case ID alters compound root (case binding)', () => {
    const script = `
      import { calculateCompoundHash } from "./src/lib/blockchain/evidenceLedger";
      async function main() {
        const rawHash = "9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a";
        const ocrHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        const root1 = await calculateCompoundHash(rawHash, ocrHash, "CY2026-MH-44521");
        const root2 = await calculateCompoundHash(rawHash, ocrHash, "CY2026-RJ-99999");
        console.log(JSON.stringify({ altered: root1 !== root2 }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.altered, true, 'Different case IDs must yield distinct compound roots');
  });
});

// ---------------------------------------------------------------------------
// SUITE 5: 4-TIER ZERO-LOSS PERSISTENCE REDUNDANCY ARCHITECTURE
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 5: 4-Tier Zero-Loss Persistence Redundancy Architecture', () => {
  const ledgerTsPath = 'src/lib/blockchain/evidenceLedger.ts';

  test('T6.OCR.5.1 - Tier 1: Polygon Smart contract maintains immutable on-chain record', () => {
    const contract = readProjectFile('contracts/CyberCastEvidenceLedger.sol');
    assert.ok(contract.includes('function registerEvidence'), 'Must implement registerEvidence');
    assert.ok(contract.includes('function recordEvidence'), 'Must implement recordEvidence');
    assert.ok(contract.includes('event EvidenceAnchored'), 'Must emit EvidenceAnchored event');
  });

  test('T6.OCR.5.2 - Tier 2: Relational Supabase table case_evidence_ledger persistence code exists', () => {
    const content = readProjectFile(ledgerTsPath);
    assert.ok(content.includes('case_evidence_ledger'), 'Must target case_evidence_ledger table');
    assert.ok(content.includes('compound_hash'), 'Must persist compound_hash to database schema');
    assert.ok(content.includes('raw_sha256'), 'Must persist raw_sha256 to database schema');
  });

  test('T6.OCR.5.3 - Tier 3: Browser local persistence integrates IndexedDB and LocalStorage', () => {
    const content = readProjectFile(ledgerTsPath);
    assert.ok(content.includes('CyberCastEvidenceStore'), 'Must define IndexedDB object store');
    assert.ok(content.includes('cybercast_blockchain_ledger'), 'Must maintain localStorage cache');
  });

  test('T6.OCR.5.4 - Tier 4: Self-verifiable Section 63 BSA certificate contains embedded SVG QR code', () => {
    const content = readProjectFile(ledgerTsPath);
    assert.ok(content.includes('generateBsa63Certificate'), 'Must export generateBsa63Certificate');
    assert.ok(content.includes('generateSvgQrCode'), 'Must generate inline SVG QR code');
  });
});

// ---------------------------------------------------------------------------
// SUITE 6: MULTI-KEY REVERSE LOOKUP REGISTRY EXECUTION
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 6: Multi-Key Reverse Lookup Registry Execution', () => {
  test('T6.OCR.6.1 - lookupByHash resolves pre-seeded evidence EVD-2026-901', () => {
    const script = `
      import { lookupByHash } from "./src/lib/blockchain/evidenceLedger";
      const item = lookupByHash("9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a");
      console.log(JSON.stringify({ found: !!item, id: item?.id }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.found, true);
    assert.equal(out.id, 'EVD-2026-901');
  });

  test('T6.OCR.6.2 - lookupByTxHash resolves evidence item by transaction hash', () => {
    const script = `
      import { lookupByTxHash } from "./src/lib/blockchain/evidenceLedger";
      const item = lookupByTxHash("0x8f2c3a1e9b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f");
      console.log(JSON.stringify({ found: !!item, id: item?.id }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.found, true);
    assert.equal(out.id, 'EVD-2026-901');
  });

  test('T6.OCR.6.3 - lookupByCertId resolves evidence item by BSA Certificate ID', () => {
    const script = `
      import { lookupByCertId } from "./src/lib/blockchain/evidenceLedger";
      const item = lookupByCertId("BSA-63-2026-RAJ-9182");
      console.log(JSON.stringify({ found: !!item, id: item?.id }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.found, true);
    assert.equal(out.id, 'EVD-2026-901');
  });

  test('T6.OCR.6.4 - lookupByCid resolves evidence item by IPFS Content Identifier', () => {
    const script = `
      import { lookupByCid } from "./src/lib/blockchain/evidenceLedger";
      const item = lookupByCid("QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx");
      console.log(JSON.stringify({ found: !!item, id: item?.id }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.found, true);
    assert.equal(out.id, 'EVD-2026-901');
  });

  test('T6.OCR.6.5 - lookupByCaseId returns all associated artifacts for CY2026-MH-44521', () => {
    const script = `
      import { lookupByCaseId } from "./src/lib/blockchain/evidenceLedger";
      const items = lookupByCaseId("CY2026-MH-44521");
      console.log(JSON.stringify({ count: items.length, ids: items.map(i => i.id) }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.ok(out.count >= 4, 'Case CY2026-MH-44521 must contain at least 4 pre-seeded artifacts');
    assert.ok(out.ids.includes('EVD-2026-901'));
  });
});

// ---------------------------------------------------------------------------
// SUITE 7: FORENSIC EVIDENCE INGESTION UI MODAL
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 7: Forensic Evidence Ingestion UI Modal', () => {
  const modalPath = 'src/components/collab/EvidenceIngestModal.tsx';

  test('T6.OCR.7.1 - EvidenceIngestModal component exists at src/components/collab/EvidenceIngestModal.tsx', () => {
    assert.ok(projectFileExists(modalPath), `Expected ${modalPath} to exist`);
  });

  test('T6.OCR.7.2 - Implements drag-and-drop file upload zone accepting JPG, PNG, PDF, WEBP', () => {
    const content = readProjectFile(modalPath);
    assert.ok(content.includes('onDrop={handleDrop}'), 'Must handle file drop events');
    assert.ok(content.includes('accept="image/png,image/jpeg,image/webp,application/pdf"'), 'Must accept images and PDFs');
  });

  test('T6.OCR.7.3 - Calculates in-memory SHA-256 binary hash upon file drop', () => {
    const content = readProjectFile(modalPath);
    assert.ok(content.includes('calculateSha256(selectedFile)'), 'Must calculate SHA-256 on selected file');
    assert.ok(content.includes('RAW ARTIFACT DIGEST COMPUTED'), 'Must display raw digest confirmation');
  });

  test('T6.OCR.7.4 - Renders side-by-side view with original preview on left and OCR on right', () => {
    const content = readProjectFile(modalPath);
    assert.ok(content.includes('ORIGINAL ARTIFACT PREVIEW'), 'Must render original artifact preview');
    assert.ok(content.includes('LIVE PADDLEOCR & FORENSIC ENTITY PREVIEW'), 'Must render OCR entity preview');
  });

  test('T6.OCR.7.5 - Displays cyber entity pills for phones, bank accounts, IFSC, UPI, APKs, urgency', () => {
    const content = readProjectFile(modalPath);
    assert.ok(content.includes('phone_numbers'), 'Must render phone number chips');
    assert.ok(content.includes('bank_accounts'), 'Must render bank account chips');
    assert.ok(content.includes('ifsc_codes'), 'Must render IFSC chips');
    assert.ok(content.includes('upi_ids'), 'Must render UPI chips');
    assert.ok(content.includes('apks_detected'), 'Must render APK chips');
    assert.ok(content.includes('urgency_keywords'), 'Must render urgency chips');
  });

  test('T6.OCR.7.6 - Provides gasless [ 🔒 ANCHOR ARTIFACT & OCR TO POLYGON AMOY ] button', () => {
    const content = readProjectFile(modalPath);
    assert.ok(content.includes('ANCHOR ARTIFACT & OCR TO POLYGON AMOY'), 'Must render anchor button');
    assert.ok(content.includes('handleAnchorToBlockchain'), 'Must trigger anchor handler');
  });
});

// ---------------------------------------------------------------------------
// SUITE 8: EVIDENCE MODULE UI & CARD UPGRADES
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 8: EvidenceModule UI & Card Upgrades', () => {
  const modulePath = 'src/components/collab/EvidenceModule.tsx';

  test('T6.OCR.8.1 - EvidenceModule imports and renders EvidenceIngestModal', () => {
    const content = readProjectFile(modulePath);
    assert.ok(content.includes('import EvidenceIngestModal'), 'Must import EvidenceIngestModal');
    assert.ok(content.includes('<EvidenceIngestModal'), 'Must render EvidenceIngestModal component');
  });

  test('T6.OCR.8.2 - Evidence cards display PADDLE_OCR v2.8 badge and regional language', () => {
    const content = readProjectFile(modulePath);
    assert.ok(content.includes('PADDLE_OCR v2.8'), 'Must display PADDLE_OCR v2.8 badge');
    assert.ok(content.includes('OCR EXTRACTED TEXT'), 'Must display OCR header');
  });

  test('T6.OCR.8.3 - Evidence cards render highlighted cyber entity pills', () => {
    const content = readProjectFile(modulePath);
    assert.ok(content.includes('ev.ocrEntities'), 'Must check ev.ocrEntities');
    assert.ok(content.includes('phone_numbers'), 'Must render phone entity chips');
    assert.ok(content.includes('apks_detected'), 'Must render APK entity chips');
  });

  test('T6.OCR.8.4 - Evidence cards include translation toggle between Original Script and English', () => {
    const content = readProjectFile(modulePath);
    assert.ok(content.includes('ORIGINAL SCRIPT'), 'Must provide toggle to Original Script');
    assert.ok(content.includes('ENGLISH TRANSLATION'), 'Must provide toggle to English Translation');
  });

  test('T6.OCR.8.5 - Direct integrity verification button [ RE-VERIFY CHECKSUM ] confirms 0 bits altered on Polygon block', () => {
    const content = readProjectFile(modulePath);
    assert.ok(content.includes('RE-VERIFY CHECKSUM'), 'Must provide [ RE-VERIFY CHECKSUM ] button');
    assert.ok(content.includes('0 BITS ALTERED · VERIFIED ON POLYGON BLOCK'), 'Must display verified bits altered message');
  });

  test('T6.OCR.8.6 - Evidence cards feature [ 🖨️ BSA SEC 63 CERTIFICATE ] action button', () => {
    const content = readProjectFile(modulePath);
    assert.ok(content.includes('BSA SEC 63 CERTIFICATE'), 'Must include official court certificate action');
  });
});

// ---------------------------------------------------------------------------
// SUITE 9: JUDICIAL COURTROOM VERIFICATION PORTAL (/verify)
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 9: Judicial Courtroom Verification Portal (/verify)', () => {
  const verifyPath = 'src/app/verify/page.tsx';

  test('T6.OCR.9.1 - Court verifier renders IMMUTABLE PADDLEOCR SEIZURE TRANSCRIPT', () => {
    const content = readProjectFile(verifyPath);
    assert.ok(content.includes('IMMUTABLE PADDLEOCR SEIZURE TRANSCRIPT'), 'Must display immutable seizure transcript header');
    assert.ok(content.includes('PADDLE_OCR v2.8'), 'Must include PADDLE_OCR v2.8 badge on court verifier');
  });

  test('T6.OCR.9.2 - Court verifier displays highlighted cyber entity pills', () => {
    const content = readProjectFile(verifyPath);
    assert.ok(content.includes('result.matchedEvidence.ocrEntities'), 'Must inspect matched evidence entities');
    assert.ok(content.includes('Phone'), 'Must render phone icon for entity');
    assert.ok(content.includes('CreditCard'), 'Must render credit card icon for entity');
  });

  test('T6.OCR.9.3 - Court verifier displays pre-cashout immutability proof under Section 63 BSA 2023', () => {
    const content = readProjectFile(verifyPath);
    assert.ok(content.includes('PRE-CASHOUT IMMUTABILITY PROOF'), 'Must display pre-cashout immutability proof');
    assert.ok(content.includes('SECTION 63 BSA 2023'), 'Must reference Section 63 BSA 2023');
  });

  test('T6.OCR.9.4 - Court verifier resolves query by raw hash, compound hash, tx hash, or BSA certificate ID', () => {
    const script = `
      import { verifyHashOnLedger } from "./src/lib/blockchain/evidenceLedger";
      async function main() {
        // Query by raw hash
        const r1 = await verifyHashOnLedger("9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a");
        // Query by Tx hash
        const r2 = await verifyHashOnLedger("0x8f2c3a1e9b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f");
        // Query by Cert ID
        const r3 = await verifyHashOnLedger("BSA-63-2026-RAJ-9182");
        console.log(JSON.stringify({
          rawOk: r1.isAuthentic,
          txOk: r2.isAuthentic,
          certOk: r3.isAuthentic
        }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.rawOk, true, 'Must verify by raw hash');
    assert.equal(out.txOk, true, 'Must verify by Tx hash');
    assert.equal(out.certOk, true, 'Must verify by BSA Cert ID');
  });

  test('T6.OCR.9.5 - Court verifier provides distinct rawFileSha256 and compoundHash in result', () => {
    const script = `
      import { verifyHashOnLedger } from "./src/lib/blockchain/evidenceLedger";
      async function main() {
        const res = await verifyHashOnLedger("EVD-2026-901");
        console.log(JSON.stringify({
          hasRaw: typeof res.rawFileSha256 === 'string' && res.rawFileSha256.length === 64,
          hasCompound: typeof res.compoundHash === 'string' && res.compoundHash.length === 64
        }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.hasRaw, true, 'Result must include 64-char rawFileSha256');
    assert.equal(out.hasCompound, true, 'Result must include 64-char compoundHash');
  });
});

// ---------------------------------------------------------------------------
// SUITE 10: LEGAL COMPLIANCE MATRIX & STRICT WEB THEME INVARIANTS
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 10: Legal Compliance Matrix & Strict Web Theme Invariants', () => {
  test('T6.OCR.10.1 - Section 63(2) BSA 2023: Raw file hash is computed and anchored at capture', () => {
    const script = `
      import { EVIDENCE_DATA } from "./src/data/collabData";
      const item = EVIDENCE_DATA[0];
      console.log(JSON.stringify({
        hasRawSha: typeof item.rawFileSha256 === 'string',
        hasTx: typeof item.blockchainTxHash === 'string',
        hasBlock: typeof item.polygonBlockNumber === 'number'
      }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.hasRawSha, true, 'Must preserve raw SHA-256');
    assert.equal(out.hasTx, true, 'Must preserve blockchain TX hash');
    assert.equal(out.hasBlock, true, 'Must preserve Polygon block height');
  });

  test('T6.OCR.10.2 - Section 63(4) BSA 2023: Certificate binds officer badge, device, and GPS lock', () => {
    const script = `
      import { generateBsa63Certificate, EVIDENCE_DATA } from "./src/lib/blockchain/evidenceLedger";
      const cert = generateBsa63Certificate(EVIDENCE_DATA[0]);
      console.log(JSON.stringify({
        officer: cert.certifyingOfficer.name,
        badge: cert.certifyingOfficer.badgeNumber,
        terminal: cert.certifyingOfficer.terminalId,
        gps: cert.certifyingOfficer.gpsCoordinates
      }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.ok(out.officer.length > 0, 'Must record officer name');
    assert.ok(out.badge.length > 0, 'Must record badge ID');
    assert.ok(out.terminal.length > 0, 'Must record terminal ID');
    assert.ok(out.gps.includes('° N'), 'Must record GPS coordinates');
  });

  test('T6.OCR.10.3 - DPDP Act 2023: No citizen PII on public blockchain (only cryptographic digests & encrypted CIDs)', () => {
    const contract = readProjectFile('contracts/CyberCastEvidenceLedger.sol');
    assert.ok(contract.includes('bytes32 sha256Hash'), 'Only 32-byte cryptographic hashes stored on-chain');
    assert.ok(contract.includes('string ipfsCid'), 'Encrypted off-chain ciphertext pointers');
    assert.ok(!contract.includes('string citizenAadhaar'), 'Zero citizen Aadhaar stored on-chain');
    assert.ok(!contract.includes('string citizenPhone'), 'Zero citizen phone stored on-chain');
  });

  test('T6.OCR.10.4 - Web theme adherence: Obsidian #0c0c0c, Neon #ceff00, and font-mono typography', () => {
    const modalContent = readProjectFile('src/components/collab/EvidenceIngestModal.tsx');
    assert.ok(modalContent.includes('#0c0c0c'), 'Modal must use #0c0c0c obsidian background');
    assert.ok(modalContent.includes('#ceff00'), 'Modal must use #ceff00 neon accent');
    assert.ok(modalContent.includes('font-mono'), 'Modal must use font-mono typography');
  });

  test('T6.OCR.10.5 - Zero AI slop invariant: no rounded-full pills or purple gradient styling in EvidenceIngestModal', () => {
    const modalContent = readProjectFile('src/components/collab/EvidenceIngestModal.tsx');
    assert.ok(!modalContent.includes('bg-gradient-to-r from-purple'), 'EvidenceIngestModal must not contain purple AI gradients');
    assert.ok(!modalContent.includes('rounded-full'), 'EvidenceIngestModal must not contain rounded-full');
  });
});

// ---------------------------------------------------------------------------
// SUITE 11: ADVANCED FORENSIC HARDENING & ADVERSARIAL EDGE-CASE VERIFICATION
// ---------------------------------------------------------------------------
describe('Tier 6 - OCR 11: Advanced Forensic Hardening & Adversarial Edge Cases', () => {
  test('T6.OCR.11.1 - Base64 data URL produces true binary SHA-256 and does not leak base64 into extracted text', () => {
    const script = `
      import { extractOcrWithPaddle } from "./src/lib/ocr/paddleOcrService";
      import crypto from "crypto";
      async function main() {
        const b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const res = await extractOcrWithPaddle(b64, "atm_cctv.png", "CY2026-MH-44521");
        const realBytes = Buffer.from(b64.split("base64,")[1], "base64");
        const realHash = crypto.createHash("sha256").update(realBytes).digest("hex");
        console.log(JSON.stringify({
          hashMatchesBinary: res.raw_sha256 === realHash,
          isNotBase64Text: !res.extracted_text.startsWith("data:"),
          hasMeaningfulText: res.extracted_text.length > 10
        }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.hashMatchesBinary, true, 'raw_sha256 must match binary decoded image bytes');
    assert.equal(out.isNotBase64Text, true, 'extracted_text must not be raw base64 string');
    assert.equal(out.hasMeaningfulText, true, 'must produce valid forensic transcript');
  });

  test('T6.OCR.11.2 - Explicit bank account A/C 9876543210 correctly extracted as bank account and NOT misclassified as phone', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Lien notice: transfer funds to A/C 9876543210 IFSC SBIN0001234 immediately";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify({
        hasAccount: entities.bank_accounts.includes("9876543210"),
        phoneCount: entities.phone_numbers.length
      }));
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.hasAccount, true, 'Must identify 9876543210 as bank account');
    assert.equal(out.phoneCount, 0, 'Must NOT misclassify bank account as phone number');
  });

  test('T6.OCR.11.3 - Lowercase and mixed-case IFSC codes are normalized to uppercase', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Beneficiary IFSC: sbin0001234 and icic0009876";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify(entities.ifsc_codes));
    `;
    const ifscs = JSON.parse(runTsxScript(script));
    assert.ok(ifscs.includes("SBIN0001234"), 'Must extract and uppercase SBIN0001234');
    assert.ok(ifscs.includes("ICIC0009876"), 'Must extract and uppercase ICIC0009876');
  });

  test('T6.OCR.11.4 - Common email TLDs (.in, .gov.in, .org, .net) excluded from UPI handle detection', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Officer email officer@cybercrime.gov.in or contact help@fraudalert.in. Pay to legit@okhdfcbank";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify(entities.upi_ids));
    `;
    const upis = JSON.parse(runTsxScript(script));
    assert.ok(!upis.includes("officer@cybercrime.gov.in"), 'Must exclude .gov.in email');
    assert.ok(!upis.includes("help@fraudalert.in"), 'Must exclude .in email');
    assert.ok(upis.includes("legit@okhdfcbank"), 'Must retain genuine UPI handle');
  });

  test('T6.OCR.11.5 - Phone number boundary protection rejects embedded numeric sequences', () => {
    const script = `
      import { extractCyberEntities } from "./src/lib/ocr/paddleOcrService";
      const text = "Case token ID9876543210 and genuine contact +91 9876543210";
      const entities = extractCyberEntities(text);
      console.log(JSON.stringify(entities.phone_numbers));
    `;
    const phones = JSON.parse(runTsxScript(script));
    assert.ok(!phones.some((p) => p.includes("ID9876543210")), 'Must not match ID-glued digits');
    assert.ok(phones.some((p) => p.includes("9876543210")), 'Must match standalone phone');
  });

  test('T6.OCR.11.6 - Python FastAPI microservice run_ocr_pipeline returns error with 0 confidence on 0-byte input', () => {
    const py = spawnSync('python3', ['-c', 'import sys; sys.path.insert(0, "."); from backend.ocr_service import run_ocr_pipeline; import json; print(json.dumps(run_ocr_pipeline(b"")))'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    });
    assert.equal(py.status, 0, `Python execution failed: ${py.stderr}`);
    const res = JSON.parse(py.stdout.trim());
    assert.equal(res.status, 'error', 'Python 0-byte must return error status');
    assert.equal(res.confidence_score, 0, 'Python 0-byte must have 0 confidence');
    assert.equal(res.extracted_text, '', 'Python 0-byte must not fabricate scam transcript');
  });

  test('T6.OCR.11.7 - Next.js API route /api/ocr/extract rejects whitespace text and whitespace base64 with 400', () => {
    const script = `
      import { POST } from "./src/app/api/ocr/extract/route";
      import { NextRequest } from "next/server";
      async function main() {
        const req1 = new NextRequest("http://localhost:3000/api/ocr/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "   " })
        });
        const res1 = await POST(req1);

        const req2 = new NextRequest("http://localhost:3000/api/ocr/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: "   " })
        });
        const res2 = await POST(req2);

        console.log(JSON.stringify({ s1: res1.status, s2: res2.status }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.s1, 400, 'Whitespace text must return 400');
    assert.equal(out.s2, 400, 'Whitespace base64 must return 400');
  });

  test('T6.OCR.11.8 - Bidirectional alias compatibility between calculateCompoundHash and calculateCompoundEvidenceHash', () => {
    const script = `
      import { calculateCompoundEvidenceHash, calculateCompoundHash } from "./src/lib/ocr/paddleOcrService";
      import { calculateCompoundHash as ledgerComp, calculateCompoundEvidenceHash as ledgerEvd } from "./src/lib/blockchain/evidenceLedger";
      async function main() {
        const h1 = await calculateCompoundEvidenceHash("raw", "ocr", "case");
        const h2 = await calculateCompoundHash("raw", "ocr", "case");
        const h3 = await ledgerComp("raw", "ocr", "case");
        const h4 = await ledgerEvd("raw", "ocr", "case");
        console.log(JSON.stringify({
          equal1: h1 === h2,
          equal2: h2 === h3,
          equal3: h3 === h4
        }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.equal1, true, 'paddleOcrService alias must produce identical hash');
    assert.equal(out.equal2, true, 'ledger calculateCompoundHash must produce identical hash');
    assert.equal(out.equal3, true, 'ledger calculateCompoundEvidenceHash must produce identical hash');
  });

  test('T6.OCR.11.9 - Multi-key registry supports filename lookup and case ID queries', () => {
    const script = `
      import { verifyHashOnLedger } from "./src/lib/blockchain/evidenceLedger";
      async function main() {
        const resFile = await verifyHashOnLedger("whatsapp_fraud_chat_01.png");
        const resCase = await verifyHashOnLedger("CY2026-MH-44521");
        console.log(JSON.stringify({
          fileFound: resFile.isAuthentic,
          caseFound: resCase.isAuthentic
        }));
      }
      main();
    `;
    const out = JSON.parse(runTsxScript(script));
    assert.equal(out.fileFound, true, 'Must verify evidence by fileName');
    assert.equal(out.caseFound, true, 'Must verify evidence by caseId');
  });

  test('T6.OCR.11.10 - EvidenceIngestModal provides reactive activeCompoundHash derivation and readOnly translation guard', () => {
    const modalContent = readProjectFile('src/components/collab/EvidenceIngestModal.tsx');
    assert.ok(modalContent.includes('activeCompoundHash'), 'Must declare and compute activeCompoundHash');
    assert.ok(modalContent.includes('readOnly={showTranslation}'), 'Must protect textarea with readOnly during translation');
    assert.ok(modalContent.includes('DYNAMICALLY SYNCED (SEC 63 BSA)'), 'Must indicate dynamic sync for Section 63 BSA');
  });
});
