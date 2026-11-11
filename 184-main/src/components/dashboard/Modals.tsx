'use client';

import React, { useState } from 'react';
import { 
  X, AlertTriangle, Shield, Check, Copy, Download, 
  Share2, Split, MapPin, Building, ChevronRight, FileText, Send
} from 'lucide-react';
import { ATMEntity, PoliceStationEntity, BankBranchEntity } from '@/data/dashboardData';
import { sendAdbSms } from '@/lib/hardwareService';

interface ModalsProps {
  criticalAlertOpen: boolean;
  onCloseCriticalAlert: () => void;
  onDispatchTeam: () => void;
  onViewAlertLocation: () => void;

  reportModalOpen: boolean;
  onCloseReportModal: () => void;

  shareModalOpen: boolean;
  onCloseShareModal: () => void;

  drawZoneModalOpen: boolean;
  onCloseDrawZoneModal: () => void;

  compareModalOpen: boolean;
  onCloseCompareModal: () => void;

  selectedATM: ATMEntity | null;
  onCloseATMDetail: () => void;
  onRequestSurveillance: (atmId: string) => void;

  selectedPolice: PoliceStationEntity | null;
  onClosePoliceDetail: () => void;
  onRequestDeployment: (stationId: string) => void;

  selectedBranch: BankBranchEntity | null;
  onCloseBranchDetail: () => void;
}

