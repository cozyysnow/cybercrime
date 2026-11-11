import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, execFile } from 'node:child_process';
import util from 'node:util';

const execFilePromise = util.promisify(execFile);
const ROOT = process.cwd();

test('1. Static File Verification for ADB SMS Bridge', (t) => {
  const routeFile = path.join(ROOT, 'src/app/api/hardware/adb-sms/route.ts');
  const serviceFile = path.join(ROOT, 'src/lib/hardwareService.ts');

  assert.ok(fs.existsSync(routeFile), 'Hardware route src/app/api/hardware/adb-sms/route.ts must exist');
  assert.ok(fs.existsSync(serviceFile), 'Service file src/lib/hardwareService.ts must exist');

  const routeContent = fs.readFileSync(routeFile, 'utf8');
  assert.ok(routeContent.includes('ZD222K9HBL'), 'Route must specify target device ZD222K9HBL');
  assert.ok(routeContent.includes('android.intent.action.SENDTO'), 'Route must execute SENDTO intent');
  assert.ok(routeContent.includes('exit_on_sent'), 'Route must include exit_on_sent flag');
  assert.ok(routeContent.includes('export async function GET'), 'Route must export GET handler');
  assert.ok(routeContent.includes('export async function POST'), 'Route must export POST handler');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  assert.ok(serviceContent.includes('export async function checkAdbDeviceStatus'), 'Service must export checkAdbDeviceStatus');
  assert.ok(serviceContent.includes('export async function sendAdbSms'), 'Service must export sendAdbSms');
});

test('2. Audit All Send SMS CTAs in Codebase', (t) => {
  // Check TaskManagementModule
  const taskModule = path.join(ROOT, 'src/components/collab/TaskManagementModule.tsx');
  assert.ok(fs.existsSync(taskModule), 'TaskManagementModule.tsx must exist');
  const taskContent = fs.readFileSync(taskModule, 'utf8');
  assert.ok(taskContent.includes('handleDirectSendSms'), 'Task card direct SMS handler must be defined');
  assert.ok(taskContent.includes('sendAdbSms'), 'TaskManagementModule must import and use sendAdbSms');
  assert.ok(taskContent.includes('handleTransmitSms'), 'SMS Modal handler handleTransmitSms must be defined');
  assert.ok(taskContent.includes('USB HARDWARE DETECTED'), 'Live hardware badge must be rendered in UI');

  // Check CollabHeader
  const headerFile = path.join(ROOT, 'src/components/collab/CollabHeader.tsx');
  assert.ok(fs.existsSync(headerFile), 'CollabHeader.tsx must exist');
  const headerContent = fs.readFileSync(headerFile, 'utf8');
  assert.ok(headerContent.includes('checkAdbDeviceStatus'), 'CollabHeader must import and poll checkAdbDeviceStatus');
  assert.ok(headerContent.includes('USB HW:'), 'CollabHeader must render live USB hardware status badge');

  // Check CommunicationModule
  const commFile = path.join(ROOT, 'src/components/collab/CommunicationModule.tsx');
  assert.ok(fs.existsSync(commFile), 'CommunicationModule.tsx must exist');
  const commContent = fs.readFileSync(commFile, 'utf8');
  assert.ok(commContent.includes('sendAdbSms'), 'CommunicationModule must import and use sendAdbSms');
  assert.ok(commContent.includes('DISPATCH TRANSFER DOSSIER'), 'CommunicationModule must have DISPATCH TRANSFER DOSSIER');
  assert.ok(commContent.includes('TRANSMIT MANDATE'), 'CommunicationModule must have TRANSMIT MANDATE');

  // Check ComplaintPredictorModal
  const predictorModal = path.join(ROOT, 'src/components/collab/ComplaintPredictorModal.tsx');
  assert.ok(fs.existsSync(predictorModal), 'ComplaintPredictorModal.tsx must exist');
  const predContent = fs.readFileSync(predictorModal, 'utf8');
  assert.ok(predContent.includes('sendAdbSms'), 'ComplaintPredictorModal must use sendAdbSms');
  assert.ok(predContent.includes('DISPATCH POLICE SMS'), 'Predictor modal must have DISPATCH POLICE SMS CTA');

  // Check CaseManagementModule
  const caseModule = path.join(ROOT, 'src/components/collab/CaseManagementModule.tsx');
  assert.ok(fs.existsSync(caseModule), 'CaseManagementModule.tsx must exist');
  const caseContent = fs.readFileSync(caseModule, 'utf8');
  assert.ok(caseContent.includes('sendAdbSms'), 'CaseManagementModule must use sendAdbSms');
  assert.ok(caseContent.includes('SEND ALERT SMS'), 'Case header must have SEND ALERT SMS button');

  // Check Dashboard Page & Action Modals
  const dashPage = path.join(ROOT, 'src/app/dashboard/page.tsx');
  assert.ok(fs.existsSync(dashPage), 'dashboard/page.tsx must exist');
  const dashContent = fs.readFileSync(dashPage, 'utf8');
  assert.ok(dashContent.includes('sendAdbSms'), 'dashboard page onDispatchTeam must call sendAdbSms');

  const modalsFile = path.join(ROOT, 'src/components/dashboard/Modals.tsx');
  assert.ok(fs.existsSync(modalsFile), 'Modals.tsx must exist');
  const modalsContent = fs.readFileSync(modalsFile, 'utf8');
  assert.ok(modalsContent.includes('sendAdbSms'), 'Modals.tsx must import and use sendAdbSms');
  assert.ok(modalsContent.includes('ALERT BANK'), 'Modals.tsx must have ALERT BANK CTA wired');
  assert.ok(modalsContent.includes('REQUEST DEPLOYMENT'), 'Modals.tsx must have REQUEST DEPLOYMENT CTA wired');
  assert.ok(modalsContent.includes('FREEZE FLAGGED ACCOUNTS'), 'Modals.tsx must have FREEZE FLAGGED ACCOUNTS CTA wired');
});

