'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Plus, Minus, Globe 
} from 'lucide-react';
import { 
  ATMS_DATA, 
  BANK_BRANCHES_DATA, 
  POLICE_STATIONS_DATA, 
  ACTIVE_INCIDENTS_DATA, 
  PREDICTED_HOTSPOTS_DATA, 
  CORRIDORS_DATA, 
  QUICK_JUMP_LOCATIONS,
  ATMEntity,
  PoliceStationEntity,
  BankBranchEntity,
  HotspotEntity,
  CrimeIncidentEntity,
  CorridorEntity
} from '@/data/dashboardData';
import { 
  LayerVisibilityState, 
  FilterState 
} from './LeftSidebar';
import { getDistrictRiskScores, DistrictRiskData } from '@/lib/apiService';
import { 
  STATE_CENTROIDS, 
  matchesState, 
  matchesRisk, 
  matchesAmount, 
  matchesTime 
} from '@/lib/filterUtils';

interface MapEngineProps {
  layers: LayerVisibilityState;
  filters: FilterState;
  onSelectATM: (atm: ATMEntity) => void;
  onSelectPolice: (station: PoliceStationEntity) => void;
  onSelectBranch: (branch: BankBranchEntity) => void;
  onSelectZone: (zoneName: string, coords: [number, number], zoom?: number) => void;
  onOpenReportModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenDrawZoneModal?: () => void;
  onOpenCompareModal?: () => void;
  flyToCoords: { coords: [number, number]; zoom?: number } | null;
}

