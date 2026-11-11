'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BLOCKCHAIN_CONFIG,
  calculateSha256,
  verifyHashOnLedger,
  getCaseHistoryFromLedger,
  generateBsa63Certificate,
  getPolygonScanTxUrl,
  getPolygonScanBlockUrl,
  getPolygonScanAddressUrl,
  Bsa63Certificate,
  LedgerVerificationResult,
} from '@/lib/blockchain/evidenceLedger';
import { EvidenceItem, EVIDENCE_DATA } from '@/data/collabData';
import {
  ShieldCheck,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Copy,
  Check,
  Printer,
  Clock,
  Database,
  Hash,
  ArrowLeft,
  FileCode2,
  RefreshCw,
  Lock,
  Layers,
  FileText,
  CreditCard,
  Camera,
  Scale,
  Smartphone,
  Phone,
  Zap,
  Package,
  Languages
} from 'lucide-react';

function CourtroomVerifierContent() {
  const searchParams = useSearchParams();
  const initialHash = searchParams?.get('hash') || '';
  const initialCase = searchParams?.get('case') || '';

  const [queryInput, setQueryInput] = useState<string>(initialHash || initialCase || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LedgerVerificationResult | null>(null);
  const [caseHistory, setCaseHistory] = useState<EvidenceItem[]>([]);
  const [activeCertificate, setActiveCertificate] = useState<Bsa63Certificate | null>(null);
  const [showCertificateView, setShowCertificateView] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const fileDropInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-verify if hash or case parameter is present in URL
  useEffect(() => {
    const q = initialHash || initialCase;
    if (q) {
      handleVerify(q);
    } else {
      handleVerify('EVD-2026-901');
    }
  }, [initialHash, initialCase]);

  const handleVerify = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setShowCertificateView(false);

    const res = await verifyHashOnLedger(query);
    setResult(res);

    if (res.isAuthentic && res.matchedEvidence) {
      const history = await getCaseHistoryFromLedger(res.matchedEvidence.caseId);
      setCaseHistory(history);
      const cert = generateBsa63Certificate(res.matchedEvidence);
      setActiveCertificate(cert);
    } else {
      setCaseHistory([]);
      setActiveCertificate(null);
    }

    setLoading(false);
  };

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const computedHash = await calculateSha256(file);
      setQueryInput(computedHash);
      await handleVerify(computedHash);
    }
  };

  const handleCopyHash = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const getCategoryIcon = (cat: EvidenceItem['category']) => {
    switch (cat) {
      case 'Communication': return <FileText className="w-4 h-4 text-sky-600" />;
      case 'Financial': return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'Surveillance': return <Camera className="w-4 h-4 text-rose-600" />;
      case 'Legal': return <Scale className="w-4 h-4 text-purple-600" />;
      case 'Device': return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'Identity': return <Lock className="w-4 h-4 text-amber-600" />;
      case 'Forensic':
      case 'Forensic / AI Intelligence Report':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      default: return <FileCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Law Enforcement & Judiciary Header Bar */}
      <header className="w-full bg-white border-b border-slate-200 select-none shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 p-1 shadow-xs">
                <Image
                  src="/logos/cybercast.png"
                  alt="CyberCast Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-slate-900">
                    Cyber<span className="text-blue-600">Cast</span>
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                </div>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  Judicial Evidence Vault • PS 184
                </span>
              </div>
            </Link>

            {/* Institutional Seal */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="flex items-center gap-1.5" title="Ministry of Home Affairs">
                <Image
                  src="/logos/emblem_india.svg"
                  alt="MHA"
                  width={16}
                  height={16}
                  className="h-4 w-auto"
                />
                <span className="text-xs text-slate-600 font-medium">MHA / I4C</span>
              </div>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-blue-700 font-semibold">Courtroom Verification Portal</span>
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/collab"
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Collab Hub</span>
            </Link>

            <a
              href={getPolygonScanAddressUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Polygon Amoy Contract</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Verification Headline Banner */}
        <div className="p-6 sm:p-7 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 border border-blue-200 rounded-full font-semibold">
                Public Judicial Verification
              </span>
              <span className="text-xs text-slate-500">
                Statutory Proof Under Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ledger: Polygon Amoy Testnet (Chain 80002)</span>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            Forensic Evidence Integrity & Chain of Custody Verifier
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Verify the mathematical integrity and immutable timestamp of electronic evidence submitted in court.
            All records are anchored to the decentralized Polygon Amoy ledger via EIP-712 gasless meta-transactions, providing conclusive proof against fabrication, alteration, or backdating under Indian Law.
          </p>
        </div>

        {/* Verification Input & Drop Zone Bar */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="lg:col-span-8 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Enter SHA-256 Hash, Case ID (e.g. CY2026-MH-44521), or Polygon Tx Hash:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify(queryInput)}
                    placeholder="e.g. 9e1a8b7c6d5e4f... or EVD-2026-901 or 0x8f2c3a1e9b4d..."
                    className="w-full bg-white border border-slate-300 pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <button
                  onClick={() => handleVerify(queryInput)}
                  disabled={loading || !queryInput.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Authenticity</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Drag & Drop File Verifier */}
            <div className="lg:col-span-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Or Drop Physical Evidence File:
              </label>
              <div
                onClick={() => fileDropInputRef.current?.click()}
                className="p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                <input
                  ref={fileDropInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileDrop}
                />
                <FileCode2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-800 font-semibold">
                  Verify Local File
                </span>
                <span className="text-[11px] text-slate-500">(In-Memory SHA-256)</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Preset Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Demo Exhibits:</span>
            {EVIDENCE_DATA.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setQueryInput(item.id);
                  handleVerify(item.id);
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                {item.id} ({item.fileName.substring(0, 18)}...)
              </button>
            ))}
          </div>
        </div>

        {/* Verification Result Section */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Main Verdict Card */}
            <div
              className={`p-6 border rounded-2xl space-y-4 shadow-sm ${
                result.isAuthentic
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-red-50/70 border-red-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {result.isAuthentic ? (
                    <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                  ) : (
                    <div className="p-2.5 bg-red-100 rounded-xl text-red-700">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">
                      Judicial Verdict • Statutory Integrity Check
                    </div>
                    <div className={`text-lg md:text-xl font-bold tracking-tight ${
                      result.isAuthentic ? 'text-emerald-900' : 'text-red-900'
                    }`}>
                      {result.isAuthentic
                        ? 'Status: Authentic & Unaltered (On-Chain Verified)'
                        : 'Hash Mismatch / Unregistered on Ledger'}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <div>Engine: <strong className="text-slate-800">{result.engineUsed}</strong></div>
                  <div>Query Latency: <strong className="font-mono">{result.latencyMs} ms</strong></div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-200/80 pt-3">
                {result.details}
              </p>

              {/* Pre-Cashout Mathematical Proof & Timeliness Panel */}
              {result.isAuthentic && (
                <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      Pre-Cashout Immutability Proof • Section 63 BSA 2023
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                      Polygon Amoy Block #{result.blockNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Complaint Ingestion Timestamp</span>
                      <span className="text-slate-900 font-semibold">
                        {result.complaintTimestamp || result.anchoredAt || result.matchedEvidence?.uploadedAt || '09 Sept 2026, 01:15:08 IST'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Predicted Cash-Out Window</span>
                      <span className="text-amber-700 font-bold">
                        {result.predictedCashOutWindow || '< 3.5 Hours'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Statutory Admissibility</span>
                      <span className="text-emerald-700 font-bold">
                        Section 63 BSA 2023 Certified
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg text-xs text-slate-700 leading-relaxed">
                    <strong className="text-emerald-800">Mathematical Proof of Timeliness: </strong>
                    <span>
                      {result.mathematicalProofTimeliness ||
                        `AI model input features and forecasted interdiction window were cryptographically committed to Polygon Amoy Block #${result.blockNumber} at the exact moment of citizen complaint ingestion. This establishes mathematical proof that AI interdiction intelligence was recorded PRIOR TO physical cash-out, eliminating defense claims of post-incident fabrication under Section 63 BSA 2023.`}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Actions Bar */}
              {result.isAuthentic && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCertificateView(!showCertificateView)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>{showCertificateView ? 'Hide Certificate' : 'View Section 63 BSA Certificate'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') window.print();
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      <span>Print Courtroom Exhibit</span>
                    </button>
                  </div>

                  <a
                    href={getPolygonScanTxUrl(result.blockchainTxHash || '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-1"
                  >
                    <span>View On-Chain on PolygonScan Amoy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Cryptographic Technical Breakdown */}
            {result.isAuthentic && result.matchedEvidence && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Cryptographic Proof Spec */}
                <div className="lg:col-span-7 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-blue-600" />
                      Cryptographic Ledger Proofs
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Polygon Amoy Block #{result.blockNumber}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold uppercase">Evidence Title & Case ID</span>
                      <span className="text-slate-900 font-bold text-sm">{result.matchedEvidence.title}</span>
                      <span className="text-slate-500 block text-xs mt-0.5">Associated Case: <strong className="text-slate-800 font-mono">{result.matchedEvidence.caseId}</strong></span>
                    </div>

                    <div>
                      {result.rawFileSha256 && result.compoundHash && result.rawFileSha256 !== result.compoundHash ? (
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-semibold uppercase">Raw Artifact SHA-256 (Original Binary Checksum)</span>
                              <button
                                onClick={() => handleCopyHash(result.rawFileSha256 || '')}
                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                              >
                                {copiedHash ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600 font-medium">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <span className="text-slate-800 font-mono text-xs break-all bg-slate-50 p-2 rounded-lg border border-slate-200 block mt-1 select-all">
                              {result.rawFileSha256}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-blue-700 font-semibold uppercase">Dual-Layer Compound Cryptographic Root (On-Chain Anchor)</span>
                            </div>
                            <span className="text-blue-700 font-mono text-xs break-all bg-blue-50/50 p-2 rounded-lg border border-blue-200 block mt-1 select-all">
                              {result.compoundHash}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-semibold uppercase">SHA-256 Cryptographic Checksum</span>
                            <button
                              onClick={() => handleCopyHash(result.sha256Hash)}
                              className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                            >
                              {copiedHash ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <span className="text-slate-800 font-mono text-xs break-all bg-slate-50 p-2 rounded-lg border border-slate-200 block mt-1 select-all">
                            {result.sha256Hash}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Polygon Block Number</span>
                        <a
                          href={getPolygonScanBlockUrl(result.blockNumber || 14892014)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-mono font-bold hover:underline flex items-center gap-1 text-xs"
                        >
                          <span>#{result.blockNumber}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">IPFS Ciphertext CID</span>
                        <span className="text-slate-700 font-mono text-xs truncate block" title={result.ipfsCid}>
                          {result.ipfsCid}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold uppercase">Transaction Hash</span>
                      <a
                        href={getPolygonScanTxUrl(result.blockchainTxHash || '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-mono text-xs truncate block flex items-center gap-1"
                        title={result.blockchainTxHash}
                      >
                        <span className="truncate">{result.blockchainTxHash}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Signing Officer</span>
                        <span className="text-slate-900 font-medium block">{result.matchedEvidence.uploadedBy}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Forensic GPS Fix</span>
                        <span className="text-slate-700 block font-mono text-xs">{result.matchedEvidence.gpsCoordinates}</span>
                      </div>
                    </div>

                    {/* Immutable PaddleOCR Seizure Transcript & Highlighted Entities */}
                    {(result.matchedEvidence.ocrExtractedText || result.ocrExtractedText) && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-900 font-semibold flex items-center gap-1.5">
                            <Languages className="w-3.5 h-3.5 text-blue-600" />
                            PaddleOCR Seizure Transcript ({result.detectedLanguage || result.matchedEvidence.detectedLanguage || 'Regional'})
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold text-[10px]">
                            PaddleOCR v2.8
                          </span>
                        </div>

                        {/* Highlighted Entity Chips */}
                        {(result.matchedEvidence.ocrEntities || result.ocrEntities) && (() => {
                          const activeOcrEntities = result.matchedEvidence.ocrEntities || result.ocrEntities;
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {activeOcrEntities.phone_numbers?.map((ph: string, idx: number) => (
                                <span key={`vph-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-md text-[11px] font-semibold font-mono">
                                  <Phone className="w-2.5 h-2.5" />
                                  {ph}
                                </span>
                              ))}
                              {activeOcrEntities.bank_accounts?.map((acc: string, idx: number) => (
                                <span key={`vacc-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[11px] font-semibold font-mono">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  A/C {acc}
                                </span>
                              ))}
                              {activeOcrEntities.ifsc_codes?.map((ifsc: string, idx: number) => (
                                <span key={`vifsc-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-md text-[11px] font-semibold font-mono">
                                  IFSC: {ifsc}
                                </span>
                              ))}
                              {activeOcrEntities.utr_numbers?.map((utr: string, idx: number) => (
                                <span key={`vutr-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-md text-[11px] font-semibold font-mono">
                                  <FileCode2 className="w-2.5 h-2.5" />
                                  UTR: {utr}
                                </span>
                              ))}
                              {activeOcrEntities.upi_ids?.map((upi: string, idx: number) => (
                                <span key={`vupi-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[11px] font-semibold font-mono">
                                  <Zap className="w-2.5 h-2.5" />
                                  {upi}
                                </span>
                              ))}
                              {activeOcrEntities.apks_detected?.map((apk: string, idx: number) => (
                                <span key={`vapk-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-[11px] font-semibold font-mono">
                                  <Package className="w-2.5 h-2.5" />
                                  {apk}
                                </span>
                              ))}
                              {activeOcrEntities.urgency_keywords?.map((kw: string, idx: number) => (
                                <span key={`vkw-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-red-800 rounded-md text-[11px] font-semibold">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {kw}
                                </span>
                              ))}
                            </div>
                          );
                        })()}

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 italic leading-relaxed">
                          &quot;{result.matchedEvidence.ocrExtractedText || result.ocrExtractedText}&quot;
                        </div>

                        {result.matchedEvidence.translatedText && (
                          <div className="text-xs text-slate-500">
                            En: &quot;{result.matchedEvidence.translatedText}&quot;
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 pt-0.5">
                          Establishes that threat text and financial coordinates were present before custodial handling (BSA Sec 63).
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Chronological Chain of Custody */}
                <div className="lg:col-span-5 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Verified Chain of Custody ({result.matchedEvidence.chainOfCustody.length})
                    </span>
                    <span className="text-xs text-slate-500">Immutable Timeline</span>
                  </div>

                  <div className="relative pl-6 border-l-2 border-slate-200 space-y-5 text-xs">
                    {result.matchedEvidence.chainOfCustody.map((log, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[31px] top-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-xs" />
                        <div className="text-xs font-semibold text-slate-900">
                          {log.timestamp} • <span className="text-blue-600">{log.action}</span>
                        </div>
                        <div className="text-xs text-slate-700 mt-0.5">
                          Officer: <span className="font-semibold">{log.officerName}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Purpose: {log.purpose}
                        </div>
                        {log.blockNumber && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Block #{log.blockNumber} • Tx: {log.txHash?.substring(0, 16)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Embedded Section 63 BSA Digital Certificate View */}
            {result.isAuthentic && showCertificateView && activeCertificate && (
              <div id="bsa-certificate-printable" className="p-8 bg-white border-2 border-slate-300 rounded-2xl shadow-xl space-y-6">
                {/* Official Indian Seal Banner */}
                <div className="border border-slate-200 p-5 bg-slate-50 rounded-xl text-center space-y-1">
                  <div className="text-[10px] tracking-widest text-slate-600 uppercase font-semibold">
                    Government of India • Ministry of Home Affairs / I4C
                  </div>
                  <div className="text-base font-bold text-slate-900 uppercase tracking-wider">
                    {activeCertificate.statutoryTitle}
                  </div>
                  <div className="text-xs text-slate-600">
                    Issued under {activeCertificate.governingSection}
                  </div>
                </div>

                {/* Grid with QR Code and Identifiers */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-xl items-center">
                  <div className="md:col-span-3 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Certificate Unique ID</span>
                      <span className="text-lg font-bold font-mono text-blue-700">{activeCertificate.certificateId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Case Identifier</span>
                      <span className="text-slate-900 font-semibold">{activeCertificate.caseId} (NCRP Cyber Crime Portal)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Evidence Title & File</span>
                      <span className="text-slate-800">{activeCertificate.title} ({activeCertificate.fileName} • {activeCertificate.fileSize})</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div
                      dangerouslySetInnerHTML={{ __html: activeCertificate.qrCodeSvg }}
                      className="w-28 h-28 flex items-center justify-center"
                    />
                    <span className="text-[9px] text-slate-500 mt-1 font-mono tracking-wider text-center">
                      Scan For On-Chain Audit
                    </span>
                  </div>
                </div>

                {/* Cryptographic Ledger Verification Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="text-xs font-semibold text-slate-900 uppercase">
                    Cryptographic Blockchain Audit Trail
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">SHA-256 Digest</span>
                      <span className="text-slate-800 font-mono text-xs break-all bg-white p-2 border border-slate-200 rounded-lg block mt-0.5">
                        {activeCertificate.sha256Hash}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Polygon Block Number</span>
                        <span className="text-blue-700 font-bold font-mono">#{activeCertificate.polygonBlockNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">IPFS Content Identifier</span>
                        <span className="text-slate-800 font-mono text-xs truncate block">{activeCertificate.ipfsCid}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Transaction Hash</span>
                      <span className="text-slate-800 font-mono text-xs break-all block">{activeCertificate.blockchainTxHash}</span>
                    </div>
                  </div>
                </div>

                {/* Certifying Officer Details */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Officer in Lawful Control</span>
                    <span className="text-slate-900 font-semibold block">{activeCertificate.certifyingOfficer.name}</span>
                    <span className="text-slate-600 block">{activeCertificate.certifyingOfficer.rank} (Badge: {activeCertificate.certifyingOfficer.badgeNumber})</span>
                    <span className="text-slate-500 block text-[11px]">{activeCertificate.certifyingOfficer.agency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Terminal Provenance & GPS Lock</span>
                    <span className="text-slate-800 block font-mono">{activeCertificate.certifyingOfficer.terminalId}</span>
                    <span className="text-blue-700 block font-mono">{activeCertificate.certifyingOfficer.gpsCoordinates}</span>
                  </div>
                </div>

                {/* Statutory Text */}
                <div className="p-5 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {activeCertificate.statutoryDeclaration}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') window.print();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Formal Certificate (BSA Section 63)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-500 font-sans">
        CyberCast Evidence Vault • Governed by Bharatiya Sakshya Adhiniyam, 2023 (Section 63) & Information Technology Act, 2000 (Section 79A).
      </footer>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-sans text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
        <span>Initializing Courtroom Verifier...</span>
      </div>
    }>
      <CourtroomVerifierContent />
    </Suspense>
  );
}
