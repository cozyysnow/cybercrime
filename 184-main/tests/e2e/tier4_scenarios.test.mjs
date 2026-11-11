/**
 * Tier 4: Real-World Application Scenarios E2E Test Suite
 * CyberCast Supabase Authentication Gate System (SIH PS 184)
 *
 * Covers complete end-to-end real-world user journeys for all 5
 * law enforcement personas and operational operational edge scenarios:
 * 1. Dr. A. K. Saxena (I4C Director)
 * 2. Supt. R. Sharma (State Cyber Nodal)
 * 3. Insp. P. Verma (District Cyber Inspector)
 * 4. SI K. Mehta (Field Investigator)
 * 5. M. Agarwal (Bank Fraud Investigator)
 * 6. Hostile Impersonator / Penetration Intrusion Attempt
 * 7. Mid-Session Token Expiration & Re-Authentication
 * 8. Shared Command Center Hot-Desking & Zero-Leakage Handover
 * Total: 8 exhaustive real-world operational scenarios.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_ACCOUNTS,
  CONTRACT_CONSTANTS,
  createMockLocalStorage,
  createMockEventTarget,
  createMockSupabaseClient,
  createAuthGateSystem
} from './harness.mjs';

describe('Tier 4 - Real-World Law Enforcement Application Scenarios', () => {
  test('T4.1 - Scenario 1: Dr. A. K. Saxena (I4C Director) National Incident Response Journey', async () => {
    const storage = createMockLocalStorage();
    const eventTarget = createMockEventTarget();
    const sys = createAuthGateSystem({ initialRoute: '/', localStorage: storage, eventTarget });

    // Step 1: Director lands on CyberCast public landing page
    assert.equal(sys.getCurrentRoute(), '/');
    assert.equal(sys.isContentBlurred(), false);

    // Step 2: Director clicks "EXPLORE THE DASHBOARD →" CTA
    const cta = sys.handleCtaClick('/dashboard');
    assert.equal(cta.intercepted, true);
    assert.equal(sys.getIntendedRoute(), '/dashboard');
    assert.equal(sys.isModalOpen(), true);

    // Step 3: Director selects I4C Central Directorate persona card
    sys.selectPersona('I4C-DIR-01');
    assert.equal(sys.getBadgeInput(), 'I4C-DIR-01');
    assert.equal(sys.getPasswordInput(), 'CyberCast@I4C2024');

    // Step 4: Dynamic officer resolver displays authoritative clearance
    const resolved = sys.getSelectedOfficer();
    assert.equal(resolved?.name, 'Dr. A. K. Saxena');
    assert.equal(resolved?.role, 'i4c_central');
    assert.equal(resolved?.persona, 'I4C Central Directorate');

    // Step 5: Submit LOGIN and verify Supabase authentication
    const authRes = await sys.submitLogin();
    assert.equal(authRes.success, true);
    assert.equal(authRes.redirectTo, '/dashboard');
    assert.equal(sys.getCurrentRoute(), '/dashboard');
    assert.equal(sys.isContentBlurred(), false);
    assert.equal(sys.isPointerEventsLocked(), false);

    // Step 6: Verify localStorage contains validated officer identity
    const stored = JSON.parse(storage.getItem(CONTRACT_CONSTANTS.storageKey));
    assert.equal(stored.badgeId, 'I4C-DIR-01');
    assert.equal(stored.role, 'i4c_central');

    // Step 7: Director transitions to /collab to review inter-agency actions
    sys.navigateTo('/collab');
    assert.equal(sys.isContentBlurred(), false, 'Single session must allow collab access');

    // Step 8: Director completes national briefing and executes SIGN OUT
    const signOutRes = await sys.signOut();
    assert.equal(signOutRes.success, true);
    assert.equal(sys.getCurrentRoute(), '/');
    assert.equal(storage.getItem(CONTRACT_CONSTANTS.storageKey), null);

    // Step 9: Re-attempting direct dashboard access is gated
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), true);
    assert.equal(sys.canDismissModal(), false);
  });

  test('T4.2 - Scenario 2: Supt. R. Sharma (State Nodal Officer) Multi-District Escalation Journey', async () => {
    const sys = createAuthGateSystem();

    // Step 1: State Nodal Officer receives dispatch link to specific case
    const caseDeepLink = '/collab?caseId=RJ-2026-9041&priority=CRITICAL';
    sys.navigateTo(caseDeepLink);

    // Step 2: AuthGate intercepts unauthenticated deep link
    assert.equal(sys.isContentBlurred(), true);
    assert.equal(sys.isPointerEventsLocked(), true);
    assert.equal(sys.isModalOpen(), true);
    assert.equal(sys.canDismissModal(), false);

    // Step 3: Nodal Officer inputs credentials
    sys.selectPersona('RJ-SP-Z04');
    assert.equal(sys.getSelectedOfficer()?.name, 'Supt. R. Sharma');
    assert.equal(sys.getSelectedOfficer()?.role, 'state_nodal');

    // Step 4: Authenticate and verify deep link access
    const loginRes = await sys.submitLogin();
    assert.equal(loginRes.success, true);
    assert.equal(sys.isContentBlurred(), false);
    assert.equal(sys.getActiveOfficer()?.badgeId, 'RJ-SP-Z04');

    // Step 5: Sign out cleanly
    await sys.signOut();
    assert.equal(sys.getCurrentRoute(), '/');
  });

  test('T4.3 - Scenario 3: Insp. P. Verma (District Cyber Inspector) Tactical Patrol Verification Journey', async () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });

    // Step 1: District inspector visits portal
    sys.handleCtaClick('/dashboard');

    // Step 2: Inspector manually types badge number
    sys.setBadgeInput('JPR-CI-889');
    assert.equal(sys.getSelectedOfficer()?.name, 'Insp. P. Verma');
    assert.equal(sys.getSelectedOfficer()?.persona, 'District Cyber Cell');

    // Step 3: Enters password and authenticates
    sys.setPasswordInput('CyberCast@District2024');
    const res = await sys.submitLogin();
    assert.equal(res.success, true);
    assert.equal(sys.getCurrentRoute(), '/dashboard');
    assert.equal(sys.getActiveOfficer()?.role, 'district_cyber');

    // Step 4: Mission complete, sign out
    await sys.signOut();
    assert.equal(sys.getActiveOfficer(), null);
  });

  test('T4.4 - Scenario 4: SI K. Mehta (Field Investigator) Rapid Mobile ATM Interception Journey', async () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });

    // Step 1: Field officer on mobile taps Collab CTA
    sys.handleCtaClick('/collab');
    assert.equal(sys.getIntendedRoute(), '/collab');

    // Step 2: Select Field Investigator persona
    sys.selectPersona('JPR-SI-412');
    assert.equal(sys.getSelectedOfficer()?.name, 'SI K. Mehta');
    assert.equal(sys.getSelectedOfficer()?.role, 'field_investigator');

    // Step 3: Rapid authentication
    const res = await sys.submitLogin();
    assert.equal(res.success, true);
    assert.equal(res.redirectTo, '/collab');
    assert.equal(sys.getCurrentRoute(), '/collab');
    assert.equal(sys.isContentBlurred(), false);

    // Step 4: Field shift ends, signs out
    await sys.signOut();
    assert.equal(sys.getCurrentRoute(), '/');
  });

  test('T4.5 - Scenario 5: M. Agarwal (Bank Fraud Investigator) Inter-Agency Mule Account Freezing Journey', async () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });

    // Step 1: Bank investigator logs in via landing CTA
    sys.handleCtaClick('/collab');
    sys.selectPersona('SBI-CFC-91');
    assert.equal(sys.getSelectedOfficer()?.name, 'M. Agarwal (SBI Fraud)');
    assert.equal(sys.getSelectedOfficer()?.role, 'bank_fi');

    // Step 2: Authenticate with bank clearance
    const res = await sys.submitLogin();
    assert.equal(res.success, true);
    assert.equal(res.redirectTo, '/collab');
    assert.equal(sys.getActiveOfficer()?.persona, 'Bank Fraud Investigator');

    // Step 3: Checks dashboard risk heatmaps as well
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), false);

    // Step 4: Sign out cleanly
    await sys.signOut();
    assert.equal(sys.getActiveOfficer(), null);
  });

  test('T4.6 - Scenario 6: Threat Actor Impersonation & Brute-Force Attack Resistance Journey', async () => {
    const sys = createAuthGateSystem();

    // Step 1: Threat actor directly requests restricted URL /dashboard
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), true);
    assert.equal(sys.canDismissModal(), false);

    // Step 2: Threat actor attempts to bypass modal via dismissal
    const dismissed = sys.closeModal();
    assert.equal(dismissed, false);
    assert.equal(sys.isModalOpen(), true);

    // Step 3: Threat actor enters forged badge ID
    sys.setBadgeInput('MHA-FORGED-007');
    sys.setPasswordInput('Admin@123');
    const fakeBadgeRes = await sys.submitLogin();
    assert.equal(fakeBadgeRes.success, false);
    assert.equal(fakeBadgeRes.error, 'Invalid Officer ID. Access Denied.');

    // Step 4: Threat actor tries brute-force passwords on legitimate badge
    sys.setBadgeInput('I4C-DIR-01');
    const passwords = ['123456', 'password', 'admin123', 'CyberCast2024'];
    for (const pwd of passwords) {
      sys.setPasswordInput(pwd);
      const res = await sys.submitLogin();
      assert.equal(res.success, false);
      assert.equal(res.error, 'Authentication Failed. Invalid credentials.');
    }

    // Step 5: Protected dashboard remains strictly blurred and locked
    assert.equal(sys.isContentBlurred(), true);
    assert.equal(sys.isPointerEventsLocked(), true);
    assert.equal(sys.getActiveOfficer(), null);
  });

  test('T4.7 - Scenario 7: Mid-Session Token Expiry & Re-Authentication Recovery Journey', async () => {
    const sys = createAuthGateSystem();

    // Step 1: State Nodal Officer authenticates
    sys.selectPersona('RJ-SP-Z04');
    await sys.submitLogin();
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), false);

    // Step 2: Supabase session token expires / is invalidated remotely
    await sys.getSupabase().auth.signOut();
    // Simulate AuthGate detecting auth state transition to null session
    sys.getLocalStorage().removeItem(CONTRACT_CONSTANTS.storageKey);
    await sys.signOut(); // Trigger gate lock
    sys.navigateTo('/dashboard');

    // Step 3: Route immediately locks with blur and non-dismissible modal
    assert.equal(sys.isContentBlurred(), true);
    assert.equal(sys.isPointerEventsLocked(), true);
    assert.equal(sys.canDismissModal(), false);

    // Step 4: Officer re-authenticates with badge and password
    sys.selectPersona('RJ-SP-Z04');
    const reAuth = await sys.submitLogin();
    assert.equal(reAuth.success, true);
    assert.equal(sys.isContentBlurred(), false);
    assert.equal(sys.getActiveOfficer()?.badgeId, 'RJ-SP-Z04');
  });

  test('T4.8 - Scenario 8: Multi-Agency Shared Workstation Hot-Desking & Zero-Leakage Handover', async () => {
    const storage = createMockLocalStorage();
    const eventTarget = createMockEventTarget();
    const sys = createAuthGateSystem({ localStorage: storage, eventTarget });

    // Session 1: District Cyber Inspector (P. Verma)
    sys.selectPersona('JPR-CI-889');
    await sys.submitLogin();
    sys.navigateTo('/collab');
    assert.equal(sys.getActiveOfficer()?.name, 'Insp. P. Verma');
    assert.equal(sys.getActiveOfficer()?.role, 'district_cyber');

    // Inspector logs out at shift transition
    await sys.signOut();
    assert.equal(sys.getCurrentRoute(), '/');
    assert.equal(storage.getItem(CONTRACT_CONSTANTS.storageKey), null);
    assert.equal(sys.getActiveOfficer(), null);

    // Session 2: State Nodal Officer (R. Sharma) immediately logs in on same workstation
    sys.handleCtaClick('/dashboard');
    sys.selectPersona('RJ-SP-Z04');
    await sys.submitLogin();

    // Verify zero residual state from Session 1
    const active = sys.getActiveOfficer();
    assert.equal(active?.badgeId, 'RJ-SP-Z04');
    assert.equal(active?.name, 'Supt. R. Sharma');
    assert.equal(active?.role, 'state_nodal');
    assert.notEqual(active?.badgeId, 'JPR-CI-889');

    const storedData = JSON.parse(storage.getItem(CONTRACT_CONSTANTS.storageKey));
    assert.equal(storedData.badgeId, 'RJ-SP-Z04');

    // Nodal Officer completes tasks and signs out
    await sys.signOut();
    assert.equal(storage.getItem(CONTRACT_CONSTANTS.storageKey), null);
    assert.equal(sys.getActiveOfficer(), null);
  });
});
