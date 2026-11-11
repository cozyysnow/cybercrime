'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import { supabase } from '@/lib/auth/supabaseClient';
import AuthModal from '@/components/collab/AuthModal';

export interface AuthGateProps {
  children: React.ReactNode;
}

// Isomorphic layout effect to run synchronously before paint on the client
// while avoiding SSR warnings on the server.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const DEFAULT_OFFICER = {
  badgeId: 'I4C-DIR-01',
  name: 'Dr. A. K. Saxena',
  role: 'i4c_central',
  persona: 'I4C Central Directorate',
  email: 'i4c.dir01@cybercast.demo',
  title: 'I4C Central Directorate',
};

export function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Synchronously ensure officer profile exists in localStorage before initial paint
  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cybercast_officer');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && parsed.badgeId) {
            setIsAuthenticated(true);
            return;
          }
        }
        // Auto-provision default verified officer session so dashboard and tabs are never blocked
        localStorage.setItem('cybercast_officer', JSON.stringify(DEFAULT_OFFICER));
        window.dispatchEvent(new Event('cybercast_auth_change'));
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const evaluateAuth = async () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cybercast_officer');
          if (!stored) {
            localStorage.setItem('cybercast_officer', JSON.stringify(DEFAULT_OFFICER));
            window.dispatchEvent(new Event('cybercast_auth_change'));
          }
        } catch {
          // ignore
        }
      }
      if (isMounted) {
        setIsAuthenticated(true);
      }
    };

    evaluateAuth();

    const handleAuthChange = () => {
      if (!isMounted) return;
      evaluateAuth();
    };

    window.addEventListener('cybercast_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener('cybercast_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Ensure children render directly and are always fully interactive
  return <>{children}</>;
}

export default AuthGate;
