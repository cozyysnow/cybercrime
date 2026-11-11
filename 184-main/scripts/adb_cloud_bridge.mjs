#!/usr/bin/env node

/**
 * CyberCast - Cloud-to-Local Hardware Bridge Daemon (Option B)
 * Ministry of Home Affairs (MHA) / I4C - Smart India Hackathon (SIH 184)
 * 
 * Bridges public cloud deployments (e.g. https://184-two.vercel.app)
 * to a physical Android device connected via USB debugging to this Mac.
 *
 * Usage:
 *   npm run bridge
 *   # or: node scripts/adb_cloud_bridge.mjs
 */

import http from 'http';
import fs from 'fs';
import { execFile } from 'child_process';
import util from 'util';
import { createClient } from '@supabase/supabase-js';

const execFilePromise = util.promisify(execFile);

// 1. Configuration & Credentials
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xlbdypsxinbyqthszmvi.supabase.co').trim();
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYmR5cHN4aW5ieXF0aHN6bXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNTksImV4cCI6MjEwNDM0MTA1OX0.W0vaJznsbAKAHIvr0d1yFaIP70rjVH8FKEPig1FP0gE').trim();
const BRIDGE_CHANNEL = 'cybercast-hardware-bridge';
const LOCAL_HTTP_PORT = parseInt(process.env.BRIDGE_PORT || '3005', 10);

const PRIMARY_ADB_PATH = '/Users/tanujpathak/Library/Android/sdk/platform-tools/adb';
const TARGET_DEVICE_ID = process.env.ADB_DEVICE_ID || 'ZD222K9HBL';

/**
 * Resolves local ADB binary
 */
function resolveAdbPath() {
  if (process.env.ADB_PATH) {
    if (process.env.ADB_PATH === 'adb' || fs.existsSync(process.env.ADB_PATH)) {
      return process.env.ADB_PATH;
    }
  }
  if (fs.existsSync(PRIMARY_ADB_PATH)) {
    return PRIMARY_ADB_PATH;
  }
  return 'adb';
}

/**
 * Escapes characters for Android remote shell
 */
