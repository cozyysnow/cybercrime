'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Shield, Bell, Lock, User, Clock, AlertTriangle, 
  Fingerprint, ChevronDown, CheckCircle2, ArrowLeft,
  Radio, LogOut, FileText, Map, RefreshCw, ShieldCheck
} from 'lucide-react';
import { OfficerRole, OFFICER_ROLES, OfficerProfile } from '@/data/collabData';
import { getModelHealth, ModelHealthStatus } from '@/lib/apiService';
import { checkAdbDeviceStatus, AdbDeviceStatus } from '@/lib/hardwareService';
import { supabase } from '@/lib/auth/supabaseClient';

interface OfficerSession {
  badgeId: string;
  name: string;
  role?: string;
  persona?: string;
  email?: string;
}

interface CollabHeaderProps {
  currentRole: OfficerRole;
  onRoleChange: (role: OfficerRole) => void;
  unreadCount?: number;
  onOpenAuthModal?: () => void;
  onLoginClick?: () => void;
}

export default function CollabHeader({
  currentRole,
  onRoleChange,
  unreadCount = 3,
  onOpenAuthModal,
  onLoginClick,
}: CollabHeaderProps) {
  const router = useRouter();
  const triggerAuthModal = onLoginClick || onOpenAuthModal || (() => {});
  const [istTime, setIstTime] = useState('');
  const [sessionSeconds, setSessionSeconds] = useState(900); // 15 minutes auto-logout
  const [modelHealth, setModelHealth] = useState<ModelHealthStatus | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [officer, setOfficer] = useState<OfficerSession | null>(null);

  // Poll Model API Health every 60s
  const refreshHealth = React.useCallback(async () => {
    try {
      const health = await getModelHealth();
      setModelHealth(health);
    } catch (e) {
      console.warn('Collab header health poll failed:', e);
    }
  }, []);

  // Poll USB ADB Hardware status every 12s
  const [hardwareStatus, setHardwareStatus] = useState<AdbDeviceStatus | null>(null);
  const refreshHardware = React.useCallback(async () => {
    try {
      const st = await checkAdbDeviceStatus();
      setHardwareStatus(st);
    } catch (e) {
      console.warn('Collab header hardware poll failed:', e);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    refreshHardware();
    const timerHealth = setInterval(refreshHealth, 60000);
    const timerHw = setInterval(refreshHardware, 12000);
    return () => {
      clearInterval(timerHealth);
      clearInterval(timerHw);
    };
  }, [refreshHealth, refreshHardware]);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Inter-State Help Request Received',
      sub: 'Rajasthan Cyber Cell requests ATM CCTV logs for Case CY-44521',
      time: '2 mins ago',
      level: 'Critical',
      read: false,
    },
    {
      id: 2,
      title: 'Funds Freeze Confirmed',
      sub: 'SBI confirmed ₹1.85 Lakhs frozen in PNB account #XXXX1102',
      time: '14 mins ago',
      level: 'High',
      read: false,
    },
    {
      id: 3,
      title: 'Task Overdue Escalation',
      sub: 'Patna Tower Dump analysis TSK-2026-085 has passed 4-hour SLA',
      time: '45 mins ago',
      level: 'Critical',
      read: false,
    },
  ]);

  const activeOfficer = OFFICER_ROLES[currentRole];

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      };
      setIstTime(now.toLocaleDateString('en-GB', options).toUpperCase() + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 15-min Session Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor Supabase Auth & LocalStorage Session
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
        console.warn('CollabHeader: error checking session:', err);
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
      console.error('Error during signOut in CollabHeader:', err);
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

  const formatSessionTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 select-none z-50 text-slate-800 font-sans shadow-xs">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left Identity: Brand, Logos & Portal Return */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            title="Return to CyberCast Portal"
          >
            <div className="relative h-8 w-8 flex-shrink-0 flex items-center justify-center bg-slate-50 rounded-lg p-1 border border-slate-200 shadow-xs">
              <Image
                src="/logos/cybercast.png"
                alt="CyberCast Logo"
                width={26}
                height={26}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Cyber<span className="text-blue-600">Cast</span>
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                Inter-Agency Command & Dossier Hub
              </span>
            </div>
          </Link>

          {/* Institutional Emblems */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-1.5" title="Ministry of Home Affairs">
              <Image
                src="/logos/emblem_india.svg"
                alt="MHA"
                width={16}
                height={16}
                className="h-4 w-auto"
              />
              <span className="text-xs text-slate-600 font-medium">MHA</span>
            </div>
            <span className="text-slate-300 text-xs">/</span>
            <div className="flex items-center gap-1.5" title="Indian Cyber Crime Coordination Centre">
              <Image
                src="/logos/i4c.png"
                alt="I4C"
                width={20}
                height={16}
                className="h-4 w-auto"
              />
              <span className="text-xs text-slate-600 font-medium">I4C</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 sm:gap-1.5 pl-4 border-l border-slate-200">
            <Link
              href="/"
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
              <span>Portal</span>
            </Link>

            <Link
              href="/dashboard"
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Map className="h-3.5 w-3.5 text-slate-400" />
              <span>Radar Map</span>
            </Link>

            <Link
              href="/benchmarks"
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Predictions</span>
            </Link>

            <Link
              href="/verify"
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Public Judicial Verification Portal"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>Verify</span>
            </Link>

            <div className="px-2.5 py-1 text-blue-700 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold flex items-center gap-1.5 ml-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span>Collab Active</span>
            </div>
          </div>

          {/* Telemetry Status Bar */}
          <div className="hidden xl:flex items-center gap-3 pl-4 border-l border-slate-200 text-xs">
            {/* Live Model Badge */}
            <div 
              onClick={refreshHealth}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors py-1 select-none"
              title={`ML Engine Status: ${modelHealth?.status === 'healthy' ? '5/5 Models Active' : 'Offline / Cached'}`}
            >
              <span className={`h-2 w-2 rounded-full ${
                modelHealth?.status === 'healthy' ? 'bg-emerald-500' :
                modelHealth?.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span className="text-[11px] font-medium">
                {modelHealth?.status === 'healthy' ? (
                  <>AI Engine: <strong className="text-emerald-700">{modelHealth.modelsLoadedCount}/5 Live</strong></>
                ) : (
                  <span className="text-amber-700">AI Engine: Cached</span>
                )}
              </span>
            </div>

            {/* Polygon Ledger Synced Indicator */}
            <Link
              href="/verify"
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors py-1 select-none text-[11px] font-medium"
              title="Polygon Amoy Ledger: Synced (Block Finality 2.1s)"
            >
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>Ledger: <strong className="text-blue-700">Synced</strong></span>
            </Link>

            {/* USB ADB Hardware Bridge Status Indicator */}
            <div
              onClick={refreshHardware}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors py-1 text-[11px] font-medium"
              title={
                hardwareStatus?.connected
                  ? `ADB Hardware Bridge: ${hardwareStatus.deviceId} (${hardwareStatus.model || 'Android'}). Method A Live Intent Active.`
                  : 'ADB Hardware Bridge: Simulation Mode'
              }
            >
              <span className={`h-2 w-2 rounded-full ${
                hardwareStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <span>
                {hardwareStatus?.connected ? (
                  <>USB: <strong className="text-emerald-700">{hardwareStatus.deviceId}</strong></>
                ) : (
                  <>USB: <strong className="text-amber-700">Sim</strong></>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Center Live IST Clock & Session Security */}
        <div className="hidden 2xl:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-mono">{istTime || 'Loading IST...'}</span>
          </div>

          {/* Auto-logout countdown */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pl-4 border-l border-slate-200">
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>Session: <strong className="text-slate-800 font-mono">{formatSessionTime(sessionSeconds)}</strong></span>
            <button
              onClick={() => setSessionSeconds(900)}
              className="text-blue-600 hover:underline text-xs font-medium ml-1"
              title="Reset 15-min Session Timer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right Section: Role Switcher & Profile & Notifications */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Role Switcher Dropdown (5 Operational Tiers) */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2 text-xs transition-colors cursor-pointer"
              title="Switch Operational Role for Evaluation"
            >
              <Shield className="h-4 w-4 text-blue-600" />
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Role Tier
                </div>
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {activeOfficer.roleName}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-xs">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-2 py-1.5 border-b border-slate-100 mb-1">
                  Switch Operational Access Tier
                </div>
                {(Object.keys(OFFICER_ROLES) as OfficerRole[]).map((rKey) => {
                  const rProf = OFFICER_ROLES[rKey];
                  const isSelected = rKey === currentRole;
                  return (
                    <button
                      key={rKey}
                      onClick={() => {
                        onRoleChange(rKey);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border mb-1 flex items-start gap-2.5 transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200 text-slate-900' 
                          : 'bg-white border-transparent text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        rKey === 'i4c_admin' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                        rKey === 'state_nodal' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
                        rKey === 'district_officer' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                        rKey === 'field_investigator' ? 'text-red-700 bg-red-50 border-red-200' :
                        'text-cyan-700 bg-cyan-50 border-cyan-200'
                      }`}>
                        {rProf.badgeNumber}
                      </span>
                      <div className="flex-1 truncate">
                        <div className="font-semibold text-slate-900 text-xs">{rProf.roleName}</div>
                        <div className="text-slate-500 text-[11px] truncate">{rProf.name} • {rProf.department}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer"
              title="Operational Alerts & Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="text-xs font-semibold text-slate-900">
                    Notifications ({notifications.filter(n => !n.read).length})
                  </span>
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-xl border text-xs ${
                        notif.read ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-red-50/30 border-red-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${notif.level === 'Critical' ? 'text-red-700' : 'text-amber-700'}`}>
                          [{notif.level}] {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{notif.time}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">{notif.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Biometric / Login Authenticator Trigger or Sign Out */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {officer && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-700 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono font-bold text-slate-900">{officer.badgeId}</span>
                  <span className="text-slate-300">|</span>
                  <span className="truncate max-w-[120px]">{officer.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                title="Sign out and terminate session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={triggerAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Official Law Enforcement Credentials"
            >
              <Fingerprint className="h-3.5 w-3.5" />
              <span>Officer Login</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
