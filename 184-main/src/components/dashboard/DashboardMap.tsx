'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MapEngine = dynamic(() => import('./MapEngine'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center font-sans text-xs text-slate-500 gap-3">
      <div className="h-7 w-7 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
      <span className="text-xs font-semibold text-slate-700">
        Initializing Geospatial Intelligence Grid...
      </span>
      <span className="text-[11px] text-slate-400">
        OpenStreetMap • CFCFRMS Telemetry Sync
      </span>
    </div>
  ),
});

export default function DashboardMap(props: any) {
  return <MapEngine {...props} />;
}
