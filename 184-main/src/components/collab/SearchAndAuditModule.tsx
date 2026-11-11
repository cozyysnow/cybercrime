'use client';

import React, { useState } from 'react';
import { 
  AUDIT_LOGS_DATA, 
  AuditLogEntry, 
  CASES_DATA, 
  EVIDENCE_DATA, 
  OfficerProfile 
} from '@/data/collabData';
import { 
  Search, 
  ShieldCheck, 
  Link2, 
  FileText, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  Lock, 
  Download, 
  Filter, 
  Share2, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Fingerprint
} from 'lucide-react';

interface SearchAndAuditModuleProps {
  currentOfficer: OfficerProfile;
  onSelectCase?: (caseId: string) => void;
  onAuditLog?: (action: string, entityId: string, entityType: string) => void;
}

export default function SearchAndAuditModule({
  currentOfficer,
  onSelectCase,
  onAuditLog,
}: SearchAndAuditModuleProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'cross_search' | 'ai_links'>('ai_links');
  
  // Search state
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchEntityFilter, setSearchEntityFilter] = useState<'ALL' | 'CASES' | 'MULES' | 'PHONES' | 'EVIDENCE'>('ALL');
  
  // Audit log filter
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(AUDIT_LOGS_DATA);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');

  // AI Cross-Case Link Cluster Data
  const linkClusters = [
    {
      id: 'LNK-9921',
      title: 'Common Mule Ring: SBI Account #4491',
      type: 'Mule Account Link',
      confidence: 96,
      syndicate: 'Mewat-Bharatpur Syndicate #04',
      cases: ['CY2026-MH-44521', 'CY2026-UP-44519', 'CY2026-HR-44472'],
      details: 'Identical beneficiary account SBI-XXXX-4491 utilized in 3 independent complaints filed across Mumbai, Lucknow, and Gurugram within 72 hours. Total routed volume: ₹19.4 Lakhs.',
      sharedEntity: 'SBI-XXXX-4491 (Jaipur Branch)',
    },
    {
      id: 'LNK-9922',
      title: 'Shared Handset IMEI: 864902819203918',
      type: 'IMEI / Device Nexus',
      confidence: 91,
      syndicate: 'Jamtara-Karmatanr Module 3',
      cases: ['CY2026-DL-44502', 'CY2026-KA-44498', 'CY2026-WB-44485'],
      details: 'IMEI terminal active across 3 separate SIM cards registered under false identities in Jharkhand and Bihar. Geolocation coordinates coincide at Jamtara CSP center.',
      sharedEntity: 'IMEI: 864902819203918 (Realme C11)',
    },
    {
      id: 'LNK-9923',
      title: 'Virtual WhatsApp Calling Gateway: +91-98765-XXXXX',
      type: 'Telecom Gateway Nexus',
      confidence: 89,
      syndicate: 'Cross-Border Digital Arrest Cartel',
      cases: ['CY2026-WB-44485', 'CY2026-GJ-44441'],
      details: 'VoIP gateway spoofing Mumbai Crime Branch calling line ID. Sanchar Saathi DoT database flags 41 consumer spam reports in 7 days.',
      sharedEntity: 'CLI: +91-98765-XXXXX (VoIP Virtual)',
    },
  ];

  // Perform multi-entity search
  const searchResults = React.useMemo(() => {
    if (!globalQuery.trim()) return [];
    const q = globalQuery.toLowerCase();
    const results: {
      type: 'Case' | 'Mule' | 'Phone' | 'Evidence';
      title: string;
      subtitle: string;
      id: string;
      caseId?: string;
    }[] = [];

    CASES_DATA.forEach((c) => {
      // Case match
      if (
        c.id.toLowerCase().includes(q) ||
        c.fraudType.toLowerCase().includes(q) ||
        c.victimState.toLowerCase().includes(q) ||
        c.victim.name.toLowerCase().includes(q)
      ) {
        if (searchEntityFilter === 'ALL' || searchEntityFilter === 'CASES') {
          results.push({
            type: 'Case',
            title: `${c.id} - ${c.fraudType}`,
            subtitle: `Victim: ${c.victim.maskedName} (${c.victimState}) • ₹${c.totalAmount.toLocaleString('en-IN')}`,
            id: c.id,
            caseId: c.id,
          });
        }
      }

      // Mule match
      c.linkedMuleAccounts.forEach((mule) => {
        if (mule.toLowerCase().includes(q)) {
          if (searchEntityFilter === 'ALL' || searchEntityFilter === 'MULES') {
            results.push({
              type: 'Mule',
              title: `Mule Account: ${mule}`,
              subtitle: `Linked to Case: ${c.id} (${c.victimState})`,
              id: mule,
              caseId: c.id,
            });
          }
        }
      });

      // Phone match
      c.linkedPhoneNumbers.forEach((ph) => {
        if (ph.toLowerCase().includes(q)) {
          if (searchEntityFilter === 'ALL' || searchEntityFilter === 'PHONES') {
            results.push({
              type: 'Phone',
              title: `Phone / MSISDN: ${ph}`,
              subtitle: `Linked to Case: ${c.id}`,
              id: ph,
              caseId: c.id,
            });
          }
        }
      });
    });

    // Evidence match
    EVIDENCE_DATA.forEach((ev) => {
      if (
        ev.id.toLowerCase().includes(q) ||
        ev.title.toLowerCase().includes(q) ||
        ev.sha256Hash.toLowerCase().includes(q) ||
        (ev.ocrExtractedText && ev.ocrExtractedText.toLowerCase().includes(q))
      ) {
        if (searchEntityFilter === 'ALL' || searchEntityFilter === 'EVIDENCE') {
          results.push({
            type: 'Evidence',
            title: `Evidence ${ev.id}: ${ev.title}`,
            subtitle: `SHA-256: ${ev.sha256Hash.substring(0, 16)}... • Case: ${ev.caseId}`,
            id: ev.id,
            caseId: ev.caseId,
          });
        }
      }
    });

    return results;
  }, [globalQuery, searchEntityFilter]);

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
    return true;
  });

  const handleExportAudit = () => {
    if (onAuditLog) {
      onAuditLog('EXPORTED_OFFICIAL_AUDIT_LOG', 'AUD-TRAIL-CSV', 'SYSTEM');
    }
    alert('[MHA I4C Statutory Compliance] Full cryptographically certified system audit trail generated as SHA-256 signed archive. Logged to central security ledger.');
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Title & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Module 07-09 // Intelligence Nexus & Immutable Ledger
            </span>
            <span className="text-xs text-slate-500 font-medium">Pan-India Graph Correlation</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-blue-600" />
            Search, AI Link Detection & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Multi-entity cross-state matching • Automated syndicate graph clustering • Sec 65B certified audit logs
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ai_links')}
            className={`px-3.5 py-1.5 text-xs font-semibold transition-all rounded-lg ${
              activeTab === 'ai_links'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Link Detection
          </button>
          <button
            onClick={() => setActiveTab('cross_search')}
            className={`px-3.5 py-1.5 text-xs font-semibold transition-all rounded-lg ${
              activeTab === 'cross_search'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Omnibox Search
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 text-xs font-semibold transition-all rounded-lg ${
              activeTab === 'audit'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Immutable Audit Trail
          </button>
        </div>
      </div>

      {/* TAB 1: AI LINK DETECTION */}
      {activeTab === 'ai_links' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide block">
                  3 Active Syndicate Nexus Clusters Identified
                </span>
                <span className="text-xs text-slate-600">
                  AI neural engine autonomously correlates recurring mule accounts, IMEIs, and IPDR traces across all state cyber units
                </span>
              </div>
            </div>
            <span className="text-xs text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full font-semibold border border-emerald-200">
              Live Graph Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {linkClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-5 bg-white border border-slate-200 hover:border-blue-300 transition-all rounded-xl shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {cluster.id}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {cluster.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {cluster.confidence}% AI Confidence
                    </span>
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      {cluster.syndicate}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed">
                  {cluster.details}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Inter-Connected Cases:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.cases.map((cId) => (
                        <button
                          key={cId}
                          onClick={() => onSelectCase && onSelectCase(cId)}
                          className="text-xs font-semibold text-blue-600 hover:underline bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                        >
                          {cId}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        alert(
                          `[Inter-State Coordination] Joint Task Force charter created for ${cluster.id} linking ${cluster.cases.join(', ')}. Dispatched formal invitations to concerned State Nodal Officers.`
                        )
                      }
                      className="text-xs font-semibold text-white px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Create Joint Task Force
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OMNIBOX CROSS-ENTITY SEARCH */}
      {activeTab === 'cross_search' && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Search across all Indian cases, mule accounts, phone numbers, IMEIs, or evidence hashes..."
                className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold uppercase">Filter Entity Type:</span>
              {(['ALL', 'CASES', 'MULES', 'PHONES', 'EVIDENCE'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSearchEntityFilter(type)}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg uppercase transition-all ${
                    searchEntityFilter === type
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-2.5">
            {!globalQuery.trim() ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <div className="text-sm font-semibold text-slate-800">Global Forensic Search</div>
                <div className="text-xs text-slate-500 mt-1">
                  Type a phone number, account number, case ACK, victim name, or SHA-256 signature to query across all 28 states
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <div className="text-sm font-semibold text-slate-800">No Matching Entities Located</div>
                <div className="text-xs text-slate-500 mt-1">
                  Try searching for partial keywords like &quot;SBI&quot;, &quot;Jaipur&quot;, &quot;44521&quot; or &quot;98765&quot;
                </div>
              </div>
            ) : (
              searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => res.caseId && onSelectCase && onSelectCase(res.caseId)}
                  className="p-4 bg-white border border-slate-200 hover:border-blue-400 cursor-pointer transition-all rounded-xl shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                      {res.type === 'Case' ? (
                        <FileText className="w-4 h-4 text-blue-600" />
                      ) : res.type === 'Mule' ? (
                        <CreditCard className="w-4 h-4 text-amber-600" />
                      ) : res.type === 'Phone' ? (
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                          {res.type}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {res.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {res.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-blue-600 transition-colors font-medium">
                    <span>Inspect Case</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: IMMUTABLE AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 uppercase block">
                  Immutable System Audit Ledger (Sec 65B Evidence Act)
                </span>
                <span className="text-xs text-slate-500">
                  Every login, case inspection, evidence download, and freeze order is cryptographically signed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportAudit}
                className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors border border-slate-200 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Audit Ledger (CSV)</span>
              </button>
            </div>
          </div>

          {/* Audit Table */}
          <div className="border border-slate-200 bg-white overflow-x-auto rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase">
                  <th className="py-3 px-3.5">Log ID</th>
                  <th className="py-3 px-3.5">Timestamp (IST)</th>
                  <th className="py-3 px-3.5">Officer & Role</th>
                  <th className="py-3 px-3.5">Action Performed</th>
                  <th className="py-3 px-3.5">Entity ID</th>
                  <th className="py-3 px-3.5">Terminal & IP</th>
                  <th className="py-3 px-3.5">Integrity Digest</th>
                  <th className="py-3 px-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-blue-600 font-semibold font-mono">
                      {log.id}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">{log.officerName}</div>
                      <div className="text-[11px] text-slate-400">{log.role}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="text-xs font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 font-mono text-xs">
                      {log.entityId}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-xs">
                      <div>{log.ipAddress}</div>
                      <div className="truncate max-w-[120px] text-slate-400 text-[11px]">{log.deviceInfo}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-xs font-mono">
                      <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        {log.integrityHash.substring(0, 16)}...
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
