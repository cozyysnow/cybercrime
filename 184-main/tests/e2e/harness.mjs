/**
 * CyberCast Supabase Authentication Gate System
 * E2E Test Harness & Authoritative Specification Oracle
 *
 * Implements authoritative reference data, mock Supabase client,
 * mock browser environment (localStorage, CustomEvent), and
 * end-to-end state machine simulator for Tiers 1-4 tests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Authoritative Demo Accounts per ORIGINAL_REQUEST.md R1 & R2
 */
export const DEMO_ACCOUNTS = [
  {
    badgeId: 'I4C-DIR-01',
    email: 'i4c.dir01@cybercast.demo',
    password: 'CyberCast@I4C2024',
    name: 'Dr. A. K. Saxena',
    role: 'i4c_central',
    persona: 'I4C Central Directorate',
    phone: '+91 11 2343 8000'
  },
  {
    badgeId: 'RJ-SP-Z04',
    email: 'state.nodal.rj@cybercast.demo',
    password: 'CyberCast@State2024',
    name: 'Supt. R. Sharma',
    role: 'state_nodal',
    persona: 'State Cyber Nodal',
    phone: '+91 141 274 0123'
  },
  {
    badgeId: 'JPR-CI-889',
    email: 'district.jpr@cybercast.demo',
    password: 'CyberCast@District2024',
    name: 'Insp. P. Verma',
    role: 'district_cyber',
    persona: 'District Cyber Cell',
    phone: '+91 141 220 4455'
  },
  {
    badgeId: 'JPR-SI-412',
    email: 'field.si.jpr@cybercast.demo',
    password: 'CyberCast@Field2024',
    name: 'SI K. Mehta',
    role: 'field_investigator',
    persona: 'Field Investigator',
    phone: '+91 98290 12345'
  },
  {
    badgeId: 'SBI-CFC-91',
    email: 'bank.sbi.cfc@cybercast.demo',
    password: 'CyberCast@Bank2024',
    name: 'M. Agarwal (SBI Fraud)',
    role: 'bank_fi',
    persona: 'Bank Fraud Investigator',
    phone: '+91 22 2274 0000'
  }
];

export const DEMO_ACCOUNTS_BY_BADGE = Object.fromEntries(
  DEMO_ACCOUNTS.map((acc) => [acc.badgeId, acc])
);

export const DEMO_ACCOUNTS_BY_EMAIL = Object.fromEntries(
  DEMO_ACCOUNTS.map((acc) => [acc.email, acc])
);

/**
 * Authoritative Supabase Environment Config
 */
export const SUPABASE_CONFIG = {
  url: 'https://xlbdypsxinbyqthszmvi.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYmR5cHN4aW5ieXF0aHN6bXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNTksImV4cCI6MjEwNDM0MTA1OX0.W0vaJznsbAKAHIvr0d1yFaIP70rjVH8FKEPig1FP0gE'
};

/**
 * Authoritative Contract Constants
 */
export const CONTRACT_CONSTANTS = {
  storageKey: 'cybercast_officer',
  authEventName: 'cybercast_auth_change',
  buttonText: 'LOGIN',
  legacyButtonText: 'REQUEST MOBILE OTP VERIFICATION',
  selectedOfficerLabel: 'Selected Officer:',
  unknownOfficerLabel: 'Unknown Officer',
  loadingText: 'AUTHENTICATING...',
  errorMessages: {
    invalidBadge: 'Invalid Officer ID. Access Denied.',
    invalidCredentials: 'Authentication Failed. Invalid credentials.',
    requiredBadge: 'Please enter Officer ID / Badge Number'
  },
  styling: {
    obsidianBg: '#0c0c0c',
    neonAccent: '#ceff00',
    roundedNone: 'rounded-none',
    blurFilter: 'blur(8px)',
    blurClass: 'blur-[8px]',
    pointerEventsNone: 'pointer-events-none',
    zIndexModal: 'z-[999]'
  },
  protectedRoutes: ['/dashboard', '/collab']
};