export default function Modals({
  criticalAlertOpen,
  onCloseCriticalAlert,
  onDispatchTeam,
  onViewAlertLocation,
  reportModalOpen,
  onCloseReportModal,
  shareModalOpen,
  onCloseShareModal,
  drawZoneModalOpen,
  onCloseDrawZoneModal,
  compareModalOpen,
  onCloseCompareModal,
  selectedATM,
  onCloseATMDetail,
  onRequestSurveillance,
  selectedPolice,
  onClosePoliceDetail,
  onRequestDeployment,
  selectedBranch,
  onCloseBranchDetail,
}: ModalsProps) {
  // Report Form state
  const [includeStats, setIncludeStats] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeZones, setIncludeZones] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Share state
  const [copied, setCopied] = useState(false);

  // Surveillance requested state
  const [surveillanceRequested, setSurveillanceRequested] = useState(false);
  const [deploymentRequested, setDeploymentRequested] = useState(false);

  return (
    <>
      {/* 1. AUTO-TRIGGERED CRITICAL ALERT MODAL */}
      {criticalAlertOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none font-sans">
          <div className="w-full max-w-lg bg-white border border-red-200 shadow-2xl rounded-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={onCloseCriticalAlert}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 mb-5">
              <div className="h-11 w-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                  Critical Alert Intercept
                </div>
                <h3 className="text-slate-900 text-lg font-semibold tracking-tight">
                  High-Confidence Cash Withdrawal Predicted
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Target Hotspot:</span>
                <span className="text-slate-900 font-semibold">Sindhi Camp ATMs, Jaipur</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Model Probability:</span>
                <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  92% High Probability
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Estimated Amount at Risk:</span>
                <span className="text-red-600 font-bold text-sm">₹12.4 Lakhs</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Predicted Time Window:</span>
                <span className="text-slate-900 font-medium">Next 2 Hours (2:00 PM – 4:00 PM)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Linked Complaints:</span>
                <span className="text-slate-700 font-medium">4 Active Complaints Ingested</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-medium">
              <button
                onClick={() => {
                  onViewAlertLocation();
                  onCloseCriticalAlert();
                }}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-center shadow-sm transition-colors"
              >
                View on Map
              </button>
              <button
                onClick={() => {
                  onDispatchTeam();
                  onCloseCriticalAlert();
                }}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-center shadow-sm transition-colors font-semibold"
              >
                Dispatch Team
              </button>
              <button
                onClick={onCloseCriticalAlert}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-center transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GENERATE PDF REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none font-sans">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 relative">
            <button
              onClick={onCloseReportModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Download className="h-4 w-4" />
              </div>
              <h3 className="text-slate-900 text-base font-semibold">
                Generate Intelligence Briefing
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Compile current GIS surveillance telemetry, hotspot probabilities, and active complaints for commanding officers and inter-agency coordination.
            </p>

            <div className="space-y-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                />
                <span className="text-slate-700 font-medium">Include National Operational Metrics</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAlerts}
                  onChange={(e) => setIncludeAlerts(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                />
                <span className="text-slate-700 font-medium">Include Active Critical Alert Logs</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeZones}
                  onChange={(e) => setIncludeZones(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
                />
                <span className="text-slate-700 font-medium">Include Top 10 High-Risk ATM Clusters</span>
              </label>
            </div>

            {reportGenerated ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs text-center space-y-2">
                <div className="font-semibold text-emerald-900 flex items-center justify-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" />
                  PDF Report Compiled Successfully
                </div>
                <div className="text-[11px] font-mono text-emerald-700">CYBERCAST-INTEL-BRIEF-{new Date().toISOString().slice(0, 10)}.pdf</div>
                <button
                  onClick={() => {
                    setReportGenerated(false);
                    onCloseReportModal();
                  }}
                  className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs shadow-sm transition-colors"
                >
                  Download Complete
                </button>
              </div>
            ) : (
              <button
                onClick={() => setReportGenerated(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Compile & Export PDF Report</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. SHARE VIEW MODAL */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none font-sans">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 relative">
            <button
              onClick={onCloseShareModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Share2 className="h-4 w-4" />
              </div>
              <h3 className="text-slate-900 text-base font-semibold">
                Share Secure Telemetry View
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Generate an authenticated 24-hour token for inter-state police coordination. Recipient officer will receive synchronized filters, zoom coordinates, and layer visibility.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Encrypted Share Link (Expires in 24h):</div>
              <div className="text-blue-600 break-all font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                https://cybercast.i4c.gov.in/v2/shared?session=7c8f2a91&coords=26.9209,75.7973&z=14&sec=I4C-RESTRICTED
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText('https://cybercast.i4c.gov.in/v2/shared?session=7c8f2a91');
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Link Copied to Clipboard' : 'Copy Secure Telemetry Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. DRAW ZONE POLYGON RISK CALCULATOR MODAL */}
      {drawZoneModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none font-sans">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 relative">
            <button
              onClick={onCloseDrawZoneModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="h-4 w-4" />
              </div>
              <h3 className="text-slate-900 text-base font-semibold">
                Custom Surveillance Zone Analysis
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Define a custom tactical perimeter to calculate instantaneous aggregate risk and ATM vulnerability index.
            </p>

            <div className="space-y-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Perimeter Type:</span>
                <span className="text-slate-900 font-medium">Radial 2.0 km Cluster</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total ATMs Enclosed:</span>
                <span className="text-slate-900 font-semibold">14 Banking Terminals</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Historical Incidents (30d):</span>
                <span className="text-amber-600 font-semibold">23 Frauds</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-900 font-semibold">Calculated Risk Index:</span>
                <span className="text-red-600 font-bold text-sm bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  78.4 / 100 [High Risk]
                </span>
              </div>
            </div>

            <button
              onClick={onCloseDrawZoneModal}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Lock Zone to Surveillance Radar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. COMPARE SPLIT-SCREEN MODAL */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none font-sans">
          <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 relative">
            <button
              onClick={onCloseCompareModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Split className="h-4 w-4" />
              </div>
              <h3 className="text-slate-900 text-base font-semibold">
                Comparative Risk Progression Engine
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Compare current risk map with historical baselines to observe how withdrawal networks migrate across jurisdictions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-blue-700 font-semibold uppercase text-[10px] pb-1.5 border-b border-slate-200 flex items-center justify-between">
                  <span>Current Live Map (Today)</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Top Hotspot:</span> <strong className="text-slate-900">Sindhi Camp (92)</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Active Complaints:</span> <strong className="text-slate-900">67 Nationwide</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Avg Withdrawal Window:</span> <strong className="text-slate-900">2.8 Hours</strong></div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-slate-600 font-semibold uppercase text-[10px] pb-1.5 border-b border-slate-200">
                  Historical Baseline (-7 Days)
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Top Hotspot:</span> <strong className="text-slate-900">Mewat Cluster (89)</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Active Complaints:</span> <strong className="text-slate-900">54 Nationwide</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Avg Withdrawal Window:</span> <strong className="text-slate-900">4.1 Hours</strong></div>
              </div>
            </div>

            <button
              onClick={onCloseCompareModal}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors"
            >
              Return to Full Command View
            </button>
          </div>
        </div>
      )}

      {/* 6. POPUP: ATM DETAIL CARD (ON CLICK) */}
      {selectedATM && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[90] w-full max-w-md p-4 select-none font-sans">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 relative">
            <button
              onClick={onCloseATMDetail}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-slate-900 text-base font-semibold">
                {selectedATM.bank} - {selectedATM.branch}
              </span>
            </div>
            <div className="text-slate-500 text-[11px] mb-3">{selectedATM.address}</div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between mb-3 text-xs">
              <span className="text-slate-600">Terminal ID: <strong className="text-slate-900 font-mono">{selectedATM.id}</strong></span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                selectedATM.riskScore >= 75 ? 'text-red-700 border-red-200 bg-red-50' :
                selectedATM.riskScore >= 50 ? 'text-amber-700 border-amber-200 bg-amber-50' :
                'text-emerald-700 border-emerald-200 bg-emerald-50'
              }`}>
                Risk: {selectedATM.riskScore}/100
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 mb-4 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
              <div>Today&apos;s Activity: <strong className="text-slate-900">3 Suspicious Withdrawals Flagged</strong></div>
              <div>Flagged Amount: <strong className="text-blue-700">₹45,000</strong> (Last: {selectedATM.lastAlert})</div>
              <div>Historical Data: <strong className="text-slate-900">{selectedATM.fraudWithdrawals} Frauds in last 30d</strong></div>
              <div>Peak Fraud Hours: <strong className="text-amber-600">1:00 PM – 4:00 PM</strong></div>
              <div>Nearest Police Station: <strong className="text-slate-900">Sindhi Camp PS (800m) • ~4 min response</strong></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              <button
                onClick={() => {
                  onRequestSurveillance(selectedATM.id);
                  setSurveillanceRequested(true);
                  setTimeout(() => setSurveillanceRequested(false), 3000);
                }}
                className={`py-2 px-2 rounded-lg text-center transition-colors font-semibold ${
                  surveillanceRequested 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {surveillanceRequested ? 'Flagged ✓' : 'Surveillance'}
              </button>
              <button
                onClick={() => {
                  sendAdbSms({
                    phone: '+919829041209',
                    message: `[CYBERCAST ATM FRAUD ALERT] ${selectedATM.bank} Nodal Officer: Suspicious withdrawal activity detected at ${selectedATM.bank} (${selectedATM.branch}, ${selectedATM.address}). Risk: ${selectedATM.fraudWithdrawals} frauds in 30d. Monitor branch CCTV & cash dispensing.`,
                    priority: 'FLASH_P1',
                    officerName: 'Bank Nodal Liaison',
                    caseId: `ATM-${selectedATM.id}`,
                  }).catch(() => {});
                  alert(`Alert broadcast sent to ${selectedATM.bank} branch nodal officer via CFCFRMS & SMS sent!`);
                }}
                className="py-2 px-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-center shadow-sm transition-colors"
              >
                Alert Bank
              </button>
              <button
                onClick={onCloseATMDetail}
                className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-center transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. POPUP: POLICE STATION DETAIL CARD (ON CLICK) */}
      {selectedPolice && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[90] w-full max-w-md p-4 select-none font-sans">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 relative">
            <button
              onClick={onClosePoliceDetail}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-slate-900 text-base font-semibold">
                {selectedPolice.name}
              </span>
            </div>
            <div className="text-slate-500 text-[11px] mb-3">{selectedPolice.jurisdiction}</div>

            <div className="space-y-1.5 text-xs text-slate-700 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>SHO: <strong className="text-slate-900">{selectedPolice.sho}</strong></div>
              <div>Contact: <strong className="text-slate-900 font-mono">{selectedPolice.contact}</strong></div>
              <div>Cyber Cell: <strong className="text-blue-700">Available ({selectedPolice.cyberCellStaff} Officers)</strong></div>
              <div>Active Assigned Cases: <strong className="text-slate-900">{selectedPolice.activeCases}</strong></div>
              <div>Response Time: <strong className="text-amber-600">{selectedPolice.responseTime}</strong></div>
              <div>Teams Deployed: <strong className="text-slate-900">{selectedPolice.teamsDeployed} Units Active</strong></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              <button
                onClick={() => {
                  onRequestDeployment(selectedPolice.id);
                  sendAdbSms({
                    phone: selectedPolice.contact || '+919829041209',
                    message: `[CYBERCAST PATROL DISPATCH] Urgent tactical deployment to ${selectedPolice.name} jurisdiction (${selectedPolice.jurisdiction}). SHO: ${selectedPolice.sho}. Active Cases: ${selectedPolice.activeCases}. Immediate PCR patrol required.`,
                    priority: 'FLASH_P1',
                    officerName: selectedPolice.sho,
                    caseId: `POLICE-${selectedPolice.id}`,
                  }).catch(() => {});
                  setDeploymentRequested(true);
                  setTimeout(() => setDeploymentRequested(false), 3000);
                }}
                className={`py-2 px-2 rounded-lg text-center transition-colors font-semibold ${
                  deploymentRequested ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {deploymentRequested ? 'Dispatched ✓' : 'Dispatch PCR'}
              </button>
              <button
                onClick={() => {
                  sendAdbSms({
                    phone: selectedPolice.contact || '+919829041209',
                    message: `[CYBERCAST FLASH DIRECTIVE] Urgent contact requested by Central Cyber Command. SHO: ${selectedPolice.sho} (${selectedPolice.name}). Please report to command console immediately.`,
                    priority: 'FLASH_P1',
                    officerName: selectedPolice.sho,
                    caseId: `SHO-${selectedPolice.id}`,
                  }).catch(() => {});
                  alert(`Tactical dispatch SMS sent to SHO ${selectedPolice.sho} (${selectedPolice.contact})!`);
                }}
                className="py-2 px-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-center shadow-sm transition-colors"
              >
                Contact SHO
              </button>
              <button
                onClick={onClosePoliceDetail}
                className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-center transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. POPUP: BANK BRANCH DETAIL CARD (ON CLICK) */}
      {selectedBranch && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[90] w-full max-w-md p-4 select-none font-sans">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 relative">
            <button
              onClick={onCloseBranchDetail}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Building className="h-4 w-4 text-sky-600" />
              <span className="text-slate-900 text-base font-semibold">
                {selectedBranch.name}
              </span>
            </div>
            <div className="text-slate-500 text-[11px] mb-3">{selectedBranch.address}</div>

            <div className="space-y-1.5 text-xs text-slate-700 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>IFSC Code: <strong className="text-slate-900 font-mono">{selectedBranch.ifsc}</strong></div>
              <div>Flagged Mule Accounts: <strong className="text-red-600">{selectedBranch.flaggedAccounts} Accounts</strong></div>
              <div>Risk Level: <strong className="text-amber-600">{selectedBranch.riskLevel}</strong></div>
              <div>Branch Manager Contact: <strong className="text-slate-900 font-mono">{selectedBranch.managerContact}</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                onClick={() => {
                  sendAdbSms({
                    phone: '+919980177312',
                    message: `[CYBERCAST CFCFRMS STATUTORY FREEZE] Mandate on ${selectedBranch.flaggedAccounts} flagged accounts at ${selectedBranch.name} (${selectedBranch.ifsc}). Freeze debits immediately under Sec 91 CrPC.`,
                    priority: 'FLASH_P1',
                    officerName: 'Priya Nambiar (Nodal Officer)',
                    caseId: `BRANCH-${selectedBranch.id}`,
                  }).catch(() => {});
                  alert(`Freeze mandate dispatched for ${selectedBranch.flaggedAccounts} accounts at ${selectedBranch.name} via CFCFRMS & SMS sent!`);
                }}
                className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center shadow-sm transition-colors"
              >
                Freeze Flagged Accounts
              </button>
              <button
                onClick={onCloseBranchDetail}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-center transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
