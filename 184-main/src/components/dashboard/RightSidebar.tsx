'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Volume2, VolumeX, RefreshCw, AlertTriangle, 
  MapPin, Shield, Building, ChevronRight, TrendingUp, 
  TrendingDown, CheckCircle, Clock, BarChart3, ChevronUp, ChevronDown 
} from 'lucide-react';
import { 
  LIVE_ALERTS_DATA, 
  TOP_10_RISK_ZONES, 
  ATMS_DATA, 
  LiveAlertItem, 
  RiskZoneRank, 
  ATMEntity 
} from '@/data/dashboardData';
import { getTopRiskZones } from '@/lib/apiService';

interface RightSidebarProps {
  selectedZone: string;
  selectedEntity: { type: string; id: string; data?: any } | null;
  onSelectZone: (zoneName: string, coords: [number, number], zoom?: number) => void;
  onSelectATM: (atm: ATMEntity) => void;
  onAcknowledgeAlert?: (id: string) => void;
  alerts?: LiveAlertItem[];
}

export default function RightSidebar({
  selectedZone,
  selectedEntity,
  onSelectZone,
  onSelectATM,
  onAcknowledgeAlert,
  alerts: propAlerts,
}: RightSidebarProps) {
  const [internalAlerts, setInternalAlerts] = useState<LiveAlertItem[]>(LIVE_ALERTS_DATA);
  const alerts = propAlerts || internalAlerts;
  const setAlerts = setInternalAlerts;
  const [riskZones, setRiskZones] = useState<RiskZoneRank[]>(TOP_10_RISK_ZONES);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isZonesLive, setIsZonesLive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Live Top 10 Risk Zones from ML Model API
  const fetchLiveZones = React.useCallback(async () => {
    setIsLoadingZones(true);
    try {
      const liveData = await getTopRiskZones(10);
      if (liveData && liveData.length > 0) {
        setRiskZones(liveData);
        setIsZonesLive(liveData[0]?.isLive ?? true);
      }
    } catch (err) {
      console.warn('Failed to load live top risk zones, using fallback:', err);
    } finally {
      setIsLoadingZones(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveZones();
  }, [fetchLiveZones]);

  // Collapsible panels
  const [alertsExpanded, setAlertsExpanded] = useState(true);
  const [zoneExpanded, setZoneExpanded] = useState(true);
  const [top10Expanded, setTop10Expanded] = useState(true);

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    if (onAcknowledgeAlert) onAcknowledgeAlert(id);
  };

  // Find ATMs in current selected zone
  const zoneATMs = ATMS_DATA.filter(a => a.zone === selectedZone || selectedZone.includes(a.zone.split(',')[0]));
  const currentZoneData = TOP_10_RISK_ZONES.find(z => z.name === selectedZone || selectedZone.includes(z.name.split(',')[0])) || TOP_10_RISK_ZONES[0];

  return (
    <aside className="w-full h-full bg-white border-l border-slate-200 flex flex-col overflow-y-auto text-slate-800 select-none divide-y divide-slate-100 text-xs shadow-xs">
      
      {/* PANEL 1: LIVE ALERTS FEED */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">Live Alerts Feed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 rounded-md border text-xs transition-colors ${
                soundEnabled 
                  ? 'text-blue-600 bg-blue-50 border-blue-200' 
                  : 'text-slate-400 bg-slate-50 border-slate-200'
              }`}
              title={soundEnabled ? 'Alert Sound Enabled' : 'Alert Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setAlertsExpanded(!alertsExpanded)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              {alertsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {alertsExpanded && (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border transition-all ${
                  alert.acknowledged
                    ? 'border-slate-200 bg-slate-50/60 opacity-60'
                    : alert.severity === 'CRITICAL'
                    ? 'border-rose-200 bg-rose-50/40 shadow-2xs'
                    : alert.severity === 'HIGH'
                    ? 'border-amber-200 bg-amber-50/40 shadow-2xs'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-600' :
                      alert.severity === 'HIGH' ? 'bg-amber-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {alert.severity} • {alert.timeAgo}
                    </span>
                  </div>
                  <span className="text-slate-900 font-bold text-xs">{alert.amount}</span>
                </div>

                <div className="text-slate-900 font-semibold text-xs leading-snug">
                  {alert.location}
                </div>

                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>{alert.fraudType}</span>
                  <span>Confidence: <strong className="text-blue-600 font-bold">{alert.confidence}%</strong></span>
                </div>

                <div className="text-[10px] text-slate-400 mt-0.5">
                  Window: {alert.predictedWindow}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onSelectZone(alert.location, [alert.lat, alert.lng], 15)}
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                  >
                    View on Map →
                  </button>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="text-slate-500 hover:text-slate-800 text-[11px]"
                  >
                    {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PANEL 2: SELECTED ZONE INTELLIGENCE PANEL */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              Zone Intelligence
            </span>
          </div>
          <button
            onClick={() => setZoneExpanded(!zoneExpanded)}
            className="text-slate-400 hover:text-slate-600"
          >
            {zoneExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {zoneExpanded && (
          <div className="space-y-4">
            
            {/* Zone Name & Overall Risk Gauge */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Hotspot Sector:</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {currentZoneData.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    State: {currentZoneData.state}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-extrabold text-rose-600 leading-none">
                    {currentZoneData.score}<span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                  <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 uppercase">
                    Critical Risk
                  </span>
                </div>
              </div>

              {/* Visual Score Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full transition-all duration-300"
                  style={{ width: `${currentZoneData.score}%` }}
                />
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Threat Vectors Breakdown
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">ATM Density:</span>
                <span className="text-slate-900 font-bold">{currentZoneData.atmDensity}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Historical Fraud:</span>
                <span className="text-amber-700 font-bold">{currentZoneData.historicalFraud}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Active Alert Risk:</span>
                <span className="text-rose-700 font-bold">{currentZoneData.activeAlerts}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Police Patrol Coverage:</span>
                <span className="text-blue-700 font-bold">{currentZoneData.policeCoverage}</span>
              </div>
            </div>

            {/* ATMs in this Zone */}
            <div>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                ATMs in this Cluster ({zoneATMs.length})
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {zoneATMs.map((atm) => (
                  <div
                    key={atm.id}
                    onClick={() => onSelectATM(atm)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="truncate">
                      <span className="text-slate-900 font-semibold text-xs">{atm.bank}</span>
                      <span className="text-slate-500 text-[10px] block truncate">{atm.branch}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      atm.riskScore >= 75 ? 'text-rose-700 bg-rose-100' :
                      atm.riskScore >= 50 ? 'text-amber-700 bg-amber-100' :
                      'text-blue-700 bg-blue-100'
                    }`}>
                      {atm.riskScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
              <div className="text-xs text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-blue-600" />
                <span>Recommended Police Action:</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4 leading-relaxed">
                <li>Deploy patrol squad to SBI and PNB ATMs between 2:00 PM – 5:00 PM</li>
                <li>Alert branch nodal manager to monitor sequential high-value withdrawals</li>
                <li>Coordinate inter-district dispatch for Case CY-44521</li>
              </ul>
            </div>

            {/* Historical Pattern 7-Day Mini Chart */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold uppercase">7-Day Withdrawal Pattern</span>
                <span className="text-blue-600 font-bold text-[11px]">Peak: 1PM - 4PM</span>
              </div>
              <div className="flex items-end justify-between h-12 gap-1.5 pt-2">
                {[
                  { day: 'Mon', val: 40 },
                  { day: 'Tue', val: 55 },
                  { day: 'Wed', val: 70 },
                  { day: 'Thu', val: 65 },
                  { day: 'Fri', val: 90 },
                  { day: 'Sat', val: 95 },
                  { day: 'Sun', val: 80 },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={`w-full rounded-t-sm transition-all ${bar.val > 75 ? 'bg-rose-500' : 'bg-blue-600'}`}
                      style={{ height: `${bar.val}%` }}
                    />
                    <span className="text-[9px] text-slate-400 font-medium">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* PANEL 3: TOP 10 RISK ZONES LIST */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              Top 10 Risk Hotspots
            </span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
              isZonesLive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-600 bg-slate-100 border border-slate-200'
            }`}>
              {isZonesLive ? 'LIVE' : 'CACHED'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchLiveZones}
              disabled={isLoadingZones}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Refresh from ML Model API"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingZones ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={() => setTop10Expanded(!top10Expanded)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              {top10Expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {top10Expanded && (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {riskZones.map((zone) => (
              <div
                key={`${zone.rank}-${zone.name}`}
                onClick={() => onSelectZone(zone.name, [zone.lat, zone.lng], 14)}
                className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  zone.name === selectedZone ? 'border-blue-500 bg-blue-50/80 font-bold' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                }`}
                title={`District Risk Score: ${zone.score}/100 • ${zone.state}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-bold w-4">{zone.rank}.</span>
                  <span className={`h-2 w-2 rounded-full ${
                    zone.score >= 80 ? 'bg-rose-500' :
                    zone.score >= 60 ? 'bg-amber-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-medium text-xs truncate max-w-[140px]">
                      {zone.name}
                    </span>
                    <span className="text-[10px] text-slate-500">{zone.state}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`font-bold text-xs ${
                    zone.score >= 80 ? 'text-rose-600' :
                    zone.score >= 60 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {zone.score}
                  </span>
                  {zone.trend === 'up' ? (
                    <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </aside>
  );
}