/**
 * Authoritative Reference Badge Resolver
 */
export const BADGE_TO_EMAIL = Object.fromEntries(
  DEMO_ACCOUNTS.map((acc) => [acc.badgeId, acc.email])
);

export const BADGE_TO_OFFICER = Object.fromEntries(
  DEMO_ACCOUNTS.map((acc) => [
    acc.badgeId,
    {
      badgeId: acc.badgeId,
      name: acc.name,
      role: acc.role,
      persona: acc.persona,
      email: acc.email
    }
  ])
);

export function referenceResolveOfficer(badgeId) {
  if (!badgeId || typeof badgeId !== 'string') return null;
  const trimmed = badgeId.trim();
  return BADGE_TO_OFFICER[trimmed] || null;
}

export function referenceIsValidBadge(badgeId) {
  if (!badgeId || typeof badgeId !== 'string') return false;
  return Boolean(BADGE_TO_OFFICER[badgeId.trim()]);
}

/**
 * In-memory Mock LocalStorage
 */
export function createMockLocalStorage(initialStore = {}) {
  let store = { ...initialStore };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    key(index) {
      return Object.keys(store)[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
    _getRawStore() {
      return { ...store };
    }
  };
}

/**
 * Mock Event Target for Custom Events
 */
export function createMockEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(callback);
    },
    removeEventListener(event, callback) {
      if (listeners.has(event)) {
        listeners.get(event).delete(callback);
      }
    },
    dispatchEvent(event) {
      const eventType = typeof event === 'string' ? event : event.type;
      if (listeners.has(eventType)) {
        for (const cb of listeners.get(eventType)) {
          cb(event);
        }
      }
      return true;
    },
    getListenerCount(event) {
      return listeners.has(event) ? listeners.get(event).size : 0;
    }
  };
}

/**
 * Mock Supabase Client Factory
 */
export function createMockSupabaseClient(initialSession = null, options = {}) {
  let currentSession = initialSession;
  const authListeners = new Set();
  let failNextSignIn = options.failNextSignIn || false;
  let networkFailure = options.networkFailure || false;

  return {
    auth: {
      async getSession() {
        if (networkFailure) {
          return { data: { session: null }, error: new Error('Network timeout') };
        }
        return { data: { session: currentSession }, error: null };
      },
      async signInWithPassword({ email, password }) {
        if (networkFailure) {
          return { data: { user: null, session: null }, error: new Error('Fetch failed: Network error') };
        }
        if (failNextSignIn) {
          failNextSignIn = false;
          return {
            data: { user: null, session: null },
            error: { message: 'Authentication Failed. Invalid credentials.', status: 400 }
          };
        }
        const account = DEMO_ACCOUNTS_BY_EMAIL[email];
        if (!account || account.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials', status: 400 }
          };
        }
        const user = {
          id: `usr_${account.badgeId}`,
          email: account.email,
          user_metadata: {
            badgeId: account.badgeId,
            name: account.name,
            role: account.role,
            persona: account.persona
          }
        };
        currentSession = {
          access_token: `mock_jwt_token_${account.badgeId}`,
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user
        };

        // Notify auth listeners
        for (const listener of authListeners) {
          listener('SIGNED_IN', currentSession);
        }

        return { data: { user, session: currentSession }, error: null };
      },
      async signOut() {
        currentSession = null;
        for (const listener of authListeners) {
          listener('SIGNED_OUT', null);
        }
        return { error: null };
      },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              }
            }
          }
        };
      },
      // Test control helpers
      _setSession(session) {
        currentSession = session;
      },
      _setNetworkFailure(fail) {
        networkFailure = fail;
      },
      _setFailNextSignIn(fail) {
        failNextSignIn = fail;
      },
      _getListenerCount() {
        return authListeners.size;
      }
    }
  };
}

/**
 * End-to-End System Simulator
 * Orchestrates complete authentication gate lifecycle matching requirements
 */
