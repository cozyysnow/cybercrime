'use client';

import React, { useState } from 'react';
import { 
  Layers, Filter, RotateCcw, ChevronDown, ChevronUp, Check,
  MapPin, Building, Shield, AlertTriangle, Flame, TrendingUp
} from 'lucide-react';
import { 
  INDIAN_STATES_AND_UTS 
} from '@/data/dashboardData';

export interface LayerVisibilityState {
  atms: boolean;
  banks: boolean;
  police: boolean;
  incidents: boolean;
  hotspots: boolean;
  corridors: boolean;
  heatmap: boolean;
}

export interface FilterState {
  timeRange: string;
  fraudTypes: string[];
  amountRange: string;
  riskLevels: string[];
  selectedState: string;
}

interface LeftSidebarProps {
  layers: LayerVisibilityState;
  onToggleLayer: (layerKey: keyof LayerVisibilityState) => void;
  filters: FilterState;
  onChangeFilter: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  layerCounts: {
    atms: number;
    banks: number;
    police: number;
    incidents: number;
    hotspots: number;
    corridors: number;
  };
  timelineHour?: number;
  onTimelineChange?: (hour: number) => void;
  onTimelinePlayToggle?: () => void;
  isPlayingTimeline?: boolean;
  timelineSpeed?: number;
  onChangeTimelineSpeed?: (speed: number) => void;
}

