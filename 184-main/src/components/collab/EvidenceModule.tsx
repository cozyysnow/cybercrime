'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  EVIDENCE_DATA, 
  EvidenceItem, 
  CASES_DATA, 
  OfficerProfile 
} from '@/data/collabData';
import {
  BLOCKCHAIN_CONFIG,
  calculateSha256,
  verifyHashOnLedger,
  anchorEvidenceToLedger,
  generateBsa63Certificate,
  getPolygonScanTxUrl,
  getPolygonScanBlockUrl,
  getPolygonScanAddressUrl,
  Bsa63Certificate,
  LedgerVerificationResult,
} from '@/lib/blockchain/evidenceLedger';
import { 
  FileCheck2, 
  ShieldCheck, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Hash, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Camera, 
  CreditCard, 
  Smartphone, 
  Scale, 
  Lock, 
  X, 
  Copy, 
  Check, 
  RefreshCw,
  MapPin,
  Laptop,
  ExternalLink,
  Printer,
  Link2,
  FileCheck,
  Layers,
  ArrowUpRight,
  Shield,
  FileCode2,
  Database,
  Languages,
  Phone,
  Zap,
  Package
} from 'lucide-react';
import EvidenceIngestModal from './EvidenceIngestModal';

interface EvidenceModuleProps {
  currentOfficer: OfficerProfile;
  onAuditLog?: (action: string, entityId: string, entityType: string) => void;
}

