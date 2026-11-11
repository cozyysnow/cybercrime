'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/collab/AuthModal';
import { supabase } from '@/lib/auth/supabaseClient';
import { 
  Shield, 
  Map, 
  BarChart2, 
  Users, 
  FileCheck2, 
  LogIn, 
  LogOut, 
  Menu, 
  X,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface OfficerSession {
  badgeId: string;
  name: string;
  role?: string;
  persona?: string;
  email?: string;
}

export default function HeaderNav() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [officer, setOfficer] = useState<OfficerSession | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncAuth = async () => {
      let currentOfficer: OfficerSession | null = null;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cybercast_officer');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && parsed.badgeId) {
              currentOfficer = parsed as OfficerSession;
            }
          }
        } catch {
          currentOfficer = null;
        }
      }

      if (currentOfficer) {
        if (isMounted) {
          setOfficer(currentOfficer);
          setIsAuthenticated(true);
        }
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          if (isMounted) {
            setIsAuthenticated(true);
            if (typeof window !== 'undefined') {
              try {
                const stored2 = localStorage.getItem('cybercast_officer');
                if (stored2) {
                  const parsed2 = JSON.parse(stored2);
                  if (parsed2 && typeof parsed2 === 'object' && parsed2.badgeId) {
                    setOfficer(parsed2 as OfficerSession);
                  }
                }
              } catch {
                // ignore
              }
            }
          }
          return;
        }
      } catch (err) {
        console.warn('HeaderNav: error verifying session:', err);
      }

      if (isMounted) {
        setOfficer(null);
        setIsAuthenticated(false);
      }
    };

    syncAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setOfficer(null);
        setIsAuthenticated(false);
      } else if (session) {
        syncAuth();
      } else {
        syncAuth();
      }
    });

    const handleAuthChange = () => {
      if (!isMounted) return;
      syncAuth();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (!isMounted) return;
      if (e.key === 'cybercast_officer' || !e.key) {
        syncAuth();
      }
    };

    window.addEventListener('cybercast_auth_change', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('cybercast_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during signOut:', err);
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cybercast_officer');
      }
    } catch (err) {
      console.error('Error removing cybercast_officer:', err);
    }

    setOfficer(null);
    setIsAuthenticated(false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cybercast_auth_change'));
    }

    try {
      router.push('/');
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-colors">
        <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-full items-center justify-between gap-4">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 overflow-hidden shadow-xs">
                  <Image
                    src="/logos/cybercast.png"
                    alt="CyberCast Logo"
                    width={32}
                    height={32}
                    className="h-7 w-7 object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                      Cyber<span className="text-blue-600">Cast</span>
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                      PRO
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium tracking-normal mt-0.5">
                    Predictive Cybercrime Defence
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Map className="w-4 h-4 text-slate-400" />
                  <span>Radar Map</span>
                </Link>

                <Link
                  href="/benchmarks"
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <BarChart2 className="w-4 h-4 text-slate-400" />
                  <span>Model Predictions</span>
                </Link>

                <Link
                  href="/collab"
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Inter-State Collab</span>
                </Link>

                <Link
                  href="/verify"
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4 text-slate-400" />
                  <span>Evidence Ledger</span>
                </Link>
              </nav>
            </div>

            {/* Right Group: Telemetry Status + Auth & CTA */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>AI Pipeline Active</span>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {officer && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                      title={`Authenticated: ${officer.name} (${officer.persona || officer.role || 'Officer'})`}
                    >
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      <span className="font-semibold text-slate-900">{officer.badgeId}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-700 truncate max-w-[120px]">{officer.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Sign In / Demo Login"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Officer Login</span>
                </button>
              )}

              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5"
              >
                <span>Launch Dashboard</span>
                <span>→</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
              >
                <Map className="w-4 h-4 text-blue-600" />
                <span>Radar Map Dashboard</span>
              </Link>
              <Link
                href="/benchmarks"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
              >
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>Model Predictions & Validation</span>
              </Link>
              <Link
                href="/collab"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Inter-State Collaboration</span>
              </Link>
              <Link
                href="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
              >
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>Digital Evidence Ledger</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-200">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                    <span className="font-semibold text-slate-900">{officer?.badgeId}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span>{officer?.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Officer Login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}