export default function LeftSidebar({
  layers,
  onToggleLayer,
  filters,
  onChangeFilter,
  onResetFilters,
  layerCounts,
}: LeftSidebarProps) {
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const fraudTypesList = [
    'KYC Fraud',
    'OTP Fraud',
    'Investment Fraud',
    'Job/Employment Fraud',
    'Loan Fraud',
    'Sextortion',
    'UPI Fraud',
    'Other',
  ];

  const toggleFraudType = (type: string) => {
    if (filters.fraudTypes.includes(type)) {
      onChangeFilter({ fraudTypes: filters.fraudTypes.filter(t => t !== type) });
    } else {
      onChangeFilter({ fraudTypes: [...filters.fraudTypes, type] });
    }
  };

  const toggleRiskLevel = (level: string) => {
    if (filters.riskLevels.includes(level)) {
      onChangeFilter({ riskLevels: filters.riskLevels.filter(l => l !== level) });
    } else {
      onChangeFilter({ riskLevels: [...filters.riskLevels, level] });
    }
  };

  const handleApplyClick = () => {
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  return (
    <aside className="w-full h-full bg-white border-r border-slate-200 flex flex-col overflow-y-auto text-slate-800 select-none divide-y divide-slate-100 text-xs shadow-xs">
      
      {/* PANEL 1: LAYER CONTROL PANEL */}
      <div className="p-4">
        <button
          onClick={() => setLayersExpanded(!layersExpanded)}
          className="w-full flex items-center justify-between text-slate-700 hover:text-slate-900 font-bold text-xs uppercase tracking-wider mb-3 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <span>Map Entity Layers</span>
          </div>
          {layersExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {layersExpanded && (
          <div className="space-y-1.5">
            
            {/* ATM Locations Layer */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.atms}
                  onChange={() => onToggleLayer('atms')}
                  className="accent-blue-600 h-4 w-4 rounded"
                />
                <span className="font-medium text-slate-800">ATM Kiosks</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {layerCounts.atms} visible
              </span>
            </label>

            {/* Bank Branches Layer */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.banks}
                  onChange={() => onToggleLayer('banks')}
                  className="accent-blue-600 h-4 w-4 rounded"
                />
                <span className="font-medium text-slate-800">Bank Branches</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {layerCounts.banks} visible
              </span>
            </label>

            {/* Police Stations Layer */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.police}
                  onChange={() => onToggleLayer('police')}
                  className="accent-blue-600 h-4 w-4 rounded"
                />
                <span className="font-medium text-slate-800">Police Stations</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {layerCounts.police} visible
              </span>
            </label>

            {/* Active Crime Incidents */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.incidents}
                  onChange={() => onToggleLayer('incidents')}
                  className="accent-rose-600 h-4 w-4 rounded"
                />
                <span className="font-medium text-slate-800">Active Incidents</span>
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {layerCounts.incidents} active
              </span>
            </label>

            {/* Predicted Hotspots */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 border border-blue-200/60 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.hotspots}
                  onChange={() => onToggleLayer('hotspots')}
                  className="accent-blue-600 h-4 w-4 rounded"
                />
                <span className="font-bold text-blue-900">Predicted Hotspots</span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {layerCounts.hotspots} zones
              </span>
            </label>

            {/* Criminal Corridors */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.corridors}
                  onChange={() => onToggleLayer('corridors')}
                  className="accent-blue-600 h-4 w-4 rounded"
                />
                <span className="font-medium text-slate-800">Money Corridors</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {layerCounts.corridors} trails
              </span>
            </label>

            {/* Risk Heatmap Overlay */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-amber-50/40 hover:bg-amber-50 border border-amber-200/60 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.heatmap}
                  onChange={() => onToggleLayer('heatmap')}
                  className="accent-amber-600 h-4 w-4 rounded"
                />
                <span className="font-bold text-amber-900">Risk Heatmap</span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </label>

          </div>
        )}
      </div>

      {/* PANEL 2: FILTER PANEL */}
      <div className="p-4">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full flex items-center justify-between text-slate-700 hover:text-slate-900 font-bold text-xs uppercase tracking-wider mb-3 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span>Telemetry Filters</span>
          </div>
          {filtersExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {filtersExpanded && (
          <div className="space-y-4 pt-1">
            
            {/* Time Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Time Window
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => onChangeFilter({ timeRange: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours (Default)</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* State / UT Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Jurisdiction / State
              </label>
              <select
                value={filters.selectedState}
                onChange={(e) => onChangeFilter({ selectedState: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Amount Range Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Amount Range
              </label>
              <select
                value={filters.amountRange}
                onChange={(e) => onChangeFilter({ amountRange: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-slate-800 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Amounts</option>
                <option value="below10k">Below ₹10,000</option>
                <option value="10k-50k">₹10,000 - ₹50,000</option>
                <option value="50k-2L">₹50,000 - ₹2,00,000</option>
                <option value="2L-10L">₹2,00,000 - ₹10,00,000</option>
                <option value="above10L">Above ₹10,00,000</option>
              </select>
            </div>

            {/* Risk Level Filter Checkboxes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Risk Severity Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Critical', label: 'Critical (76-100)', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                  { id: 'High', label: 'High (51-75)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                  { id: 'Moderate', label: 'Moderate (26-50)', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
                  { id: 'Low', label: 'Low (0-25)', color: 'text-slate-700 bg-slate-50 border-slate-200' },
                ].map((r) => (
                  <label key={r.id} className={`flex items-center gap-1.5 p-1.5 rounded-md border text-xs cursor-pointer font-medium ${r.color}`}>
                    <input
                      type="checkbox"
                      checked={filters.riskLevels.includes(r.id)}
                      onChange={() => toggleRiskLevel(r.id)}
                      className="accent-blue-600 h-3.5 w-3.5 rounded"
                    />
                    <span>{r.id}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fraud Type Filter Checkboxes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Fraud Typology
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {fraudTypesList.map((type) => (
                  <label key={type} className="flex items-center gap-1.5 p-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.fraudTypes.includes(type)}
                      onChange={() => toggleFraudType(type)}
                      className="accent-blue-600 h-3.5 w-3.5 rounded"
                    />
                    <span className="truncate">{type.replace(' Fraud', '')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleApplyClick}
                className={`flex-1 py-2 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
                  appliedNotice
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {appliedNotice ? (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>Filters Applied</span>
                  </>
                ) : (
                  <span>Apply Filters</span>
                )}
              </button>
              <button
                onClick={onResetFilters}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                title="Reset all filters to default"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

          </div>
        )}
      </div>

    </aside>
  );
}