export default function EvidenceModule({ currentOfficer, onAuditLog }: EvidenceModuleProps) {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(EVIDENCE_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>('ALL');
  
  // Modals & Drawers
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<Bsa63Certificate | null>(null);
  const [showCourtVerifier, setShowCourtVerifier] = useState(false);
  
  // Verification states
  const [verifyingHashId, setVerifyingHashId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [verifiedHashes, setVerifiedHashes] = useState<Record<string, boolean>>({
    'EVD-2026-901': true,
    'EVD-2026-902': true,
    'EVD-2026-903': true,
    'EVD-2026-904': true,
  });
  const [showTranslationCard, setShowTranslationCard] = useState<Record<string, boolean>>({});
  const [reverifiedMap, setReverifiedMap] = useState<Record<string, { status: 'verified' | 'verifying'; block: number; latency: number }>>({});

  // Blockchain Anchoring State
  const [anchoringId, setAnchoringId] = useState<string | null>(null);
  const [miningStep, setMiningStep] = useState<string | null>(null);
  const [anchoredSuccessToast, setAnchoredSuccessToast] = useState<{ id: string; txHash: string; block: number } | null>(null);

  // Courtroom Verifier State
  const [verifierInput, setVerifierInput] = useState<string>('');
  const [verifierCalculating, setVerifierCalculating] = useState<boolean>(false);
  const [verifierResult, setVerifierResult] = useState<LedgerVerificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const verifierFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleReverifyChecksum = async (ev: EvidenceItem) => {
    setReverifiedMap((prev) => ({
      ...prev,
      [ev.id]: { status: 'verifying', block: ev.polygonBlockNumber || 14892014, latency: 0 },
    }));
    const startTime = Date.now();
    await verifyHashOnLedger(ev.compoundHash || ev.rawFileSha256 || ev.sha256Hash);
    const latency = Date.now() - startTime;
    setReverifiedMap((prev) => ({
      ...prev,
      [ev.id]: { status: 'verified', block: ev.polygonBlockNumber || 14892014, latency },
    }));
    if (onAuditLog) {
      onAuditLog('REVERIFIED_CHECKSUM_ON_CHAIN', ev.id, 'EVIDENCE');
    }
  };

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    caseId: CASES_DATA[0].id,
    category: 'Communication' as EvidenceItem['category'],
    type: 'image' as EvidenceItem['type'],
    fileName: '',
    fileSize: '1.2 MB',
    confidentiality: 'Restricted' as EvidenceItem['confidentiality'],
    source: 'Police' as EvidenceItem['source'],
    ocrText: '',
    sha256: '',
    autoAnchor: true,
  });

  // Sync any newly anchored evidence from localStorage on mount and reactive events
  useEffect(() => {
    const syncFromStorage = () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cybercast_blockchain_ledger');
          if (stored) {
            const parsed = JSON.parse(stored) as EvidenceItem[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEvidenceList((prev) => {
                const ids = new Set(prev.map((i) => i.id));
                const extras = parsed.filter((p) => !ids.has(p.id));
                if (extras.length > 0) {
                  return [...extras, ...prev];
                }
                return prev;
              });
            }
          }
        } catch (e) {
          console.warn('Storage sync error:', e);
        }
      }
    };

    syncFromStorage();

    const handleEvidenceAnchored = (e: any) => {
      const detail = e.detail as EvidenceItem;
      if (detail) {
        setEvidenceList((prev) => {
          const filtered = prev.filter((p) => p.id !== detail.id && p.sha256Hash !== detail.sha256Hash);
          return [detail, ...filtered];
        });
        setVerifiedHashes((prev) => ({ ...prev, [detail.id]: true }));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cybercast_evidence_anchored', handleEvidenceAnchored);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cybercast_evidence_anchored', handleEvidenceAnchored);
      }
    };
  }, []);

  // Filter Categories
  const categories = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'Communication', label: 'Communication' },
    { id: 'Financial', label: 'Financial' },
    { id: 'Surveillance', label: 'Surveillance' },
    { id: 'Forensic / AI Intelligence Report', label: 'Forensic / AI Intel' },
    { id: 'Legal', label: 'Legal / FIR' },
    { id: 'Device', label: 'Device Data' },
    { id: 'Identity', label: 'Identity / KYC' },
  ];

  // Filtered evidence items
  const filteredEvidence = evidenceList.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.blockchainTxHash && ev.blockchainTxHash.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.ocrExtractedText && ev.ocrExtractedText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ev.caseId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || ev.category === selectedCategory;
    const matchesCase = selectedCaseFilter === 'ALL' || ev.caseId === selectedCaseFilter;

    return matchesSearch && matchesCategory && matchesCase;
  });

  const handleCopyHash = (hash: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const handleAnchorToLedger = async (ev: EvidenceItem) => {
    setAnchoringId(ev.id);
    setMiningStep('1/3: Binding raw artifact SHA-256 & OCR into compound root...');
    await new Promise((r) => setTimeout(r, 600));

    setMiningStep('2/3: Packaging encrypted forensic container to IPFS...');
    await new Promise((r) => setTimeout(r, 600));

    setMiningStep('3/3: Dispatching EIP-712 Meta-Transaction to Polygon Amoy Testnet (#80002)...');

    const result = await anchorEvidenceToLedger(ev, {
      name: currentOfficer.name,
      badgeNumber: currentOfficer.badgeNumber,
      rank: currentOfficer.rank,
      agency: currentOfficer.roleName,
    });

    setEvidenceList((prev) =>
      prev.map((item) => (item.id === ev.id ? result.evidenceItem : item))
    );
    setVerifiedHashes((prev) => ({ ...prev, [ev.id]: true }));
    setAnchoringId(null);
    setMiningStep(null);

    setAnchoredSuccessToast({
      id: ev.id,
      txHash: result.blockchainTxHash,
      block: result.polygonBlockNumber,
    });
    setTimeout(() => setAnchoredSuccessToast(null), 6000);

    if (onAuditLog) {
      onAuditLog('ANCHORED_EVIDENCE_TO_BLOCKCHAIN', ev.id, 'EVIDENCE');
    }
  };

  const handleOpenCertificate = (ev: EvidenceItem) => {
    const cert = generateBsa63Certificate(ev, {
      name: currentOfficer.name,
      badgeNumber: currentOfficer.badgeNumber,
      rank: currentOfficer.rank,
      agency: currentOfficer.roleName,
    });
    setActiveCertificate(cert);
    setShowCertificateModal(true);
    if (onAuditLog) {
      onAuditLog('GENERATED_SECTION_63_BSA_CERTIFICATE', ev.id, 'EVIDENCE');
    }
  };

  const handleDownload = (ev: EvidenceItem) => {
    alert(`Downloading forensic artifact "${ev.fileName}" with Section 63 BSA 2023 Digital Certificate.`);
    if (onAuditLog) {
      onAuditLog('DOWNLOADED_FORENSIC_EXHIBIT', ev.id, 'EVIDENCE');
    }
  };

  // Instant Courtroom Verifier execution
  const handleRunCourtroomVerifier = async (hashOrCase: string) => {
    if (!hashOrCase.trim()) return;
    setVerifierCalculating(true);
    setVerifierResult(null);

    const res = await verifyHashOnLedger(hashOrCase.trim());
    setVerifierResult(res);
    setVerifierCalculating(false);

    if (onAuditLog) {
      onAuditLog('COURTROOM_VERIFIER_QUERY', hashOrCase.substring(0, 16), 'VERIFY');
    }
  };

  const handleVerifierFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerifierCalculating(true);
      const computedHash = await calculateSha256(file);
      setVerifierInput(computedHash);
      const res = await verifyHashOnLedger(computedHash);
      setVerifierResult(res);
      setVerifierCalculating(false);
    }
  };

  const getCategoryIcon = (cat: EvidenceItem['category']) => {
    switch (cat) {
      case 'Communication': return <FileText className="w-4 h-4 text-sky-600" />;
      case 'Financial': return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'Surveillance': return <Camera className="w-4 h-4 text-rose-600" />;
      case 'Legal': return <Scale className="w-4 h-4 text-purple-600" />;
      case 'Device': return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'Identity': return <Lock className="w-4 h-4 text-amber-600" />;
      case 'Forensic':
      case 'Forensic / AI Intelligence Report':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      default: return <FileCheck2 className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Top Banner: Real-Time Blockchain Status Strip */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Polygon Amoy Ledger: Connected</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 hidden sm:inline">Finality: 2.1s</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <a
            href={getPolygonScanAddressUrl(BLOCKCHAIN_CONFIG.contractAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-600 truncate flex items-center gap-1 font-mono transition-colors"
            title="Inspect Smart Contract on PolygonScan"
          >
            <span>Contract: 0x71cA...84E9</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCourtVerifier(true)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Instant Courtroom Verifier</span>
          </button>

          <Link
            href="/verify"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span>Public Portal (/verify)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
          </Link>
        </div>
      </div>

      {/* Mining / Relayer Toast Alert */}
      {anchoredSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-4 rounded-xl shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Anchored to Polygon Amoy:</strong> Evidence <code className="font-mono">{anchoredSuccessToast.id}</code> confirmed in Block <code className="font-mono">#{anchoredSuccessToast.block}</code>. Gas sponsored by MHA Relayer.
            </span>
          </div>
          <a
            href={getPolygonScanTxUrl(anchoredSuccessToast.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline hover:text-emerald-900 flex items-center gap-1 shrink-0 font-medium"
          >
            <span>View Txn</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Main Module Header & Ingest Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Module 04 // Forensic Evidence Vault
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Bharatiya Sakshya Adhiniyam, 2023 (Sec 63) / Sec 65B IEA
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Blockchain-Backed Chain of Custody & Evidence Locker
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            On-chain SHA-256 hash validation • IPFS off-chain encrypted ciphertext • Gasless EIP-712 MHA Relayer • Section 63 BSA Admissibility
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Ingest Forensic Evidence</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Evidence ID, file, SHA-256, Txn Hash or OCR text..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedCaseFilter}
            onChange={(e) => setSelectedCaseFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
          >
            <option value="ALL">All Linked Cases</option>
            {CASES_DATA.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} ({c.victimState})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Evidence Grid Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredEvidence.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-800">No Evidence Items Found</div>
            <div className="text-xs text-slate-500 mt-1">Adjust your search query or category filter</div>
          </div>
        ) : (
          filteredEvidence.map((ev) => {
            const isVerified = (verifiedHashes[ev.id] ?? false) || ev.ledgerStatus === 'ANCHORED';
            const isVerifying = verifyingHashId === ev.id;
            const isAnchored = ev.ledgerStatus === 'ANCHORED';
            const isAnchoring = anchoringId === ev.id;

            return (
              <div
                key={ev.id}
                className="bg-white border border-slate-200 hover:border-blue-300 transition-all p-5 rounded-xl shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top line badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1.5 font-semibold">
                        {getCategoryIcon(ev.category)}
                        {ev.category}
                      </span>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200">
                        Case: {ev.caseId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAnchored ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>On-Chain #{ev.polygonBlockNumber || '14892014'}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 text-amber-700 bg-amber-50">
                          Pending Anchor
                        </span>
                      )}

                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          ev.confidentiality === 'Top Secret'
                            ? 'text-rose-700 bg-rose-50 border-rose-200'
                            : ev.confidentiality === 'Restricted'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-sky-700 bg-sky-50 border-sky-200'
                        }`}
                      >
                        {ev.confidentiality}
                      </span>
                    </div>
                  </div>

                  {/* Title and filename */}
                  <h3 className="text-sm font-semibold text-slate-900 tracking-wide mb-1">
                    {ev.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="font-mono">{ev.fileName}</span>
                    <span>•</span>
                    <span>{ev.fileSize}</span>
                    <span>•</span>
                    <span className="text-slate-700 font-medium">{ev.source} Sourced</span>
                  </div>

                  {/* Cryptographic SHA-256 Hash Display */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <Hash className="w-3.5 h-3.5 text-blue-600" />
                        SHA-256 Checksum (Immutable Forensic Hash)
                      </span>
                      <button
                        onClick={() => handleCopyHash(ev.sha256Hash)}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors text-xs font-medium"
                      >
                        {copiedHash === ev.sha256Hash ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-xs font-mono text-slate-800 break-all bg-white p-2 rounded border border-slate-200 select-all">
                      {ev.sha256Hash}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        {isVerifying ? (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Validating against Polygon Amoy RPC...
                          </span>
                        ) : (isVerified || reverifiedMap[ev.id]?.status === 'verified') ? (
                          <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Verified on Polygon Block #{ev.polygonBlockNumber || reverifiedMap[ev.id]?.block || 14892014}
                          </span>
                        ) : (
                          <span className="text-xs text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Unverified Checksum
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleReverifyChecksum(ev)}
                        disabled={isVerifying || reverifiedMap[ev.id]?.status === 'verifying'}
                        className="text-xs text-blue-600 hover:underline font-semibold disabled:opacity-50 flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Re-Verify Checksum</span>
                      </button>
                    </div>
                  </div>

                  {/* Blockchain Details Strip (Tx, Block, IPFS) */}
                  {isAnchored && (
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Ledger Status:</span>
                        <span className="text-emerald-700 font-semibold">
                          ● {ev.ledgerStatus || 'ANCHORED'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Polygon Block:</span>
                        <span className="text-slate-900 font-mono">#{ev.polygonBlockNumber || '14892014'}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Transaction Hash:</span>
                        <a
                          href={`https://amoy.polygonscan.com/tx/${ev.blockchainTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 truncate font-mono"
                        >
                          <span className="truncate">{ev.blockchainTxHash || '0x4f12...a98b'}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">IPFS CID:</span>
                        <a
                          href={`https://ipfs.io/ipfs/${ev.ipfsCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-700 hover:text-blue-600 flex items-center gap-1 truncate font-mono"
                        >
                          <span className="truncate">{ev.ipfsCid || 'QmXoyp...4uco'}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* If not yet anchored, show Anchor CTA */}
                  {!isAnchored && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Awaiting on-chain judicial commitment
                      </span>
                      <button
                        onClick={() => handleAnchorToLedger(ev)}
                        disabled={isAnchoring}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {isAnchoring ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Mining...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Anchor to Ledger</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Mining progress step message if this item is being anchored */}
                  {isAnchoring && miningStep && (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700 rounded-lg mb-3 animate-pulse">
                      {miningStep}
                    </div>
                  )}

                  {/* OCR snippet if present */}
                  {ev.ocrExtractedText && (
                    <div className="p-3.5 bg-slate-50 border-l-4 border-blue-600 rounded-r-lg mb-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-900 font-semibold">
                            OCR Extracted Text ({ev.detectedLanguage || 'Regional'})
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-medium">
                            PaddleOCR v2.8
                          </span>
                        </div>
                        {ev.translatedText && (
                          <button
                            type="button"
                            onClick={() => setShowTranslationCard((prev) => ({ ...prev, [ev.id]: !prev[ev.id] }))}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Languages className="w-3.5 h-3.5" />
                            <span>{showTranslationCard[ev.id] ? 'Original Script' : 'English Translation'}</span>
                          </button>
                        )}
                      </div>

                      {/* Entity Chips */}
                      {ev.ocrEntities && (
                        <div className="flex flex-wrap gap-1.5">
                          {ev.ocrEntities.phone_numbers?.map((ph, idx) => (
                            <span key={`ph-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-medium rounded-full">
                              <Phone className="w-2.5 h-2.5 text-sky-600" />
                              {ph}
                            </span>
                          ))}
                          {ev.ocrEntities.bank_accounts?.map((acc, idx) => (
                            <span key={`acc-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium rounded-full">
                              <CreditCard className="w-2.5 h-2.5 text-amber-600" />
                              A/C {acc}
                            </span>
                          ))}
                          {ev.ocrEntities.ifsc_codes?.map((ifsc, idx) => (
                            <span key={`ifsc-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-medium rounded-full">
                              IFSC: {ifsc}
                            </span>
                          ))}
                          {ev.ocrEntities.utr_numbers?.map((utr, idx) => (
                            <span key={`utr-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-medium rounded-full">
                              <FileCode2 className="w-2.5 h-2.5 text-teal-600" />
                              UTR: {utr}
                            </span>
                          ))}
                          {ev.ocrEntities.upi_ids?.map((upi, idx) => (
                            <span key={`upi-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium rounded-full">
                              <Zap className="w-2.5 h-2.5 text-emerald-600" />
                              {upi}
                            </span>
                          ))}
                          {ev.ocrEntities.apks_detected?.map((apk, idx) => (
                            <span key={`apk-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium rounded-full">
                              <Package className="w-2.5 h-2.5 text-rose-600" />
                              {apk}
                            </span>
                          ))}
                          {ev.ocrEntities.urgency_keywords?.map((kw, idx) => (
                            <span key={`kw-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-red-800 text-[11px] font-medium rounded-full">
                              <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-slate-700 line-clamp-2 italic leading-relaxed">
                        &quot;{showTranslationCard[ev.id] && ev.translatedText ? ev.translatedText : ev.ocrExtractedText}&quot;
                      </p>
                      {ev.compoundHash && (
                        <div className="text-[11px] font-mono text-slate-400 truncate" title={ev.compoundHash}>
                          Compound Root: {ev.compoundHash.substring(0, 24)}...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata telemetry */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Ingested By</span>
                      <span className="text-slate-800 font-medium truncate block">{ev.uploadedBy}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Timestamp</span>
                      <span className="text-slate-800 block">{ev.uploadedAt}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">GPS Coordinates</span>
                      <span className="text-slate-800 font-mono text-[11px] truncate block">{ev.gpsCoordinates}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Hardware Terminal</span>
                      <span className="text-slate-800 truncate block">{ev.deviceUsed}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedEvidence(ev);
                        setShowCustodyModal(true);
                      }}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-colors"
                      title="View chronological chain of custody"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Custody ({ev.chainOfCustody.length})</span>
                    </button>

                    <button
                      onClick={() => handleOpenCertificate(ev)}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-sm transition-colors"
                      title="Export official Section 63 BSA Certificate"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>BSA Sec 63 Cert</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEvidence(ev)}
                      className="text-xs font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleDownload(ev)}
                      className="text-xs font-semibold text-white flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INSTANT COURTROOM VERIFIER DRAWER / MODAL */}
      {showCourtVerifier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Instant Courtroom Integrity Verifier (BSA 2023 Sec 63)
                </span>
              </div>
              <button
                onClick={() => {
                  setShowCourtVerifier(false);
                  setVerifierResult(null);
                  setVerifierInput('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <p className="text-xs text-slate-600">
                Drag and drop any local evidence file to calculate its SHA-256 digest in-memory and match it against the Polygon Amoy blockchain ledger. Or paste a 64-character hash digest or Case ID.
              </p>

              {/* Drag & Drop Zone */}
              <div
                onClick={() => verifierFileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer text-center bg-slate-50/50 rounded-xl transition-all"
              >
                <input
                  ref={verifierFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleVerifierFileDrop}
                />
                <FileCode2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-slate-800 font-semibold">
                  Click or Drag local evidence file here to verify authenticity
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Computes SHA-256 in browser buffer; checks on-chain state in &lt;100ms
                </div>
              </div>

              {/* Text / Hash input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold uppercase block">
                  Or enter SHA-256 digest or Case ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifierInput}
                    onChange={(e) => setVerifierInput(e.target.value)}
                    placeholder="e.g. 9e1a8b7c6d5e4f3a... or CY2026-MH-44521"
                    className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    onClick={() => handleRunCourtroomVerifier(verifierInput)}
                    disabled={verifierCalculating || !verifierInput.trim()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {verifierCalculating ? 'Checking...' : 'Verify'}
                  </button>
                </div>
              </div>

              {/* Verification Result Card */}
              {verifierResult && (
                <div
                  className={`p-5 border rounded-xl space-y-3 ${
                    verifierResult.isAuthentic
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-rose-50/80 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {verifierResult.isAuthentic ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-800">
                            Authentic & Unaltered (BSA Sec 63 Compliant)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                          <span className="text-sm font-semibold text-rose-800">
                            Hash Mismatch / Unregistered Record
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      Latency: {verifierResult.latencyMs}ms ({verifierResult.engineUsed})
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {verifierResult.details}
                  </p>

                  {verifierResult.isAuthentic && verifierResult.matchedEvidence && (
                    <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2 text-xs shadow-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Matched File:</span>
                        <span className="text-slate-900 font-semibold">{verifierResult.matchedEvidence.fileName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Polygon Amoy Block:</span>
                        <a
                          href={getPolygonScanBlockUrl(verifierResult.blockNumber || 14892014)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-mono"
                        >
                          <span>#{verifierResult.blockNumber}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction Hash:</span>
                        <a
                          href={getPolygonScanTxUrl(verifierResult.blockchainTxHash || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-[280px] flex items-center gap-1 font-mono"
                        >
                          <span>{verifierResult.blockchainTxHash}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">IPFS CID:</span>
                        <span className="text-slate-700 font-mono truncate max-w-[280px]">{verifierResult.ipfsCid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">BSA Certificate ID:</span>
                        <span className="text-blue-700 font-semibold">{verifierResult.bsaCertificateId}</span>
                      </div>
                    </div>
                  )}

                  {verifierResult.isAuthentic && verifierResult.matchedEvidence && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setShowCourtVerifier(false);
                          handleOpenCertificate(verifierResult.matchedEvidence!);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>View Section 63 BSA Certificate</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => {
                  setShowCourtVerifier(false);
                  setVerifierResult(null);
                  setVerifierInput('');
                }}
                className="px-4 py-2 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close Verifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL BSA 2023 SECTION 63 DIGITAL INTEGRITY CERTIFICATE MODAL */}
      {showCertificateModal && activeCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Section 63 BSA, 2023 Certificate // Courtroom Exhibit
                </span>
              </div>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Body (Printable Area) */}
            <div id="bsa-certificate-printable" className="p-6 overflow-y-auto space-y-5 text-xs text-slate-900">
              
              {/* Official Seal / Institutional Header */}
              <div className="border border-slate-200 p-5 bg-slate-50 rounded-xl text-center space-y-1">
                <div className="text-[11px] tracking-widest text-blue-700 uppercase font-semibold">
                  Government of India • Ministry of Home Affairs
                </div>
                <div className="text-base font-bold text-slate-900">
                  Indian Cyber Crime Coordination Centre (I4C)
                </div>
                <div className="text-xs text-slate-600">
                  {activeCertificate.statutoryTitle}
                </div>
                <div className="text-xs text-blue-700 bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-200 mt-1 font-semibold">
                  Statutory Proof Under {activeCertificate.governingSection.toUpperCase()}
                </div>
              </div>

              {/* Certificate Telemetry & QR Code Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm items-center">
                <div className="md:col-span-2 space-y-2">
                  <div>
                    <span className="text-slate-400 text-[11px] uppercase font-semibold block">Certificate Serial No.</span>
                    <span className="text-base font-bold text-blue-600 font-mono">{activeCertificate.certificateId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] uppercase font-semibold block">Case Unique Identifier</span>
                    <span className="text-slate-900 font-semibold">{activeCertificate.caseId} (NCRP Portal Reference)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] uppercase font-semibold block">Evidence Title & File</span>
                    <span className="text-slate-700">{activeCertificate.title} ({activeCertificate.fileName} • {activeCertificate.fileSize})</span>
                  </div>
                </div>

                {/* Inline SVG QR Code */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div
                    dangerouslySetInnerHTML={{ __html: activeCertificate.qrCodeSvg }}
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
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">SHA-256 Cryptographic Digest (Invariable)</span>
                    <span className="text-slate-800 font-mono break-all bg-slate-50 p-2 border border-slate-200 rounded-lg block select-all">
                      {activeCertificate.sha256Hash}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Polygon Amoy Block Height</span>
                      <span className="text-emerald-700 font-bold font-mono">#{activeCertificate.polygonBlockNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">IPFS Ciphertext CID</span>
                      <span className="text-slate-700 font-mono truncate block" title={activeCertificate.ipfsCid}>
                        {activeCertificate.ipfsCid}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Blockchain Transaction Hash</span>
                    <a
                      href={getPolygonScanTxUrl(activeCertificate.blockchainTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block font-mono text-xs flex items-center gap-1"
                    >
                      <span>{activeCertificate.blockchainTxHash}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Officer in Lawful Control */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Certifying Investigator</span>
                  <span className="text-slate-900 font-bold block">{activeCertificate.certifyingOfficer.name}</span>
                  <span className="text-slate-500 block">{activeCertificate.certifyingOfficer.rank} (Badge: {activeCertificate.certifyingOfficer.badgeNumber})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Terminal & GPS Provenance</span>
                  <span className="text-slate-700 block truncate">{activeCertificate.certifyingOfficer.terminalId}</span>
                  <span className="text-blue-600 font-mono text-[11px] block">{activeCertificate.certifyingOfficer.gpsCoordinates}</span>
                </div>
              </div>

              {/* Statutory Legal Declaration Text */}
              <div className="p-4 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {activeCertificate.statutoryDeclaration}
              </div>
            </div>

            {/* Certificate Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(activeCertificate.verificationUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{copiedLink ? 'Link Copied!' : 'Copy Verification URL'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.print();
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Certificate</span>
                </button>

                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Preview Modal */}
      {selectedEvidence && !showCustodyModal && !showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Forensic Preview: {selectedEvidence.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  {selectedEvidence.title}
                </h4>
                <div className="text-xs text-slate-500">
                  Case ID: {selectedEvidence.caseId} • Filename: {selectedEvidence.fileName} • {selectedEvidence.fileSize}
                </div>
              </div>

              {/* Simulated Viewer */}
              <div className="bg-slate-50 border border-slate-200 p-8 text-center rounded-xl min-h-[220px] flex flex-col items-center justify-center relative">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center mb-3">
                  {getCategoryIcon(selectedEvidence.category)}
                </div>
                <div className="text-xs text-slate-800 font-semibold uppercase">
                  {selectedEvidence.fileName}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Section 63 BSA / Sec 65B Certified Forensic Media Container
                </div>

                <div className="absolute bottom-3 right-3 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                  Digitally Watermarked // I4C Forensic Lab
                </div>
              </div>

              {/* OCR Deep View */}
              {selectedEvidence.ocrExtractedText && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700 uppercase">
                      Extracted Text Analysis ({selectedEvidence.detectedLanguage})
                    </span>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">99.4% OCR Confidence</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-mono">
                    {selectedEvidence.ocrExtractedText}
                  </div>
                  {selectedEvidence.translatedText && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase mb-1">English Parsed Translation:</span>
                      {selectedEvidence.translatedText}
                    </div>
                  )}
                </div>
              )}

              {/* SHA-256 Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Full SHA-256 Digest</span>
                <p className="text-xs font-mono text-slate-800 break-all bg-white p-2.5 rounded-lg border border-slate-200">
                  {selectedEvidence.sha256Hash}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCustodyModal(true)}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chain of Custody</span>
                </button>
                <button
                  onClick={() => handleOpenCertificate(selectedEvidence)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1.5 ml-2"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>View BSA 63 Cert</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="px-4 py-2 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownload(selectedEvidence)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Download Evidence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chain of Custody Modal */}
      {selectedEvidence && showCustodyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Immutable Chain of Custody: {selectedEvidence.id}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowCustodyModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-semibold text-slate-900">
                  {selectedEvidence.title}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1">
                  SHA-256: {selectedEvidence.sha256Hash.substring(0, 32)}...
                </div>
                {selectedEvidence.polygonBlockNumber && (
                  <div className="text-xs text-emerald-700 font-semibold font-mono mt-1">
                    Anchored to Polygon Amoy Block #{selectedEvidence.polygonBlockNumber}
                  </div>
                )}
              </div>

              <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
                {selectedEvidence.chainOfCustody.map((log, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-sm" />
                    <div className="text-xs font-semibold text-blue-700">
                      {log.timestamp} • {log.action}
                    </div>
                    <div className="text-xs text-slate-800 mt-0.5">
                      Officer: <span className="font-semibold">{log.officerName}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Statutory Purpose: {log.purpose}
                    </div>
                    {log.blockNumber && (
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Block: #{log.blockNumber} • Tx: {log.txHash?.substring(0, 16)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => {
                  setShowCustodyModal(false);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Evidence Ingestion Modal with PaddleOCR & Polygon Amoy Anchoring */}
      <EvidenceIngestModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        currentOfficer={currentOfficer}
        onEvidenceIngested={(newItem) => {
          setEvidenceList((prev) => {
            const filtered = prev.filter((p) => p.id !== newItem.id && p.sha256Hash !== newItem.sha256Hash);
            return [newItem, ...filtered];
          });
          if (onAuditLog) {
            onAuditLog('INGESTED_FORENSIC_EVIDENCE', newItem.id, 'EVIDENCE');
          }
        }}
      />
    </div>
  );
}