export function createAuthGateSystem(options = {}) {
  const localStorage = options.localStorage || createMockLocalStorage();
  const eventTarget = options.eventTarget || createMockEventTarget();
  const supabase = options.supabase || createMockSupabaseClient(options.initialSession || null);

  // System UI state
  let currentRoute = options.initialRoute || '/';
  let intendedRoute = null;
  let isModalOpen = false;
  let canDismissModal = true;
  let badgeInput = '';
  let passwordInput = '';
  let selectedRole = 'i4c_central';
  let isProcessing = false;
  let errorMsg = '';
  let activeOfficer = null;

  // Sync active officer from localStorage if present
  const storedOfficerJson = localStorage.getItem(CONTRACT_CONSTANTS.storageKey);
  if (storedOfficerJson) {
    try {
      activeOfficer = JSON.parse(storedOfficerJson);
    } catch {
      activeOfficer = null;
    }
  }

  // Helper to resolve officer
  const resolve = options.resolveOfficer || referenceResolveOfficer;
  const isValid = options.isValidBadge || referenceIsValidBadge;

  return {
    // State inspection
    getCurrentRoute: () => currentRoute,
    getIntendedRoute: () => intendedRoute,
    isModalOpen: () => isModalOpen,
    canDismissModal: () => canDismissModal,
    getBadgeInput: () => badgeInput,
    getPasswordInput: () => passwordInput,
    getSelectedOfficer: () => resolve(badgeInput),
    isProcessing: () => isProcessing,
    getErrorMsg: () => errorMsg,
    getActiveOfficer: () => activeOfficer,
    getLocalStorage: () => localStorage,
    getSupabase: () => supabase,

    // Route Protection Status for Current Route
    isRouteProtected: (route = currentRoute) => {
      if (!route || typeof route !== 'string') return false;
      return CONTRACT_CONSTANTS.protectedRoutes.some(
        (pr) => route === pr || route.startsWith(`${pr}/`) || route.startsWith(`${pr}?`) || route.startsWith(`${pr}#`)
      );
    },

    isContentBlurred: () => {
      const isProtected = CONTRACT_CONSTANTS.protectedRoutes.some(
        (pr) => currentRoute === pr || currentRoute.startsWith(`${pr}/`) || currentRoute.startsWith(`${pr}?`) || currentRoute.startsWith(`${pr}#`)
      );
      return isProtected && !activeOfficer;
    },

    isPointerEventsLocked: () => {
      const isProtected = CONTRACT_CONSTANTS.protectedRoutes.some(
        (pr) => currentRoute === pr || currentRoute.startsWith(`${pr}/`) || currentRoute.startsWith(`${pr}?`) || currentRoute.startsWith(`${pr}#`)
      );
      return isProtected && !activeOfficer;
    },

    // Navigation & CTA Interception (R5)
    navigateTo(route) {
      currentRoute = route;
      const isProtected = CONTRACT_CONSTANTS.protectedRoutes.some(
        (pr) => route === pr || route.startsWith(`${pr}/`) || route.startsWith(`${pr}?`) || route.startsWith(`${pr}#`)
      );
      if (isProtected && !activeOfficer) {
        // AuthGate kicks in (R4)
        isModalOpen = true;
        canDismissModal = false; // Lock modal in place without X
      }
    },

    handleCtaClick(targetRoute) {
      const isProtected = CONTRACT_CONSTANTS.protectedRoutes.some(
        (pr) => targetRoute === pr || targetRoute.startsWith(`${pr}/`) || targetRoute.startsWith(`${pr}?`) || targetRoute.startsWith(`${pr}#`)
      );

      if (isProtected && !activeOfficer) {
        // Intercept CTA (R5)
        intendedRoute = targetRoute;
        isModalOpen = true;
        canDismissModal = true; // Modal on landing can be dismissed
        errorMsg = '';
        return { intercepted: true, intendedRoute };
      } else {
        // Seamless immediate navigation
        currentRoute = targetRoute;
        return { intercepted: false, targetRoute };
      }
    },

    // Modal Interaction (R3)
    selectPersona(badgeId) {
      if (isProcessing) return; // Controls disabled while processing
      const officer = DEMO_ACCOUNTS_BY_BADGE[badgeId];
      if (officer) {
        badgeInput = officer.badgeId;
        passwordInput = officer.password;
        selectedRole = officer.role;
        errorMsg = '';
      }
    },

    setBadgeInput(val) {
      if (isProcessing) return;
      badgeInput = val;
      errorMsg = ''; // Clearing on input change (R3)
    },

    setPasswordInput(val) {
      if (isProcessing) return;
      passwordInput = val;
      errorMsg = ''; // Clearing on input change (R3)
    },

    closeModal() {
      if (!canDismissModal) {
        // Cannot dismiss when locked by AuthGate (R4)
        return false;
      }
      isModalOpen = false;
      errorMsg = '';
      return true;
    },

    // Submit Authentication Form (R3)
    async submitLogin() {
      if (isProcessing) return { success: false, reason: 'ALREADY_PROCESSING' };

      // Pre-auth Badge Validation (R3)
      if (!badgeInput || !badgeInput.trim()) {
        errorMsg = CONTRACT_CONSTANTS.errorMessages.requiredBadge;
        return { success: false, reason: 'MISSING_BADGE', error: errorMsg };
      }

      const trimmedBadge = badgeInput.trim();
      const officer = resolve(trimmedBadge);

      if (!officer) {
        // Pre-auth rejection: Does NOT reach Supabase
        errorMsg = CONTRACT_CONSTANTS.errorMessages.invalidBadge;
        return { success: false, reason: 'INVALID_OFFICER', error: errorMsg };
      }

      // Enter loading state
      isProcessing = true;
      errorMsg = '';

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: officer.email,
          password: passwordInput
        });

        if (error || !data?.session) {
          isProcessing = false;
          errorMsg = CONTRACT_CONSTANTS.errorMessages.invalidCredentials;
          return { success: false, reason: 'INVALID_CREDENTIALS', error: errorMsg };
        }

        // Successful authentication
        isProcessing = false;
        activeOfficer = {
          badgeId: officer.badgeId,
          name: officer.name,
          role: officer.role,
          persona: officer.persona
        };

        // Persist to localStorage (R3 & Interface Contract)
        localStorage.setItem(CONTRACT_CONSTANTS.storageKey, JSON.stringify(activeOfficer));

        // Dispatch custom auth event
        eventTarget.dispatchEvent(new CustomEvent(CONTRACT_CONSTANTS.authEventName));

        // Close modal
        isModalOpen = false;
        canDismissModal = true;

        // Auto-redirect to intendedRoute (R5)
        const redirectDestination = intendedRoute || (CONTRACT_CONSTANTS.protectedRoutes.includes(currentRoute) ? currentRoute : '/dashboard');
        intendedRoute = null;
        currentRoute = redirectDestination;

        return {
          success: true,
          officer: activeOfficer,
          redirectTo: redirectDestination
        };
      } catch (err) {
        isProcessing = false;
        errorMsg = CONTRACT_CONSTANTS.errorMessages.invalidCredentials;
        return { success: false, reason: 'AUTH_EXCEPTION', error: errorMsg };
      }
    },

    // Sign Out (R6)
    async signOut() {
      await supabase.auth.signOut();
      localStorage.removeItem(CONTRACT_CONSTANTS.storageKey);
      activeOfficer = null;
      eventTarget.dispatchEvent(new CustomEvent(CONTRACT_CONSTANTS.authEventName));

      // Clean redirect to /
      currentRoute = '/';
      isModalOpen = false;
      canDismissModal = true;
      return { success: true, currentRoute };
    }
  };
}

/**
 * Helper to inspect source file content
 */
export function readProjectFile(relativePath) {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Helper to check file existence
 */
export function projectFileExists(relativePath) {
  return fs.existsSync(path.resolve(PROJECT_ROOT, relativePath));
}

/**
 * Dynamic module loader with graceful fallback
 */
export async function tryImportModule(relativePath) {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return await import(`file://${fullPath}`);
  } catch (err) {
    return { _loadError: err };
  }
}
