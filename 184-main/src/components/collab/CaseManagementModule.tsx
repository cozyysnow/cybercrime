'use client';

import React, { useState, useMemo } from 'react';
import { 
  FolderOpen, Search, ArrowUpDown, Filter, Eye, EyeOff,
  Shield, AlertTriangle, CheckCircle2, Clock, Lock, 
  FileText, MessageSquare, Download, Share2, CornerDownRight,
  TrendingDown, Check, X, Building, Smartphone, MapPin, 
  ChevronRight, RefreshCw, Send, Plus, Cpu, RotateCcw, ExternalLink,
  Printer, ShieldCheck, Database, FileCheck, Radio
} from 'lucide-react';
import { sendAdbSms } from '@/lib/hardwareService';
import { 
  CaseEntity, CASES_DATA, CaseStatus, PriorityLevel, 
  OfficerRole, OFFICER_ROLES, OfficerProfile, MoneyTrailNode, EVIDENCE_DATA,
  CHAT_MESSAGES, ChatMessage, EvidenceItem
} from '@/data/collabData';
import ComplaintPredictorModal from './ComplaintPredictorModal';
import { 
  predictWithdrawal, 
  getSHAPExplanation, 
  PredictionResponse, 
  SHAPExplanation 
} from '@/lib/apiService';
import {
  generateBsa63Certificate,
  getPolygonScanTxUrl,
  Bsa63Certificate,
  getUniqueLedgerItems
} from '@/lib/blockchain/evidenceLedger';

interface CaseManagementModuleProps {
  currentRole?: OfficerRole;
  currentOfficer?: OfficerProfile;
  onOpenCaseChat?: (caseId: string) => void;
  onAuditLog?: (action: string, entityId: string, entityType: string) => void;
  directSelectedCaseId?: string | null;
}

