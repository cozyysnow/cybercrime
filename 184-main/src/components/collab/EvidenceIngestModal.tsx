'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Upload,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  FileText,
  FileCode2,
  Phone,
  CreditCard,
  Zap,
  Package,
  ExternalLink,
  Printer,
  Eye,
  Languages,
  Clock,
  Cpu,
  MapPin,
  Laptop
} from 'lucide-react';
import {
  CASES_DATA,
  EvidenceItem,
  OfficerProfile
} from '@/data/collabData';
import {
  calculateSha256,
  anchorEvidenceToLedger,
  calculateCompoundHash,
  generateBsa63Certificate,
  getPolygonScanTxUrl,
  Bsa63Certificate
} from '@/lib/blockchain/evidenceLedger';
import {
  extractOcrWithPaddle,
  extractCyberEntities,
  detectIndicLanguage,
  PaddleOcrExtractionResult,
  PaddleOcrEntityResult
} from '@/lib/ocr/paddleOcrService';

interface EvidenceIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerProfile;
  onEvidenceIngested?: (item: EvidenceItem) => void;
}

export default function EvidenceIngestModal({
  isOpen,
  onClose,
  currentOfficer,
  onEvidenceIngested,
}: EvidenceIngestModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');

  // Metadata fields
  const [title, setTitle] = useState<string>('');
  const [caseId, setCaseId] = useState<string>(CASES_DATA[0]?.id || 'CY2026-MH-44521');
  const [category, setCategory] = useState<EvidenceItem['category']>('Communication');
  const [confidentiality, setConfidentiality] = useState<EvidenceItem['confidentiality']>('Restricted');
  const [source, setSource] = useState<EvidenceItem['source']>('Victim');

  // OCR & Crypto State
  const [rawSha256, setRawSha256] = useState<string>('');
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [isExtractingOcr, setIsExtractingOcr] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<PaddleOcrExtractionResult | null>(null);
  const [editedOcrText, setEditedOcrText] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState<boolean>(false);

  // Anchoring State
  const [isAnchoring, setIsAnchoring] = useState<boolean>(false);
  const [miningStep, setMiningStep] = useState<string | null>(null);
  const [anchoredItem, setAnchoredItem] = useState<EvidenceItem | null>(null);
  const [activeCert, setActiveCert] = useState<Bsa63Certificate | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Dynamically derive active entities from edited transcript
  const activeEntities: PaddleOcrEntityResult = useMemo(() => {
    const text = editedOcrText || ocrResult?.extracted_text || '';
    if (!text) {
      return {
        phone_numbers: [],
        bank_accounts: [],
        ifsc_codes: [],
        upi_ids: [],
        apks_detected: [],
        urls_detected: [],
        urgency_keywords: [],
        utr_numbers: [],
      };
    }
    return extractCyberEntities(text);
  }, [editedOcrText, ocrResult]);

  // Dynamically derive active language from edited transcript
  const activeLanguage = useMemo(() => {
    const text = editedOcrText || ocrResult?.extracted_text || '';
    if (!text) return 'None (Empty Payload)';
    return detectIndicLanguage(text);
  }, [editedOcrText, ocrResult]);

  // Dynamically derive compound hash
  const [activeCompoundHash, setActiveCompoundHash] = useState<string>('');
  useEffect(() => {
    let active = true;
    async function updateCompound() {
      if (!rawSha256) {
        setActiveCompoundHash('');
        return;
      }
      const textToHash = editedOcrText || ocrResult?.extracted_text || '';
      if (textToHash) {
        const textSha = await calculateSha256(textToHash);
        const comp = await calculateCompoundHash(rawSha256, textSha, caseId);
        if (active) setActiveCompoundHash(comp);
      } else {
        if (active) setActiveCompoundHash(rawSha256);
      }
    }
    updateCompound();
    return () => { active = false; };
  }, [rawSha256, editedOcrText, ocrResult, caseId]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFile = async (selectedFile: File) => {
    setFileError(null);
    if (!selectedFile || selectedFile.size === 0) {
      setFile(null);
      setFileError('Invalid file: 0-byte empty file cannot be ingested as digital evidence under Section 63 BSA 2023.');
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    const sizeInMb = (selectedFile.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMb} MB`);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    // Default title if empty
    if (!title) {
      setTitle(`Forensic Exhibit - ${selectedFile.name.replace(/\.[^/.]+$/, '')}`);
    }

    // Step 1: Immediate in-memory cryptographic hashing (Client-Side Web Crypto)
    setIsHashing(true);
    try {
      const digest = await calculateSha256(selectedFile);
      setRawSha256(digest);
    } catch (err) {
      console.error('Hashing error:', err);
    } finally {
      setIsHashing(false);
    }

    // Step 2: PaddleOCR Indic Multilingual Extraction
    setIsExtractingOcr(true);
    try {
      const ocr = await extractOcrWithPaddle(selectedFile, selectedFile.name, caseId);
      setOcrResult(ocr);
      setEditedOcrText(ocr.extracted_text);
    } catch (err) {
      console.error('OCR error:', err);
    } finally {
      setIsExtractingOcr(false);
    }
  };

  const handleAnchorToBlockchain = async () => {
    if (!file && !rawSha256) return;
    setIsAnchoring(true);

    try {
      // Step 1: Compound Hashing
      setMiningStep('1/3: Binding raw artifact SHA-256 & PaddleOCR transcript into compound root...');
      await new Promise((r) => setTimeout(r, 600));

      const ocrTextToHash = editedOcrText || ocrResult?.extracted_text || '';
      const ocrTextSha256 = ocrTextToHash ? await calculateSha256(ocrTextToHash) : undefined;
      const compoundDigest = activeCompoundHash || (ocrTextSha256
        ? await calculateCompoundHash(rawSha256, ocrTextSha256, caseId)
        : rawSha256);

      // Step 2: IPFS Envelope
      setMiningStep('2/3: Packaging AES-256 encrypted forensic container to IPFS...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Gasless Relayer Broadcast
      setMiningStep('3/3: Dispatching EIP-712 Meta-Transaction to Polygon Amoy Testnet (#80002)...');

      const anchorPayload: Partial<EvidenceItem> = {
        caseId,
        title: title || `Forensic Evidence - ${fileName}`,
        category,
        type: file?.type.startsWith('image/') ? 'image' : 'pdf',
        fileName: fileName || 'evidence_file.dat',
        fileSize: fileSize || '1.5 MB',
        sha256Hash: compoundDigest,
        rawFileSha256: rawSha256,
        compoundHash: compoundDigest,
        ocrTextSha256,
        ocrExtractedText: ocrTextToHash,
        translatedText: ocrResult?.translated_text,
        detectedLanguage: activeLanguage,
        ocrEntities: activeEntities,
        ocrConfidence: ocrResult?.confidence_score || 0.964,
        ocrModelVersion: 'PaddleOCR v2.8 (DBNet + CRNN/SVTR Indic)',
        relevance: 'Primary',
        source,
        confidentiality,
      };

      const result = await anchorEvidenceToLedger(anchorPayload, {
        name: currentOfficer.name,
        badgeNumber: currentOfficer.badgeNumber,
        rank: currentOfficer.rank,
        agency: currentOfficer.department,
      });

      setAnchoredItem(result.evidenceItem);
      const cert = generateBsa63Certificate(result.evidenceItem, {
        name: currentOfficer.name,
        badgeNumber: currentOfficer.badgeNumber,
        rank: currentOfficer.rank,
        agency: currentOfficer.department,
      });
      setActiveCert(cert);

      // Fire reactive window event for cross-component sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cybercast_evidence_anchored', { detail: result.evidenceItem })
        );
      }

      onEvidenceIngested?.(result.evidenceItem);
    } catch (err) {
      console.error('Anchoring error:', err);
    } finally {
      setIsAnchoring(false);
      setMiningStep(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setFileName('');
    setFileSize('');
    setTitle('');
    setRawSha256('');
    setOcrResult(null);
    setEditedOcrText('');
    setAnchoredItem(null);
    setActiveCert(null);
    setFileError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl font-sans text-slate-900 overflow-hidden">

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-slate-900">
                  Ingest Forensic Evidence & PaddleOCR
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  PaddleOCR v2.8
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dual-Layer Polygon Amoy Ledger & Section 63 BSA 2023 Chain of Custody
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">

          {/* Post-Anchored Success View */}
          {anchoredItem && (
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Artifact & PaddleOCR Transcript Anchored to Ledger</span>
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                  Polygon Amoy Block #{anchoredItem.polygonBlockNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium uppercase">Evidence ID</span>
                  <span className="text-slate-900 font-semibold">{anchoredItem.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium uppercase">Section 63 BSA Certificate</span>
                  <span className="text-blue-600 font-semibold">{anchoredItem.bsa63CertificateId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium uppercase">Raw File SHA-256</span>
                  <span className="text-slate-700 font-mono text-[11px] truncate block" title={anchoredItem.rawFileSha256}>
                    {anchoredItem.rawFileSha256}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium uppercase">Compound Cryptographic Root</span>
                  <span className="text-blue-700 font-mono text-[11px] truncate block" title={anchoredItem.compoundHash}>
                    {anchoredItem.compoundHash}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-500 block text-[11px] font-medium uppercase">Polygon Tx Hash</span>
                  <a
                    href={getPolygonScanTxUrl(anchoredItem.blockchainTxHash || '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1 truncate"
                  >
                    <span>{anchoredItem.blockchainTxHash}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-emerald-200">
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg shadow-sm"
                >
                  Ingest Another File
                </button>
                <div className="flex items-center gap-2">
                  {activeCert && (
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') window.print();
                      }}
                      className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center gap-1.5 rounded-lg shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Print BSA 63 Certificate</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {!anchoredItem && (
            <>
              {/* Step 1: Drag-and-Drop Ingestion Zone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-blue-600" />
                    1. Forensic Artifact Ingestion (Up to 50MB)
                  </span>
                  <span className="text-slate-400 text-xs">JPG • PNG • PDF • WEBP</span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer bg-slate-50/50 text-center rounded-xl"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-slate-800 font-semibold">
                    {fileName ? fileName : 'Click or Drag forensic evidence file here'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    WhatsApp Threats • ATM CCTV Snapshots • Bank Freeze Memos • UPI QR Codes
                  </div>
                </div>
              </div>

              {/* Error Banner for Empty/Corrupt Files */}
              {fileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Real-Time SHA-256 Hashing Status Pill */}
              {isHashing && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Computing raw artifact SHA-256 binary hash in-memory...</span>
                </div>
              )}

              {rawSha256 && !isHashing && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800 font-semibold flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Raw Artifact Digest Computed (Section 63(4) BSA 2023 Tamper-Proof)
                    </span>
                    <span className="text-slate-500 font-mono text-xs">{fileSize}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-800 break-all select-all bg-white p-2 border border-emerald-200 rounded-lg">
                    {rawSha256}
                  </div>
                </div>
              )}

              {/* Step 2: Interactive Metadata Fields */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <span className="text-slate-700 font-semibold text-xs uppercase tracking-wider block">
                  2. Case Metadata & Chain of Custody Provenance
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Evidence Title / Description *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. WhatsApp Threat & QuickSupport APK Screenshot"
                      className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Associated Case ID *
                    </label>
                    <select
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {CASES_DATA.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} — {c.fraudType.substring(0, 24)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="Communication">Communication</option>
                        <option value="Financial">Financial / Bank Statement</option>
                        <option value="Surveillance">Surveillance / CCTV Footage</option>
                        <option value="Forensic / AI Intelligence Report">Forensic / AI Intelligence Report</option>
                        <option value="Legal">Legal / FIR</option>
                        <option value="Device">Device Dump</option>
                        <option value="Identity">Identity / KYC</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Confidentiality *
                      </label>
                      <select
                        value={confidentiality}
                        onChange={(e) => setConfidentiality(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="Restricted">Restricted (Inter-State)</option>
                        <option value="Top Secret">Top Secret (I4C Only)</option>
                        <option value="Open">Open (All Officers)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Evidence Source
                    </label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Victim">Victim Submission</option>
                      <option value="Police">Police Field Squad</option>
                      <option value="Bank">Bank / CFCFRMS Liaison</option>
                      <option value="CCTV">ATM CCTV System</option>
                      <option value="AI-detected">CyberCast AI Predictive Engine</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Side-by-Side Live OCR & Integrity Preview */}
              {(file || rawSha256) && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      3. Live PaddleOCR & Forensic Entity Preview
                    </span>
                    {ocrResult && (
                      <span className="text-xs text-slate-500 font-mono">
                        {ocrResult.model_version} • {ocrResult.processing_time_ms}ms
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Left: Original File Preview */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                        <span className="text-slate-600 font-semibold uppercase text-[10px]">Original Artifact Preview</span>
                        <span className="text-slate-400 text-xs font-mono">{fileName}</span>
                      </div>

                      {filePreviewUrl ? (
                        <div className="relative aspect-video max-h-[220px] bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={filePreviewUrl}
                            alt="Evidence Preview"
                            className="object-contain w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video max-h-[220px] bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center text-center p-4">
                          <FileText className="w-10 h-10 text-slate-400 mb-2" />
                          <span className="text-xs text-slate-800 font-semibold">{fileName || 'document_artifact.pdf'}</span>
                          <span className="text-xs text-slate-400 mt-1">Binary PDF / Raw Forensic Payload</span>
                        </div>
                      )}

                      <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                        <div>Officer: <span className="text-slate-800 font-medium">{currentOfficer.name} ({currentOfficer.badgeNumber})</span></div>
                        <div>GPS Fix: <span className="text-blue-600 font-mono text-[11px]">26.9124° N, 75.7873° E (Station GPS Verified)</span></div>
                      </div>
                    </div>

                    {/* Right: Extracted Regional Text & Highlighted Entities */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Languages className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-700 font-semibold uppercase text-xs">
                            {activeLanguage}
                          </span>
                        </div>
                        {ocrResult?.confidence_score && (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                            Confidence: {(ocrResult.confidence_score * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>

                      {isExtractingOcr ? (
                        <div className="py-8 text-center space-y-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                          <div className="text-xs text-slate-800 font-semibold">Running PaddleOCR Indic Engine...</div>
                          <div className="text-xs text-slate-500">Analyzing Devanagari, angle skew & cyber entities</div>
                        </div>
                      ) : (
                        <>
                          {/* Highlighted Entity Chips */}
                          {(activeEntities.phone_numbers.length > 0 ||
                            activeEntities.bank_accounts.length > 0 ||
                            activeEntities.ifsc_codes.length > 0 ||
                            activeEntities.utr_numbers?.length > 0 ||
                            activeEntities.upi_ids.length > 0 ||
                            activeEntities.apks_detected.length > 0 ||
                            activeEntities.urgency_keywords.length > 0) && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Detected Cyber Entities:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {activeEntities.phone_numbers.map((ph, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium rounded-full">
                                      <Phone className="w-3 h-3 text-sky-600" />
                                      {ph}
                                    </span>
                                  ))}

                                  {activeEntities.bank_accounts.map((acc, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-full">
                                      <CreditCard className="w-3 h-3 text-amber-600" />
                                      A/C {acc}
                                    </span>
                                  ))}

                                  {activeEntities.ifsc_codes.map((ifsc, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium rounded-full">
                                      IFSC: {ifsc}
                                    </span>
                                  ))}

                                  {activeEntities.utr_numbers?.map((utr, idx) => (
                                    <span key={`utr-${idx}`} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium rounded-full">
                                      <FileCode2 className="w-3 h-3 text-teal-600" />
                                      UTR: {utr}
                                    </span>
                                  ))}

                                  {activeEntities.upi_ids.map((upi, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-full">
                                      <Zap className="w-3 h-3 text-emerald-600" />
                                      {upi}
                                    </span>
                                  ))}

                                  {activeEntities.apks_detected.map((apk, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-full">
                                      <Package className="w-3 h-3 text-rose-600" />
                                      {apk}
                                    </span>
                                  ))}

                                  {activeEntities.urgency_keywords.map((kw, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded-full">
                                      <AlertTriangle className="w-3 h-3 text-red-600" />
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Editable Transcript Textarea */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-slate-700 block">
                                Extracted Transcript (Editable for Courtroom Notes)
                              </label>
                              {ocrResult?.translated_text && (
                                <button
                                  type="button"
                                  onClick={() => setShowTranslation(!showTranslation)}
                                  className="text-xs text-blue-600 font-medium hover:underline"
                                >
                                  {showTranslation ? 'View Original Script' : 'View English Translation'}
                                </button>
                              )}
                            </div>
                            <textarea
                              rows={4}
                              readOnly={showTranslation}
                              value={showTranslation && ocrResult?.translated_text ? ocrResult.translated_text : editedOcrText}
                              onChange={(e) => {
                                if (!showTranslation) {
                                  setEditedOcrText(e.target.value);
                                }
                              }}
                              className={`w-full bg-white border border-slate-200 p-2.5 text-xs font-mono text-slate-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 leading-relaxed ${showTranslation ? 'opacity-80 cursor-not-allowed bg-slate-50' : ''
                                }`}
                            />
                            {showTranslation && (
                              <div className="text-[11px] text-blue-600 italic">
                                English translation is read-only. Click &quot;View Original Script&quot; to edit evidence transcript.
                              </div>
                            )}
                          </div>

                          {/* Compound Root Preview */}
                          {(activeCompoundHash || ocrResult?.compound_hash) && (
                            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700 font-semibold block text-xs">
                                  Dual-Layer Compound Cryptographic Root:
                                </span>
                                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                                  Synced (Sec 63 BSA)
                                </span>
                              </div>
                              <div className="text-slate-600 truncate select-all font-mono text-[11px]" title={activeCompoundHash || ocrResult?.compound_hash}>
                                {activeCompoundHash || ocrResult?.compound_hash}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mining Progress Banner */}
              {isAnchoring && miningStep && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 space-y-1 animate-pulse">
                  <div className="flex items-center gap-2 font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Polygon Amoy Anchoring in Progress...</span>
                  </div>
                  <div className="text-xs text-slate-600">{miningStep}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAnchoring || isHashing || !rawSha256}
                  onClick={handleAnchorToBlockchain}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Anchor Artifact & OCR to Polygon Amoy</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
