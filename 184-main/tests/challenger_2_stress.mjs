import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import vm from 'node:vm';

const ROOT = '/Users/tanujpathak/teamwork_projects/cybercast_landing';
const TEST_PORT = 3184; // PS 184 dedicated port

function decodeHtmlEntities(str) {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// =========================================================================
// 1. GLB Binary Container Integrity & Draco Chunk Stress Testing
// =========================================================================
test('1. GLB Container Integrity (earth.glb)', async (t) => {
  const glbPath = path.join(ROOT, 'public/3d/earth.glb');
  assert.ok(fs.existsSync(glbPath), 'earth.glb must exist on disk');

  const buf = fs.readFileSync(glbPath);
  const totalSize = buf.length;
  assert.equal(totalSize, 1577860, `earth.glb size must be exactly 1577860 bytes, got ${totalSize}`);

  // Validator function for testing both valid file and synthetic corrupted mutations
  function validateGLB(buffer) {
    if (buffer.length < 12) return { valid: false, error: 'Buffer too small for GLB header' };
    const magic = buffer.toString('ascii', 0, 4);
    if (magic !== 'glTF') return { valid: false, error: `Invalid magic: ${magic}` };
    const version = buffer.readUInt32LE(4);
    if (version !== 2) return { valid: false, error: `Unsupported glTF version: ${version}` };
    const declaredLength = buffer.readUInt32LE(8);
    if (declaredLength !== buffer.length) {
      return { valid: false, error: `Declared length ${declaredLength} !== buffer length ${buffer.length}` };
    }

    // Chunk 0 - JSON
    if (buffer.length < 20) return { valid: false, error: 'Buffer too small for Chunk 0 header' };
    const chunk0Length = buffer.readUInt32LE(12);
    const chunk0Type = buffer.toString('ascii', 16, 20);
    if (chunk0Type !== 'JSON') return { valid: false, error: `Chunk 0 type must be JSON, got ${chunk0Type}` };
    if (chunk0Length % 4 !== 0) return { valid: false, error: 'Chunk 0 length must be 4-byte aligned' };

    const jsonStart = 20;
    const jsonEnd = jsonStart + chunk0Length;
    if (jsonEnd > buffer.length) return { valid: false, error: 'Chunk 0 exceeds buffer bounds' };

    let gltf;
    try {
      const jsonText = buffer.toString('utf8', jsonStart, jsonEnd);
      gltf = JSON.parse(jsonText);
    } catch (e) {
      return { valid: false, error: `Failed to parse JSON chunk: ${e.message}` };
    }

    // Chunk 1 - BIN
    const chunk1HeaderOffset = jsonEnd;
    if (chunk1HeaderOffset + 8 > buffer.length) return { valid: false, error: 'Missing Chunk 1 header' };
    const chunk1Length = buffer.readUInt32LE(chunk1HeaderOffset);
    const chunk1Type = buffer.toString('ascii', chunk1HeaderOffset + 4, chunk1HeaderOffset + 8);
    if (chunk1Type !== 'BIN\0' && chunk1Type !== 'BIN ') {
      return { valid: false, error: `Chunk 1 type must be BIN, got ${chunk1Type}` };
    }
    if (chunk1HeaderOffset + 8 + chunk1Length !== buffer.length) {
      return {
        valid: false,
        error: `Chunk 1 bounds mismatch: header+data=${chunk1HeaderOffset + 8 + chunk1Length} vs file=${buffer.length}`
      };
    }

    return { valid: true, gltf, chunk0Length, chunk1Length };
  }

  // A. Empirical assertion on real production earth.glb
  const result = validateGLB(buf);
  assert.ok(result.valid, `GLB validation failed: ${result.error}`);
  assert.equal(result.chunk0Length, 3824, 'Chunk 0 JSON length matches 3824');
  assert.equal(result.chunk1Length, 1574008, 'Chunk 1 BIN length matches 1574008');

  // Verify glTF metadata
  const gltf = result.gltf;
  assert.equal(gltf.asset.version, '2.0', 'glTF asset version must be 2.0');
  assert.ok(gltf.extensionsUsed.includes('KHR_draco_mesh_compression'), 'KHR_draco_mesh_compression must be in extensionsUsed');
  assert.ok(gltf.extensionsUsed.includes('EXT_texture_webp'), 'EXT_texture_webp must be in extensionsUsed');
  assert.ok(gltf.extensionsUsed.includes('EXT_mesh_gpu_instancing'), 'EXT_mesh_gpu_instancing must be in extensionsUsed');
  assert.ok(gltf.extensionsRequired.includes('KHR_draco_mesh_compression'), 'KHR_draco_mesh_compression must be in extensionsRequired');

  const nodeNames = gltf.nodes.map(n => n.name);
  assert.ok(nodeNames.includes('Earth'), 'Earth node must exist in GLB');
  assert.ok(nodeNames.includes('Graticules'), 'Graticules node must exist in GLB');
  assert.ok(nodeNames.includes('SkyDots'), 'SkyDots node must exist in GLB');
  assert.ok(nodeNames.includes('DotReference'), 'DotReference node must exist in GLB');

  // B. Adversarial Mutation Tests: prove validator catches corrupted models
  const corruptMagic = Buffer.from(buf);
  corruptMagic.write('BAD!', 0);
  assert.equal(validateGLB(corruptMagic).valid, false, 'Validator must reject corrupted magic bytes');

  const corruptVersion = Buffer.from(buf);
  corruptVersion.writeUInt32LE(1, 4);
  assert.equal(validateGLB(corruptVersion).valid, false, 'Validator must reject invalid version 1');

  const corruptLength = Buffer.from(buf);
  corruptLength.writeUInt32LE(99999, 8);
  assert.equal(validateGLB(corruptLength).valid, false, 'Validator must reject mismatched total length');

  const truncatedBuf = buf.subarray(0, 1000);
  assert.equal(validateGLB(truncatedBuf).valid, false, 'Validator must reject truncated buffer');
});

// =========================================================================
// 2. Draco WASM Decoder & JS Wrapper Integrity
// =========================================================================
test('2. Draco WASM Decoder & Wrapper Integrity', async (t) => {
  const wasmPath = path.join(ROOT, 'public/3d/draco/draco_decoder.wasm');
  const jsPath = path.join(ROOT, 'public/3d/draco/draco_wasm_wrapper.js');

  assert.ok(fs.existsSync(wasmPath), 'draco_decoder.wasm must exist');
  assert.ok(fs.existsSync(jsPath), 'draco_wasm_wrapper.js must exist');

  const wasmBuf = fs.readFileSync(wasmPath);
  assert.equal(wasmBuf.length, 283091, `WASM size must be 283091 bytes, got ${wasmBuf.length}`);

  // WASM Header: Magic 0x00 0x61 0x73 0x6d (\0asm), Version 0x01 0x00 0x00 0x00
  const magic = wasmBuf.subarray(0, 4);
  assert.deepEqual(Array.from(magic), [0x00, 0x61, 0x73, 0x6d], 'WASM magic bytes must be \\0asm');
  const wasmVer = wasmBuf.readUInt32LE(4);
  assert.equal(wasmVer, 1, 'WASM version must be 1');

  // Empirical compilation test using V8 WebAssembly engine
  const isValidWasm = WebAssembly.validate(wasmBuf);
  assert.ok(isValidWasm, 'WebAssembly.validate must return true for draco_decoder.wasm');

  const wasmModule = await WebAssembly.compile(wasmBuf);
  const exports = WebAssembly.Module.exports(wasmModule);
  assert.ok(exports.length > 0, `Compiled WASM module must export functions, found ${exports.length}`);

  // Adversarial Mutation: ensure invalid WASM fails compilation
  const corruptWasm = Buffer.from(wasmBuf);
  corruptWasm[10] ^= 0xff; // flip random byte in bytecode section
  assert.equal(WebAssembly.validate(corruptWasm), false, 'Corrupted WASM must fail validation');

  // Verify Draco JS wrapper syntax
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  assert.equal(jsContent.length, 84810, `Draco JS size must be 84810 bytes, got ${jsContent.length}`);

  assert.doesNotThrow(() => {
    new vm.Script(jsContent);
  }, 'draco_wasm_wrapper.js must be syntactically valid JavaScript');

  assert.ok(jsContent.includes('DracoDecoderModule'), 'Wrapper must define DracoDecoderModule');
});

// =========================================================================
// 3. 3D Fallback Image WebP Binary Integrity
// =========================================================================
test('3. 3D Fallback Image WebP Container Integrity', (t) => {
  const imgPath = path.join(ROOT, 'public/images/3d-fallback.webp');
  assert.ok(fs.existsSync(imgPath), '3d-fallback.webp must exist');

  const buf = fs.readFileSync(imgPath);
  assert.equal(buf.length, 30222, `WebP image size must be 30222 bytes, got ${buf.length}`);

  function validateWebP(buffer) {
    if (buffer.length < 12) return { valid: false, error: 'Buffer too small' };
    const riff = buffer.toString('ascii', 0, 4);
    if (riff !== 'RIFF') return { valid: false, error: 'Missing RIFF header' };
    const fileSizeMinus8 = buffer.readUInt32LE(4);
    if (fileSizeMinus8 !== buffer.length - 8) {
      return { valid: false, error: `Declared size ${fileSizeMinus8} !== actual ${buffer.length - 8}` };
    }
    const webp = buffer.toString('ascii', 8, 12);
    if (webp !== 'WEBP') return { valid: false, error: 'Missing WEBP header' };

    const chunkType = buffer.toString('ascii', 12, 16);
    const chunkLen = buffer.readUInt32LE(16);

    let width = 0;
    let height = 0;

    if (chunkType === 'VP8 ') {
      // Keyframe check (bit 0 of byte 20 == 0)
      const b0 = buffer.readUInt8(20);
      const isKey = (b0 & 0x01) === 0;
      if (!isKey) return { valid: false, error: 'Not a VP8 keyframe' };

      // Start code: 0x9d 0x01 0x2a
      const startCode = buffer.subarray(23, 26).toString('hex');
      if (startCode !== '9d012a') return { valid: false, error: `Invalid VP8 start code: ${startCode}` };

      width = buffer.readUInt16LE(26) & 0x3fff;
      height = buffer.readUInt16LE(28) & 0x3fff;
    } else {
      return { valid: false, error: `Unsupported chunk type: ${chunkType}` };
    }

    return { valid: true, width, height, chunkType, chunkLen };
  }

  const res = validateWebP(buf);
  assert.ok(res.valid, `WebP validation error: ${res.error}`);
  assert.equal(res.chunkType, 'VP8 ');
  assert.equal(res.width, 566, `Width must be 566px, got ${res.width}`);
  assert.equal(res.height, 567, `Height must be 567px, got ${res.height}`);

  // Adversarial Mutation: corrupt RIFF header
  const corruptRiff = Buffer.from(buf);
  corruptRiff.write('NOPE', 0);
  assert.equal(validateWebP(corruptRiff).valid, false, 'Validator must reject invalid RIFF');
});

// =========================================================================
// 4. Next.js Static Production Build Artifacts Verification
// =========================================================================
test('4. Next.js Production Build Artifacts Integrity', (t) => {
  const dotNext = path.join(ROOT, '.next');
  assert.ok(fs.existsSync(dotNext), '.next directory must exist');

  const buildIdFile = path.join(dotNext, 'BUILD_ID');
  assert.ok(fs.existsSync(buildIdFile), 'BUILD_ID must exist');
  const buildId = fs.readFileSync(buildIdFile, 'utf8').trim();
  assert.ok(buildId.length > 0, `BUILD_ID must not be empty (got: ${buildId})`);

  // Prerender manifest
  const prerenderFile = path.join(dotNext, 'prerender-manifest.json');
  assert.ok(fs.existsSync(prerenderFile), 'prerender-manifest.json must exist');
  const prerender = JSON.parse(fs.readFileSync(prerenderFile, 'utf8'));
  assert.ok('/' in prerender.routes, 'Route "/" must be prerendered in prerender-manifest.json');

  // Build manifest
  const buildManifestFile = path.join(dotNext, 'build-manifest.json');
  assert.ok(fs.existsSync(buildManifestFile), 'build-manifest.json must exist');

  // App Build Manifest & Chunks existence
  const appBuildManifestFile = path.join(dotNext, 'app-build-manifest.json');
  assert.ok(fs.existsSync(appBuildManifestFile), 'app-build-manifest.json must exist');
  const appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestFile, 'utf8'));

  const verifiedChunks = new Set();
  for (const [pageKey, chunks] of Object.entries(appBuildManifest.pages)) {
    for (const chunk of chunks) {
      if (verifiedChunks.has(chunk)) continue;
      const fullChunkPath = path.join(dotNext, chunk);
      assert.ok(fs.existsSync(fullChunkPath), `Client chunk must exist: ${chunk}`);
      const st = fs.statSync(fullChunkPath);
      assert.ok(st.size > 0, `Client chunk ${chunk} must have non-zero size`);
      verifiedChunks.add(chunk);
    }
  }
  assert.ok(verifiedChunks.size > 0, `Verified ${verifiedChunks.size} client chunks on disk`);

  // Prerendered HTML outputs
  const indexHtmlFile = path.join(dotNext, 'server/app/index.html');
  assert.ok(fs.existsSync(indexHtmlFile), 'Prerendered index.html must exist in server/app/');
  const indexHtml = fs.readFileSync(indexHtmlFile, 'utf8');
  assert.ok(indexHtml.length > 50000, `Prerendered index.html must be substantial (>50KB, got ${indexHtml.length} bytes)`);

  const notFoundHtmlFile = path.join(dotNext, 'server/app/_not-found.html');
  assert.ok(fs.existsSync(notFoundHtmlFile), 'Prerendered _not-found.html must exist');
});