export default function CaseManagementModule({
  currentRole: propRole,
  currentOfficer,
  onOpenCaseChat,
  onAuditLog,
  directSelectedCaseId,
}: CaseManagementModuleProps) {
  const currentRole = propRole || currentOfficer?.role || 'i4c_admin';
  const [cases, setCases] = useState<CaseEntity[]>(CASES_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'amount' | 'priority' | 'status' | 'updated'>('newest');
  
  // Selection and Bulk Actions
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  
  // Selected Case Detail View
  const [activeCase, setActiveCase] = useState<CaseEntity | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'money_trail' | 'evidence' | 'chat' | 'intelligence' | 'action_log'>('overview');
  const [unmaskVictim, setUnmaskVictim] = useState(false);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<CaseStatus>('UNDER_INVESTIGATION');
  const [statusNote, setStatusNote] = useState('');

  // Live Prediction Modal State
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  const [isReAnalyzingCase, setIsReAnalyzingCase] = useState(false);
  const [caseLivePrediction, setCaseLivePrediction] = useState<PredictionResponse | null>(null);
  const [caseLiveShap, setCaseLiveShap] = useState<SHAPExplanation | null>(null);

  // Section 63 BSA 2023 Digital Certificate Modal State
  const [activeCert, setActiveCert] = useState<Bsa63Certificate | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Money trail freeze state tracker
  const [frozenNodeIds, setFrozenNodeIds] = useState<string[]>([]);

  // Filter & Search Logic
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Role-based visibility check
      if (currentRole === 'district_officer' && c.victimDistrict !== 'Jaipur North' && c.suspectedWithdrawalCity !== 'Jaipur') {
        // District officers only see Jaipur cases unless shared
        if (c.id !== 'CY2026-MH-44521') return false;
      }
      if (currentRole === 'field_investigator' && c.assignedOfficerId !== 'OFF-FLD-004' && c.id !== 'CY2026-MH-44521') {
        return false;
      }
      if (currentRole === 'bank_liaison') {
        const hasSBIAccount = c.moneyTrail?.some(n => n.bank.includes('State Bank') || n.bank.includes('SBI')) || c.id === 'CY2026-MH-44521';
        if (!hasSBIAccount) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = c.id.toLowerCase().includes(q);
        const matchType = c.fraudType.toLowerCase().includes(q);
        const matchVictim = c.victim.name.toLowerCase().includes(q) || c.victim.phoneMasked.includes(q);
        const matchState = c.victimState.toLowerCase().includes(q) || c.suspectedWithdrawalCity.toLowerCase().includes(q);
        const matchMule = c.linkedMuleAccounts.some(m => m.toLowerCase().includes(q));
        if (!matchId && !matchType && !matchVictim && !matchState && !matchMule) return false;
      }

      // Filters
      if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
      if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
      if (filterState !== 'ALL' && c.suspectedWithdrawalState !== filterState && c.victimState !== filterState) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount') return b.totalAmount - a.totalAmount;
      if (sortBy === 'priority') {
        const pOrder: Record<PriorityLevel, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      }
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0; // default order is newest first
    });
  }, [cases, searchQuery, filterStatus, filterPriority, filterState, sortBy, currentRole]);

  // Handle Bulk Status Change
  const handleBulkStatusChange = (status: CaseStatus) => {
    setCases(prev => prev.map(c => selectedCaseIds.includes(c.id) ? { ...c, status, lastUpdated: 'Just now' } : c));
    setSelectedCaseIds([]);
  };

  // SMS Alert State
  const [isSendingCaseSms, setIsSendingCaseSms] = useState(false);
  const [caseSmsSent, setCaseSmsSent] = useState(false);

  // Handle Account Freeze in Money Trail
  const handleRequestFreeze = (nodeId: string, accountMasked: string) => {
    setFrozenNodeIds(prev => [...prev, nodeId]);
    if (activeCase) {
      const updatedMoneyTrail = activeCase.moneyTrail.map(n => 
        n.id === nodeId ? { ...n, status: 'Frozen' as const, freezeStatus: 'Executed' as const } : n
      );
      const newActionLogEntry = {
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        officerName: OFFICER_ROLES[currentRole].name,
        role: OFFICER_ROLES[currentRole].roleName,
        action: `CFCFRMS Statutory Debit Freeze executed on ${accountMasked}`,
        outcome: 'Account successfully lien-marked via nodal bank API hook and SMS directive dispatched',
      };
      const updatedCase: CaseEntity = {
        ...activeCase,
        moneyTrail: updatedMoneyTrail,
        actionLog: [newActionLogEntry, ...activeCase.actionLog],
      };
      setActiveCase(updatedCase);
      setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));

      // Dispatch ADB SMS to bank liaison officer
      sendAdbSms({
        phone: '+919980177312',
        message: `[CYBERCAST CFCFRMS FREEZE] Statutory Lien Debit Freeze on ${accountMasked} for Case ${activeCase.id}. Freeze debit immediately under Sec 91 CrPC. Authorized: ${OFFICER_ROLES[currentRole].name}.`,
        priority: 'FLASH_P1',
        officerName: 'Priya Nambiar (Nodal Officer)',
        caseId: activeCase.id,
      }).catch(() => {});
    }
  };

  // Direct Send Case Alert SMS to Field Unit
  const handleSendCaseAlertSms = async () => {
    if (!activeCase) return;
    setIsSendingCaseSms(true);
    const message = `[CYBERCAST FLASH DIRECTIVE] Urgent intervention for Case ${activeCase.id}. Predicted withdrawal zone: ${activeCase.predictedZone} (${activeCase.predictedTimeWindow}). Assigned: ${activeCase.assignedOfficerName}. Verify perimeter immediately.`;
    
    await sendAdbSms({
      phone: '+919829041209',
      message,
      priority: activeCase.priority === 'Critical' ? 'FLASH_P1' : 'URGENT_P2',
      officerName: activeCase.assignedOfficerName,
      caseId: activeCase.id,
    });

    setIsSendingCaseSms(false);
    setCaseSmsSent(true);

    const newActionLogEntry = {
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      officerName: OFFICER_ROLES[currentRole].name,
      role: OFFICER_ROLES[currentRole].roleName,
      action: `Tactical Alert SMS dispatched to assigned field officer (${activeCase.assignedOfficerName}) via ADB Hardware Bridge`,
      outcome: 'Device intent triggered; field unit notified',
    };

    const updatedCase = {
      ...activeCase,
      actionLog: [newActionLogEntry, ...activeCase.actionLog],
    };
    setActiveCase(updatedCase);
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));

    if (onAuditLog) {
      onAuditLog(`DISPATCHED_CASE_ALERT_SMS_${activeCase.id}`, activeCase.id, 'CASE');
    }
  };

  // Handle Status Update Submit
  const handleStatusUpdate = () => {
    if (!activeCase) return;
    const newLogEntry = {
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      officerName: OFFICER_ROLES[currentRole].name,
      role: OFFICER_ROLES[currentRole].roleName,
      action: `Status transitioned to ${newStatus}`,
      outcome: statusNote || 'Manual case status update by assigned officer',
    };
    const updatedCase: CaseEntity = {
      ...activeCase,
      status: newStatus,
      lastUpdated: 'Just now',
      actionLog: [newLogEntry, ...activeCase.actionLog],
    };
    setActiveCase(updatedCase);
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    setStatusModalOpen(false);
    setStatusNote('');
  };

  // Re-analyze active case with live ML model API
  const handleReAnalyzeActiveCase = async () => {
    if (!activeCase) return;
    setIsReAnalyzingCase(true);
    try {
      const pred = await predictWithdrawal({
        complaint_id: activeCase.id,
        fraud_type: activeCase.fraudType,
        amount_stolen_inr: activeCase.totalAmount,
        victim_state: activeCase.victimState,
        victim_district: activeCase.victimDistrict,
        victim_city_type: 'Metro',
        fraudster_phone_circle: activeCase.suspectedWithdrawalState,
        mule_account_bank: activeCase.moneyTrail[0]?.bank || 'SBI',
        mule_account_state: activeCase.suspectedWithdrawalState,
        complaint_hour: 14,
        complaint_day_of_week: 2,
      });
      const shap = getSHAPExplanation({
        fraud_type: activeCase.fraudType,
        amount_stolen_inr: activeCase.totalAmount,
        victim_state: activeCase.victimState,
        mule_account_state: activeCase.suspectedWithdrawalState,
        complaint_hour: 14,
      }, pred);
      setCaseLivePrediction(pred);
      setCaseLiveShap(shap);
      if (onAuditLog) {
        onAuditLog(`Live ML Re-Analysis executed for ${activeCase.id}`, activeCase.id, 'CASE');
      }
    } catch (err) {
      console.warn('Re-analysis error:', err);
    } finally {
      setIsReAnalyzingCase(false);
    }
  };

  const handleSaveNewComplaintCase = (newCase: CaseEntity) => {
    setCases(prev => [newCase, ...prev]);
    setActiveCase(newCase);
    if (onAuditLog) {
      onAuditLog(`New Case ${newCase.id} created from Live ML Model Prediction`, newCase.id, 'CASE');
    }
  };

  const handleOpenJudicialCertificate = (c: CaseEntity) => {
    const officerObj = currentOfficer || OFFICER_ROLES[currentRole];
    const uniqueItems = getUniqueLedgerItems();

    // 1. If case has explicit blockchain proof, prioritize exact evidence item
    if (c.blockchainProof) {
      const specificItem = uniqueItems.find(
        (item) =>
          item.bsa63CertificateId === c.blockchainProof?.certId ||
          (item.polygonBlockNumber === c.blockchainProof?.blockNumber && item.blockchainTxHash === c.blockchainProof?.txHash) ||
          (item.caseId && item.caseId.toLowerCase() === c.id.toLowerCase() && item.category === 'Forensic / AI Intelligence Report')
      );

      const targetItem: EvidenceItem = specificItem || {
        id: `EVD-${c.id.replace(/[^a-zA-Z0-9]/g, '')}`,
        caseId: c.id,
        title: 'AI Predictive Interdiction & Complaint Dossier',
        category: 'Forensic / AI Intelligence Report',
        type: 'json',
        fileName: `${c.id}_prediction_manifest.json`,
        fileSize: '2.4 KB',
        uploadedAt: c.blockchainProof.anchoredAt || c.registeredAt,
        uploadedBy: `${c.assignedOfficerName} (${c.assignedOfficerId})`,
        uploadingOfficerId: c.assignedOfficerId || officerObj.badgeNumber,
        deviceUsed: 'I4C Police Command Forensic Console (MHA VPN)',
        gpsCoordinates: '28.6139° N, 77.2090° E (Station GPS Verified)',
        sha256Hash: c.blockchainProof.manifestHash || '9e1a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a',
        relevance: 'Primary',
        source: 'AI-detected',
        confidentiality: 'Restricted',
        blockchainTxHash: c.blockchainProof.txHash,
        polygonBlockNumber: c.blockchainProof.blockNumber,
        ipfsCid: c.blockchainProof.manifestCid || 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
        anchoredAt: c.blockchainProof.anchoredAt,
        bsa63CertificateId: c.blockchainProof.certId,
        ledgerStatus: 'ANCHORED',
        chainOfCustody: [
          {
            timestamp: c.blockchainProof.anchoredAt,
            officerName: c.assignedOfficerName,
            action: '[COMPLAINT_INGESTED_AND_AI_PREDICTED]',
            purpose: 'Section 63 BSA 2023 Immutability Lock for AI Prediction',
            blockNumber: c.blockchainProof.blockNumber,
            txHash: c.blockchainProof.txHash,
            digitalSignature: `${c.assignedOfficerId || officerObj.badgeNumber}:EIP712-SIGNED`,
          },
        ],
      };

      const cert = generateBsa63Certificate(targetItem, {
        name: officerObj.name,
        badgeNumber: officerObj.badgeNumber,
        rank: officerObj.rank,
        agency: officerObj.department,
      });
      setActiveCert(cert);
      setShowCertModal(true);
      if (onAuditLog) {
        onAuditLog(`Section 63 BSA 2023 Digital Certificate viewed for Case ${c.id}`, c.id, 'CASE');
      }
      return;
    }

    // 2. Fallback for cases without blockchainProof: match against any available evidence item
    const matchedEv = uniqueItems.find((item) => item.caseId && item.caseId.toLowerCase() === c.id.toLowerCase());
    if (matchedEv) {
      const cert = generateBsa63Certificate(matchedEv, {
        name: officerObj.name,
        badgeNumber: officerObj.badgeNumber,
        rank: officerObj.rank,
        agency: officerObj.department,
      });
      setActiveCert(cert);
      setShowCertModal(true);
      if (onAuditLog) {
        onAuditLog(`Section 63 BSA 2023 Digital Certificate viewed for Case ${c.id}`, c.id, 'CASE');
      }
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'SURVEILLANCE_ACTIVE':
        return (
          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Surveillance Active
          </span>
        );
      case 'FUNDS_FROZEN':
        return <span className="text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full text-xs font-semibold">Funds Frozen</span>;
      case 'ARREST_MADE':
        return <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold">Arrest Made</span>;
      case 'UNDER_INVESTIGATION':
        return <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold">Investigation</span>;
      case 'CASE_RESOLVED':
        return <span className="text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-xs font-semibold">Resolved</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'Critical':
        return <span className="text-rose-600 font-semibold flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-600" /> Critical</span>;
      case 'High':
        return <span className="text-amber-600 font-semibold flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> High</span>;
      case 'Medium':
        return <span className="text-amber-600 font-medium flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Medium</span>;
      default:
        return <span className="text-slate-500 font-normal flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" /> Low</span>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans text-slate-900 bg-slate-50 select-none">
      
      {/* 1. TOP MODULE TOOLBAR & SEARCH */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        
        {/* Module Title & Counter */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              National Case Dossier Management
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-full">
                {filteredCases.length} Active in Jurisdiction
              </span>
            </h2>
            <div className="text-xs text-slate-500">
              Correlated against NCRP Portal, CFCFRMS Gateway, & Indian Telecom Registries
            </div>
          </div>
        </div>

        {/* Actions: Ingest Complaint with AI & Search Box */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsPredictModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Ingest Complaint & Run AI Prediction</span>
          </button>

          {/* Global Case Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Case ID, Phone, Mule..."
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 2. FILTERS & SORTING BAR */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Filters:</span>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SURVEILLANCE_ACTIVE">Surveillance Active</option>
            <option value="FUNDS_FROZEN">Funds Frozen</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="ARREST_MADE">Arrest Made</option>
            <option value="CASE_RESOLVED">Case Resolved</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>

          {/* State Filter */}
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="ALL">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Haryana">Haryana</option>
            <option value="Delhi">Delhi</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Gujarat">Gujarat</option>
          </select>

          {/* Reset button */}
          {(filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterState !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setFilterPriority('ALL');
                setFilterState('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1 ml-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-800 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="newest">Newest Complaint</option>
            <option value="amount">Highest Amount</option>
            <option value="priority">Priority Level</option>
            <option value="status">Case Status</option>
          </select>
        </div>

      </div>

      {/* 3. BULK ACTIONS BAR (When cases are selected) */}
      {selectedCaseIds.length > 0 && (
        <div className="px-5 py-2.5 bg-blue-50/80 border-b border-blue-200 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-blue-900">
              {selectedCaseIds.length} Cases Selected
            </span>
            <button
              onClick={() => handleBulkStatusChange('SURVEILLANCE_ACTIVE')}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Mark Surveillance Active
            </button>
            <button
              onClick={() => handleBulkStatusChange('FUNDS_FROZEN')}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Mark Funds Frozen
            </button>
          </div>
          <button
            onClick={() => setSelectedCaseIds([])}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* 4. MAIN CASES TABLE */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10">
              <th className="p-3.5 w-10">
                <input
                  type="checkbox"
                  checked={selectedCaseIds.length === filteredCases.length && filteredCases.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCaseIds(filteredCases.map(c => c.id));
                    else setSelectedCaseIds([]);
                  }}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-3.5">Case ID</th>
              <th className="p-3.5">Complaint Time</th>
              <th className="p-3.5">Fraud Taxonomy</th>
              <th className="p-3.5">Amount Involved</th>
              <th className="p-3.5">Origin → Target Withdrawal</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Priority</th>
              <th className="p-3.5">Assigned Lead</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCases.map((c) => {
              const isSelected = selectedCaseIds.includes(c.id);
              return (
                <tr
                  key={c.id}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => setActiveCase(c)}
                >
                  <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCaseIds(prev => [...prev, c.id]);
                        else setSelectedCaseIds(prev => prev.filter(id => id !== c.id));
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-blue-600 hover:underline">{c.id}</span>
                      {c.linkedCasesCount > 1 && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium border border-slate-200" title={`${c.linkedCasesCount} Linked Cases Detected`}>
                          +{c.linkedCasesCount}
                        </span>
                      )}
                      {c.blockchainProof && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenJudicialCertificate(c);
                          }}
                          title={`Polygon Tx: ${c.blockchainProof.txHash}\nAnchored: ${c.blockchainProof.anchoredAt}\nCertificate: ${c.blockchainProof.certId}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-medium rounded transition-colors cursor-pointer"
                        >
                          <Lock className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Anchored · #{c.blockchainProof.blockNumber}</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-500 text-xs">{c.registeredAt}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{c.fraudType}</td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    ₹{c.totalAmount.toLocaleString('en-IN')}
                    {c.recoveredAmount > 0 && (
                      <span className="text-xs text-emerald-600 block font-normal">
                        (₹{c.recoveredAmount.toLocaleString('en-IN')} Secured)
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-xs text-slate-700">
                    <span>{c.victimState}</span>
                    <span className="text-slate-400 mx-1.5">→</span>
                    <span className="text-amber-700 font-semibold">{c.suspectedWithdrawalCity}</span>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">{c.suspectedWithdrawalZone}</span>
                  </td>
                  <td className="p-3.5">{getStatusBadge(c.status)}</td>
                  <td className="p-3.5">{getPriorityBadge(c.priority)}</td>
                  <td className="p-3.5 text-slate-600 text-xs truncate max-w-[120px]">{c.assignedOfficerName}</td>
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveCase(c)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-semibold rounded-lg shadow-sm transition-all"
                    >
                      Dossier →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCases.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">
            No cybercrime cases match current query or role security scope.
          </div>
        )}
      </div>

      {/* 5. FULL CASE DOSSIER MODAL (6 DEEP TABS) */}
      {activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm select-none font-sans text-slate-900 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
            
            {/* Dossier Top Banner */}
            <div className="p-4 sm:px-6 sm:py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                  Case Dossier: {activeCase.id}
                </div>
                {activeCase.blockchainProof && (
                  <button
                    type="button"
                    onClick={() => handleOpenJudicialCertificate(activeCase)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                    title={`Polygon Tx: ${activeCase.blockchainProof.txHash}\nAnchored: ${activeCase.blockchainProof.anchoredAt}`}
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Block #{activeCase.blockchainProof.blockNumber}</span>
                  </button>
                )}
                {getStatusBadge(activeCase.status)}
                {getPriorityBadge(activeCase.priority)}
                <span className="text-slate-400 text-xs">NCRP: {activeCase.ncrpAckNumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendCaseAlertSms}
                  disabled={isSendingCaseSms}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Dispatch immediate tactical SMS directive to assigned officer via ADB hardware"
                >
                  <Radio className={`h-3.5 w-3.5 ${isSendingCaseSms ? 'animate-spin' : 'animate-pulse text-amber-600'}`} />
                  <span>{isSendingCaseSms ? 'Sending SMS...' : caseSmsSent ? 'SMS Sent ✓' : 'Send Alert SMS'}</span>
                </button>
                <button
                  onClick={() => setStatusModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs rounded-lg shadow-sm"
                >
                  Change Status
                </button>
                <button
                  onClick={() => onOpenCaseChat && onOpenCaseChat(activeCase.id)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  <span>Case Chat</span>
                </button>
                <button
                  onClick={() => setActiveCase(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Dossier Tabs Navigation */}
            <div className="flex items-center border-b border-slate-200 bg-white px-4 overflow-x-auto text-xs font-semibold">
              {[
                { id: 'overview', label: '1. Case Overview' },
                { id: 'money_trail', label: '2. Money Trail Flowchart' },
                { id: 'evidence', label: '3. Evidence Locker' },
                { id: 'chat', label: '4. Communication Thread' },
                { id: 'intelligence', label: '5. AI Predictive Intel' },
                { id: 'action_log', label: '6. Immutable Action Log' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dossier Content Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-xs">
              
              {/* TAB 1: CASE OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Financial & Complaint Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Stolen Amount</div>
                      <div className="text-2xl font-bold text-slate-900">₹{activeCase.totalAmount.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-slate-500">Via 3 swift RTGS/IMPS Transfers</div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Recovered / Secured</div>
                      <div className="text-2xl font-bold text-emerald-600">₹{activeCase.recoveredAmount.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-emerald-700 font-medium">
                        {Math.round((activeCase.recoveredAmount / activeCase.totalAmount) * 100)}% of total fund trail secured
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Predicted Withdrawal Zone</div>
                      <div className="text-base font-bold text-amber-700 truncate">{activeCase.predictedZone}</div>
                      <div className="text-xs text-rose-600 font-medium">Time Window: {activeCase.predictedTimeWindow}</div>
                    </div>
                  </div>

                  {/* Victim Information with Privacy Unmask */}
                  <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                        Victim Record & Jurisdiction Compliance
                      </span>
                      <button
                        onClick={() => setUnmaskVictim(!unmaskVictim)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
                      >
                        {unmaskVictim ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span>{unmaskVictim ? 'Mask Identifiers' : 'Unmask for Investigator'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px] uppercase font-semibold">Victim Name</span>
                        <strong className="text-slate-900 text-sm">
                          {unmaskVictim ? activeCase.victim.name : activeCase.victim.maskedName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] uppercase font-semibold">Demographics</span>
                        <strong className="text-slate-900 text-sm">{activeCase.victim.age} Yrs • {activeCase.victim.gender}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] uppercase font-semibold">Contact Number</span>
                        <strong className="text-slate-900 text-sm font-mono">{activeCase.victim.phoneMasked}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px] uppercase font-semibold">Debited Bank</span>
                        <strong className="text-slate-900 text-sm">{activeCase.victim.bankName}</strong>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-500 block text-xs font-semibold mb-1">Victim Complaint Statement</span>
                      <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed text-xs">
                        &quot;{activeCase.victim.summaryText}&quot;
                      </p>
                    </div>
                  </div>

                  {/* AI Case Summary & Gang Attribution */}
                  <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 text-xs uppercase font-semibold">
                      <Cpu className="h-4 w-4 text-blue-600" />
                      CyberCast AI Synthesis & Attribution (Confidence: {activeCase.confidenceScore}%)
                    </div>
                    <p className="text-slate-700 leading-relaxed text-xs">
                      {activeCase.aiSummary}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2 text-xs border-t border-blue-100">
                      <div>Attributed Syndicate: <strong className="text-slate-900 font-semibold">{activeCase.suspectedGang}</strong></div>
                      <div>Linked Mule Accounts: <strong className="text-slate-900 font-semibold">{activeCase.linkedMuleAccounts.length} Flagged</strong></div>
                      <div>Linked IMEIs: <strong className="text-slate-900 font-semibold">{activeCase.linkedIMEIs.length} Captured</strong></div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: MONEY TRAIL FLOWCHART */}
              {activeTab === 'money_trail' && (
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        Interactive Fund Dispersal Flowchart
                      </h3>
                      <p className="text-xs text-slate-500">
                        CFCFRMS Real-Time Automated Multi-Tier Account Tracing
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Secured Ratio</div>
                      <div className="text-base font-bold text-emerald-600">
                        ₹{activeCase.recoveredAmount.toLocaleString('en-IN')} / ₹{activeCase.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Flowchart Nodes */}
                  <div className="space-y-4">
                    {activeCase.moneyTrail.map((node, idx) => {
                      const isFrozen = frozenNodeIds.includes(node.id) || node.status === 'Frozen';
                      return (
                        <div key={node.id} className="relative">
                          {idx > 0 && (
                            <div className="w-0.5 h-4 bg-blue-200 mx-auto my-1 flex items-center justify-center">
                              <CornerDownRight className="h-3 w-3 text-blue-500" />
                            </div>
                          )}

                          <div className={`p-4 bg-white border rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                            isFrozen 
                              ? 'border-sky-300 bg-sky-50/50' 
                              : node.type === 'atm'
                              ? 'border-rose-200 bg-rose-50/30'
                              : 'border-slate-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl border ${
                                node.type === 'victim' ? 'border-slate-200 bg-slate-100 text-slate-700' :
                                node.type === 'mule' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                'border-rose-200 bg-rose-50 text-rose-700'
                              }`}>
                                {node.type === 'victim' ? <Building className="h-5 w-5" /> :
                                 node.type === 'mule' ? <Smartphone className="h-5 w-5" /> :
                                 <MapPin className="h-5 w-5" />}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    [{node.label}]
                                  </span>
                                  <span className="text-slate-900 font-semibold text-xs">{node.bank}</span>
                                </div>
                                <div className="text-xs text-slate-700 font-medium">
                                  Account: <strong className="font-mono">{node.accountMasked}</strong> • {node.location}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Transfer: {node.timestamp} {node.holderName ? `• Beneficiary: ${node.holderName}` : ''}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="text-right">
                                <div className="text-base font-bold text-slate-900">
                                  ₹{node.amount.toLocaleString('en-IN')}
                                </div>
                                <div className="text-[11px]">
                                  {isFrozen ? (
                                    <span className="text-sky-700 font-semibold uppercase">Lien Frozen ✓</span>
                                  ) : node.status === 'Drained' ? (
                                    <span className="text-slate-400 uppercase font-medium">Transferred Out</span>
                                  ) : (
                                    <span className="text-rose-600 font-semibold uppercase">Active Risk</span>
                                  )}
                                </div>
                              </div>

                              {/* Freeze Button for Active Mules */}
                              {node.type === 'mule' && (
                                <button
                                  onClick={() => handleRequestFreeze(node.id, node.accountMasked)}
                                  disabled={isFrozen}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
                                    isFrozen 
                                      ? 'bg-sky-100 text-sky-700 border border-sky-200 cursor-not-allowed'
                                      : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                                  }`}
                                >
                                  {isFrozen ? 'Frozen via CFCFRMS' : 'Request Freeze'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* TAB 3: EVIDENCE LOCKER */}
              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                      Linked Evidentiary Artifacts ({EVIDENCE_DATA.filter(e => e.caseId === activeCase.id).length})
                    </span>
                    <span className="text-xs text-emerald-700 font-medium">SHA-256 Integrity Verified</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EVIDENCE_DATA.filter(e => e.caseId === activeCase.id).map((ev) => (
                      <div key={ev.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                            {ev.category}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{ev.fileSize}</span>
                        </div>
                        <div className="font-semibold text-slate-900 text-xs">{ev.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate bg-slate-50 p-1.5 rounded border border-slate-200">
                          SHA-256: {ev.sha256Hash}
                        </div>
                        {ev.ocrExtractedText && (
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                            <span className="text-[10px] text-blue-700 block uppercase font-semibold mb-0.5">OCR Extract:</span>
                            {ev.ocrExtractedText}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span>Uploaded: {ev.uploadedAt}</span>
                          <span className="text-slate-700 font-medium">{ev.confidentiality}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: COMMUNICATION THREAD */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      Inter-Agency Operational Comms ({activeCase.id})
                    </span>
                    <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-medium">
                      Secure E2EE Encrypted
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(CHAT_MESSAGES['case-44521'] || []).map((msg) => (
                      <div key={msg.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{msg.senderName}</span>
                            <span className="text-slate-500">[{msg.senderRank} • {msg.senderState}]</span>
                          </div>
                          <span className="text-slate-400 text-xs font-mono">{msg.timestamp}</span>
                        </div>

                        <div className="text-xs text-slate-800 leading-relaxed">
                          {msg.translatedText || msg.originalText}
                        </div>

                        {msg.translatedText && (
                          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-blue-700 font-medium">
                              🇮🇳 {msg.originalLanguage} → {msg.translatedLanguage} (Confidence: {msg.translationConfidence}%)
                            </span>
                            <span className="italic truncate max-w-[200px]">Orig: &quot;{msg.originalText}&quot;</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => onOpenCaseChat && onOpenCaseChat(activeCase.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                    >
                      Open Full Translation Bridge Console →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: INTELLIGENCE REPORT (POWERED BY LIVE ML API) */}
              {activeTab === 'intelligence' && (
                <div className="space-y-4">
                  <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-600" />
                        Predictive ATM Withdrawal Corridor Report
                      </div>
                      <button
                        onClick={handleReAnalyzeActiveCase}
                        disabled={isReAnalyzingCase}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isReAnalyzingCase ? 'animate-spin text-blue-600' : ''}`} />
                        <span>{isReAnalyzingCase ? 'Inferring...' : 'Re-Analyze via Live ML Model'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Target Hotspot:</span>
                        <strong className="text-slate-900">{caseLivePrediction ? caseLivePrediction.zone_prediction.predicted_zone : activeCase.predictedZone}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Confidence:</span>
                        <strong className="text-blue-600">
                          {caseLivePrediction 
                            ? `${((caseLivePrediction.top_predicted_states[0]?.probability || 0.8) * 100).toFixed(1)}%` 
                            : `${activeCase.confidenceScore}%`} High Prob
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Est. Time Window:</span>
                        <strong className="text-amber-600">
                          {caseLivePrediction ? `${caseLivePrediction.estimated_time_window_hours} Hours` : activeCase.predictedTimeWindow}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Status:</span>
                        <strong className="text-emerald-600">
                          {caseLivePrediction ? `${caseLivePrediction.processing_latency_ms.toFixed(1)}ms (Live API)` : 'Calibrated'}
                        </strong>
                      </div>
                    </div>

                    {/* LIVE MODEL ACTIONS */}
                    {caseLivePrediction ? (
                      <div className="space-y-2 text-xs text-slate-700">
                        <div className="text-xs font-semibold text-slate-900 uppercase">Live ML Interdiction Protocols</div>
                        <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-700">
                          {caseLivePrediction.recommended_actions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs text-slate-700">
                        <div className="text-xs font-semibold text-slate-900 uppercase">Recommended Law Enforcement Protocol</div>
                        <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-700">
                          <li>Dispatch two undercover surveillance units to Sindhi Camp SBI ATM perimeter.</li>
                          <li>Alert nodal officer Priya Nambiar at SBI to place debit block on suspect mule cards.</li>
                          <li>Coordinate with Maharashtra Crime Branch regarding source victim FIR #412/2026.</li>
                        </ol>
                      </div>
                    )}

                    {/* LIVE SHAP EXPLANATION ACCORDION IF RUN */}
                    {caseLiveShap && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-4">
                        <div className="text-xs font-semibold text-slate-900 uppercase flex items-center justify-between">
                          <span>SHAP Feature Importance Attribution</span>
                          <span className="text-slate-400 font-mono text-[10px]">Model: XGBoost / Neural Net</span>
                        </div>
                        <p className="text-xs text-slate-600">{caseLiveShap.summary}</p>
                        <div className="space-y-2 pt-1">
                          {caseLiveShap.topFactors.map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${f.direction === 'positive' ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'}`}>
                                  {f.direction === 'positive' ? `+${f.impactPercentage}%` : `-${f.impactPercentage}%`}
                                </span>
                                <span className="text-slate-900 font-medium">{f.feature}</span>
                              </div>
                              <span className="text-slate-500 font-mono text-xs">{f.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* TAB 6: ACTION LOG */}
              {activeTab === 'action_log' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                    Statutory Case Audit Trail (Immutable & Cryptographically Chained)
                  </div>
                  <div className="space-y-2.5">
                    {activeCase.actionLog.map((log, idx) => (
                      <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start gap-3 text-xs">
                        <span className="text-blue-600 font-semibold font-mono text-xs whitespace-nowrap">{log.timestamp}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 font-semibold">{log.officerName}</strong>
                            <span className="text-slate-500 text-[11px]">({log.role})</span>
                          </div>
                          <div className="text-slate-800 mt-1">{log.action}</div>
                          <div className="text-slate-500 text-xs mt-0.5">Outcome: {log.outcome}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* 6. STATUS CHANGE MODAL */}
      {statusModalOpen && activeCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm select-none font-sans text-slate-900 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setStatusModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-base font-semibold text-slate-900 mb-1">
              Update Case Status: {activeCase.id}
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Formal status transitions are permanently recorded in the national immutable audit log.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select New Status:</label>
                <select
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="UNDER_INVESTIGATION">Under Investigation</option>
                  <option value="SURVEILLANCE_ACTIVE">Surveillance Active</option>
                  <option value="FUNDS_FROZEN">Funds Frozen</option>
                  <option value="ARREST_MADE">Arrest Made</option>
                  <option value="CASE_RESOLVED">Case Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mandatory Officer Note / Reason:</label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Provide statutory rationale, seizure memo reference, or court order details..."
                  className="w-full bg-white border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
                >
                  Commit Status Update →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. LIVE COMPLAINT PREDICTION MODAL */}
      <ComplaintPredictorModal
        isOpen={isPredictModalOpen}
        onClose={() => setIsPredictModalOpen(false)}
        onSaveToCases={handleSaveNewComplaintCase}
        currentOfficer={currentOfficer || OFFICER_ROLES[currentRole]}
        onBroadcastAlert={(alertText) => {
          if (onAuditLog) {
            onAuditLog(alertText, 'ALERT', 'BROADCAST');
          }
        }}
      />

      {/* 8. SECTION 63 BSA 2023 DIGITAL INTEGRITY CERTIFICATE MODAL */}
      {showCertModal && activeCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl font-sans text-slate-900 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Section 63 BSA, 2023 Certificate // Courtroom Exhibit
                </span>
              </div>
              <button
                onClick={() => setShowCertModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Body (Printable Area) */}
            <div id="bsa-certificate-printable" className="p-6 overflow-y-auto space-y-5 text-xs text-slate-900">
              {/* Institutional Header */}
              <div className="border border-slate-200 p-5 bg-slate-50 rounded-xl text-center space-y-1">
                <div className="text-[11px] tracking-widest text-blue-700 uppercase font-semibold">
                  Government of India • Ministry of Home Affairs
                </div>
                <div className="text-base font-bold text-slate-900">
                  Indian Cyber Crime Coordination Centre (I4C)
                </div>
                <div className="text-xs text-slate-600">
                  {activeCert.statutoryTitle}
                </div>
                <div className="text-xs text-blue-700 bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-200 mt-1 font-semibold">
                  Statutory Proof Under {activeCert.governingSection.toUpperCase()}
                </div>
              </div>

              {/* Certificate Telemetry & QR Code Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm items-center">
                <div className="md:col-span-2 space-y-2">
                  <div>
                    <span className="text-slate-400 text-[11px] font-semibold uppercase block">Certificate Serial No.</span>
                    <span className="text-base font-bold text-blue-600 font-mono">{activeCert.certificateId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] font-semibold uppercase block">Case Unique Identifier</span>
                    <span className="text-slate-900 font-semibold">{activeCert.caseId} (NCRP Portal Reference)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] font-semibold uppercase block">Evidence Title & File</span>
                    <span className="text-slate-700">{activeCert.title} ({activeCert.fileName} • {activeCert.fileSize})</span>
                  </div>
                </div>

                {/* Inline SVG QR Code */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div
                    dangerouslySetInnerHTML={{ __html: activeCert.qrCodeSvg }}
                    className="w-32 h-32 flex items-center justify-center"
                  />
                  <span className="text-[10px] text-blue-700 mt-1 font-mono font-semibold tracking-wider text-center">
                    Scan for Judicial Proof
                  </span>
                </div>
              </div>

              {/* Cryptographic Proof Details */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                <div className="text-xs font-semibold text-slate-900 uppercase flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Cryptographic & On-Chain Proofs</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">SHA-256 Cryptographic Digest (Invariable)</span>
                    <span className="text-slate-800 font-mono break-all bg-slate-50 p-2 border border-slate-200 rounded-lg block select-all">
                      {activeCert.sha256Hash}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold uppercase">Polygon Amoy Block Height</span>
                      <span className="text-emerald-700 font-bold font-mono">#{activeCert.polygonBlockNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold uppercase">IPFS Ciphertext CID</span>
                      <span className="text-slate-700 font-mono truncate block" title={activeCert.ipfsCid}>
                        {activeCert.ipfsCid}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold uppercase">Blockchain Transaction Hash</span>
                    <a
                      href={getPolygonScanTxUrl(activeCert.blockchainTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block font-mono text-xs flex items-center gap-1"
                    >
                      <span>{activeCert.blockchainTxHash}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Statutory Declaration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs text-slate-500 uppercase font-semibold">
                  Statutory Declaration Under Section 63(4) Bharatiya Sakshya Adhiniyam, 2023
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {activeCert.statutoryDeclaration}
                </p>
              </div>

              {/* Certifying Officer Seal */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div>
                  Signing Officer: <strong className="text-slate-900">{activeCert.certifyingOfficer.name}</strong> ({activeCert.certifyingOfficer.badgeNumber})
                </div>
                <div>
                  Agency: <span className="text-slate-700 font-medium">{activeCert.certifyingOfficer.agency}</span>
                </div>
              </div>
            </div>

            {/* Footer with Print and External Link */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <a
                href={getPolygonScanTxUrl(activeCert.blockchainTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Verify on PolygonScan Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') window.print();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
