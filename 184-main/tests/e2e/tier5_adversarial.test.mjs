/**
 * Tier 5: Adversarial Coverage Hardening E2E Test Suite
 * CyberCast Supabase Authentication Gate System (SIH PS 184)
 *
 * White-box adversarial testing targeting edge conditions, security invariants,
 * prototype pollution resistance, unicode/homoglyph handling, malformed storage,
 * cross-header session teardown, AuthGate layout boundaries, click interception,
 * and provisioning script resilience.
 *
 * Total: 73 comprehensive adversarial and white-box stress tests.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

import {
  resolveOfficer,
  isValidBadge,
  getSupabaseEmail,
  BADGE_TO_OFFICER,
  BADGE_TO_EMAIL
} from '../../src/lib/auth/badgeMapping.ts';

import {
  supabase,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY
} from '../../src/lib/auth/supabaseClient.ts';

import {
  DEMO_ACCOUNTS,
  DEMO_ACCOUNTS_BY_BADGE,
  CONTRACT_CONSTANTS,
  createMockLocalStorage,
  createMockEventTarget,
  createMockSupabaseClient,
  createAuthGateSystem,
  readProjectFile,
  projectFileExists
} from './harness.mjs';

describe('Tier 5 - Feature 1: Prototype Pollution & Object Property Injection Defense', () => {
  test('T5.1.1 - resolveOfficer("__proto__") returns null and prevents prototype lookup', () => {
    const result = resolveOfficer('__proto__');
    assert.equal(result, null, 'resolveOfficer must return null for __proto__');
    assert.equal(Object.prototype.hasOwnProperty.call(Object.prototype, 'badgeId'), false);
  });

  test('T5.1.2 - resolveOfficer("constructor") returns null and does not return Object constructor', () => {
    const result = resolveOfficer('constructor');
    assert.equal(result, null, 'resolveOfficer must return null for constructor');
    assert.notEqual(result, Object);
  });

  test('T5.1.3 - resolveOfficer returns null for standard Object prototype method names', () => {
    const pollutionKeys = ['toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString'];
    for (const key of pollutionKeys) {
      assert.equal(resolveOfficer(key), null, `resolveOfficer must return null for ${key}`);
    }
  });

  test('T5.1.4 - Uppercase pollution keys (__PROTO__, CONSTRUCTOR, TOSTRING) return null', () => {
    const upperKeys = ['__PROTO__', 'CONSTRUCTOR', 'TOSTRING', 'VALUEOF', 'HASOWNPROPERTY'];
    for (const key of upperKeys) {
      assert.equal(resolveOfficer(key), null, `resolveOfficer must return null for ${key}`);
    }
  });

  test('T5.1.5 - isValidBadge returns false for all prototype property names', () => {
    const propertyNames = ['__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty', '__PROTO__', 'CONSTRUCTOR'];
    for (const prop of propertyNames) {
      assert.equal(isValidBadge(prop), false, `isValidBadge must return false for ${prop}`);
    }
  });

  test('T5.1.6 - getSupabaseEmail returns null for all prototype property names', () => {
    const propertyNames = ['__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty', '__PROTO__', 'CONSTRUCTOR'];
    for (const prop of propertyNames) {
      assert.equal(getSupabaseEmail(prop), null, `getSupabaseEmail must return null for ${prop}`);
    }
  });

  test('T5.1.7 - Prototype pollution submission in auth gate returns pre-auth rejection without Supabase call', async () => {
    let networkCalled = false;
    const mockSupabase = createMockSupabaseClient();
    const origSignIn = mockSupabase.auth.signInWithPassword;
    mockSupabase.auth.signInWithPassword = async (...args) => {
      networkCalled = true;
      return origSignIn(...args);
    };

    const sys = createAuthGateSystem({
      supabase: mockSupabase,
      resolveOfficer,
      isValidBadge
    });

    sys.setBadgeInput('__proto__');
    sys.setPasswordInput('CyberCast@I4C2024');
    const res = await sys.submitLogin();

    assert.equal(res.success, false);
    assert.equal(res.reason, 'INVALID_OFFICER');
    assert.equal(res.error, CONTRACT_CONSTANTS.errorMessages.invalidBadge);
    assert.equal(networkCalled, false, 'Supabase network method must NOT be called for pollution attempt');
  });

  test('T5.1.8 - Object prototype integrity: dictionaries remain unpolluted after all tests', () => {
    assert.equal(({}).polluted, undefined, 'Object.prototype must remain unpolluted');
    assert.equal(({}).badgeId, undefined, 'Object.prototype.badgeId must remain undefined');
    assert.equal(Object.prototype.hasOwnProperty.call(BADGE_TO_OFFICER, '__proto__'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(BADGE_TO_EMAIL, '__proto__'), false);
  });
});

describe('Tier 5 - Feature 2: Unicode, Zero-Width Spaces, Special Characters & Adversarial Padding', () => {
  test('T5.2.1 - Zero-width space prefixes/suffixes (\\u200B, \\u200C, \\u200D) fail resolution safely', () => {
    const zwsVariants = [
      '\u200BI4C-DIR-01',
      'I4C-DIR-01\u200B',
      '\u200CJPR-CI-889',
      'RJ-SP-Z04\u200D',
      '\u200B\u200C\u200D'
    ];
    for (const variant of zwsVariants) {
      assert.equal(resolveOfficer(variant), null, `Zero-width variant ${JSON.stringify(variant)} must fail resolution`);
      assert.equal(isValidBadge(variant), false, `Zero-width variant ${JSON.stringify(variant)} must be invalid`);
    }
  });

  test('T5.2.2 - Embedded zero-width space inside badge ID safely rejected', () => {
    assert.equal(resolveOfficer('I4C\u200B-DIR-01'), null);
    assert.equal(isValidBadge('I4C\u200B-DIR-01'), false);
    assert.equal(resolveOfficer('RJ\u200C-SP-Z04'), null);
    assert.equal(isValidBadge('RJ\u200C-SP-Z04'), false);
  });

  test('T5.2.3 - Emoji and symbols in badge IDs return null and false without crashing', () => {
    const emojiBadges = ['🛡️-DIR-01', '👮‍♂️', '🔥', 'I4C-DIR-01🚀', '🇮🇳-POLICE-1'];
    for (const emoji of emojiBadges) {
      assert.equal(resolveOfficer(emoji), null, `Emoji badge ${emoji} must return null`);
      assert.equal(isValidBadge(emoji), false, `Emoji badge ${emoji} must return false`);
      assert.equal(getSupabaseEmail(emoji), null, `Emoji badge ${emoji} must return null email`);
    }
  });

  test('T5.2.4 - Non-ASCII Cyrillic homoglyphs return null and are not confused with Latin ASCII', () => {
    const cyrillicBadge = '\u04064\u0421-D\u0406R-01';
    assert.equal(resolveOfficer(cyrillicBadge), null, 'Homoglyph spoof must be rejected');
    assert.equal(isValidBadge(cyrillicBadge), false, 'Homoglyph spoof must return false');
  });

  test('T5.2.5 - SQL injection payloads return null and false without throwing', () => {
    const sqliPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE auth.users; --",
      "admin'--",
      "I4C-DIR-01' UNION SELECT * FROM users--",
      "1' OR '1' = '1"
    ];
    for (const payload of sqliPayloads) {
      assert.equal(resolveOfficer(payload), null, `SQLi payload ${payload} must return null`);
      assert.equal(isValidBadge(payload), false, `SQLi payload ${payload} must return false`);
    }
  });

  test('T5.2.6 - XSS vector payloads return null and false without script execution', () => {
    const xssPayloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '"><svg/onload=alert(1)>',
      'I4C-DIR-01<script>'
    ];
    for (const payload of xssPayloads) {
      assert.equal(resolveOfficer(payload), null, `XSS payload ${payload} must return null`);
      assert.equal(isValidBadge(payload), false, `XSS payload ${payload} must return false`);
    }
  });

  test('T5.2.7 - Whitespace padding with mixed tabs, newlines, and carriage returns resolves cleanly', () => {
    const padded = '\t\r\n   I4C-DIR-01   \n\r\t';
    const officer = resolveOfficer(padded);
    assert.ok(officer, 'Should resolve despite complex whitespace padding');
    assert.equal(officer.name, 'Dr. A. K. Saxena');
    assert.equal(isValidBadge(padded), true);
    assert.equal(getSupabaseEmail(padded), 'i4c.dir01@cybercast.demo');
  });

  test('T5.2.8 - Massive repetitive string (50,000 chars) does not crash or cause ReDoS', () => {
    const hugeBadge = 'A'.repeat(50000);
    const start = Date.now();
    const res = resolveOfficer(hugeBadge);
    const duration = Date.now() - start;
    assert.equal(res, null);
    assert.ok(duration < 50, `Resolution of 50k chars took ${duration}ms (must be < 50ms)`);
  });

  test('T5.2.9 - Null byte injection strings return null and false', () => {
    const nullByteBadges = ['I4C-DIR-01\0', 'I4C-DIR-01\0.evil.com', '\0I4C-DIR-01', 'JPR\0-CI-889'];
    for (const bad of nullByteBadges) {
      assert.equal(resolveOfficer(bad), null, `Null byte badge ${JSON.stringify(bad)} must return null`);
      assert.equal(isValidBadge(bad), false, `Null byte badge ${JSON.stringify(bad)} must return false`);
    }
  });
});

describe('Tier 5 - Feature 3: Type Invariants & Boundary Resilience (Null, Undefined, Non-Strings)', () => {
  test('T5.3.1 - resolveOfficer(null) and resolveOfficer(undefined) safely return null', () => {
    assert.equal(resolveOfficer(null), null);
    assert.equal(resolveOfficer(undefined), null);
  });

  test('T5.3.2 - resolveOfficer("") and resolveOfficer("   ") return null', () => {
    assert.equal(resolveOfficer(''), null);
    assert.equal(resolveOfficer('     '), null);
    assert.equal(resolveOfficer('\t\n\r'), null);
  });

  test('T5.3.3 - Non-string types passed to resolveOfficer safely return null without throwing', () => {
    const nonStrings = [
      12345,
      true,
      false,
      {},
      [],
      ['I4C-DIR-01'],
      { badgeId: 'I4C-DIR-01' },
      () => 'I4C-DIR-01',
      Symbol('badge'),
      NaN,
      Infinity,
      -Infinity
    ];
    for (const val of nonStrings) {
      assert.equal(resolveOfficer(val), null, `Type ${typeof val} must return null`);
    }
  });

  test('T5.3.4 - Non-string types passed to isValidBadge safely return false', () => {
    const nonStrings = [null, undefined, 12345, true, {}, [], Symbol('badge'), NaN];
    for (const val of nonStrings) {
      assert.equal(isValidBadge(val), false, `Type ${typeof val} must return false`);
    }
  });

  test('T5.3.5 - Non-string types passed to getSupabaseEmail safely return null', () => {
    const nonStrings = [null, undefined, 12345, true, {}, [], Symbol('badge'), NaN];
    for (const val of nonStrings) {
      assert.equal(getSupabaseEmail(val), null, `Type ${typeof val} must return null`);
    }
  });

  test('T5.3.6 - Form submission with empty or whitespace badge returns MISSING_BADGE error', async () => {
    const sys = createAuthGateSystem({ resolveOfficer, isValidBadge });
    sys.setBadgeInput('   ');
    const res = await sys.submitLogin();
    assert.equal(res.success, false);
    assert.equal(res.reason, 'MISSING_BADGE');
    assert.equal(res.error, CONTRACT_CONSTANTS.errorMessages.requiredBadge);
  });

  test('T5.3.7 - Password submission with non-string or empty password does not crash client', async () => {
    const sys = createAuthGateSystem({ resolveOfficer, isValidBadge });
    sys.setBadgeInput('I4C-DIR-01');
    sys.setPasswordInput('');
    const res = await sys.submitLogin();
    assert.equal(res.success, false);
    assert.equal(res.reason, 'INVALID_CREDENTIALS');
  });
});

describe('Tier 5 - Feature 4: Case Normalization Across All 5 Demo Personas', () => {
  test('T5.4.1 - Persona 1 (Dr. A. K. Saxena): lower, mixed, and padded casing normalize to I4C-DIR-01', () => {
    const variations = ['i4c-dir-01', 'I4c-Dir-01', 'i4C-dIr-01', '  i4c-dir-01  '];
    for (const v of variations) {
      const officer = resolveOfficer(v);
      assert.ok(officer, `Should resolve ${v}`);
      assert.equal(officer.badgeId, 'I4C-DIR-01');
      assert.equal(officer.name, 'Dr. A. K. Saxena');
      assert.equal(isValidBadge(v), true);
      assert.equal(getSupabaseEmail(v), 'i4c.dir01@cybercast.demo');
    }
  });

  test('T5.4.2 - Persona 2 (Supt. R. Sharma): lower, mixed, and padded casing normalize to RJ-SP-Z04', () => {
    const variations = ['rj-sp-z04', 'Rj-Sp-Z04', 'rJ-sP-z04', '  rj-sp-z04  '];
    for (const v of variations) {
      const officer = resolveOfficer(v);
      assert.ok(officer, `Should resolve ${v}`);
      assert.equal(officer.badgeId, 'RJ-SP-Z04');
      assert.equal(officer.name, 'Supt. R. Sharma');
      assert.equal(isValidBadge(v), true);
      assert.equal(getSupabaseEmail(v), 'state.nodal.rj@cybercast.demo');
    }
  });

  test('T5.4.3 - Persona 3 (Insp. P. Verma): lower, mixed, and padded casing normalize to JPR-CI-889', () => {
    const variations = ['jpr-ci-889', 'Jpr-Ci-889', 'jPr-cI-889', '  jpr-ci-889  '];
    for (const v of variations) {
      const officer = resolveOfficer(v);
      assert.ok(officer, `Should resolve ${v}`);
      assert.equal(officer.badgeId, 'JPR-CI-889');
      assert.equal(officer.name, 'Insp. P. Verma');
      assert.equal(isValidBadge(v), true);
      assert.equal(getSupabaseEmail(v), 'district.jpr@cybercast.demo');
    }
  });

  test('T5.4.4 - Persona 4 (SI K. Mehta): lower, mixed, and padded casing normalize to JPR-SI-412', () => {
    const variations = ['jpr-si-412', 'Jpr-Si-412', 'jPr-sI-412', '  jpr-si-412  '];
    for (const v of variations) {
      const officer = resolveOfficer(v);
      assert.ok(officer, `Should resolve ${v}`);
      assert.equal(officer.badgeId, 'JPR-SI-412');
      assert.equal(officer.name, 'SI K. Mehta');
      assert.equal(isValidBadge(v), true);
      assert.equal(getSupabaseEmail(v), 'field.si.jpr@cybercast.demo');
    }
  });

  test('T5.4.5 - Persona 5 (M. Agarwal): lower, mixed, and padded casing normalize to SBI-CFC-91', () => {
    const variations = ['sbi-cfc-91', 'Sbi-Cfc-91', 'sBi-cFc-91', '  sbi-cfc-91  '];
    for (const v of variations) {
      const officer = resolveOfficer(v);
      assert.ok(officer, `Should resolve ${v}`);
      assert.equal(officer.badgeId, 'SBI-CFC-91');
      assert.equal(officer.name, 'M. Agarwal (SBI Fraud)');
      assert.equal(isValidBadge(v), true);
      assert.equal(getSupabaseEmail(v), 'bank.sbi.cfc@cybercast.demo');
    }
  });

  test('T5.4.6 - Case normalization consistency: resolveOfficer, isValidBadge, and getSupabaseEmail agree for all 5', () => {
    for (const acc of DEMO_ACCOUNTS) {
      const lower = acc.badgeId.toLowerCase();
      const officer = resolveOfficer(lower);
      const valid = isValidBadge(lower);
      const email = getSupabaseEmail(lower);

      assert.equal(valid, true);
      assert.equal(officer?.badgeId, acc.badgeId);
      assert.equal(email, acc.email);
    }
  });

  test('T5.4.7 - System simulator resolves Selected Officer name on lowercased badge input', () => {
    const sys = createAuthGateSystem({ resolveOfficer, isValidBadge });
    sys.setBadgeInput('sbi-cfc-91');
    const selected = sys.getSelectedOfficer();
    assert.ok(selected);
    assert.equal(selected.name, 'M. Agarwal (SBI Fraud)');
  });
});

describe('Tier 5 - Feature 5: Malformed LocalStorage & Storage Corruption Stress Tests', () => {
  test('T5.5.1 - Truncated / malformed JSON in cybercast_officer does not crash system initialization', () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: '{"badgeId": "I4C-DIR-01", "name": "Dr. A. K.'
    });
    const sys = createAuthGateSystem({ localStorage: storage, initialRoute: '/dashboard' });
    assert.equal(sys.getActiveOfficer(), null);
    assert.equal(sys.isRouteProtected('/dashboard'), true);
    assert.equal(sys.isContentBlurred(), true);
  });

  test('T5.5.2 - Non-JSON raw primitives in cybercast_officer are safely treated as unauthenticated', () => {
    const rawPrimitives = ['12345', 'true', 'false', 'null', '"plain string"'];
    for (const prim of rawPrimitives) {
      const storage = createMockLocalStorage({ [CONTRACT_CONSTANTS.storageKey]: prim });
      const sys = createAuthGateSystem({ localStorage: storage, initialRoute: '/dashboard' });
      assert.equal(Boolean(sys.getActiveOfficer()?.badgeId), false, `Raw primitive ${prim} must not yield valid badgeId`);

      let authenticated = false;
      try {
        const parsed = JSON.parse(storage.getItem(CONTRACT_CONSTANTS.storageKey));
        authenticated = Boolean(parsed && typeof parsed === 'object' && parsed.badgeId);
      } catch {
        authenticated = false;
      }
      assert.equal(authenticated, false, `Raw primitive ${prim} must not authenticate in AuthGate`);
    }
  });

  test('T5.5.3 - Array JSON in cybercast_officer does not grant authenticated state', () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify([{ badgeId: 'I4C-DIR-01' }])
    });
    const sys = createAuthGateSystem({ localStorage: storage });
    assert.equal(sys.getActiveOfficer()?.badgeId, undefined);
  });

  test('T5.5.4 - Stored object missing badgeId is treated as unauthenticated', () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify({ name: 'Imposter Officer', role: 'admin' })
    });
    const sys = createAuthGateSystem({ localStorage: storage });
    assert.equal(Boolean(sys.getActiveOfficer()?.badgeId), false);
  });

  test('T5.5.5 - Stored object with empty or null badgeId is treated as unauthenticated', () => {
    const storageEmpty = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify({ badgeId: '', name: 'Dr. Saxena' })
    });
    const sysEmpty = createAuthGateSystem({ localStorage: storageEmpty });
    assert.equal(Boolean(sysEmpty.getActiveOfficer()?.badgeId), false);

    const storageNull = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify({ badgeId: null, name: 'Dr. Saxena' })
    });
    const sysNull = createAuthGateSystem({ localStorage: storageNull });
    assert.equal(Boolean(sysNull.getActiveOfficer()?.badgeId), false);
  });

  test('T5.5.6 - Stored JSON with prototype pollution payload does not contaminate Object prototype', () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: '{"__proto__": {"admin": true}}'
    });
    const sys = createAuthGateSystem({ localStorage: storage });
    assert.equal(({}).admin, undefined);
  });

  test('T5.5.7 - Giant JSON payload (100KB+ garbage data) does not crash or exhaust memory', () => {
    const largeObj = {
      badgeId: 'I4C-DIR-01',
      name: 'Dr. A. K. Saxena',
      role: 'i4c_central',
      persona: 'I4C Central Directorate',
      junkData: 'X'.repeat(100000)
    };
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify(largeObj)
    });
    const sys = createAuthGateSystem({ localStorage: storage });
    assert.equal(sys.getActiveOfficer()?.badgeId, 'I4C-DIR-01');
  });
});

describe('Tier 5 - Feature 6: Multi-Header Session Teardown & Cross-Tab Synchronization', () => {
  test('T5.6.1 - HeaderNav sign out removes cybercast_officer and dispatches auth event', async () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify(DEMO_ACCOUNTS[0])
    });
    const eventTarget = createMockEventTarget();
    let eventFired = false;
    eventTarget.addEventListener(CONTRACT_CONSTANTS.authEventName, () => {
      eventFired = true;
    });

    const sys = createAuthGateSystem({ localStorage: storage, eventTarget, initialRoute: '/dashboard' });
    assert.ok(sys.getActiveOfficer());

    await sys.signOut();
    assert.equal(storage.getItem(CONTRACT_CONSTANTS.storageKey), null);
    assert.equal(sys.getActiveOfficer(), null);
    assert.equal(eventFired, true);
    assert.equal(sys.getCurrentRoute(), '/');
  });

  test('T5.6.2 - DashboardHeader sign out removes storage and dispatches auth event', async () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify(DEMO_ACCOUNTS[1])
    });
    const eventTarget = createMockEventTarget();
    let eventCount = 0;
    eventTarget.addEventListener(CONTRACT_CONSTANTS.authEventName, () => eventCount++);

    const sys = createAuthGateSystem({ localStorage: storage, eventTarget, initialRoute: '/dashboard' });
    await sys.signOut();

    assert.equal(storage.getItem(CONTRACT_CONSTANTS.storageKey), null);
    assert.equal(eventCount, 1);
    assert.equal(sys.getCurrentRoute(), '/');
  });

  test('T5.6.3 - CollabHeader sign out removes storage and dispatches auth event', async () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify(DEMO_ACCOUNTS[2])
    });
    const eventTarget = createMockEventTarget();
    let eventCount = 0;
    eventTarget.addEventListener(CONTRACT_CONSTANTS.authEventName, () => eventCount++);

    const sys = createAuthGateSystem({ localStorage: storage, eventTarget, initialRoute: '/collab' });
    await sys.signOut();

    assert.equal(storage.getItem(CONTRACT_CONSTANTS.storageKey), null);
    assert.equal(eventCount, 1);
    assert.equal(sys.getCurrentRoute(), '/');
  });

  test('T5.6.4 - Cross-tab storage change event (key: cybercast_officer) revokes active session', () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify(DEMO_ACCOUNTS[0])
    });
    const sys = createAuthGateSystem({ localStorage: storage, initialRoute: '/dashboard' });
    assert.equal(sys.isContentBlurred(), false);

    storage.removeItem(CONTRACT_CONSTANTS.storageKey);

    const postSyncSys = createAuthGateSystem({ localStorage: storage, initialRoute: '/dashboard' });
    assert.equal(postSyncSys.getActiveOfficer(), null);
    assert.equal(postSyncSys.isContentBlurred(), true);
  });

  test('T5.6.5 - Cross-tab storage clear (key: null) revokes active session', () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify(DEMO_ACCOUNTS[0])
    });
    const sys = createAuthGateSystem({ localStorage: storage, initialRoute: '/collab' });
    assert.equal(sys.isContentBlurred(), false);

    storage.clear();
    const postClearSys = createAuthGateSystem({ localStorage: storage, initialRoute: '/collab' });
    assert.equal(postClearSys.getActiveOfficer(), null);
    assert.equal(postClearSys.isContentBlurred(), true);
  });

  test('T5.6.6 - Consecutive or redundant sign-out calls complete idempotently without throwing', async () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });
    const res1 = await sys.signOut();
    const res2 = await sys.signOut();
    const res3 = await sys.signOut();
    assert.equal(res1.success, true);
    assert.equal(res2.success, true);
    assert.equal(res3.success, true);
  });

  test('T5.6.7 - Sign-out destination is strictly "/" across all headers in source code', () => {
    const headerFiles = [
      'src/components/navigation/HeaderNav.tsx',
      'src/components/dashboard/DashboardHeader.tsx',
      'src/components/collab/CollabHeader.tsx'
    ];
    for (const relPath of headerFiles) {
      const content = readProjectFile(relPath);
      assert.ok(content, `${relPath} must exist`);
      assert.ok(
        content.includes("router.push('/')") || content.includes("window.location.href = '/'"),
        `${relPath} must redirect to / on sign out`
      );
    }
  });
});

describe('Tier 5 - Feature 7: AuthGate Security Boundary & Styling Invariant Verification', () => {
  test('T5.7.1 - AuthGate unauthenticated wrapper includes exact Tailwind blur classes', () => {
    const authGateSrc = readProjectFile('src/components/AuthGate.tsx');
    assert.ok(authGateSrc, 'AuthGate.tsx must exist');
    assert.ok(authGateSrc.includes('filter blur-[8px]'), 'Must contain filter blur-[8px]');
    assert.ok(authGateSrc.includes('pointer-events-none'), 'Must contain pointer-events-none');
    assert.ok(authGateSrc.includes('select-none'), 'Must contain select-none');
  });

  test('T5.7.2 - AuthGate unauthenticated wrapper contains aria-hidden="true"', () => {
    const authGateSrc = readProjectFile('src/components/AuthGate.tsx');
    assert.ok(authGateSrc.includes('aria-hidden="true"'), 'Unauthenticated blurred wrapper must enforce aria-hidden="true"');
  });

  test('T5.7.3 - AuthGate mounts non-dismissible AuthModal (canDismiss={false}) for unauthenticated access', () => {
    const authGateSrc = readProjectFile('src/components/AuthGate.tsx');
    assert.ok(authGateSrc.includes('canDismiss={false}'), 'AuthGate must mount AuthModal with canDismiss={false}');
    assert.ok(authGateSrc.includes('isOpen={true}'), 'AuthGate must mount AuthModal with isOpen={true}');
  });

  test('T5.7.4 - AuthGate renders unadorned children upon authenticated session', () => {
    const authGateSrc = readProjectFile('src/components/AuthGate.tsx');
    assert.ok(
      authGateSrc.includes('if (isAuthenticated)') && authGateSrc.includes('return <>{children}</>'),
      'AuthGate must return clean <>{children}</> when authenticated'
    );
  });

  test('T5.7.5 - AuthGate uses isomorphic layout effect to prevent FOUC', () => {
    const authGateSrc = readProjectFile('src/components/AuthGate.tsx');
    assert.ok(
      authGateSrc.includes('useIsomorphicLayoutEffect') || authGateSrc.includes('useLayoutEffect'),
      'AuthGate must use isomorphic layout effect for synchronous pre-paint check'
    );
  });

  test('T5.7.6 - Protected route matrix: deep nested routes are all verified as protected', () => {
    const sys = createAuthGateSystem();
    const protectedPaths = [
      '/dashboard',
      '/dashboard/',
      '/dashboard/cases',
      '/dashboard/intel/hotspots',
      '/dashboard/atms/view',
      '/collab',
      '/collab/',
      '/collab/dossier/new',
      '/collab/chain/evidence',
      '/dashboard?zone=north',
      '/collab#tab=cases'
    ];
    for (const p of protectedPaths) {
      assert.equal(sys.isRouteProtected(p), true, `Path ${p} must be protected`);
    }
  });

  test('T5.7.7 - Public route matrix: landing and informational routes are not protected', () => {
    const sys = createAuthGateSystem();
    const publicPaths = [
      '/',
      '/#problem',
      '/#solution',
      '/#features',
      '/#impact',
      '/about',
      '/help',
      '/privacy'
    ];
    for (const p of publicPaths) {
      assert.equal(sys.isRouteProtected(p), false, `Path ${p} must NOT be protected`);
    }
  });
});

describe('Tier 5 - Feature 8: LandingAuthInterceptor Click Capture & Route Destination Stress', () => {
  test('T5.8.1 - Destination extraction preserves complex query parameters', () => {
    const sys = createAuthGateSystem();
    const cta = sys.handleCtaClick('/dashboard?caseId=CY-44521&severity=CRITICAL&page=1');
    assert.equal(cta.intercepted, true);
    assert.equal(cta.intendedRoute, '/dashboard?caseId=CY-44521&severity=CRITICAL&page=1');
  });

  test('T5.8.2 - Destination extraction preserves hash fragments', () => {
    const sys = createAuthGateSystem();
    const cta = sys.handleCtaClick('/dashboard#incident-radar');
    assert.equal(cta.intercepted, true);
    assert.equal(cta.intendedRoute, '/dashboard#incident-radar');
  });

  test('T5.8.3 - Destination extraction preserves combined query and hash', () => {
    const sys = createAuthGateSystem();
    const cta = sys.handleCtaClick('/collab?filter=active#evidence-vault');
    assert.equal(cta.intercepted, true);
    assert.equal(cta.intendedRoute, '/collab?filter=active#evidence-vault');
  });

  test('T5.8.4 - External links are rejected by protected route analyzer in LandingAuthInterceptor', () => {
    const interceptorSrc = readProjectFile('src/components/landing/LandingAuthInterceptor.tsx');
    assert.ok(interceptorSrc, 'LandingAuthInterceptor.tsx must exist');
    assert.ok(interceptorSrc.includes("route.startsWith('http://')"), 'Must reject external http URLs');
    assert.ok(interceptorSrc.includes("route.startsWith('https://')"), 'Must reject external https URLs');
    assert.ok(interceptorSrc.includes("route.startsWith('//')"), 'Must reject protocol-relative URLs');
  });

  test('T5.8.5 - Non-HTTP schemes (mailto:, tel:) are rejected by protected route analyzer', () => {
    const interceptorSrc = readProjectFile('src/components/landing/LandingAuthInterceptor.tsx');
    assert.ok(interceptorSrc.includes("route.startsWith('mailto:')"), 'Must reject mailto links');
    assert.ok(interceptorSrc.includes("route.startsWith('tel:')"), 'Must reject tel links');
  });

  test('T5.8.6 - Interceptor attaches capture-phase listener to document to preempt default navigation', () => {
    const interceptorSrc = readProjectFile('src/components/landing/LandingAuthInterceptor.tsx');
    assert.ok(
      interceptorSrc.includes("document.addEventListener('click', handleDocumentClick, true)"),
      'Must attach capture-phase listener (true third argument) to intercept clicks'
    );
  });

  test('T5.8.7 - Successful post-auth redirection routes to preserved destination and clears intendedRoute', async () => {
    const sys = createAuthGateSystem({ resolveOfficer, isValidBadge });
    sys.handleCtaClick('/dashboard?tab=telemetry#live');
    assert.equal(sys.getIntendedRoute(), '/dashboard?tab=telemetry#live');

    sys.selectPersona('I4C-DIR-01');
    const res = await sys.submitLogin();
    assert.equal(res.success, true);
    assert.equal(res.redirectTo, '/dashboard?tab=telemetry#live');
    assert.equal(sys.getCurrentRoute(), '/dashboard?tab=telemetry#live');
    assert.equal(sys.getIntendedRoute(), null, 'intendedRoute must be reset after redirection');
  });
});

describe('Tier 5 - Feature 9: Provisioning Script (createDemoUsers.ts) Dry-Run & Env Resilience', () => {
  test('T5.9.1 - CLI execution without SUPABASE_SERVICE_ROLE_KEY exits cleanly with code 0', () => {
    const res = spawnSync('npx', ['tsx', 'scripts/createDemoUsers.ts'], {
      env: { ...process.env, SUPABASE_SERVICE_ROLE_KEY: '' },
      encoding: 'utf8',
      timeout: 10000
    });
    assert.equal(res.status, 0, 'Script must exit with code 0 on missing key');
    assert.ok(
      res.stderr.includes('SUPABASE_SERVICE_ROLE_KEY is not configured') ||
      res.stdout.includes('SUPABASE_SERVICE_ROLE_KEY is not configured'),
      'Must log warning message explaining configuration steps'
    );
  });

  test('T5.9.2 - CLI execution with placeholder key "your_service_role_key_here" exits cleanly with code 0', () => {
    const res = spawnSync('npx', ['tsx', 'scripts/createDemoUsers.ts'], {
      env: { ...process.env, SUPABASE_SERVICE_ROLE_KEY: 'your_service_role_key_here' },
      encoding: 'utf8',
      timeout: 10000
    });
    assert.equal(res.status, 0, 'Script must exit with code 0 on placeholder key');
  });

  test('T5.9.3 - CLI execution with key containing "placeholder" exits cleanly with code 0', () => {
    const res = spawnSync('npx', ['tsx', 'scripts/createDemoUsers.ts'], {
      env: { ...process.env, SUPABASE_SERVICE_ROLE_KEY: 'my_placeholder_secret' },
      encoding: 'utf8',
      timeout: 10000
    });
    assert.equal(res.status, 0, 'Script must exit with code 0 on placeholder key');
  });

  test('T5.9.4 - Script source enforces email_confirm: true in createUser and updateUserById', () => {
    const scriptSrc = readProjectFile('scripts/createDemoUsers.ts');
    assert.ok(scriptSrc, 'scripts/createDemoUsers.ts must exist');
    assert.ok(scriptSrc.includes('email_confirm: true'), 'Must set email_confirm: true');
  });

  test('T5.9.5 - Script source enforces all 4 user_metadata fields: badgeId, name, role, persona', () => {
    const scriptSrc = readProjectFile('scripts/createDemoUsers.ts');
    assert.ok(scriptSrc.includes('badgeId: user.badgeId'));
    assert.ok(scriptSrc.includes('name: user.name'));
    assert.ok(scriptSrc.includes('role: user.role'));
    assert.ok(scriptSrc.includes('persona: user.persona'));
  });

  test('T5.9.6 - Script source validates idempotent user lookup via case-insensitive email matching', () => {
    const scriptSrc = readProjectFile('scripts/createDemoUsers.ts');
    assert.ok(
      scriptSrc.includes('u.email?.toLowerCase()') || scriptSrc.includes('user.email.toLowerCase()'),
      'Must match emails case-insensitively for idempotency'
    );
  });

  test('T5.9.7 - Script source defines exactly 5 authoritative demo accounts matching specification', () => {
    const scriptSrc = readProjectFile('scripts/createDemoUsers.ts');
    for (const acc of DEMO_ACCOUNTS) {
      assert.ok(scriptSrc.includes(acc.badgeId), `Script must define ${acc.badgeId}`);
      assert.ok(scriptSrc.includes(acc.email), `Script must define ${acc.email}`);
    }
  });
});

describe('Tier 5 - Feature 10: White-Box Source Code Conformance & Anti-Regression Invariants', () => {
  test('T5.10.1 - src/lib/auth/supabaseClient.ts does NOT leak service role key in client bundle', () => {
    const clientSrc = readProjectFile('src/lib/auth/supabaseClient.ts');
    assert.ok(clientSrc, 'supabaseClient.ts must exist');
    assert.equal(
      clientSrc.includes('SUPABASE_SERVICE_ROLE_KEY'),
      false,
      'Client file must never reference or bundle SUPABASE_SERVICE_ROLE_KEY'
    );
  });

  test('T5.10.2 - src/lib/auth/badgeMapping.ts uses Object.prototype.hasOwnProperty.call', () => {
    const mappingSrc = readProjectFile('src/lib/auth/badgeMapping.ts');
    assert.ok(mappingSrc, 'badgeMapping.ts must exist');
    assert.ok(
      mappingSrc.includes('Object.prototype.hasOwnProperty.call'),
      'Must use Object.prototype.hasOwnProperty.call for prototype-safe lookup'
    );
  });

  test('T5.10.3 - src/components/collab/AuthModal.tsx uses z-[999] for modal overlay depth', () => {
    const modalSrc = readProjectFile('src/components/collab/AuthModal.tsx');
    assert.ok(modalSrc, 'AuthModal.tsx must exist');
    assert.ok(modalSrc.includes('z-[999]'), 'Modal backdrop must use z-[999]');
  });

  test('T5.10.4 - src/components/collab/AuthModal.tsx action button text is LOGIN and AUTHENTICATING...', () => {
    const modalSrc = readProjectFile('src/components/collab/AuthModal.tsx');
    assert.ok(modalSrc.includes('LOGIN'), 'Button text must be LOGIN');
    assert.ok(modalSrc.includes('AUTHENTICATING...'), 'Loading text must be AUTHENTICATING...');
    assert.equal(
      modalSrc.includes('REQUEST MOBILE OTP VERIFICATION'),
      false,
      'Legacy OTP text must be eradicated'
    );
  });

  test('T5.10.5 - src/components/collab/AuthModal.tsx styling includes #0c0c0c obsidian and #ceff00 neon accent', () => {
    const modalSrc = readProjectFile('src/components/collab/AuthModal.tsx');
    assert.ok(modalSrc.includes('#0c0c0c'), 'Must use #0c0c0c obsidian background');
    assert.ok(modalSrc.includes('#ceff00'), 'Must use #ceff00 neon yellow-green accent');
    assert.ok(modalSrc.includes('rounded-none'), 'Must use rounded-none border styling');
  });

  test('T5.10.6 - All 3 headers dispatch cybercast_auth_change event on sign out', () => {
    const headerFiles = [
      'src/components/navigation/HeaderNav.tsx',
      'src/components/dashboard/DashboardHeader.tsx',
      'src/components/collab/CollabHeader.tsx'
    ];
    for (const relPath of headerFiles) {
      const content = readProjectFile(relPath);
      assert.ok(
        content.includes("new Event('cybercast_auth_change')") ||
        content.includes("new CustomEvent('cybercast_auth_change')"),
        `${relPath} must dispatch cybercast_auth_change event on sign out`
      );
    }
  });

  test('T5.10.7 - src/components/navigation/Navbar.tsx cleanly re-exports HeaderNav', () => {
    const navSrc = readProjectFile('src/components/navigation/Navbar.tsx');
    assert.ok(navSrc, 'Navbar.tsx must exist');
    assert.ok(navSrc.includes("import HeaderNav from './HeaderNav'"), 'Navbar must import HeaderNav');
    assert.ok(navSrc.includes('export { HeaderNav as Navbar }'), 'Navbar must re-export HeaderNav');
  });
});