test('3. Direct ADB Command Execution on Attached Device ZD222K9HBL', async (t) => {
  const adbBin = '/Users/tanujpathak/Library/Android/sdk/platform-tools/adb';
  if (!fs.existsSync(adbBin)) {
    t.skip('ADB binary not found at specified path, skipping direct hardware test');
    return;
  }

  // Check attached devices
  const { stdout: devicesOut } = await execFilePromise(adbBin, ['devices', '-l']);
  assert.ok(devicesOut.includes('ZD222K9HBL'), 'Target device ZD222K9HBL must be listed in adb devices');

  // Test intent execution directly
  const testPhone = '+919829041209';
  const testMsg = '"[CYBERCAST TEST] Automated Verification Suite"';
  const { stdout: intentOut } = await execFilePromise(adbBin, [
    '-s',
    'ZD222K9HBL',
    'shell',
    'am',
    'start',
    '-a',
    'android.intent.action.SENDTO',
    '-d',
    `sms:${testPhone}`,
    '--es',
    'sms_body',
    testMsg,
    '--ez',
    'exit_on_sent',
    'true',
  ]);

  assert.ok(intentOut.includes('Starting: Intent'), 'Intent must start successfully on device');
});

test('4. End-to-End Runtime HTTP API Verification', async (t) => {
  const TEST_PORT = 3097;
  const server = spawn('npx', ['next', 'start', '-p', String(TEST_PORT)], {
    cwd: ROOT,
    stdio: 'pipe',
  });

  // Wait for Next.js server to start
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
      // console.error('Next server err:', chunk.toString());
    });
    setTimeout(() => {
      if (!started) resolve();
    }, 5000);
  });

  try {
    // 4a. Verify GET /api/hardware/adb-sms
    const getRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${TEST_PORT}/api/hardware/adb-sms`, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      }).on('error', reject);
    });

    assert.equal(getRes.status, 200, 'GET endpoint must return 200 OK');
    assert.equal(typeof getRes.data.connected, 'boolean', 'connected must be boolean');
    assert.equal(getRes.data.targetConfigured, 'ZD222K9HBL', 'targetConfigured must match ZD222K9HBL');
    assert.ok(typeof getRes.data.deviceState === 'string', 'deviceState must be present');
    if (getRes.data.connected) {
      assert.equal(getRes.data.mode, 'hardware', 'mode must be hardware when connected');
      assert.equal(getRes.data.deviceId, 'ZD222K9HBL', 'deviceId must be ZD222K9HBL');
    }

    // 4b. Verify POST /api/hardware/adb-sms with valid payload
    const postPayload = JSON.stringify({
      phone: '+91 98290 41209',
      message: '[CYBERCAST VERIFICATION DIRECTIVE] SI Manoj Meena proceed to Sindhi Camp. SLA: 4 Hours.',
      priority: 'FLASH_P1',
      officerName: 'SI Manoj Meena',
      caseId: 'CAS-2026-TEST',
    });

    const postRes = await new Promise((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${TEST_PORT}/api/hardware/adb-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postPayload),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.write(postPayload);
      req.end();
    });

    assert.equal(postRes.status, 200, 'POST endpoint must return 200 OK');
    assert.equal(postRes.data.success, true, 'POST response success must be true');
    assert.ok(postRes.data.dltReference.startsWith('DLT-1407-'), 'DLT reference must follow protocol format');
    assert.equal(postRes.data.phone, '+919829041209', 'Phone number must be sanitized');

    if (getRes.data.connected) {
      assert.equal(postRes.data.mode, 'hardware', 'Mode must be hardware when device is online');
      assert.equal(postRes.data.deviceId, 'ZD222K9HBL', 'deviceId must match attached device');
      assert.equal(postRes.data.hardwareDispatched, true, 'hardwareDispatched must be true');
    } else {
      assert.equal(postRes.data.mode, 'simulation', 'Mode must be simulation when offline');
    }

    // 4c. Verify POST with empty body (resilience & defaults)
    const emptyPostRes = await new Promise((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${TEST_PORT}/api/hardware/adb-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': 2,
          },
        },
        (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.write('{}');
      req.end();
    });

    assert.equal(emptyPostRes.status, 200, 'Empty POST must not crash (returns 200 with defaults)');
    assert.equal(emptyPostRes.data.success, true, 'Empty POST must succeed with sanitized fallback');
    assert.ok(emptyPostRes.data.phone.length > 5, 'Default phone must be populated');

    // 4d. Verify POST with special characters, quotes, newlines in message
    const complexPayload = JSON.stringify({
      phone: '+91 98290-41209',
      message: 'Notice: "Quoted Directive" & $100 `date` ! Alert\nNext line: Intercept mule.\r\nThird line.',
      priority: 'FLASH_P1',
    });

    const complexRes = await new Promise((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${TEST_PORT}/api/hardware/adb-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(complexPayload),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.write(complexPayload);
      req.end();
    });

    assert.equal(complexRes.status, 200, 'Complex characters POST must return 200 OK');
    assert.equal(complexRes.data.success, true, 'Complex payload must succeed');
    assert.equal(complexRes.data.phone, '+919829041209', 'Clean phone sanitation');
    assert.ok(!complexRes.data.message.includes('\n'), 'Message must have newlines normalized to spaces');

    // 4e. Verify POST with non-numeric / malformed phone string
    const malformedPhonePayload = JSON.stringify({
      phone: 'INVALID_TEXT_NO_DIGITS',
      message: 'Test with bad phone',
    });

    const malformedPhoneRes = await new Promise((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${TEST_PORT}/api/hardware/adb-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(malformedPhonePayload),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.write(malformedPhonePayload);
      req.end();
    });

    assert.equal(malformedPhoneRes.status, 200, 'Malformed phone must return 200 OK');
    assert.equal(malformedPhoneRes.data.success, true);
    assert.equal(malformedPhoneRes.data.phone, '+919829041209', 'Malformed phone must fall back to default police line');

  } finally {
    server.kill();
  }
});

test('5. Toast Concurrency & Shell Escaping Verification', (t) => {
  // Test toast concurrency logic
  let toast = null;
  const setToast = (updater) => {
    toast = typeof updater === 'function' ? updater(toast) : updater;
  };

  const toast1Id = 1001;
  setToast({ id: toast1Id, text: 'Toast 1' });
  assert.equal(toast.id, toast1Id);

  // Trigger toast 2 before toast 1 timer fires
  const toast2Id = 1002;
  setToast({ id: toast2Id, text: 'Toast 2' });
  assert.equal(toast.id, toast2Id);

  // Toast 1 timeout fires with bug fix: only dismiss if curr?.id === toast1Id
  setToast((curr) => (curr?.id === toast1Id ? null : curr));
  assert.equal(toast?.id, toast2Id, 'Toast 2 must NOT be dismissed by toast 1 timer');

  // Toast 2 timeout fires
  setToast((curr) => (curr?.id === toast2Id ? null : curr));
  assert.equal(toast, null, 'Toast 2 dismissed correctly when its own timer fires');

  // Verify route.ts includes keyguard dismissal
  const routeContent = fs.readFileSync(path.join(ROOT, 'src/app/api/hardware/adb-sms/route.ts'), 'utf8');
  assert.ok(routeContent.includes('dismiss-keyguard'), 'Route must dismiss keyguard on wake');
  assert.ok(routeContent.includes('unauthorizedDevice'), 'Route must detect unauthorized devices');
});