// =========================================================================
// 5. Runtime Server Response & HTML Rendering Stress Test
// =========================================================================
test('5. Runtime Production Server HTTP Rendering & Static Serving', async (t) => {
  // Spawn Next.js production server on dedicated test port
  const server = spawn('npx', ['next', 'start', '-p', String(TEST_PORT)], {
    cwd: ROOT,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(TEST_PORT) }
  });

  let serverStarted = false;
  let serverOutput = '';

  server.stdout.on('data', (d) => {
    const s = d.toString();
    serverOutput += s;
    if (s.includes('Ready') || s.includes(String(TEST_PORT))) {
      serverStarted = true;
    }
  });

  server.stderr.on('data', (d) => {
    serverOutput += d.toString();
  });

  // Wait for server to become ready
  const maxWait = 10000;
  const startWait = Date.now();
  while (!serverStarted && Date.now() - startWait < maxWait) {
    await new Promise((r) => setTimeout(r, 200));
  }

  try {
    // Helper function for HTTP requests
    function fetchHttp(pathname) {
      return new Promise((resolve, reject) => {
        const req = http.get({
          hostname: '127.0.0.1',
          port: TEST_PORT,
          path: pathname,
          timeout: 5000
        }, (res) => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            const bodyBuf = Buffer.concat(chunks);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              bodyBuffer: bodyBuf,
              bodyText: bodyBuf.toString('utf8')
            });
          });
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Request timeout')));
      });
    }

    // A. Main Landing Page Route (/)
    const mainPage = await fetchHttp('/');
    assert.equal(mainPage.statusCode, 200, `Landing page status must be 200, got ${mainPage.statusCode}`);
    assert.ok(mainPage.headers['content-type']?.includes('text/html'), 'Content-Type must be text/html');
    assert.ok(!mainPage.bodyText.includes('Internal Server Error'), 'No 500 errors in response');
    assert.ok(!mainPage.bodyText.includes('Application error: a client-side exception has occurred'), 'No client exception overlay');

    // Title Verification
    const titleMatch = mainPage.bodyText.match(/<title>(.*?)<\/title>/);
    assert.ok(titleMatch, '<title> tag must be present');
    assert.ok(titleMatch[1].includes('CyberCast'), `Title must include "CyberCast", got: "${titleMatch[1]}"`);

    // CyberCast Logo Image Tag Verification
    assert.ok(
      mainPage.bodyText.includes('src="/CyberCast.png"') || mainPage.bodyText.includes('CyberCast.png'),
      'HTML must contain CyberCast.png logo source'
    );
    assert.ok(
      mainPage.bodyText.includes('alt="CyberCast Logo"') || mainPage.bodyText.includes('CyberCast'),
      'HTML must contain alt text referencing CyberCast'
    );

    // 3D Fallback Image Tag Verification
    assert.ok(
      mainPage.bodyText.includes('src="/images/3d-fallback.webp"'),
      'HTML must contain 3D fallback image webp tag'
    );

    // Decode HTML entities before checking verbatim section texts
    const decodedHtml = decodeHtmlEntities(mainPage.bodyText);

    // Verbatim Section Text Assertions (All 12 Sections)
    const requiredSections = [
      { sec: 1, text: 'Predicting Cybercrime Cash Withdrawals Before They Happen' },
      { sec: 1, text: 'Smart India Hackathon 2026 | Problem Statement 184 | Ministry of Home Affairs, I4C' },
      { sec: 1, text: 'Explore the Dashboard →' },
      { sec: 2, text: 'The Crisis We Are Solving' },
      { sec: 2, text: '8,000+ Daily Complaints' },
      { sec: 2, text: '2-6 Hour Window' },
      { sec: 2, text: 'No Predictive Intelligence' },
      { sec: 3, text: 'A Weather Forecast for Cybercrime' },
      { sec: 3, text: 'From "Crime → Complaint → Investigation → Money Gone" to "Complaint → Prediction → Deployment → Criminal Caught"' },
      { sec: 4, text: 'What We Have Built' },
      { sec: 4, text: 'Predictive Analytics Engine' },
      { sec: 4, text: 'Risk Heatmap Dashboard' },
      { sec: 4, text: 'Law Enforcement Interface' },
      { sec: 4, text: 'Alert & Notification System' },
      { sec: 5, text: 'How the System Works in Real-Time' },
      { sec: 5, text: 'Complaint Filed' },
      { sec: 5, text: 'AI Pattern Matching' },
      { sec: 5, text: 'Location Prediction' },
      { sec: 5, text: 'Heatmap Activation' },
      { sec: 5, text: 'Automated Alerts' },
      { sec: 5, text: 'Proactive Intervention' },
      { sec: 6, text: 'Expected Impact' },
      { sec: 6, text: '8,000+' },
      { sec: 6, text: '2-6 hrs' },
      { sec: 6, text: '28 States' },
      { sec: 6, text: '4-Tier' },
      { sec: 7, text: 'Unified Defense Ecosystem' },
      { sec: 7, text: 'I4C Command Center' },
      { sec: 7, text: 'State Cyber Cells' },
      { sec: 7, text: 'District Police' },
      { sec: 7, text: 'Banks & Financial Institutions' },
      { sec: 8, text: 'Built With' },
      { sec: 8, text: 'AI/ML Layer' },
      { sec: 8, text: 'Geospatial Layer' },
      { sec: 8, text: 'Data Layer' },
      { sec: 9, text: 'Powered by Multi-Source Intelligence' },
      { sec: 9, text: 'National Crime Records Bureau (NCRB)' },
      { sec: 9, text: 'Reserve Bank of India (RBI)' },
      { sec: 9, text: 'OpenStreetMap' },
      { sec: 9, text: 'Sanchar Saathi (DoT)' },
      { sec: 9, text: 'TRAI' },
      { sec: 9, text: 'CERT-In' },
      { sec: 9, text: 'data.gov.in' },
      { sec: 9, text: 'NewsAPI' },
      { sec: 9, text: 'Kaggle Fraud Datasets' },
      { sec: 10, text: 'Built for Real-World Complexity' },
      { sec: 10, text: 'Data Quality & Multilingual Inputs' },
      { sec: 10, text: 'Alert Fatigue Prevention' },
      { sec: 10, text: 'Criminal Adaptation' },
      { sec: 10, text: 'Inter-Agency Coordination' },
      { sec: 11, text: 'A System That Learns From Every Case' },
      { sec: 11, text: 'Complaint → Prediction → Alert → Police Action → Outcome Feedback → Model Retraining → Better Prediction' },
      { sec: 12, text: 'Strengthening India\'s cybersecurity posture' },
      { sec: 12, text: 'Smart India Hackathon 2026' },
      { sec: 12, text: 'SIH184' },
      { sec: 12, text: 'Cyber Singham' },
      { sec: 12, text: 'Galgotias University' },
      { sec: 12, text: 'Ekkta Mishra' },
      { sec: 12, text: 'Aditya Gupta' },
      { sec: 12, text: 'Tanuj Pathak' },
      { sec: 12, text: 'Shreya Singh' },
      { sec: 12, text: 'Shruti Yadav' },
      { sec: 12, text: 'Manya Singh Bhadauriya' }
    ];

    for (const item of requiredSections) {
      assert.ok(
        decodedHtml.includes(item.text),
        `Section ${item.sec} verbatim text missing from runtime HTML: "${item.text}"`
      );
    }

    // B. Static 3D Assets Delivery Verification via HTTP
    const glbRes = await fetchHttp('/3d/earth.glb');
    assert.equal(glbRes.statusCode, 200, '/3d/earth.glb HTTP status must be 200');
    assert.equal(glbRes.bodyBuffer.length, 1577860, '/3d/earth.glb HTTP byte length must be 1577860');

    const wasmRes = await fetchHttp('/3d/draco/draco_decoder.wasm');
    assert.equal(wasmRes.statusCode, 200, '/3d/draco/draco_decoder.wasm HTTP status must be 200');
    assert.equal(wasmRes.bodyBuffer.length, 283091, 'draco_decoder.wasm HTTP byte length must be 283091');

    const jsRes = await fetchHttp('/3d/draco/draco_wasm_wrapper.js');
    assert.equal(jsRes.statusCode, 200, '/3d/draco/draco_wasm_wrapper.js HTTP status must be 200');
    assert.equal(jsRes.bodyBuffer.length, 84810, 'draco_wasm_wrapper.js HTTP byte length must be 84810');

    const fallbackRes = await fetchHttp('/images/3d-fallback.webp');
    assert.equal(fallbackRes.statusCode, 200, '/images/3d-fallback.webp HTTP status must be 200');
    assert.equal(fallbackRes.bodyBuffer.length, 30222, '3d-fallback.webp HTTP byte length must be 30222');

    const logoRes = await fetchHttp('/CyberCast.png');
    assert.equal(logoRes.statusCode, 200, '/CyberCast.png HTTP status must be 200');
    assert.equal(logoRes.bodyBuffer.length, 844126, 'CyberCast.png HTTP byte length must be 844126');

    // C. Non-existent Route (404 Verification)
    const notFoundRes = await fetchHttp('/non-existent-route-challenger-stress');
    assert.equal(notFoundRes.statusCode, 404, 'Non-existent route must return HTTP 404');

    // D. Burst Concurrency Stress Test: 50 concurrent requests
    const CONCURRENT_COUNT = 50;
    const burstStart = Date.now();
    const requests = Array.from({ length: CONCURRENT_COUNT }, (_, i) => {
      const path = i % 2 === 0 ? '/' : '/3d/earth.glb';
      const reqStart = Date.now();
      return fetchHttp(path).then(res => {
        return {
          index: i,
          statusCode: res.statusCode,
          duration: Date.now() - reqStart
        };
      });
    });

    const results = await Promise.all(requests);
    const burstDuration = Date.now() - burstStart;

    const all200 = results.every(r => r.statusCode === 200);
    assert.ok(all200, `All ${CONCURRENT_COUNT} concurrent requests must return HTTP 200`);

    const latencies = results.map(r => r.duration).sort((a, b) => a - b);
    const minLat = latencies[0];
    const maxLat = latencies[latencies.length - 1];
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    console.log(`\n  Concurrency Stress Test Metrics (${CONCURRENT_COUNT} requests in ${burstDuration}ms):`);
    console.log(`  - Success Rate: 100% (50/50 HTTP 200)`);
    console.log(`  - Latency: min=${minLat}ms, p50=${p50}ms, p95=${p95}ms, max=${maxLat}ms\n`);

  } finally {
    // Graceful teardown of the test server
    server.kill('SIGTERM');
  }
});
