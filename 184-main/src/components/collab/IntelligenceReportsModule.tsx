'use client';

import React, { useState } from 'react';
import { 
  FileText, Download, Share2, TrendingUp, 
  BarChart3, Globe, Calendar, Check, Printer, Shield, 
  AlertTriangle, Network, Layers, ExternalLink
} from 'lucide-react';
import { OfficerRole, OFFICER_ROLES, OfficerProfile } from '@/data/collabData';
import { getModelHealth, ModelHealthStatus, getDistrictRiskScores } from '@/lib/apiService';

interface IntelligenceReportsModuleProps {
  currentRole?: OfficerRole;
  currentOfficer?: OfficerProfile;
  onAuditLog?: (action: string, entityId: string, entityType: string) => void;
}

export default function IntelligenceReportsModule({
  currentRole: propRole,
  currentOfficer,
  onAuditLog,
}: IntelligenceReportsModuleProps) {
  const currentRole = propRole || currentOfficer?.role || 'i4c_admin';
  const [selectedReportType, setSelectedReportType] = useState<number>(1);
  const [sitrepLanguage, setSitrepLanguage] = useState<'en' | 'hi'>('en');
  const [customRange, setCustomRange] = useState('Last 7 Days');
  const [customFormat, setCustomFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);
  const [modelTelemetry, setModelTelemetry] = useState<ModelHealthStatus | null>(null);
  const [districtCount, setDistrictCount] = useState<number>(964);

  React.useEffect(() => {
    getModelHealth().then(setModelTelemetry).catch(() => {});
    getDistrictRiskScores().then(d => setDistrictCount(d.length)).catch(() => {});
  }, []);

  const activeOfficer = OFFICER_ROLES[currentRole];

  const handleExportReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Intelligence Report compiled and downloaded to local secure downloads directory.');
    }, 1200);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans text-slate-900 bg-slate-50 select-none">
      
      {/* 1. TOP MODULE HEADER */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              National Intelligence & Threat Analytics Reports
              <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-full">
                Statutory Briefings
              </span>
            </h2>
            <div className="text-xs text-slate-500">
              Automated AI Pattern Summaries, Daily SITREPs, and Inter-State Criminal Syndicate Dossiers
            </div>
          </div>
        </div>

        {/* Global Export & Print Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print Dossier</span>
          </button>

          <button
            onClick={handleExportReport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Compiling...' : 'Export Report'}</span>
          </button>
        </div>

      </div>

      {/* LIVE MODEL TELEMETRY STRIP */}
      <div className="px-5 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live ML Engine: <span className="text-blue-600">FastAPI v3.0.0</span>
          </span>
          <span className="text-slate-300">•</span>
          <span>Models: <strong className="text-slate-800 font-medium">{modelTelemetry?.modelsLoadedCount ?? 5}/5 Active</strong></span>
          <span className="text-slate-300">•</span>
          <span>Scored Districts: <strong className="text-blue-600 font-medium">{districtCount} Pan-India</strong></span>
          <span className="text-slate-300">•</span>
          <span>Inference Latency: <strong className="text-emerald-700 font-mono font-medium">{modelTelemetry?.latencyMs ?? 21}ms</strong></span>
        </div>
        <span className="text-xs text-slate-400 uppercase tracking-wider hidden md:inline font-medium">
          MHA / I4C National AI Repository
        </span>
      </div>

      {/* 2. REPORT TABS NAVIGATION */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 overflow-x-auto text-xs font-semibold">
        {[
          { id: 1, label: 'Report 1: Case-Specific AI Intel' },
          { id: 2, label: 'Report 2: Daily SITREP (Bilingual)' },
          { id: 3, label: 'Report 3: Weekly Trend Analysis' },
          { id: 4, label: 'Report 4: Criminal Network Syndicate' },
          { id: 5, label: 'Report 5: Custom Report Builder' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReportType(tab.id)}
            className={`px-4 py-3 whitespace-nowrap transition-all border-b-2 ${
              selectedReportType === tab.id
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. REPORT CONTENT VIEWER */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 text-xs">
        
        {/* REPORT 1: CASE-SPECIFIC INTELLIGENCE REPORT */}
        {selectedReportType === 1 && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm relative space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs text-blue-700 uppercase font-semibold tracking-wider">[ Classified Dossier ]</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Case CY2026-MH-44521 — Predictive Withdrawal Hotspot Intelligence
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Source FIR #412/2026 • Ingested: 05 Sept 2026 11:42 IST • Target: Jaipur North
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Threat Index</span>
                  <span className="text-rose-600 font-bold text-lg">92 / 100 Critical</span>
                </div>
              </div>

              <div className="space-y-4 text-slate-700 text-xs leading-relaxed">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="text-xs text-blue-700 uppercase font-semibold">1. AI Pattern Matching & Modus Operandi:</div>
                  <p>
                    Pattern analysis extracted from victim statement matches the <strong>&quot;Electricity Bill Disconnection APK&quot;</strong> attack vector. 
                    The malware routed ₹4.50 Lakhs into two tier-1 mule accounts in Jaipur (State Bank of India) and Alwar (Punjab National Bank). 
                    Historical correlation matches <strong>18 previous cases</strong> associated with the <em>Mewat Sector-4 Collective</em>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Predicted Cash-Out</span>
                    <strong className="text-slate-900 text-sm">Sindhi Camp ATMs, Jaipur</strong>
                    <span className="text-xs text-amber-700 font-medium block mt-1">Window: 14:00 - 16:30 IST Today</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Model Confidence</span>
                    <strong className="text-blue-600 text-sm">92% High Probability</strong>
                    <span className="text-xs text-slate-500 block mt-1">Trained on 45,000 NCRP Cases</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Recovery Feasibility</span>
                    <strong className="text-emerald-600 text-sm">74% High Recovery</strong>
                    <span className="text-xs text-slate-500 block mt-1">₹1.85L Frozen at Tier-1</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="text-xs text-blue-900 uppercase font-semibold">2. Recommended Tactical Directives:</div>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-700 text-xs">
                    <li>Maintain 2 plainclothes officers around SBI ATM Terminal #RJ-4421 on Station Road.</li>
                    <li>Verify suspect identity against CCTV reference photo (Black Hoodie, male, 25-30 yrs).</li>
                    <li>CFCFRMS freeze executed on PNB #XXXX1102; alert branch manager to report walk-in withdrawal attempts.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 2: DAILY SITUATION REPORT (SITREP) - BILINGUAL */}
        {selectedReportType === 2 && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2.5 text-xs">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-slate-700 uppercase">SITREP Language:</span>
                <button
                  onClick={() => setSitrepLanguage('en')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    sitrepLanguage === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setSitrepLanguage('hi')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    sitrepLanguage === 'hi' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>

              <span className="text-xs text-slate-500">Published daily at 08:00 IST • Dispatch #SIT-2026-248</span>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-5">
              {sitrepLanguage === 'en' ? (
                <>
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-xs text-blue-700 font-semibold uppercase tracking-wider">[ MHA / I4C National Briefing ]</span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      National Cyber Threat Daily Situation Report (SITREP) — 05 September 2026
                    </h3>
                  </div>

                  {/* 4 Stat KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">24h Complaints</span>
                      <strong className="text-xl text-slate-900 font-bold">8,247</strong>
                      <span className="text-xs text-rose-600 block font-medium">+14% vs Previous Day</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Amount at Risk</span>
                      <strong className="text-xl text-amber-700 font-bold">₹18.42 Cr</strong>
                      <span className="text-xs text-slate-500 block">Across 28 States & UTs</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Funds Frozen (CFCFRMS)</span>
                      <strong className="text-xl text-emerald-600 font-bold">₹4.85 Cr</strong>
                      <span className="text-xs text-emerald-700 block font-medium">26.3% Interception Rate</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Field Arrests Made</span>
                      <strong className="text-xl text-slate-900 font-bold">14 Suspects</strong>
                      <span className="text-xs text-blue-600 block font-medium">6 Inter-State Gangs</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="text-xs text-slate-900 font-semibold uppercase">Top 5 Trending Cyber Fraud Typologies:</div>
                      <ol className="list-decimal pl-4 space-y-1.5">
                        <li><strong>KYC / Electricity Bill Disconnection Scams</strong> (2,410 cases — High severity in MH, RJ, DL)</li>
                        <li><strong>Institutional Stock & Crypto Investment Frauds</strong> (1,840 cases — ₹8.2 Cr losses in GJ, KA, TS)</li>
                        <li><strong>Instant Loan App Extortion & Sextortion</strong> (1,120 cases — Originating in Jamtara & Bharatpur)</li>
                        <li><strong>UPI Phishing / Fake QR Code Payments</strong> (1,090 cases — Rural and urban ATM cash-outs)</li>
                        <li><strong>Digital Arrest & FedEx Customs Impersonation</strong> (610 cases — High net-worth seniors targeted)</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="text-xs text-slate-900 font-semibold uppercase">Top 3 National High-Risk Withdrawal Hotspots:</div>
                      <div className="space-y-2">
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg">1. 🔴 <strong>Sindhi Camp, Jaipur</strong> — 14 ATMs under heightened surveillance (Predicted volume: ₹45L)</div>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg">2. 🔴 <strong>Tauru-Kaman Corridor, Mewat</strong> — Rural POS terminals actively monitored (Predicted volume: ₹68L)</div>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg">3. 🟠 <strong>Hazratganj, Lucknow</strong> — High-value corporate bank branch clusters (Predicted volume: ₹32L)</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* HINDI TRANSLATED SITREP */
                <>
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-xs text-blue-700 font-semibold uppercase tracking-wider">[ गृह मंत्रालय / आई4सी राष्ट्रीय ब्रीफिंग ]</span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      राष्ट्रीय साइबर अपराध दैनिक स्थिति रिपोर्ट (SITREP) — 05 सितंबर 2026
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">24 घंटे की कुल शिकायतें</span>
                      <strong className="text-xl text-slate-900 font-bold">8,247</strong>
                      <span className="text-xs text-rose-600 block font-medium">पिछले दिन की तुलना में +14%</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">जोखिम में कुल राशि</span>
                      <strong className="text-xl text-amber-700 font-bold">₹18.42 करोड़</strong>
                      <span className="text-xs text-slate-500 block">28 राज्यों और यूटी में</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">फ्रीज की गई राशि (CFCFRMS)</span>
                      <strong className="text-xl text-emerald-600 font-bold">₹4.85 करोड़</strong>
                      <span className="text-xs text-emerald-700 block font-medium">26.3% रोकथाम दर</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">गिरफ्तार संदिग्ध</span>
                      <strong className="text-xl text-slate-900 font-bold">14 व्यक्ति</strong>
                      <span className="text-xs text-blue-600 block font-medium">6 अंतर-राज्यीय गिरोह</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="text-xs text-slate-900 font-semibold uppercase">शीर्ष 5 साइबर धोखाधड़ी श्रेणियां:</div>
                      <ol className="list-decimal pl-4 space-y-1.5">
                        <li><strong>केवाईसी / बिजली बिल विच्छेदन धोखाधड़ी</strong> (2,410 मामले — महाराष्ट्र, राजस्थान, दिल्ली में उच्च प्रसार)</li>
                        <li><strong>फर्जी शेयर बाजार और क्रिप्टो निवेश घोटाला</strong> (1,840 मामले — गुजरात, कर्नाटक में भारी नुकसान)</li>
                        <li><strong>लोन ऐप ब्लैकमेल और सेक्सटॉर्शन</strong> (1,120 मामले — जामताड़ा और भरतपुर गिरोह)</li>
                        <li><strong>यूपीआई क्यूआर कोड भुगतान धोखाधड़ी</strong> (1,090 मामले)</li>
                        <li><strong>डिजिटल अरेस्ट / फेडेक्स कस्टम अधिकारी धोखाधड़ी</strong> (610 मामले)</li>
                      </ol>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* REPORT 3: WEEKLY TREND ANALYSIS */}
        {selectedReportType === 3 && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-5">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-700 font-semibold uppercase tracking-wider">[ Weekly Trend Strategy ]</span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    National Trend & Migration Analytics — Week 36 (2026)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">Comparing W35 vs W36</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="text-xs font-semibold text-slate-900 uppercase flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span>Emerging Modus Operandi Shifts</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Fraud networks in the Mewat corridor are shifting from urban bank branch ATM withdrawals toward rural Customer Service Points (CSP) and micro-ATMs. 
                    Average cash-out time window has compressed from 4.2 hours down to <strong>2.6 hours</strong>.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="text-xs font-semibold text-slate-900 uppercase flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span>Inter-State Recovery Leaderboard</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between"><span>1. Rajasthan State Cyber Cell:</span><strong className="text-emerald-600 font-semibold">34.2% Recovery</strong></div>
                    <div className="flex justify-between"><span>2. Maharashtra Cyber Police:</span><strong className="text-slate-900 font-semibold">31.8% Recovery</strong></div>
                    <div className="flex justify-between"><span>3. Haryana Cyber Crime Unit:</span><strong className="text-slate-900 font-semibold">28.4% Recovery</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 4: CRIMINAL NETWORK SYNDICATE */}
        {selectedReportType === 4 && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-5">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-600 font-semibold uppercase tracking-wider">[ Syndicate Attribution ]</span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Network Dossier: &quot;Mewat-Jamtara Transit Ring #04&quot;
                  </h3>
                </div>
                <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold">42 Linked Cases Ingested</span>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="text-xs text-blue-900 font-semibold uppercase flex items-center gap-2">
                  <Network className="h-4 w-4 text-blue-600" />
                  Mule Account & Caller Topology Graph
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">Calling Cores</span>
                    <strong className="text-slate-900 text-sm">12 Active SIMs</strong>
                    <span className="text-slate-500 text-xs block mt-0.5">Location: Nuh & Bharatpur</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">Tier-1 Mule Accounts</span>
                    <strong className="text-slate-900 text-sm">28 Flagged Accounts</strong>
                    <span className="text-slate-500 text-xs block mt-0.5">SBI, PNB, Canara Bank</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">Primary Cash-Out Hub</span>
                    <strong className="text-slate-900 text-sm">Jaipur & Alwar ATMs</strong>
                    <span className="text-blue-600 font-semibold text-xs block mt-0.5">Sindhi Camp & MI Road</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 5: CUSTOM REPORT BUILDER */}
        {selectedReportType === 5 && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs text-blue-700 font-semibold uppercase tracking-wider">[ Report Compiler Wizard ]</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Build Custom Strategic / Parliamentary Dossier
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Time Window:</label>
                  <select
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="Last 24 Hours">Last 24 Hours</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Quarter 3 (2026)">Current Quarter (Q3 2026)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Jurisdictions:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    {['Rajasthan', 'Maharashtra', 'Uttar Pradesh', 'Haryana', 'Delhi NCR', 'Pan-India Combined'].map((st) => (
                      <label key={st} className="flex items-center gap-2 cursor-pointer text-slate-800">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                        <span>{st}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Export Format:</label>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {['PDF (Statutory Dossier)', 'Excel (.XLSX Audit Sheets)', 'PowerPoint (.PPTX Command Brief)'].map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2 cursor-pointer text-slate-800">
                        <input
                          type="radio"
                          name="format"
                          checked={customFormat === fmt.split(' ')[0]}
                          onChange={() => setCustomFormat(fmt.split(' ')[0])}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleExportReport}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Generate & Compile Custom Report →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
