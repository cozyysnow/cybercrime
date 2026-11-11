'use client';

import React from 'react';
import { TICKER_ITEMS } from '@/data/dashboardData';

interface BottomBarProps {
  onTickerClick?: (item: string) => void;
}

export default function BottomBar({ onTickerClick }: BottomBarProps) {
  return (
    <footer className="relative z-40 w-full bg-white border-t border-slate-200 text-slate-700 font-sans text-xs select-none">
      
      {/* PANEL 1: CONTINUOUS SCROLLING REAL-TIME TICKER */}
      <div className="w-full bg-slate-50/90 border-b border-slate-200 py-1.5 px-3 overflow-hidden flex items-center group">
        <div className="flex-shrink-0 flex items-center gap-1.5 pr-3 border-r border-slate-200 text-[10px] text-blue-700 font-semibold uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span>Radar Dispatch</span>
        </div>

        <div className="relative w-full overflow-hidden whitespace-nowrap ml-3">
          <div className="inline-block animate-marquee group-hover:[animation-play-state:paused] text-[11px] text-slate-600 font-medium">
            {TICKER_ITEMS.map((item, idx) => (
              <span
                key={idx}
                onClick={() => onTickerClick && onTickerClick(item)}
                className="inline-block mx-6 hover:text-blue-600 cursor-pointer transition-colors"
              >
                {item}
              </span>
            ))}
            {/* Repeat for continuous loop */}
            {TICKER_ITEMS.map((item, idx) => (
              <span
                key={`dup-${idx}`}
                onClick={() => onTickerClick && onTickerClick(item)}
                className="inline-block mx-6 hover:text-blue-600 cursor-pointer transition-colors"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PANEL 2 & 3: MAP LEGEND & DATA SOURCE HEALTH */}
      <div className="px-3 sm:px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] bg-white">
        
        {/* Map Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-600">
          <span className="font-semibold text-slate-900 uppercase text-[9px] tracking-wider">
            Legend:
          </span>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="1"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
            <span>ATM (Normal)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="1"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
            <span>ATM (Moderate)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="1"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
            <span>ATM (High Risk)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"/></svg>
            <span>Bank Branch</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Police Station</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Active Incident</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" strokeDasharray="3 3"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
            <span>Hotspot Zone</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 border-t-2 border-dashed border-red-500" />
            <span>Money Corridor</span>
          </div>
        </div>

        {/* Data Source Status Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 border-t md:border-t-0 pt-1 md:pt-0 border-slate-200">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
            <span>NCRP:</span>
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            <span className="text-emerald-700 font-semibold">Live</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
            <span>Bank Feed:</span>
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            <span className="text-emerald-700 font-semibold">Live</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
            <span>OSM:</span>
            <span className="text-slate-600">Updated 2h ago</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
            <span>News Feed:</span>
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            <span className="text-emerald-700 font-semibold">Live</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
            <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse" />
            <span>Alerts Active</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
