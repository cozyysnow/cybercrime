'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import LeftSidebar, { LayerVisibilityState, FilterState } from '@/components/dashboard/LeftSidebar';
import RightSidebar from '@/components/dashboard/RightSidebar';
import BottomBar from '@/components/dashboard/BottomBar';
import DashboardMap from '@/components/dashboard/DashboardMap';
import Modals from '@/components/dashboard/Modals';
import { sendAdbSms } from '@/lib/hardwareService';
import { 
  ATMS_DATA, 
  BANK_BRANCHES_DATA, 
  POLICE_STATIONS_DATA, 
  ACTIVE_INCIDENTS_DATA, 
  PREDICTED_HOTSPOTS_DATA, 
  CORRIDORS_DATA,
  ATMEntity,
  PoliceStationEntity,
  BankBranchEntity,
  LIVE_ALERTS_DATA,
  LiveAlertItem,
} from '@/data/dashboardData';
import { Layers, Shield, Map as MapIcon, Sliders } from 'lucide-react';
import { 
  STATE_CENTROIDS, 
  matchesState, 
  matchesRisk, 
  matchesAmount, 
  matchesTime 
} from '@/lib/filterUtils';

export default function DashboardPage() {
  // Layer Toggles
  const [layers, setLayers] = useState<LayerVisibilityState>({
    atms: true,
    banks: true,
    police: true,
    incidents: true,
    hotspots: true,
    corridors: false, // hidden by default per user brief
    heatmap: true,
  });

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    timeRange: '24h',
    fraudTypes: ['KYC Fraud', 'OTP Fraud', 'Investment Fraud', 'UPI Fraud'],
    amountRange: 'all',
    riskLevels: ['Critical', 'High', 'Moderate'],
    selectedState: 'All India',
  });

  // Selected Entities
  const [selectedZone, setSelectedZone] = useState('Sindhi Camp, Jaipur');
  const [selectedATM, setSelectedATM] = useState<ATMEntity | null>(null);
  const [selectedPolice, setSelectedPolice] = useState<PoliceStationEntity | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BankBranchEntity | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; id: string; data?: any } | null>(null);

  // Map FlyTo target
  const [flyToCoords, setFlyToCoords] = useState<{ coords: [number, number]; zoom?: number } | null>(null);

  // Live Alerts Feed
  const [alerts, setAlerts] = useState<LiveAlertItem[]>(LIVE_ALERTS_DATA);

  // Modals state
  const [criticalAlertOpen, setCriticalAlertOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [drawZoneModalOpen, setDrawZoneModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Mobile / Tablet Tab State ('map' | 'layers' | 'intelligence')
  const [mobileTab, setMobileTab] = useState<'map' | 'layers' | 'intelligence'>('map');

  // Dynamic filtered counts reflecting active filters across all layers
  const filteredCounts = React.useMemo(() => {
    const atmsCount = ATMS_DATA.filter((atm) => {
      if (!matchesRisk(atm.riskScore, filters.riskLevels)) return false;
      if (!matchesState(filters.selectedState, [atm.address, atm.zone, atm.id])) return false;
      if (!matchesTime(atm.lastAlert, filters.timeRange)) return false;
      return true;
    }).length;

    const banksCount = BANK_BRANCHES_DATA.filter((b) => {
      if (!matchesState(filters.selectedState, [b.address, b.zone, b.name])) return false;
      if (!matchesRisk(b.riskLevel, filters.riskLevels)) return false;
      return true;
    }).length;

    const policeCount = POLICE_STATIONS_DATA.filter((p) => {
      if (!matchesState(filters.selectedState, [p.jurisdiction, p.name])) return false;
      return true;
    }).length;

    const incidentsCount = ACTIVE_INCIDENTS_DATA.filter((inc) => {
      if (filters.fraudTypes.length > 0 && !filters.fraudTypes.includes(inc.fraudType)) return false;
      if (!matchesAmount(inc.amount, filters.amountRange)) return false;
      if (!matchesState(filters.selectedState, [inc.groundTruthState, inc.predictedStateTop1, inc.victimLocation, inc.caseTitle])) return false;
      const incTier = inc.amount >= 1000000 ? 'Critical' : inc.amount >= 200000 ? 'High' : inc.amount >= 50000 ? 'Moderate' : 'Low';
      if (!matchesRisk(incTier, filters.riskLevels)) return false;
      if (!matchesTime(inc.complaintTime, filters.timeRange)) return false;
      return true;
    }).length;

    const hotspotsCount = PREDICTED_HOTSPOTS_DATA.filter((spot) => {
      if (!matchesState(filters.selectedState, [spot.name])) return false;
      const spotTier = spot.riskScore >= 90 || spot.urgency === 'Immediate' ? 'Critical' : spot.riskScore >= 80 ? 'High' : 'Moderate';
      if (!matchesRisk(spotTier, filters.riskLevels)) return false;
      if (!matchesTime(spot.urgency, filters.timeRange) && !matchesTime(spot.timeWindow, filters.timeRange)) return false;
      return true;
    }).length;

    const corridorsCount = CORRIDORS_DATA.filter((c) => {
      if (filters.selectedState && filters.selectedState !== 'All India') {
        if (!matchesState(filters.selectedState, [c.fromState]) && !matchesState(filters.selectedState, [c.toState])) return false;
      }
      let corridorAmountNum = 10000000;
      if (c.totalAmount.includes('Cr')) {
        corridorAmountNum = parseFloat(c.totalAmount.replace(/[^\d.]/g, '')) * 10000000;
      } else if (c.totalAmount.includes('Lakh')) {
        corridorAmountNum = parseFloat(c.totalAmount.replace(/[^\d.]/g, '')) * 100000;
      }
      if (!matchesAmount(corridorAmountNum, filters.amountRange)) return false;
      return true;
    }).length;

    return {
      atms: atmsCount,
      banks: banksCount,
      police: policeCount,
      incidents: incidentsCount,
      hotspots: hotspotsCount,
      corridors: corridorsCount,
    };
  }, [filters]);

  const handleToggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangeFilter = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...newFilters };
      if (newFilters.selectedState && STATE_CENTROIDS[newFilters.selectedState]) {
        const target = STATE_CENTROIDS[newFilters.selectedState];
        setFlyToCoords({ coords: target.coords, zoom: target.zoom });
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      timeRange: '24h',
      fraudTypes: ['KYC Fraud', 'OTP Fraud', 'Investment Fraud', 'Job/Employment Fraud', 'Loan Fraud', 'Sextortion', 'UPI Fraud', 'Other'],
      amountRange: 'all',
      riskLevels: ['Critical', 'High', 'Moderate', 'Low'],
      selectedState: 'All India',
    });
    setFlyToCoords({ coords: [22.5937, 78.9629], zoom: 5 });
  };

  const handleSelectZone = (zoneName: string, coords: [number, number], zoom = 14) => {
    setSelectedZone(zoneName);
    setFlyToCoords({ coords, zoom });
  };

  const handleSelectATM = (atm: ATMEntity) => {
    setSelectedATM(atm);
    setSelectedZone(atm.zone);
    setFlyToCoords({ coords: [atm.lat, atm.lng], zoom: 16 });
  };

  const handleSelectPolice = (station: PoliceStationEntity) => {
    setSelectedPolice(station);
    setFlyToCoords({ coords: [station.lat, station.lng], zoom: 15 });
  };

  const handleSelectBranch = (branch: BankBranchEntity) => {
    setSelectedBranch(branch);
    setFlyToCoords({ coords: [branch.lat, branch.lng], zoom: 15 });
  };

  const handleSelectFromHeader = (type: string, id: string, coords: [number, number], zoom = 15) => {
    setFlyToCoords({ coords, zoom });
    if (type === 'ATM') {
      const atm = ATMS_DATA.find((a) => a.id === id);
      if (atm) setSelectedATM(atm);
    } else if (type === 'ZONE') {
      setSelectedZone(id);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* 1. TOP BAR */}
      <DashboardHeader
        onSelectEntity={handleSelectFromHeader}
        onTriggerSOS={() => setCriticalAlertOpen(true)}
        unreadCount={alerts.filter(a => !a.acknowledged).length}
      />

      {/* 2. MAIN 3-PANEL COMMAND CENTER LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SIDEBAR (Layers & Intelligence Filters) */}
        <div className={`w-80 flex-shrink-0 h-full z-20 transition-all duration-300 ${
          mobileTab === 'layers' ? 'block absolute inset-0 z-30 w-full' : 'hidden lg:block'
        }`}>
          <LeftSidebar
            layers={layers}
            onToggleLayer={handleToggleLayer}
            filters={filters}
            onChangeFilter={handleChangeFilter}
            onResetFilters={handleResetFilters}
            layerCounts={filteredCounts}
          />
        </div>

        {/* CENTER: INTERACTIVE OPENSTREETMAP */}
        <main className={`flex-1 h-full relative z-10 ${
          mobileTab === 'map' ? 'block' : 'hidden lg:block'
        }`}>
          <DashboardMap
            layers={layers}
            filters={filters}
            onSelectATM={handleSelectATM}
            onSelectPolice={handleSelectPolice}
            onSelectBranch={handleSelectBranch}
            onSelectZone={handleSelectZone}
            onOpenReportModal={() => setReportModalOpen(true)}
            onOpenShareModal={() => setShareModalOpen(true)}
            onOpenDrawZoneModal={() => setDrawZoneModalOpen(true)}
            onOpenCompareModal={() => setCompareModalOpen(true)}
            flyToCoords={flyToCoords}
          />
        </main>

        {/* RIGHT SIDEBAR (Live Alerts, Zone Intelligence, Top 10) */}
        <div className={`w-80 xl:w-96 flex-shrink-0 h-full z-20 transition-all duration-300 ${
          mobileTab === 'intelligence' ? 'block absolute inset-0 z-30 w-full' : 'hidden lg:block'
        }`}>
          <RightSidebar
            selectedZone={selectedZone}
            selectedEntity={selectedEntity}
            onSelectZone={handleSelectZone}
            onSelectATM={handleSelectATM}
            alerts={alerts}
            onAcknowledgeAlert={(id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))}
          />
        </div>

      </div>

      {/* 3. MOBILE & TABLET BOTTOM TAB SWITCHER */}
      <div className="lg:hidden flex items-center justify-around bg-white border-t border-slate-200 py-2.5 px-4 z-40 text-xs">
        <button
          onClick={() => setMobileTab('layers')}
          className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'layers' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Sliders className="h-4 w-4" />
          <span>Layers & Filters</span>
        </button>

        <button
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'map' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <MapIcon className="h-4 w-4" />
          <span>Radar Map</span>
        </button>

        <button
          onClick={() => setMobileTab('intelligence')}
          className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'intelligence' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Shield className="h-4 w-4" />
          <span>Intelligence</span>
        </button>
      </div>

      {/* 4. BOTTOM BAR (Ticker, Legend, Feed Health) */}
      <div className="hidden sm:block">
        <BottomBar
          onTickerClick={(item) => {
            if (item.includes('Indore')) {
              setFlyToCoords({ coords: [22.7196, 75.8577], zoom: 14 });
            } else if (item.includes('Ahmedabad')) {
              setFlyToCoords({ coords: [23.0225, 72.5714], zoom: 14 });
            } else if (item.includes('Mewat')) {
              setFlyToCoords({ coords: [27.5000, 76.9000], zoom: 13 });
            }
          }}
        />
      </div>

      {/* 5. FLOATING POPUPS & ACTION MODALS */}
      <Modals
        criticalAlertOpen={criticalAlertOpen}
        onCloseCriticalAlert={() => setCriticalAlertOpen(false)}
        onDispatchTeam={async () => {
          sendAdbSms({
            phone: '+919829041209',
            message: '[CYBERCAST CRITICAL DISPATCH] Rapid Response PCR Unit dispatched to Sindhi Camp Jaipur ATMs. High-risk withdrawal predicted within 2h. Intercept suspect immediately.',
            priority: 'FLASH_P1',
            officerName: 'SI Manoj Meena (Jaipur PCR Lead)',
            caseId: 'CRIT-ALERT-SINDHI-CAMP',
          }).catch(() => {});
          alert('Rapid Response Unit dispatched! Directive transmitted to physical Android device (ZD222K9HBL) via ADB Intent.');
          setCriticalAlertOpen(false);
        }}
        onViewAlertLocation={() => {
          setFlyToCoords({ coords: [26.9210, 75.7970], zoom: 15 });
          setSelectedZone('Sindhi Camp, Jaipur');
          setCriticalAlertOpen(false);
        }}
        reportModalOpen={reportModalOpen}
        onCloseReportModal={() => setReportModalOpen(false)}
        shareModalOpen={shareModalOpen}
        onCloseShareModal={() => setShareModalOpen(false)}
        drawZoneModalOpen={drawZoneModalOpen}
        onCloseDrawZoneModal={() => setDrawZoneModalOpen(false)}
        compareModalOpen={compareModalOpen}
        onCloseCompareModal={() => setCompareModalOpen(false)}
        selectedATM={selectedATM}
        onCloseATMDetail={() => setSelectedATM(null)}
        onRequestSurveillance={(id) => {
          // Handled in modal
        }}
        selectedPolice={selectedPolice}
        onClosePoliceDetail={() => setSelectedPolice(null)}
        onRequestDeployment={(id) => {
          // Handled in modal
        }}
        selectedBranch={selectedBranch}
        onCloseBranchDetail={() => setSelectedBranch(null)}
      />

    </div>
  );
}
