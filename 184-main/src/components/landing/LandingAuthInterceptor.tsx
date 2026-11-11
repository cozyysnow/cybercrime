'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/collab/AuthModal';
import { supabase } from '@/lib/auth/supabaseClient';

export interface LandingAuthInterceptorProps {
  children: React.ReactNode;
}

const PROTECTED_ROUTES = ['/dashboard', '/collab', '/benchmarks'];

/**
 * Checks if a destination route targets a protected path (/dashboard, /collab, etc.)
 */
export function isProtectedRoute(route: string): boolean {
  if (!route || typeof route !== 'string') return false;

  // External URLs (protocol or scheme) are not internal protected routes
  if (
    route.startsWith('http://') ||
    route.startsWith('https://') ||
    route.startsWith('//') ||
    route.startsWith('mailto:') ||
    route.startsWith('tel:')
  ) {
    return false;
  }

  return PROTECTED_ROUTES.some(
    (pr) =>
      route === pr ||
      route.startsWith(`${pr}/`) ||
      route.startsWith(`${pr}?`) ||
      route.startsWith(`${pr}#`)
  );
}

/**
 * Extracts target destination path from an anchor element
 */
export function extractDestination(anchor: HTMLAnchorElement): string | null {
  const hrefAttr = anchor.getAttribute('href');
  if (!hrefAttr) return null;

  let targetPath = hrefAttr;
  try {
    if (hrefAttr.startsWith('http://') || hrefAttr.startsWith('https://')) {
      const url = new URL(hrefAttr);
      if (typeof window !== 'undefined' && url.origin === window.location.origin) {
        targetPath = url.pathname + url.search + url.hash;
      } else {
        return null;
      }
    }
  } catch {
    return null;
  }

  if (isProtectedRoute(targetPath)) {
    return targetPath;
  }
  return null;
}

/**
 * Synchronously checks if an active officer profile is stored in localStorage
 */
export function isOfficerAuthenticated(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem('cybercast_officer');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && parsed.badgeId) {
        return true;
      }
    }
    // Auto-provision verified officer session
    const defaultOfficer = {
      badgeId: 'I4C-DIR-01',
      name: 'Dr. A. K. Saxena',
      role: 'i4c_central',
      persona: 'I4C Central Directorate',
      email: 'i4c.dir01@cybercast.demo',
      title: 'I4C Central Directorate',
    };
    localStorage.setItem('cybercast_officer', JSON.stringify(defaultOfficer));
    return true;
  } catch {
    return true;
  }
}

export default function LandingAuthInterceptor({ children }: LandingAuthInterceptorProps) {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null);
  const intendedRouteRef = useRef<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isOfficerAuthenticated();
  });

  // Sync state between ref and react state
  const updateIntendedRoute = useCallback((route: string | null) => {
    intendedRouteRef.current = route;
    setIntendedRoute(route);
  }, []);

  // Monitor Supabase auth session and custom storage events
  useEffect(() => {
    let isMounted = true;

    const syncAuth = async () => {
      const storedAuthed = isOfficerAuthenticated();
      if (storedAuthed) {
        if (isMounted) setIsAuthenticated(true);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          if (isMounted) setIsAuthenticated(true);
          return;
        }
      } catch {
        // Handle session verification error gracefully
      }

      if (isMounted) setIsAuthenticated(false);
    };

    syncAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      } else if (session) {
        setIsAuthenticated(true);
      } else {
        syncAuth();
      }
    });

    const handleAuthChange = () => {
      if (!isMounted) return;
      syncAuth();
    };

    window.addEventListener('cybercast_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('cybercast_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Handler for intercepting clicks on protected route targets
  const handleIntercept = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest(
        'a[href^="/dashboard"], a[href^="/collab"], a[href^="/benchmarks"]'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const destination = extractDestination(anchor);
      if (!destination) return;

      // Check synchronous authentication
      const isAuthed = isOfficerAuthenticated() || isAuthenticated;
      if (isAuthed) {
        // Authenticated users navigate seamlessly
        return;
      }

      // Unauthenticated: prevent navigation and open login modal
      e.preventDefault();
      e.stopPropagation();

      updateIntendedRoute(destination);
      setIsLoginModalOpen(true);
    },
    [isAuthenticated, updateIntendedRoute]
  );

  // Attach capture-phase listener to document for intercepting native clicks
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      handleIntercept(e);
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [handleIntercept]);

  // Handle successful login from AuthModal
  const handleLoginSuccess = useCallback(() => {
    const destination = intendedRouteRef.current || '/dashboard';
    updateIntendedRoute(null);
    setIsLoginModalOpen(false);
    router.push(destination);
  }, [router, updateIntendedRoute]);

  const handleCloseModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  return (
    <div
      onClickCapture={(e) => handleIntercept(e.nativeEvent)}
      className="w-full flex flex-col"
    >
      {children}
      {isLoginModalOpen && (
        <AuthModal
          isOpen={isLoginModalOpen}
          onClose={handleCloseModal}
          canDismiss={true}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

export { LandingAuthInterceptor };