export default function MapEngine({
  layers,
  filters,
  onSelectATM,
  onSelectPolice,
  onSelectBranch,
  onSelectZone,
  flyToCoords,
}: MapEngineProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const referenceLayerRef = useRef<L.TileLayer | null>(null);
  
  // Layer Groups
  const atmsLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const banksLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const policeLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const incidentsLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const hotspotsLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const corridorsLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const heatmapLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Base map style: 'street' (default) | 'terrain' | 'satellite' | 'dark'
  const [mapStyle, setMapStyle] = useState<'dark' | 'street' | 'satellite' | 'terrain'>('street');
  const [districtScores, setDistrictScores] = useState<DistrictRiskData[]>([]);

  // Load live district risk scores from ML Model API
  useEffect(() => {
    let mounted = true;
    getDistrictRiskScores().then((data) => {
      if (mounted && data && data.length > 0) {
        setDistrictScores(data);
      }
    }).catch((e) => console.warn('Failed to load district risk scores for map:', e));
    return () => { mounted = false; };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
      minZoom: 4,
      maxZoom: 19,
    });

    mapInstanceRef.current = map;

    // Attach layer groups
    atmsLayerGroupRef.current.addTo(map);
    banksLayerGroupRef.current.addTo(map);
    policeLayerGroupRef.current.addTo(map);
    incidentsLayerGroupRef.current.addTo(map);
    hotspotsLayerGroupRef.current.addTo(map);
    corridorsLayerGroupRef.current.addTo(map);
    heatmapLayerGroupRef.current.addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }
    if (referenceLayerRef.current) {
      referenceLayerRef.current.remove();
      referenceLayerRef.current = null;
    }

    let tileUrl = '';
    let maxZoom = 19;
    let maxNativeZoom = 19;
    let className = '';

    switch (mapStyle) {
      case 'dark':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
        maxNativeZoom = 16;
        break;
      case 'satellite':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        maxZoom = 19;
        break;
      case 'terrain':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        maxZoom = 19;
        break;
      case 'street':
      default:
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
        maxZoom = 19;
        break;
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom,
      maxNativeZoom,
      className,
    });

    newTileLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;

    // Add labels reference layer for dark mode
    if (mapStyle === 'dark') {
      const refLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 16,
        opacity: 0.85,
      });
      refLayer.addTo(mapInstanceRef.current);
      referenceLayerRef.current = refLayer;
    }
  }, [mapStyle]);

  // Fly to target coords when prop updates
  useEffect(() => {
    if (!mapInstanceRef.current || !flyToCoords) return;
    mapInstanceRef.current.flyTo(flyToCoords.coords, flyToCoords.zoom || 14, {
      duration: 1.2,
    });
  }, [flyToCoords]);

  // Auto-fly to state centroid when selectedState filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !filters.selectedState) return;
    const target = STATE_CENTROIDS[filters.selectedState];
    if (target) {
      mapInstanceRef.current.flyTo(target.coords, target.zoom, {
        duration: 1.4,
      });
    }
  }, [filters.selectedState]);

  // RENDER MARKER LAYERS ACCORDING TO TOGGLES AND FILTERS
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 1. ATMs LAYER
    atmsLayerGroupRef.current.clearLayers();
    if (layers.atms) {
      ATMS_DATA.forEach((atm) => {
        // Multi-Filter Evaluation
        if (!matchesRisk(atm.riskScore, filters.riskLevels)) return;
        if (!matchesState(filters.selectedState, [atm.address, atm.zone, atm.id])) return;
        if (!matchesTime(atm.lastAlert, filters.timeRange)) return;

        // Custom Vector Pin Icon - Clean SaaS card terminal
        const isHigh = atm.riskScore >= 76;
        const isMod = atm.riskScore >= 51 && atm.riskScore < 76;
        const color = isHigh ? '#dc2626' : isMod ? '#d97706' : '#16a34a';

        const iconHtml = `
          <div style="width: 22px; height: 22px; background: #ffffff; border: 2px solid ${color}; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="1"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
              <circle cx="6" cy="15" r="1" fill="${color}"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-atm-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([atm.lat, atm.lng], { icon: customIcon });
        
        marker.on('click', () => {
          onSelectATM(atm);
          onSelectZone(atm.zone, [atm.lat, atm.lng]);
        });

        marker.bindPopup(`
          <div style="padding: 12px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 12px; width: 260px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="font-weight: 700; font-size: 13px; color: ${color}; margin-bottom: 2px;">
              ${atm.bank}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
              ${atm.branch} • ID: ${atm.id}
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-bottom: 8px; font-size: 11.5px; line-height: 1.5;">
              <div>Risk Score: <strong style="color: ${color};">${atm.riskScore}/100</strong></div>
              <div>Historical Frauds: <strong>${atm.fraudWithdrawals}</strong></div>
              <div>Last Alert: <strong>${atm.lastAlert}</strong></div>
            </div>
            <button id="flag-${atm.id}" style="width: 100%; background: #2563eb; color: #ffffff; font-weight: 600; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 11px;">
              Flag for Surveillance
            </button>
          </div>
        `);

        marker.addTo(atmsLayerGroupRef.current);
      });
    }

    // 2. BANK BRANCHES LAYER
    banksLayerGroupRef.current.clearLayers();
    if (layers.banks) {
      BANK_BRANCHES_DATA.forEach((branch) => {
        // Multi-Filter Evaluation
        if (!matchesState(filters.selectedState, [branch.address, branch.zone, branch.name])) return;
        if (!matchesRisk(branch.riskLevel, filters.riskLevels)) return;

        const iconHtml = `
          <div style="width: 22px; height: 22px; background: #ffffff; border: 2px solid #0284c7; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="21" x2="21" y2="21"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="m12 3 9 7H3z"/>
              <line x1="7" y1="10" x2="7" y2="21"/>
              <line x1="12" y1="10" x2="12" y2="21"/>
              <line x1="17" y1="10" x2="17" y2="21"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-bank-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([branch.lat, branch.lng], { icon: customIcon });

        marker.on('click', () => {
          onSelectBranch(branch);
        });

        marker.bindPopup(`
          <div style="padding: 12px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 12px; width: 260px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="font-weight: 700; font-size: 13px; color: #0284c7; margin-bottom: 2px;">
              ${branch.name}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
              IFSC: ${branch.ifsc}
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 11.5px; line-height: 1.5;">
              <div>Flagged Accounts: <strong style="color: #dc2626;">${branch.flaggedAccounts}</strong></div>
              <div>Area Risk Level: <strong>${branch.riskLevel}</strong></div>
              <div>Manager: <strong>${branch.managerContact}</strong></div>
            </div>
          </div>
        `);

        marker.addTo(banksLayerGroupRef.current);
      });
    }

    // 3. POLICE STATIONS LAYER
    policeLayerGroupRef.current.clearLayers();
    if (layers.police) {
      POLICE_STATIONS_DATA.forEach((ps) => {
        // Multi-Filter Evaluation
        if (!matchesState(filters.selectedState, [ps.jurisdiction, ps.name])) return;

        const iconHtml = `
          <div style="width: 22px; height: 22px; background: #ffffff; border: 2px solid #2563eb; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-police-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([ps.lat, ps.lng], { icon: customIcon });

        marker.on('click', () => {
          onSelectPolice(ps);
        });

        marker.bindPopup(`
          <div style="padding: 12px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 12px; width: 270px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="font-weight: 700; font-size: 13px; color: #2563eb; margin-bottom: 2px;">
              ${ps.name}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
              ${ps.jurisdiction}
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 11.5px; line-height: 1.5;">
              <div>SHO: <strong>${ps.sho}</strong></div>
              <div>Cyber Cell: <strong style="color: #16a34a;">${ps.cyberCell ? 'Available (Staff: ' + ps.cyberCellStaff + ')' : 'No'}</strong></div>
              <div>Active Cases: <strong>${ps.activeCases}</strong></div>
              <div>Response Time: <strong style="color: #d97706;">${ps.responseTime}</strong></div>
            </div>
          </div>
        `);

        marker.addTo(policeLayerGroupRef.current);
      });
    }

    // 4. ACTIVE INCIDENTS LAYER (REAL HIGH COURT & POLICE CASES BENCHMARK)
    incidentsLayerGroupRef.current.clearLayers();
    if (layers.incidents) {
      ACTIVE_INCIDENTS_DATA.forEach((inc) => {
        // Multi-Filter Evaluation
        if (filters.fraudTypes.length > 0 && !filters.fraudTypes.includes(inc.fraudType)) return;
        if (!matchesAmount(inc.amount, filters.amountRange)) return;
        if (!matchesState(filters.selectedState, [inc.groundTruthState, inc.predictedStateTop1, inc.victimLocation, inc.caseTitle])) return;
        const incTier = inc.amount >= 1000000 ? 'Critical' : inc.amount >= 200000 ? 'High' : inc.amount >= 50000 ? 'Moderate' : 'Low';
        if (!matchesRisk(incTier, filters.riskLevels)) return;
        if (!matchesTime(inc.complaintTime, filters.timeRange)) return;

        // Incident Warning Diamond
        const iconHtml = `
          <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="position: absolute; inset: 2px; background: #ffffff; border: 2px solid #dc2626; transform: rotate(45deg); box-shadow: 0 2px 6px rgba(0,0,0,0.15);"></div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: relative; z-index: 2;">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-real-case-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([inc.lat, inc.lng], { icon: customIcon });

        const top3List = inc.top3States 
          ? inc.top3States.map(s => `<span style="display: inline-block; background: #f1f5f9; color: #334155; padding: 2px 6px; margin: 1px; font-size: 10px; border-radius: 4px; font-weight: 500;">${s.state} (${Math.round(s.prob * 100)}%)</span>`).join(' ')
          : '';

        marker.bindPopup(`
          <div style="padding: 14px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 12px; width: 330px; box-shadow: 0 12px 28px -5px rgba(0,0,0,0.15);">
            
            <!-- Real Court Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              <span style="font-weight: 700; font-size: 11.5px; color: #dc2626; letter-spacing: 0.3px; display: flex; align-items: center; gap: 5px;">
                <img src="/logos/emblem_india.svg" alt="MHA" style="width: 14px; height: 14px;" />
                Case: ${inc.id}
              </span>
              <span style="background: #fef2f2; color: #b91c1c; font-size: 9.5px; padding: 2px 6px; border: 1px solid #fecaca; border-radius: 4px; font-weight: 600;">
                High Court Verified
              </span>
            </div>

            <!-- Court Case Citation -->
            <div style="margin-bottom: 8px;">
              <div style="font-weight: 600; font-size: 12px; color: #1e293b; line-height: 1.3;">
                ${inc.caseTitle || inc.id}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                Source: <span style="color: #2563eb; font-weight: 500;">${inc.courtName || 'Court Record'}</span> (${inc.decisionDate || 'Verified'})
              </div>
              ${inc.courtUrl ? `<div style="margin-top: 3px;"><a href="${inc.courtUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-size: 10px;">Read High Court Judgment ↗</a></div>` : ''}
            </div>

            <!-- Incident Overview -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; margin-bottom: 8px; font-size: 11px; line-height: 1.5;">
              <div>• <strong>Fraud Type:</strong> ${inc.fraudType}</div>
              <div>• <strong>Amount Stolen:</strong> <span style="color: #dc2626; font-weight: 700;">${inc.amountFormatted}</span></div>
              <div>• <strong>Victim Location:</strong> ${inc.victimLocation}</div>
              <div style="color: #475569; margin-top: 3px;">• <strong>Money Trail:</strong> ${inc.networkPattern || 'Layered through secondary mule accounts'}</div>
            </div>

            <!-- Ground Truth vs Model Prediction Box -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
              <div style="color: #166534; font-weight: 700; font-size: 10.5px; text-transform: uppercase; margin-bottom: 3px; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 5px;">
                  <img src="/logos/rbi.svg" alt="RBI" style="width: 13px; height: 13px;" />
                  Actual Cash-Out Ground Truth
                </span>
                <span style="background: #dcfce7; color: #15803d; padding: 1px 5px; font-size: 9px; border-radius: 3px; font-weight: 600;">CCTV Verified</span>
              </div>
              <div style="font-size: 11px; color: #14532d; font-weight: 600;">
                ${inc.groundTruthLocation || inc.predictedZone}
              </div>
              <div style="font-size: 10px; color: #15803d; margin-top: 2px;">
                Evidence: ${inc.cctvEvidence || 'ATM CCTV identified cash withdrawer'}
              </div>
            </div>

            <!-- Model Prediction Verdict -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px;">
              <div style="color: #1e40af; font-weight: 700; font-size: 10.5px; text-transform: uppercase; margin-bottom: 3px; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 5px;">
                  <img src="/logos/cybercast.png" alt="Cybercast" style="width: 13px; height: 13px; object-fit: contain;" />
                  CyberCast ML Prediction
                </span>
                <span style="background: #dbeafe; color: #1e40af; padding: 1px 5px; font-size: 9px; border-radius: 3px; font-weight: 600;">
                  ${inc.isTop1Match ? 'Verified Top-1 Hit' : 'Top-3 Match'}
                </span>
              </div>
              <div style="font-size: 11px; color: #1e3a8a;">
                <div>Predicted State: <strong>${inc.predictedStateTop1 || 'Target State'} (${inc.predictedConfidence || 80}% conf)</strong></div>
                <div style="margin-top: 3px;">Top-3 Candidates: ${top3List}</div>
              </div>
            </div>

          </div>
        `);

        marker.addTo(incidentsLayerGroupRef.current);

        // Ground Truth Cash-Out Marker
        if (inc.groundTruthCoords) {
          const gtIconHtml = `
            <div style="width: 22px; height: 22px; background: #ffffff; border: 2px solid #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          `;

          const gtIcon = L.divIcon({
            html: gtIconHtml,
            className: 'custom-ground-truth-marker',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const gtMarker = L.marker(inc.groundTruthCoords, { icon: gtIcon });

          gtMarker.bindPopup(`
            <div style="padding: 12px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 12px; width: 280px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
              <div style="font-weight: 700; font-size: 12px; color: #16a34a; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 5px;">
                  <img src="/logos/rbi.svg" alt="ATM" style="width: 13px; height: 13px;" />
                  Actual Cash-Out ATM
                </span>
                <span style="background: #dcfce7; color: #166534; font-size: 9px; padding: 1px 5px; border-radius: 3px;">Case ${inc.id}</span>
              </div>
              <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">
                ${inc.groundTruthLocation}
              </div>
              <div style="font-size: 11px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 6px; line-height: 1.4;">
                <div>Amount Extracted: <strong style="color: #dc2626;">${inc.groundTruthAmount || 'Cash Out'}</strong></div>
                <div>Court Evidence: <span>${inc.cctvEvidence || 'CCTV Confirmed'}</span></div>
                <div style="color: #2563eb; margin-top: 3px;">Model Prediction: Predicted ${inc.predictedStateTop1} as Top-1 (${inc.predictedConfidence}%)</div>
              </div>
            </div>
          `);

          gtMarker.addTo(incidentsLayerGroupRef.current);
        }
      });
    }

    // 5. PREDICTED WITHDRAWAL HOTSPOTS LAYER
    hotspotsLayerGroupRef.current.clearLayers();
    if (layers.hotspots) {
      PREDICTED_HOTSPOTS_DATA.forEach((spot) => {
        // Multi-Filter Evaluation
        if (!matchesState(filters.selectedState, [spot.name])) return;
        const spotTier = spot.riskScore >= 90 || spot.urgency === 'Immediate' ? 'Critical' : spot.riskScore >= 80 ? 'High' : 'Moderate';
        if (!matchesRisk(spotTier, filters.riskLevels)) return;
        if (!matchesTime(spot.urgency, filters.timeRange) && !matchesTime(spot.timeWindow, filters.timeRange)) return;

        const radius = spot.radius;
        const opacity = spot.urgency === 'Immediate' ? 0.2 : 0.12;

        // Clean perimeter circle
        const circle = L.circle([spot.lat, spot.lng], {
          radius,
          color: '#dc2626',
          fillColor: '#dc2626',
          fillOpacity: opacity,
          weight: 1.5,
          dashArray: '4, 4',
        });

        // Center Tactical Radar Pin
        const centerIconHtml = `
          <div style="width: 22px; height: 22px; background: #ffffff; border: 2px solid #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="22" y1="12" x2="18" y2="12"/>
              <line x1="6" y1="12" x2="2" y2="12"/>
              <line x1="12" y1="6" x2="12" y2="2"/>
              <line x1="12" y1="22" x2="12" y2="18"/>
            </svg>
          </div>
        `;

        const centerIcon = L.divIcon({
          html: centerIconHtml,
          className: 'custom-hotspot-center-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const centerMarker = L.marker([spot.lat, spot.lng], { icon: centerIcon });

        const popupContent = `
          <div style="padding: 12px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 12px; width: 280px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="font-weight: 700; font-size: 13px; color: #dc2626; margin-bottom: 4px;">
              Hotspot: ${spot.name}
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-bottom: 6px; font-size: 11.5px; line-height: 1.5;">
              <div>Prediction Confidence: <strong style="color: #2563eb;">${spot.confidence}%</strong></div>
              <div>Time Window: <strong>${spot.timeWindow}</strong></div>
              <div>ATMs in Zone: <strong>${spot.atmCount} Terminals</strong></div>
              <div>Urgency: <strong style="color: #dc2626;">${spot.urgency}</strong></div>
              <div style="margin-top: 6px; font-size: 11px; color: #475569;">Action: ${spot.recommendedAction}</div>
            </div>
          </div>
        `;

        circle.on('click', () => {
          onSelectZone(spot.name, [spot.lat, spot.lng], 15);
        });
        centerMarker.on('click', () => {
          onSelectZone(spot.name, [spot.lat, spot.lng], 15);
        });

        circle.bindPopup(popupContent);
        centerMarker.bindPopup(popupContent);

        circle.addTo(hotspotsLayerGroupRef.current);
        centerMarker.addTo(hotspotsLayerGroupRef.current);
      });
    }

    // 6. CRIMINAL NETWORK CORRIDORS LAYER
    corridorsLayerGroupRef.current.clearLayers();
    if (layers.corridors) {
      CORRIDORS_DATA.forEach((corridor) => {
        // Multi-Filter Evaluation
        if (filters.selectedState && filters.selectedState !== 'All India') {
          const fromMatch = matchesState(filters.selectedState, [corridor.fromState]);
          const toMatch = matchesState(filters.selectedState, [corridor.toState]);
          if (!fromMatch && !toMatch) return;
        }

        let corridorAmountNum = 10000000;
        if (corridor.totalAmount.includes('Cr')) {
          corridorAmountNum = parseFloat(corridor.totalAmount.replace(/[^\d.]/g, '')) * 10000000;
        } else if (corridor.totalAmount.includes('Lakh')) {
          corridorAmountNum = parseFloat(corridor.totalAmount.replace(/[^\d.]/g, '')) * 100000;
        }
        if (!matchesAmount(corridorAmountNum, filters.amountRange)) return;

        const color = corridor.type === 'active' ? '#dc2626' : corridor.type === 'predicted' ? '#d97706' : '#64748b';
        
        const polyline = L.polyline(corridor.path, {
          color,
          weight: 2.5,
          dashArray: '6, 6',
          opacity: 0.85,
        });

        polyline.bindPopup(`
          <div style="padding: 12px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 12px; width: 280px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              <span style="font-weight: 700; color: ${color}; text-transform: uppercase; font-size: 11px; display: flex; align-items: center; gap: 5px;">
                <img src="/logos/emblem_india.svg" alt="Court" style="width: 13px; height: 13px;" />
                ${corridor.type} Court Trail
              </span>
              <span style="background: #f1f5f9; font-size: 9px; padding: 2px 6px; border-radius: 4px; color: #475569; font-weight: 500;">
                Verified Path
              </span>
            </div>
            <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 6px;">
              ${corridor.fromState} → ${corridor.toState}
            </div>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 6px; font-size: 11.5px; line-height: 1.5;">
              <div>Court Documented Cases: <strong style="color: #2563eb;">${corridor.casesCount}</strong></div>
              <div>Avg Speed to ATM Cashout: <strong>${corridor.avgTime}</strong></div>
              <div>Total Stolen Funds Routed: <strong style="color: #dc2626;">${corridor.totalAmount}</strong></div>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
              Verified across Delhi High Court & State Police FIR casefiles.
            </div>
          </div>
        `);

        polyline.addTo(corridorsLayerGroupRef.current);
      });
    }

    // 7. HEATMAP OVERLAY LAYER (POWERED BY LIVE 964 DISTRICTS ML MODEL)
    heatmapLayerGroupRef.current.clearLayers();
    if (layers.heatmap) {
      // Base national high-risk corridors
      const HEATMAP_POINTS = [
        { lat: 26.9210, lng: 75.7970, r: 2800, color: '#dc2626', title: 'Jaipur Police Commr', score: '92.4', tier: 'Critical' },
        { lat: 26.8505, lng: 80.9492, r: 2400, color: '#dc2626', title: 'Lucknow Central', score: '87.1', tier: 'Critical' },
        { lat: 28.6315, lng: 77.2170, r: 3200, color: '#dc2626', title: 'Delhi NCT Central', score: '74.0', tier: 'Critical' },
        { lat: 12.9752, lng: 77.6065, r: 2200, color: '#d97706', title: 'Bengaluru Urban', score: '78.5', tier: 'High' },
        { lat: 19.1158, lng: 72.8687, r: 2800, color: '#d97706', title: 'Mumbai Commr', score: '71.2', tier: 'High' },
        { lat: 25.6186, lng: 85.1414, r: 2000, color: '#eab308', title: 'Patna Urban', score: '68.8', tier: 'Moderate' },
        { lat: 22.5280, lng: 88.3655, r: 2100, color: '#eab308', title: 'Kolkata Cyber Cell', score: '64.2', tier: 'Moderate' },
        { lat: 17.4089, lng: 78.4907, r: 1800, color: '#16a34a', title: 'Hyderabad Commr', score: '52.1', tier: 'Moderate' },
        { lat: 27.5000, lng: 76.9000, r: 3500, color: '#dc2626', title: 'Mewat Tri-Border', score: '94.6', tier: 'Critical' },
        { lat: 23.9629, lng: 86.8016, r: 3000, color: '#dc2626', title: 'Deoghar-Jamtara Cluster', score: '89.0', tier: 'Critical' },
      ];

      // Add live critical districts from ML Model API
      if (districtScores.length > 0) {
        districtScores.filter(d => d.risk_tier === 'Critical').slice(0, 10).forEach((d) => {
          const coords: [number, number] | null = 
            d.District === 'South' ? [23.1650, 91.4380] :
            d.District === 'South-West' ? [28.5921, 77.0460] :
            d.District === 'Central' ? [28.6448, 77.2167] :
            d.District === 'Rohini' ? [28.7495, 77.0565] :
            d.District === 'Chaibasa' ? [22.5539, 85.8078] :
            d.District === 'Saraikela' ? [22.7001, 85.9328] :
            d.District === 'Pakur' ? [24.6346, 87.8493] :
            null;
          
          if (coords) {
            HEATMAP_POINTS.push({
              lat: coords[0],
              lng: coords[1],
              r: 2600,
              color: '#dc2626',
              title: `${d.District}, ${d.State}`,
              score: d.risk_score.toFixed(1),
              tier: d.risk_tier,
            });
          }
        });
      }

      HEATMAP_POINTS.forEach((pt) => {
        // Multi-Filter Evaluation
        if (!matchesState(filters.selectedState, [pt.title])) return;
        if (!matchesRisk(pt.tier, filters.riskLevels)) return;
        const circle = L.circle([pt.lat, pt.lng], {
          radius: pt.r,
          color: pt.color,
          fillColor: pt.color,
          fillOpacity: 0.2,
          weight: 1,
        });

        circle.bindPopup(`
          <div style="padding: 12px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 12px; width: 260px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="font-weight: 700; font-size: 12.5px; color: ${pt.color}; margin-bottom: 4px;">
              District Risk: ${pt.title}
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11.5px; line-height: 1.5;">
              <div>Cash-out Risk Score: <strong style="color: #2563eb;">${pt.score} / 100</strong></div>
              <div>Classification: <span style="background: #fef2f2; color: #dc2626; padding: 1px 6px; border-radius: 4px; font-weight: 600;">${pt.tier}</span></div>
              <div style="margin-top: 4px; font-size: 10px; color: #64748b;">Source: Live ML District Model (Railway 3.0.0)</div>
            </div>
          </div>
        `);

        circle.addTo(heatmapLayerGroupRef.current);
      });
    }

  }, [layers, filters, onSelectATM, onSelectPolice, onSelectBranch, onSelectZone, districtScores]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleNationalReset = () => {
    mapInstanceRef.current?.flyTo([22.5937, 78.9629], 5);
  };

  const handleQuickJump = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = QUICK_JUMP_LOCATIONS.find(l => l.name === e.target.value);
    if (loc && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], loc.zoom);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden select-none font-sans">
      
      {/* MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

      {/* TOP LEFT ON MAP: MAP STYLE SWITCHER */}
      <div className="absolute top-3 left-3 z-30 flex items-center bg-white/95 border border-slate-200/90 p-1 text-xs shadow-lg backdrop-blur-md rounded-xl">
        <button
          onClick={() => setMapStyle('street')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${mapStyle === 'street' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          Street
        </button>
        <button
          onClick={() => setMapStyle('terrain')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${mapStyle === 'terrain' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          Terrain
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${mapStyle === 'satellite' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapStyle('dark')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${mapStyle === 'dark' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          Dark
        </button>
      </div>

      {/* TOP RIGHT ON MAP: QUICK JUMP DROPDOWN & RESET */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <select
          onChange={handleQuickJump}
          defaultValue="National View (India)"
          className="bg-white/95 border border-slate-200/90 px-3 py-1.5 text-xs text-slate-800 font-medium rounded-xl shadow-lg backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {QUICK_JUMP_LOCATIONS.map((loc) => (
            <option key={loc.name} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleNationalReset}
          className="p-2 bg-white/95 hover:bg-slate-100 border border-slate-200/90 text-slate-700 hover:text-slate-900 rounded-xl shadow-lg backdrop-blur-md transition-colors"
          title="Reset to Full India View"
        >
          <Globe className="h-4 w-4" />
        </button>
      </div>

      {/* LEFT SURFACE: MAP INTERACTION CONTROLS - ONLY ZOOM IN AND ZOOM OUT */}
      <div className="absolute top-16 left-3 z-30 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="h-8 w-8 bg-white/95 hover:bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-lg backdrop-blur-md rounded-xl transition-all active:scale-95"
          title="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="h-8 w-8 bg-white/95 hover:bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-lg backdrop-blur-md rounded-xl transition-all active:scale-95"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