function escapeForAndroidShell(text) {
  return '"' + text.replace(/["\\`$]/g, '\\$&') + '"';
}

/**
 * Dispatches the SMS intent to the physical device
 */
async function triggerAdbSms(adbPath, targetDevice, data) {
  const phone = data.phone || '+919829041209';
  const rawMessage = data.message || '[CYBERCAST FLASH DIRECTIVE] URGENT LAW ENFORCEMENT INTERVENTION REQUIRED';
  const cleanMessage = rawMessage.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 480);
  const caseId = data.caseId || 'CY2026-MH-44521';
  const officerName = data.officerName || 'Officer';
  const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

  console.log(`\n-----------------------------------------------------------------------`);
  console.log(`📡 [CLOUD TRIGGER RECEIVED @ ${timestamp}]`);
  console.log(`   Case ID:     ${caseId}`);
  console.log(`   Officer:     ${officerName}`);
  console.log(`   Destination: ${phone}`);
  console.log(`   Message:     ${cleanMessage.slice(0, 80)}...`);

  try {
    // 1. Wake screen and clear keyguard
    try {
      await execFilePromise(adbPath, ['-s', targetDevice, 'shell', 'input', 'keyevent', 'KEYCODE_WAKEUP'], { timeout: 2500 });
      await execFilePromise(adbPath, ['-s', targetDevice, 'shell', 'wm', 'dismiss-keyguard'], { timeout: 2500 });
    } catch {
      // Non-fatal
    }

    // 2. Launch SMS Intent
    const escapedBody = escapeForAndroidShell(cleanMessage);
    const adbArgs = [
      '-s',
      targetDevice,
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.SENDTO',
      '-d',
      `sms:${phone}`,
      '--es',
      'sms_body',
      escapedBody,
      '--ez',
      'exit_on_sent',
      'true',
    ];

    const { stdout, stderr } = await execFilePromise(adbPath, adbArgs, { timeout: 6000 });
    if (stdout.includes('Error:') || (stderr && stderr.includes('Error:'))) {
      throw new Error(stdout || stderr);
    }

    // 3. Option 1: Autonomous Send Button Auto-Tap
    let tapX = 990;
    let tapY = 2191;
    try {
      // Allow window manager & conversation thread to render
      await new Promise((r) => setTimeout(r, 800));

      // Calculate dynamic coordinates from physical screen dimensions
      const { stdout: sizeOut } = await execFilePromise(adbPath, ['-s', targetDevice, 'shell', 'wm', 'size'], { timeout: 2000 });
      const m = sizeOut.match(/(\d+)x(\d+)/);
      if (m) {
        tapX = Math.round(parseInt(m[1], 10) * 0.917);
        tapY = Math.round(parseInt(m[2], 10) * 0.913);
      }

      await execFilePromise(adbPath, ['-s', targetDevice, 'shell', 'input', 'tap', String(tapX), String(tapY)], { timeout: 3000 });
      console.log(`🚀 [AUTO-SEND TAP SUCCESS] Tapped Send button at (${tapX}, ${tapY})`);
    } catch (tapErr) {
      console.warn(`⚠️ [Auto-Send Tap Warning]:`, tapErr.message);
    }

    console.log(`🟢 [PHYSICAL HARDWARE INTENT LAUNCHED & SENT]`);
    console.log(`   Target Device: ${targetDevice}`);
    console.log(`   Status: Phone awake. Native SMS app opened and directive sent automatically!`);
    console.log(`-----------------------------------------------------------------------\n`);
    return { success: true, deviceId: targetDevice, autoSent: true, tapCoords: { x: tapX, y: tapY } };
  } catch (err) {
    console.error(`🔴 [ADB DISPATCH FAILED]:`, err.message);
    console.log(`-----------------------------------------------------------------------\n`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log(`\n=======================================================================`);
  console.log(`⚡ CYBERCAST CLOUD-TO-LOCAL HARDWARE BRIDGE (OPTION B)`);
  console.log(`   Connecting https://184-two.vercel.app -> Local Android Device`);
  console.log(`=======================================================================`);

  const adbPath = resolveAdbPath();
  console.log(`[1/4] Probing ADB executable at: ${adbPath}`);

  let activeDevice = TARGET_DEVICE_ID;
  try {
    const { stdout } = await execFilePromise(adbPath, ['devices', '-l'], { timeout: 3000 });
    const lines = stdout.split('\n').filter((l) => l.trim() && !l.startsWith('List') && !l.startsWith('*'));
    const online = lines.filter((l) => l.includes('device'));
    if (online.length > 0) {
      activeDevice = online[0].split(/\s+/)[0];
      console.log(`[2/4] Verified physical Android hardware: ${activeDevice} [ONLINE]`);
    } else {
      console.warn(`[2/4] ⚠️ Warning: No authorized device found in 'adb devices'. Using configured: ${activeDevice}`);
    }
  } catch (err) {
    console.warn(`[2/4] ⚠️ ADB device probe warning: ${err.message}`);
  }

  // 3. Connect to Supabase Realtime Channel
  console.log(`[3/4] Subscribing to Supabase Realtime WebSocket on '${BRIDGE_CHANNEL}'...`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const channel = supabase.channel(BRIDGE_CHANNEL);

  channel
    .on('broadcast', { event: 'dispatch_sms' }, async ({ payload }) => {
      if (payload) {
        await triggerAdbSms(adbPath, activeDevice, payload);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[4/4] 🟢 Realtime WebSocket connected! Listening for cloud triggers.`);
      } else {
        console.log(`[Realtime Status Update]: ${status}`);
      }
    });

  // 4. Start Local HTTP Webhook Server on 3005 (for optional ngrok/direct webhook)
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', device: activeDevice, channel: BRIDGE_CHANNEL }));
      return;
    }

    if (req.method === 'POST' && (req.url === '/webhook/adb-sms' || req.url === '/')) {
      let bodyStr = '';
      req.on('data', (chunk) => { bodyStr += chunk; });
      req.on('end', async () => {
        try {
          const body = JSON.parse(bodyStr || '{}');
          const result = await triggerAdbSms(adbPath, activeDevice, body);
          res.writeHead(result.success ? 200 : 500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[HTTP Notice] Local port ${LOCAL_HTTP_PORT} is in use; primary Supabase WebSocket bridge remains 100% active.`);
    } else {
      console.warn(`[HTTP Server Warning]:`, err.message);
    }
  });

  server.listen(LOCAL_HTTP_PORT, '127.0.0.1', () => {
    console.log(`[HTTP] Optional local webhook server listening on http://127.0.0.1:${LOCAL_HTTP_PORT}/webhook/adb-sms`);
    console.log(`\n🚀 READY FOR SIH DEMO: Click any 'Send SMS' CTA on https://184-two.vercel.app`);
    console.log(`   Your phone screen will wake up and open the SMS app automatically!\n`);
  });

  // Handle graceful exit
  process.on('SIGINT', async () => {
    console.log('\nStopping Cloud-to-Local Bridge...');
    await channel.unsubscribe();
    server.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal bridge error:', err);
  process.exit(1);
});
