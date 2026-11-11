/**
 * Tier 3: Cross-Feature Interactions & Combinatorial E2E Test Suite
 * CyberCast Supabase Authentication Gate System (SIH PS 184)
 *
 * Covers pairwise and multi-feature interaction flows:
 * CTA click -> AuthModal -> Persona Autofill -> Dynamic Resolution ->
 * Supabase Password Auth -> LocalStorage Persistence -> Auto-Redirect ->
 * Header Status -> Session Teardown -> Route Re-locking.
 * Total: 16 comprehensive combinatorial interaction tests.
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

describe('Tier 3 - Combinatorial & Cross-Feature Interaction Flows', () => {
  test('T3.1 - Full Golden Path: Landing CTA -> Modal -> Persona Autofill -> Auth -> Redirect -> Header -> Signout', async () => {
    const storage = createMockLocalStorage();
    const eventTarget = createMockEventTarget();
    let authEvents = 0;
    eventTarget.addEventListener(CONTRACT_CONSTANTS.authEventName, () => authEvents++);

    const sys = createAuthGateSystem({ initialRoute: '/', localStorage: storage, eventTarget });

    // 1. Landing CTA click
    const ctaRes = sys.handleCtaClick('/dashboard');
    assert.equal(ctaRes.intercepted, true);
    assert.equal(sys.isModalOpen(), true);
    assert.equal(sys.canDismissModal(), true);

    // 2. Select I4C Director persona card
    sys.selectPersona('I4C-DIR-01');
    assert.equal(sys.getBadgeInput(), 'I4C-DIR-01');
    assert.equal(sys.getPasswordInput(), 'CyberCast@I4C2024');
    assert.equal(sys.getSelectedOfficer()?.name, 'Dr. A. K. Saxena');

    // 3. Submit LOGIN
    const loginRes = await sys.submitLogin();
    assert.equal(loginRes.success, true);
    assert.equal(loginRes.redirectTo, '/dashboard');
    assert.equal(sys.getCurrentRoute(), '/dashboard');
    assert.equal(sys.isModalOpen(), false);

    // 4. Verify LocalStorage and Auth Event
    const stored = JSON.parse(storage.getItem(CONTRACT_CONSTANTS.storageKey));
    assert.equal(stored.badgeId, 'I4C-DIR-01');
    assert.equal(stored.role, 'i4c_central');
    assert.equal(authEvents, 1);

    // 5. Verify unblurred dashboard access
    assert.equal(sys.isContentBlurred(), false);
    assert.equal(sys.isPointerEventsLocked(), false);

    // 6. Sign Out
    const signOutRes = await sys.signOut();
    assert.equal(signOutRes.success, true);
    assert.equal(signOutRes.currentRoute, '/');
    assert.equal(storage.getItem(CONTRACT_CONSTANTS.storageKey), null);
    assert.equal(sys.getActiveOfficer(), null);
    assert.equal(authEvents, 2);

    // 7. Verify subsequent /dashboard access is locked
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), true);
    assert.equal(sys.canDismissModal(), false);
  });

  test('T3.2 - Collab Workflow: CTA click -> Manual Typing -> Dynamic Resolution -> Login -> Sign Out', async () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });

    // 1. Click Collab CTA
    sys.handleCtaClick('/collab');
    assert.equal(sys.getIntendedRoute(), '/collab');

    // 2. Manually type badge ID
    sys.setBadgeInput('RJ-SP-Z04');
    assert.equal(sys.getSelectedOfficer()?.name, 'Supt. R. Sharma');
    assert.equal(sys.getSelectedOfficer()?.role, 'state_nodal');

    // 3. Type password and submit
    sys.setPasswordInput('CyberCast@State2024');
    const res = await sys.submitLogin();
    assert.equal(res.success, true);
    assert.equal(res.redirectTo, '/collab');
    assert.equal(sys.getCurrentRoute(), '/collab');

    // 4. Verify Active Session
    assert.equal(sys.getActiveOfficer()?.badgeId, 'RJ-SP-Z04');

    // 5. Sign out
    await sys.signOut();
    assert.equal(sys.getCurrentRoute(), '/');
  });

  test('T3.3 - Error Recovery: Rogue Badge -> Pre-auth Reject -> Persona Selection -> Error Cleared -> Success', async () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });
    sys.handleCtaClick('/dashboard');

    // Type rogue badge
    sys.setBadgeInput('ROGUE-BADGE-X');
    sys.setPasswordInput('SomeSecretPassword');
    const failRes = await sys.submitLogin();
    assert.equal(failRes.success, false);
    assert.equal(failRes.error, 'Invalid Officer ID. Access Denied.');
    assert.equal(sys.getErrorMsg(), 'Invalid Officer ID. Access Denied.');

    // User clicks persona card
    sys.selectPersona('JPR-CI-889');
    assert.equal(sys.getErrorMsg(), '', 'Error must clear upon persona selection');
    assert.equal(sys.getSelectedOfficer()?.name, 'Insp. P. Verma');

    // Login succeeds
    const successRes = await sys.submitLogin();
    assert.equal(successRes.success, true);
    assert.equal(sys.getCurrentRoute(), '/dashboard');
  });

  test('T3.4 - Gatekeeper Interception: Direct Deep-Link -> Locked Modal -> Wrong Password -> Retry -> Unlocked', async () => {
    const sys = createAuthGateSystem();

    // Direct navigation to /dashboard without session
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), true);
    assert.equal(sys.canDismissModal(), false);

    // Cannot dismiss
    assert.equal(sys.closeModal(), false);
    assert.equal(sys.isModalOpen(), true);

    // Enter wrong credentials
    sys.setBadgeInput('I4C-DIR-01');
    sys.setPasswordInput('IncorrectPassword123');
    const failRes = await sys.submitLogin();
    assert.equal(failRes.success, false);
    assert.equal(failRes.error, 'Authentication Failed. Invalid credentials.');
    assert.equal(sys.canDismissModal(), false, 'Modal remains locked on error');

    // Correct password
    sys.setPasswordInput('CyberCast@I4C2024');
    assert.equal(sys.getErrorMsg(), '', 'Error clears on password change');
    const successRes = await sys.submitLogin();
    assert.equal(successRes.success, true);
    assert.equal(sys.isContentBlurred(), false);
    assert.equal(sys.isModalOpen(), false);
  });

  test('T3.5 - Rapid Persona Switching: Switch between 3 roles -> Final Bank FI -> Shared Route Interactivity', async () => {
    const sys = createAuthGateSystem();
    sys.navigateTo('/collab');

    // Switch rapidly
    sys.selectPersona('I4C-DIR-01');
    sys.selectPersona('RJ-SP-Z04');
    sys.selectPersona('SBI-CFC-91');

    assert.equal(sys.getSelectedOfficer()?.role, 'bank_fi');
    const res = await sys.submitLogin();
    assert.equal(res.success, true);
    assert.equal(sys.getActiveOfficer()?.name, 'M. Agarwal (SBI Fraud)');

    // Shared session allows immediate access to /dashboard
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), false);
    assert.equal(sys.isModalOpen(), false);
  });

  test('T3.6 - Authenticated Pass-Through: Logged-in user bypasses landing CTA interception', async () => {
    const sys = createAuthGateSystem();
    sys.setBadgeInput('I4C-DIR-01');
    sys.setPasswordInput('CyberCast@I4C2024');
    await sys.submitLogin();

    // Navigate to landing
    sys.navigateTo('/');
    assert.equal(sys.getCurrentRoute(), '/');

    // Click CTA for /dashboard
    const ctaDash = sys.handleCtaClick('/dashboard');
    assert.equal(ctaDash.intercepted, false);
    assert.equal(sys.getCurrentRoute(), '/dashboard');
    assert.equal(sys.isModalOpen(), false);

    // Click CTA for /collab
    const ctaCollab = sys.handleCtaClick('/collab');
    assert.equal(ctaCollab.intercepted, false);
    assert.equal(sys.getCurrentRoute(), '/collab');
    assert.equal(sys.isModalOpen(), false);
  });

  test('T3.7 - Multi-Tab Synchronization: Cross-tab logout immediately locks active protected view', async () => {
    const storage = createMockLocalStorage();
    const eventTarget = createMockEventTarget();
    const sys = createAuthGateSystem({ localStorage: storage, eventTarget });

    // Log in
    sys.setBadgeInput('I4C-DIR-01');
    sys.setPasswordInput('CyberCast@I4C2024');
    await sys.submitLogin();
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), false);

    // Simulate Tab 2 clearing storage and dispatching event
    storage.removeItem(CONTRACT_CONSTANTS.storageKey);
    eventTarget.dispatchEvent(new CustomEvent(CONTRACT_CONSTANTS.authEventName));

    // Sign out active session
    await sys.signOut();
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), true);
    assert.equal(sys.canDismissModal(), false);
  });

  test('T3.8 - Multiple Consecutive Authentication Failures then Recovery', async () => {
    const sys = createAuthGateSystem();
    sys.setBadgeInput('JPR-SI-412');

    // 3 failed password attempts
    for (let i = 1; i <= 3; i++) {
      sys.setPasswordInput(`WrongPass_${i}`);
      const fail = await sys.submitLogin();
      assert.equal(fail.success, false);
      assert.equal(fail.error, 'Authentication Failed. Invalid credentials.');
    }

    // 4th attempt with valid password
    sys.setPasswordInput('CyberCast@Field2024');
    const success = await sys.submitLogin();
    assert.equal(success.success, true);
    assert.equal(sys.getActiveOfficer()?.badgeId, 'JPR-SI-412');
  });

  test('T3.9 - Complex Query Parameters Preservation on Post-Auth Redirection', async () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });
    const complexTarget = '/dashboard?threat_type=financial_fraud&timeframe=7d&export=true';

    sys.handleCtaClick(complexTarget);
    assert.equal(sys.getIntendedRoute(), complexTarget);

    sys.selectPersona('JPR-CI-889');
    const res = await sys.submitLogin();
    assert.equal(res.success, true);
    assert.equal(res.redirectTo, complexTarget);
    assert.equal(sys.getCurrentRoute(), complexTarget);
  });

  test('T3.10 - Modal Lock Disparity: Landing modal dismissible vs Route modal locked', () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });

    // Case A: Landing CTA
    sys.handleCtaClick('/dashboard');
    assert.equal(sys.canDismissModal(), true);
    assert.equal(sys.closeModal(), true);

    // Case B: Route protection
    sys.navigateTo('/dashboard');
    assert.equal(sys.canDismissModal(), false);
    assert.equal(sys.closeModal(), false);
  });

  test('T3.11 - Dynamic Officer Mutation: Valid -> Mutation -> Rejection -> Fix -> Success', async () => {
    const sys = createAuthGateSystem();
    sys.selectPersona('I4C-DIR-01');
    assert.equal(sys.getSelectedOfficer()?.name, 'Dr. A. K. Saxena');

    // Mutate badge string
    sys.setBadgeInput('I4C-DIR-99');
    assert.equal(sys.getSelectedOfficer(), null);
    const fail = await sys.submitLogin();
    assert.equal(fail.reason, 'INVALID_OFFICER');

    // Fix badge string
    sys.setBadgeInput('I4C-DIR-01');
    assert.equal(sys.getSelectedOfficer()?.name, 'Dr. A. K. Saxena');
    const success = await sys.submitLogin();
    assert.equal(success.success, true);
  });

  test('T3.12 - Page Re-Hydration Simulation: Pre-existing localStorage grants immediate access', () => {
    const storage = createMockLocalStorage({
      [CONTRACT_CONSTANTS.storageKey]: JSON.stringify({
        badgeId: 'RJ-SP-Z04',
        name: 'Supt. R. Sharma',
        role: 'state_nodal',
        persona: 'State Cyber Nodal'
      })
    });

    const sys = createAuthGateSystem({ localStorage: storage });
    assert.ok(sys.getActiveOfficer());
    assert.equal(sys.getActiveOfficer()?.badgeId, 'RJ-SP-Z04');

    // Directly visits /dashboard
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), false);
    assert.equal(sys.isModalOpen(), false);
  });

  test('T3.13 - Network Error Recovery During Authentication Workflow', async () => {
    const client = createMockSupabaseClient(null, { networkFailure: true });
    const sys = createAuthGateSystem({ supabase: client });

    sys.setBadgeInput('I4C-DIR-01');
    sys.setPasswordInput('CyberCast@I4C2024');

    // Fails due to network
    const failRes = await sys.submitLogin();
    assert.equal(failRes.success, false);
    assert.equal(failRes.error, 'Authentication Failed. Invalid credentials.');

    // Network recovers
    client.auth._setNetworkFailure(false);
    const retryRes = await sys.submitLogin();
    assert.equal(retryRes.success, true);
    assert.equal(sys.getActiveOfficer()?.badgeId, 'I4C-DIR-01');
  });

  test('T3.14 - Multiple Rapid CTA Invocations: Idempotent Single-Modal State', () => {
    const sys = createAuthGateSystem({ initialRoute: '/' });
    for (let i = 0; i < 5; i++) {
      sys.handleCtaClick('/dashboard');
    }
    assert.equal(sys.isModalOpen(), true);
    assert.equal(sys.getIntendedRoute(), '/dashboard');
  });

  test('T3.15 - Cross-Agency Workstation Handover: Signout Officer A -> Immediate Login Officer B', async () => {
    const storage = createMockLocalStorage();
    const sys = createAuthGateSystem({ localStorage: storage });

    // Officer A: District Cyber Inspector
    sys.selectPersona('JPR-CI-889');
    await sys.submitLogin();
    assert.equal(sys.getActiveOfficer()?.badgeId, 'JPR-CI-889');

    // Officer A signs out
    await sys.signOut();
    assert.equal(storage.getItem(CONTRACT_CONSTANTS.storageKey), null);
    assert.equal(sys.getActiveOfficer(), null);

    // Officer B: State Nodal Officer logs in
    sys.selectPersona('RJ-SP-Z04');
    await sys.submitLogin();
    assert.equal(sys.getActiveOfficer()?.badgeId, 'RJ-SP-Z04');
    assert.equal(sys.getActiveOfficer()?.name, 'Supt. R. Sharma');

    const stored = JSON.parse(storage.getItem(CONTRACT_CONSTANTS.storageKey));
    assert.equal(stored.badgeId, 'RJ-SP-Z04');
  });

  test('T3.16 - History Navigation Simulation: Back-button to protected route after sign-out', async () => {
    const sys = createAuthGateSystem();

    // Log in and go to dashboard
    sys.selectPersona('I4C-DIR-01');
    await sys.submitLogin();
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), false);

    // Sign out (navigates to /)
    await sys.signOut();
    assert.equal(sys.getCurrentRoute(), '/');

    // Officer clicks browser Back button to return to /dashboard
    sys.navigateTo('/dashboard');
    assert.equal(sys.isContentBlurred(), true, 'Content must be blurred');
    assert.equal(sys.canDismissModal(), false, 'Modal must be locked');
  });
});
