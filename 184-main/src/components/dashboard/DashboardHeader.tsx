'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Bell, User, AlertTriangle, CheckCircle, 
  MapPin, Clock, Shield, ExternalLink, X, ChevronDown, LogOut,
  ArrowLeft, Radio, BarChart2, CheckCircle2
} from 'lucide-react';
import { 
  ATMS_DATA, 
  ACTIVE_INCIDENTS_DATA, 
  PREDICTED_HOTSPOTS_DATA, 
  LIVE_ALERTS_DATA 
} from '@/data/dashboardData';
import { getModelHealth, ModelHealthStatus } from '@/lib/apiService';
import { supabase } from '@/lib/auth/supabaseClient';

interface OfficerSession {
  badgeId: string;
  name: string;
  role?: string;
  persona?: string;
  email?: string;
}

interface DashboardHeaderProps {
  onSelectEntity?: (type: string, id: string, coords: [number, number], zoom?: number) => void;
  onTriggerSOS?: () => void;
  unreadCount?: number;
}

export default function DashboardHeader({
  onSelectEntity,
  onTriggerSOS,
  unreadCount = 3,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [istTime, setIstTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [alerts, setAlerts] = useState(LIVE_ALERTS_DATA);
  const [modelHealth, setModelHealth] = useState<ModelHealthStatus | null>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [officer, setOfficer] = useState<OfficerSession | null>(null);

  // Poll Model API Health every 60s
  const refreshHealth = React.useCallback(async () => {
    setIsRefreshingHealth(true);
    try {
      const health = await getModelHealth();
      setModelHealth(health);
    } catch (e) {
      console.warn('Failed to poll health:', e);
    } finally {
      setIsRefreshingHealth(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 60000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

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
      setIstTime(now.toLocaleString('en-IN', options).toUpperCase() + ' IST');
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
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
        console.warn('DashboardHeader: error verifying session:', err);
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

  // Global Search Suggestions
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();

    const results: Array<{
      type: 'CASE' | 'ATM' | 'ZONE' | 'PHONE' | 'ACCOUNT';
      title: string;
      subtitle: string;
      coords: [number, number];
      id: string;
    }> = [];

    // Search Incidents & Cases
    ACTIVE_INCIDENTS_DATA.forEach(inc => {
      if (inc.id.toLowerCase().includes(q) || inc.fraudType.toLowerCase().includes(q) || inc.victimLocation.toLowerCase().includes(q)) {
        results.push({
          type: 'CASE',
          title: inc.id,
          subtitle: `${inc.fraudType} • ${inc.amountFormatted} • ${inc.victimLocation}`,
          coords: [inc.lat, inc.lng],
          id: inc.id,
        });
      }
    });

    // Search ATMs
    ATMS_DATA.forEach(atm => {
      if (atm.id.toLowerCase().includes(q) || atm.bank.toLowerCase().includes(q) || atm.address.toLowerCase().includes(q) || atm.zone.toLowerCase().includes(q)) {
        results.push({
          type: 'ATM',
          title: `${atm.bank} (${atm.id})`,
          subtitle: `${atm.address} • Risk ${atm.riskScore}/100`,
          coords: [atm.lat, atm.lng],
          id: atm.id,
        });
      }
    });

    // Search Zones / Hotspots
    PREDICTED_HOTSPOTS_DATA.forEach(spot => {
      if (spot.name.toLowerCase().includes(q)) {
        results.push({
          type: 'ZONE',
          title: spot.name,
          subtitle: `Confidence ${spot.confidence}% • Window: ${spot.timeWindow}`,
          coords: [spot.lat, spot.lng],
          id: spot.id,
        });
      }
    });

    // Suspect Phone / Account match
    if (q.includes('98') || q.includes('phone') || q.includes('94')) {
      results.push({
        type: 'PHONE',
        title: '+91 94140 88219 [Suspect Mule CDR]',
        subtitle: 'Linked to 3 complaints • Last tower: Jaipur Sindhi Camp',
        coords: [26.9215, 75.7968],
        id: 'PHONE-MULE-88',
      });
    }

    if (q.includes('mule') || q.includes('sbi') || q.includes('account') || q.includes('44')) {
      results.push({
        type: 'ACCOUNT',
        title: 'A/C 38291048291 (SBI Sindhi Camp)',
        subtitle: 'Flagged by CFCFRMS • Layer 2 mule account • ₹14.8L transit',
        coords: [26.9218, 75.7960],
        id: 'ACC-MULE-3829',
      });
    }

    return results.slice(0, 7);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: typeof searchResults[0]) => {
    if (onSelectEntity) {
      onSelectEntity(result.type, result.id, result.coords, 16);
    }
    setSearchQuery('');
    setSearchResultsOpen(false);
  };

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  };

  return (
    <header className="relative z-50 w-full h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between gap-3 text-slate-800 select-none shadow-2xs">
      
      {/* LEFT: Project Brand & Institutional Badges */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-7 w-7 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 overflow-hidden shadow-2xs">
            <Image
              src="/logos/cybercast.png"
              alt="CyberCast Logo"
              width={26}
              height={26}
              className="h-full w-full object-contain p-0.5"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 leading-none">
              <span className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Cyber<span className="text-blue-600">Cast</span>
              </span>
              <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                RADAR
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium hidden md:block">
              Predictive Incident Dashboard
            </span>
          </div>
        </Link>

        {/* Live IST Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-600">
          <Clock className="h-3.5 w-3.5 text-blue-600" />
          <span>{istTime || 'Synchronizing IST...'}</span>
        </div>

        {/* Live ML Model Status Telemetry Indicator */}
        <div 
          onClick={refreshHealth}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border bg-slate-50 hover:bg-slate-100 border-slate-200"
          title={`Click to re-ping model API (Lat: ${modelHealth?.latencyMs || 0}ms)`}
        >
          <span 
            className={`h-2 w-2 rounded-full ${
              modelHealth?.status === 'healthy' 
                ? 'bg-emerald-500' 
                : modelHealth?.status === 'degraded'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`} 
          />
          <span className="text-xs">
            {modelHealth?.status === 'healthy' && (
              <span className="text-slate-700">
                Model: <span className="text-emerald-700 font-bold">{modelHealth.modelsLoadedCount}/5 Active</span>
                <span className="text-slate-400 font-normal ml-1">({modelHealth.latencyMs}ms)</span>
              </span>
            )}
            {modelHealth?.status === 'degraded' && (
              <span className="text-amber-700 font-medium">
                Model: {modelHealth.modelsLoadedCount}/5 Active
              </span>
            )}
            {(!modelHealth || modelHealth.status === 'offline') && (
              <span className="text-rose-700 font-medium">
                Model Offline • Cached
              </span>
            )}
          </span>
          {isRefreshingHealth && <span className="text-slate-400 text-[10px] animate-spin">⟳</span>}
        </div>

        {/* Benchmarks Link */}
        <Link
          href="/benchmarks"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
          title="Inspect ML predictions and validation"
        >
          <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Model Predictions</span>
        </Link>
      </div>

      {/* CENTER: Global Search Bar */}
      <div className="relative flex-1 max-w-md hidden sm:block">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Case ID, ATM, Location, Phone, Account..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchResultsOpen(true);
            }}
            onFocus={() => setSearchResultsOpen(true)}
            className="w-full bg-slate-50 border border-slate-200 pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResultsOpen(false);
              }}
              className="absolute right-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Auto-suggest dropdown */}
        {searchResultsOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100 text-xs overflow-hidden">
            <div className="p-2.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Matching Intelligence Nodes ({searchResults.length})</span>
              <span>ESC to close</span>
            </div>
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSearchResult(item)}
                className="p-2.5 hover:bg-blue-50/60 cursor-pointer transition-colors flex items-start gap-2.5"
              >
                <span className="mt-0.5 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-700 uppercase">
                  {item.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 font-semibold truncate">{item.title}</div>
                  <div className="text-slate-500 text-[11px] truncate">{item.subtitle}</div>
                </div>
                <span className="text-[11px] text-blue-600 font-medium">Pan Map →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Actions, Notifications, Profile, SOS */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        
        {/* Return to Portal Link */}
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
          <span>Portal</span>
        </Link>

        {/* Collab Link */}
        <Link
          href="/collab"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Collab Hub</span>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setAlertsDropdownOpen(!alertsDropdownOpen);
              setProfileDropdownOpen(false);
            }}
            className="relative p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            aria-label="Alerts"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {alertsDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 text-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-slate-900 text-xs">Live Predicted Alerts</span>
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {alerts.map((al) => (
                  <div 
                    key={al.id} 
                    className={`p-3 hover:bg-slate-50 transition-colors ${al.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        al.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        al.severity === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {al.severity} • {al.timeAgo}
                      </span>
                      <span className="text-xs text-slate-900 font-bold">{al.amount}</span>
                    </div>
                    <div className="text-slate-900 font-medium text-xs mt-1">{al.location}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{al.fraudType} • Confidence: {al.confidence}%</div>
                    
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (onSelectEntity) onSelectEntity('ZONE', al.id, [al.lat, al.lng], 15);
                          setAlertsDropdownOpen(false);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        View on Map →
                      </button>
                      <button
                        onClick={() => {
                          setAlerts(prev => prev.map(a => a.id === al.id ? { ...a, acknowledged: true } : a));
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        {al.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-slate-500 text-[11px]">
                Synchronized with CFCFRMS interdiction stream
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen);
              setAlertsDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors text-xs font-medium"
          >
            <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {officer?.name
                ? officer.name
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'VS'}
            </div>
            <span className="hidden md:inline font-semibold text-slate-800">
              {officer?.name || 'Insp. Sharma'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 text-xs divide-y divide-slate-100 overflow-hidden">
              <div className="p-3 bg-slate-50">
                <div className="font-bold text-slate-900 text-xs">
                  {officer?.name || 'Inspector V. Sharma, RPS'}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  {officer?.persona || 'Addl. SP (Cybercrime Division)'}
                </div>
                <div className="text-blue-700 text-[10px] mt-1 font-semibold uppercase">
                  {officer?.badgeId
                    ? `Badge: ${officer.badgeId} • ${(officer.role || 'Officer').toUpperCase()}`
                    : 'Role: I4C National Admin'}
                </div>
              </div>

              <div className="p-2 space-y-1 text-slate-700">
                <div className="p-1.5 hover:bg-slate-50 rounded-md cursor-pointer flex items-center justify-between">
                  <span>Assigned Cases</span>
                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-800 font-bold rounded">14</span>
                </div>
                <div className="p-1.5 hover:bg-slate-50 rounded-md cursor-pointer flex items-center justify-between">
                  <span>Surveillance Teams Active</span>
                  <span className="text-blue-600 font-bold">2 Units</span>
                </div>
                <div className="p-1.5 hover:bg-slate-50 rounded-md cursor-pointer">
                  Audit Telemetry Log
                </div>
              </div>

              <div className="p-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-center py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Emergency SOS Button */}
        <button
          onClick={onTriggerSOS}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
          title="Trigger Immediate Command Center SOS Alert"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Urgent Alert</span>
        </button>

      </div>

    </header>
  );
}
