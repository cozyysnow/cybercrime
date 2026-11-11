'use client';

import React, { useState } from 'react';
import { 
  X, Cpu, Send, AlertTriangle, Shield, CheckCircle2, 
  Clock, MapPin, Building, ArrowRight, BarChart3, Info, 
  TrendingUp, RefreshCw, Layers, ExternalLink, Zap, Lock, ShieldCheck,
  Radio, Smartphone
} from 'lucide-react';
import { sendAdbSms } from '@/lib/hardwareService';
import { 
  predictWithdrawal, 
  getSHAPExplanation, 
  ComplaintInput, 
  PredictionResponse, 
  SHAPExplanation 
} from '@/lib/apiService';
import { CaseEntity, CaseStatus, PriorityLevel, OfficerProfile } from '@/data/collabData';
import {
  calculateSha256,
  anchorEvidenceToLedger,
  getPolygonScanTxUrl,
  AnchorResult
} from '@/lib/blockchain/evidenceLedger';

interface ComplaintPredictorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToCases?: (newCase: CaseEntity) => void;
  onBroadcastAlert?: (alertText: string) => void;
  currentOfficer?: OfficerProfile;
}

const PRESET_TEMPLATES: Array<{
  id: string;
  name: string;
  badge: string;
  data: ComplaintInput;
}> = [
  {
    id: 'kyc_fast',
    name: 'KYC Fast ATM Cash-out (₹75K)',
    badge: 'High Urgency ATM',
    data: {
      complaint_id: 'NCRP-2026-MH-94812',
      fraud_type: 'KYC_Fraud',
      amount_stolen_inr: 75000,
      victim_state: 'Maharashtra',
      victim_district: 'Pune',
      victim_city_type: 'Metro',
      fraudster_phone_circle: 'Rajasthan',
      mule_account_bank: 'SBI',
      mule_account_state: 'Rajasthan',
      complaint_hour: 14,
      complaint_day_of_week: 2,
    },
  },
  {
    id: 'corp_high',
    name: 'High-Value Spoof Scam (₹5,00,000)',
    badge: 'Branch Counter',
    data: {
      complaint_id: 'NCRP-2026-DL-11029',
      fraud_type: 'OTP_Fraud',
      amount_stolen_inr: 500000,
      victim_state: 'Delhi (NCT)',
      victim_district: 'Central',
      victim_city_type: 'Metro',
      fraudster_phone_circle: 'Haryana',
      mule_account_bank: 'HDFC',
      mule_account_state: 'Haryana',
      complaint_hour: 23,
      complaint_day_of_week: 5,
    },
  },
  {
    id: 'upi_task',
    name: 'UPI Part-Time Task Scam (₹28,500)',
    badge: 'Rapid Local',
    data: {
      complaint_id: 'NCRP-2026-KA-44910',
      fraud_type: 'Investment_Fraud',
      amount_stolen_inr: 28500,
      victim_state: 'Karnataka',
      victim_district: 'Bengaluru Urban',
      victim_city_type: 'Metro',
      fraudster_phone_circle: 'Karnataka',
      mule_account_bank: 'Canara',
      mule_account_state: 'Karnataka',
      complaint_hour: 11,
      complaint_day_of_week: 3,
    },
  },
];

export default function ComplaintPredictorModal({
  isOpen,
  onClose,
  onSaveToCases,
  onBroadcastAlert,
  currentOfficer,
}: ComplaintPredictorModalProps) {
  const [formData, setFormData] = useState<ComplaintInput>(PRESET_TEMPLATES[0].data);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [shap, setShap] = useState<SHAPExplanation | null>(null);
  const [activeTab, setActiveTab] = useState<'prediction' | 'shap'>('prediction');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);

  // Blockchain Ledger Anchoring State (Section 63 BSA 2023)
  const [isBlockchainAnchoringEnabled, setIsBlockchainAnchoringEnabled] = useState(true);
  const [anchoringStep, setAnchoringStep] = useState<number>(0); // 0: idle, 1: hashing, 2: relayer, 3: confirmed
  const [anchoredProof, setAnchoredProof] = useState<AnchorResult | null>(null);
  const [manifestData, setManifestData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setFormData({
      ...preset.data,
      complaint_id: `NCRP-2026-${Date.now().toString().slice(-5)}`,
    });
    setPrediction(null);
    setShap(null);
    setSavedSuccess(false);
    setAlertSuccess(false);
    setAnchoredProof(null);
    setManifestData(null);
    setAnchoringStep(0);
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setSavedSuccess(false);
    setAlertSuccess(false);
    setAnchoredProof(null);
    setManifestData(null);
    setAnchoringStep(0);

    try {
      const pred = await predictWithdrawal(formData);
      const shapResult = getSHAPExplanation(formData, pred);
      setPrediction(pred);
      setShap(shapResult);
      setActiveTab('prediction');

      if (isBlockchainAnchoringEnabled) {
        // Step 1/3: Calculating SHA-256 Manifest Digest...
        setAnchoringStep(1);

        const caseId = pred.complaint_id || formData.complaint_id;
        const topState = pred.top_predicted_states[0]?.state || formData.victim_state;
        const facility = pred.zone_prediction.predicted_zone.includes('Counter') || pred.zone_prediction.predicted_zone.includes('Branch')
          ? 'Bank_Branch_Counter'
          : 'Urban_ATM';

        const officerName = currentOfficer?.name || 'Dr. A. K. Saxena';
        const officerBadge = currentOfficer?.badgeNumber || 'I4C-DIR-01';
        const officerRank = currentOfficer?.rank || 'Joint Director (Cyber Defense)';

        // Cryptographic Manifest bundling Complaint Vector + AI Prediction + SHAP + Officer Provenance
        const manifest = {
          manifestVersion: '1.0-BSA2023',
          caseId,
          complaintVector: {
            complaintId: caseId,
            submissionTimestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
            fraudTaxonomy: formData.fraud_type,
            defraudedAmount: formData.amount_stolen_inr,
            victimJurisdiction: formData.victim_state,
            victimDistrict: formData.victim_district || 'District Police HQ',
            muleBank: formData.mule_account_bank || 'SBI',
            muleState: formData.mule_account_state || topState,
          },
          aiInferenceOutput: {
            primaryPredictedState: topState,
            confidenceScore: pred.top_predicted_states[0]?.probability || 0.85,
            extractionFacility: facility,
            hierarchyStage: pred.zone_prediction.hierarchy_stage,
            estimatedInterdictionWindowHours: pred.estimated_time_window_hours,
            timeUrgency: pred.time_urgency,
          },
          shapAttributionFactors: (shapResult.topFactors || []).map((f) => ({
            feature: f.feature,
            value: f.value,
            impactPercentage: f.impactPercentage,
            direction: f.direction,
            description: f.description,
          })),
          officerProvenance: {
            officerName,
            badgeNumber: officerBadge,
            rank: officerRank,
            terminalId: 'I4C-CONSOLE-SECURE-01',
            gpsStationStamp: '28.6139° N, 77.2090° E (National Cyber Command)',
          },
        };

        setManifestData(manifest);
        const manifestJson = JSON.stringify(manifest, null, 2);
        const manifestHash = await calculateSha256(manifestJson);

        // Step 2/3: Submitting EIP-712 Meta-Transaction to Polygon Amoy...
        await new Promise((resolve) => setTimeout(resolve, 350));
        setAnchoringStep(2);

        await new Promise((resolve) => setTimeout(resolve, 400));

        // Step 3/3: Mining confirmation & ledger entry
        const anchorResult = await anchorEvidenceToLedger(
          {
            caseId,
            title: 'AI Predictive Interdiction & Complaint Dossier',
            category: 'Forensic / AI Intelligence Report',
            type: 'json',
            fileName: `${caseId}_prediction_manifest.json`,
            fileSize: `${(new TextEncoder().encode(manifestJson).length / 1024).toFixed(1)} KB`,
            sha256Hash: manifestHash,
            relevance: 'Primary',
            source: 'AI-detected',
            confidentiality: 'Restricted',
            ocrExtractedText: `AI PREDICTION MANIFEST (${caseId})\nPrimary Predicted State: ${topState}\nInterdiction Window: < ${pred.estimated_time_window_hours} Hours\nFacility: ${facility}\nAmount: ₹${formData.amount_stolen_inr.toLocaleString('en-IN')}`,
            chainOfCustody: [
              {
                timestamp: new Date().toLocaleTimeString('en-GB') + ' IST',
                officerName,
                action: '[COMPLAINT_INGESTED_AND_AI_PREDICTED]',
                purpose: 'Section 63 BSA 2023 Immutability Lock for AI Prediction',
                digitalSignature: `${officerBadge}:EIP712-SIGNED`,
              },
            ],
          },
          {
            name: officerName,
            badgeNumber: officerBadge,
            rank: officerRank,
            agency: 'Indian Cyber Crime Coordination Centre (I4C), MHA',
          }
        );

        setAnchoringStep(3);
        setAnchoredProof(anchorResult);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cybercast_evidence_anchored', { detail: anchorResult.evidenceItem })
          );
        }
      }
    } catch (err) {
      console.error('Prediction or blockchain anchoring failed:', err);
      setAnchoringStep(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDispatchToDossier = () => {
    if (!prediction) return;
    
    const topState = prediction.top_predicted_states[0]?.state || formData.victim_state;
    const isUrgent = prediction.time_urgency.toLowerCase().includes('critical') || prediction.estimated_time_window_hours <= 3;
    const priority: PriorityLevel = isUrgent ? 'Critical' : formData.amount_stolen_inr >= 200000 ? 'High' : 'Medium';
    const status: CaseStatus = isUrgent ? 'SURVEILLANCE_ACTIVE' : 'UNDER_INVESTIGATION';

    const newCase: CaseEntity = {
      id: prediction.complaint_id,
      ncrpAckNumber: `NCRP-2026-${Date.now().toString().slice(-6)}`,
      registeredAt: new Date().toLocaleString('en-IN') + ' IST',
      fraudType: formData.fraud_type,
      totalAmount: formData.amount_stolen_inr,
      recoveredAmount: 0,
      victimState: formData.victim_state,
      victimDistrict: formData.victim_district || 'District Police HQ',
      suspectedWithdrawalState: topState,
      suspectedWithdrawalCity: `${topState} Metro`,
      suspectedWithdrawalZone: `${prediction.zone_prediction.predicted_zone} Cluster`,
      status,
      priority,
      assignedOfficerId: currentOfficer?.id || 'OFF-I4C-AUTO',
      assignedOfficerName: currentOfficer?.name || 'I4C Command Dispatch',
      lastUpdated: 'Just now',
      linkedCasesCount: 1,
      sourceOfComplaint: 'NCRP Portal',
      blockchainProof: anchoredProof ? {
        txHash: anchoredProof.blockchainTxHash,
        blockNumber: anchoredProof.polygonBlockNumber,
        certId: anchoredProof.bsa63CertificateId,
        anchoredAt: anchoredProof.anchoredAt,
        manifestCid: anchoredProof.ipfsCid,
        manifestHash: anchoredProof.evidenceItem.sha256Hash,
      } : undefined,
      victim: {
        name: 'Reported Complainant (NCRP)',
        maskedName: 'R******* C**********',
        age: 38,
        gender: 'Not Disclosed',
        phoneMasked: '+91 98XXX-XXXXX',
        bankName: formData.victim_state + ' Rural / Commercial Bank',
        accountMasked: 'A/C XXXX-9102',
        summaryText: `Complainant reported unauthorized debit of ₹${formData.amount_stolen_inr.toLocaleString('en-IN')} via ${formData.fraud_type}. Transferred into mule account in ${formData.mule_account_state || topState}.`,
      },
      aiSummary: `Live ML Model (FastAPI v3.0.0) projected withdrawal in ${topState} (${prediction.zone_prediction.predicted_zone}) with ${prediction.estimated_time_window_hours}h time window. Urgency: ${prediction.time_urgency}.${anchoredProof ? ` Anchored to Polygon Amoy Block #${anchoredProof.polygonBlockNumber} (Tx: ${anchoredProof.blockchainTxHash.substring(0, 10)}...).` : ''}`,
      predictedZone: `${prediction.zone_prediction.predicted_zone} Cluster`,
      predictedTimeWindow: `${prediction.estimated_time_window_hours} Hours`,
      confidenceScore: Math.round((prediction.top_predicted_states[0]?.probability || 0.8) * 100),
      suspectedGang: 'Inter-State Cyber Syndicate (Mewat / Western Corridor)',
      linkedMuleAccounts: [
        `${formData.mule_account_bank || 'SBI'} A/C XXXX${Date.now().toString().slice(-4)} (${formData.mule_account_state || topState})`
      ],
      linkedPhoneNumbers: [
        `+91 94XXX-${Date.now().toString().slice(-5)}`
      ],
      linkedIMEIs: [
        `86492004${Date.now().toString().slice(-7)}`
      ],
      moneyTrail: [
        {
          id: 'node-entry',
          label: `${formData.mule_account_bank || 'SBI'} Mule Node`,
          type: 'mule',
          bank: formData.mule_account_bank || 'SBI',
          accountMasked: `XXXX-${Date.now().toString().slice(-4)}`,
          amount: formData.amount_stolen_inr,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST',
          location: `${topState} Commercial Branch`,
          status: 'Active',
          freezeStatus: 'Pending',
        }
      ],
      actionLog: [
        {
          timestamp: new Date().toLocaleTimeString('en-GB') + ' IST',
          officerName: currentOfficer?.name || 'Live ML Model (FastAPI v3.0.0)',
          role: 'Autonomous Inference Pipeline',
          action: `Automated predictive triage completed (${prediction.processing_latency_ms.toFixed(1)}ms)${anchoredProof ? ` • Polygon Block #${anchoredProof.polygonBlockNumber}` : ''}`,
          outcome: `Predicted cash-out state ${topState} with ${prediction.zone_prediction.predicted_zone} classification`,
        }
      ],
    };

    if (onSaveToCases) {
      onSaveToCases(newCase);
      setSavedSuccess(true);
    }
  };

  const handleBroadcastAlert = async () => {
    if (!prediction) return;
    const topState = prediction.top_predicted_states[0]?.state || 'Suspect Zone';
    const alertMsg = `CRITICAL INTERDICTION: Case ${prediction.complaint_id} — Cashout expected in ${prediction.estimated_time_window_hours}h in ${topState} (${prediction.zone_prediction.predicted_zone}). Action: ${prediction.recommended_actions[0] || 'Deploy patrol units'}`;
    if (onBroadcastAlert) {
      onBroadcastAlert(alertMsg);
    }
    setAlertSuccess(true);
    // Trigger ADB SMS directive to physical hardware terminal
    try {
      await sendAdbSms({
        phone: '+919829041209',
        message: `[CYBERCAST BROADCAST ALERT] ${alertMsg}`,
        priority: 'FLASH_P1',
        officerName: currentOfficer?.name || 'Assigned Officer',
        caseId: prediction.complaint_id,
      });
    } catch {
      // Non-fatal fallback
    }
  };

  const handleSendSmsAlert = async () => {
    if (!prediction) return;
    setIsSendingSms(true);
    setSmsFeedback(null);
    const topState = prediction.top_predicted_states[0]?.state || formData.victim_state;
    const alertMsg = `[CYBERCAST FLASH DIRECTIVE] Urgent interdiction for Case ${prediction.complaint_id}. Predicted withdrawal: ${topState} (${prediction.zone_prediction.predicted_zone}) in ${prediction.estimated_time_window_hours}h. Action: ${prediction.recommended_actions[0] || 'Deploy patrol units'}. Authorized: ${currentOfficer?.name || 'I4C Command'}.`;

    const res = await sendAdbSms({
      phone: '+919829041209',
      message: alertMsg,
      priority: 'FLASH_P1',
      officerName: currentOfficer?.name || 'Assigned Officer',
      caseId: prediction.complaint_id,
    });

    setIsSendingSms(false);
    setSmsSuccess(true);
    if (res.mode === 'hardware') {
      setSmsFeedback(`✓ Intent launched on ${res.deviceId || 'ZD222K9HBL'} (${res.model || 'Android'}) • Ref #${res.dltReference}`);
    } else {
      setSmsFeedback(`✓ SMS simulated via DLT Trunk • Ref #${res.dltReference}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900 flex items-center gap-2">
                ML Predictive Ingestion Engine
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">
                  FastAPI v3.0.0
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Ministry of Home Affairs / I4C • PS 184 Cash-out Hotspot Predictor
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsBlockchainAnchoringEnabled(!isBlockchainAnchoringEnabled)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                isBlockchainAnchoringEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title="Section 63 Bharatiya Sakshya Adhiniyam, 2023 Statutory Proof"
            >
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              <span>Immutable BSA 2023 Ledger: {isBlockchainAnchoringEnabled ? 'Enabled' : 'Disabled'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MODAL CONTENT: TWO-COLUMN LAYOUT */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT COLUMN: PRESETS & COMPLAINT INPUT FORM (5 COLS) */}
          <div className="lg:col-span-5 p-5 space-y-5 bg-slate-50/50 overflow-y-auto">
            
            {/* PRESET TEMPLATES */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-blue-600" />
                <span>Evaluation Test Presets</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_TEMPLATES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900">{preset.name}</span>
                      <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {preset.badge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {preset.data.victim_state} → {preset.data.mule_account_state} • {preset.data.fraud_type}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleRunAnalysis} className="space-y-4 pt-3 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Complaint Parameters
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Complaint ID</label>
                  <input
                    type="text"
                    value={formData.complaint_id}
                    onChange={(e) => setFormData({ ...formData, complaint_id: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Fraud Type</label>
                  <select
                    value={formData.fraud_type}
                    onChange={(e) => setFormData({ ...formData, fraud_type: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="KYC_Fraud">KYC Fraud</option>
                    <option value="OTP_Fraud">OTP Fraud</option>
                    <option value="Investment_Fraud">Investment Fraud</option>
                    <option value="Task_Fraud">Task Fraud</option>
                    <option value="Vishing">Vishing</option>
                    <option value="Loan_App_Scam">Loan App Scam</option>
                    <option value="Sextortion">Sextortion</option>
                    <option value="UPI_Fraud">UPI Fraud</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-xs font-medium text-blue-700 block mb-1">Amount Stolen (INR)</label>
                  <input
                    type="number"
                    value={formData.amount_stolen_inr}
                    onChange={(e) => setFormData({ ...formData, amount_stolen_inr: Number(e.target.value) })}
                    className="w-full bg-white border border-blue-200 px-3 py-2 text-xs text-blue-900 font-semibold rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                    min={500}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Victim City Type</label>
                  <select
                    value={formData.victim_city_type || 'Metro'}
                    onChange={(e) => setFormData({ ...formData, victim_city_type: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="Metro">Metro</option>
                    <option value="Tier-2">Tier-2</option>
                    <option value="Tier-3">Tier-3</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Victim State</label>
                  <input
                    type="text"
                    value={formData.victim_state}
                    onChange={(e) => setFormData({ ...formData, victim_state: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Victim District</label>
                  <input
                    type="text"
                    value={formData.victim_district || ''}
                    onChange={(e) => setFormData({ ...formData, victim_district: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="e.g. Pune / Central"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Mule Account Bank</label>
                  <input
                    type="text"
                    value={formData.mule_account_bank || ''}
                    onChange={(e) => setFormData({ ...formData, mule_account_bank: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="e.g. SBI, HDFC, PNB"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Mule State</label>
                  <input
                    type="text"
                    value={formData.mule_account_state || ''}
                    onChange={(e) => setFormData({ ...formData, mule_account_state: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="e.g. Rajasthan, Haryana"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Incident Hour (0-23)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.complaint_hour ?? 14}
                    onChange={(e) => setFormData({ ...formData, complaint_hour: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Fraudster Circle</label>
                  <input
                    type="text"
                    value={formData.fraudster_phone_circle || ''}
                    onChange={(e) => setFormData({ ...formData, fraudster_phone_circle: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="e.g. Rajasthan, Bihar"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>{anchoringStep > 0 ? 'Anchoring to Polygon Amoy...' : 'Querying Live ML Models...'}</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4" />
                    <span>Execute Live ML Prediction →</span>
                  </>
                )}
              </button>
            </form>

          </div>

          {/* RIGHT COLUMN: PREDICTION RESULTS & SHAP WATERFALL (7 COLS) */}
          <div className="lg:col-span-7 p-5 space-y-4 bg-white overflow-y-auto">
            
            {!prediction && !isAnalyzing && (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mb-3 text-blue-600">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <div className="text-sm font-semibold text-slate-800 mb-1">
                  Awaiting Complaint Parameters
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  Select a test preset on the left or enter complaint parameters and click &ldquo;Execute Live ML Prediction&rdquo; to query the multi-class inference pipeline.
                </p>
              </div>
            )}

            {isAnalyzing && !prediction && (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="relative">
                  <div className="h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <Cpu className="h-4 w-4 text-blue-600 absolute inset-0 m-auto" />
                </div>
                <div className="text-sm font-semibold text-blue-600">
                  Analyzing Complaint via Multi-Class ML Pipeline
                </div>
                <div className="text-xs text-slate-500 space-y-1 font-mono">
                  <div>[1/4] Querying State Prediction Model...</div>
                  <div>[2/4] Classifying ATM Zone Subtype (Hierarchy Stages 1 & 2)...</div>
                  <div>[3/4] Estimating Critical Cash-out Window...</div>
                  <div>[4/4] Generating Shapley Feature Explanations...</div>
                  {isBlockchainAnchoringEnabled && anchoringStep > 0 && (
                    <div className="pt-2 border-t border-slate-200 text-emerald-600 font-semibold">
                      {anchoringStep === 1 && <div>1/3 Calculating SHA-256 Manifest Digest...</div>}
                      {anchoringStep === 2 && <div>2/3 Submitting EIP-712 Meta-Transaction to Polygon Amoy...</div>}
                      {anchoringStep === 3 && <div>3/3 Polygon Amoy Block Confirmed</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {prediction && (
              <div className="space-y-4">
                
                {/* 3-STEP BLOCKCHAIN MICRO-TELEMETRY TICKER */}
                {anchoringStep > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 border-b border-slate-200 pb-1.5">
                      <span className="flex items-center gap-1.5 text-blue-600">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        Polygon Amoy EIP-712 Gasless Anchoring // Section 63 BSA 2023
                      </span>
                      <span className="text-emerald-700 font-mono text-[11px]">Chain ID: 80002</span>
                    </div>

                    <div className="text-xs space-y-1">
                      {anchoringStep === 1 && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>1/3 Calculating SHA-256 Manifest Digest...</span>
                        </div>
                      )}
                      {anchoringStep === 2 && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>2/3 Submitting EIP-712 Meta-Transaction to Polygon Amoy...</span>
                        </div>
                      )}
                      {anchoringStep === 3 && anchoredProof && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-emerald-700">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-semibold text-xs">
                              3/3 Block #{anchoredProof.polygonBlockNumber} Confirmed — Tx: {anchoredProof.blockchainTxHash.substring(0, 14)}...
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-500">BSA Cert: {anchoredProof.bsa63CertificateId}</span>
                            <a
                              href={getPolygonScanTxUrl(anchoredProof.blockchainTxHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>PolygonScan</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* SUB-HEADER: TABS (Prediction vs SHAP) */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('prediction')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        activeTab === 'prediction'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      1. Prediction Results
                    </button>
                    <button
                      onClick={() => setActiveTab('shap')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        activeTab === 'shap'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>2. SHAP Explainability</span>
                    </button>
                  </div>

                  <div className="text-xs font-mono text-slate-500">
                    Latency: <strong className="text-blue-600 font-semibold">{prediction.processing_latency_ms.toFixed(1)}ms</strong>
                    {prediction.isFallback && <span className="ml-1 text-amber-600">(Fallback)</span>}
                  </div>
                </div>

                {/* TAB 1: PREDICTION RESULTS */}
                {activeTab === 'prediction' && (
                  <div className="space-y-3">
                    
                    {/* TOP STATS CARDS */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Primary Predicted State</span>
                        <span className="text-base font-bold text-slate-900">
                          {prediction.top_predicted_states[0]?.state || 'N/A'}
                        </span>
                        <div className="text-xs text-blue-600 font-semibold mt-0.5">
                          {((prediction.top_predicted_states[0]?.probability || 0) * 100).toFixed(1)}% Confidence
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Withdrawal Zone</span>
                        <span className="text-base font-bold text-slate-900">
                          {prediction.zone_prediction.predicted_zone}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {prediction.zone_prediction.hierarchy_stage}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Interdiction Window</span>
                        <span className="text-base font-bold text-amber-600">
                          {prediction.estimated_time_window_hours} Hours
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {prediction.time_urgency.split('(')[0]}
                        </div>
                      </div>
                    </div>

                    {/* TOP PREDICTED STATES PROGRESS BARS */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Top State Probability Distribution</span>
                        <span className="text-slate-400 font-mono text-[10px] lowercase">[model: state_predictor]</span>
                      </div>
                      <div className="space-y-2 pt-1">
                        {prediction.top_predicted_states.map((st) => (
                          <div key={st.rank} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-800 font-medium">
                                #{st.rank} {st.state}
                              </span>
                              <span className="text-blue-600 font-semibold font-mono">
                                {(st.probability * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${Math.max(4, st.probability * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RECOMMENDED LAW ENFORCEMENT ACTIONS */}
                    <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <span>Tactical Interdiction Protocols</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                        {prediction.recommended_actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    {/* ORIGIN DISTRICT RISK BANNER */}
                    {prediction.origin_district_risk && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-semibold block">Origin District Threat Score:</span>
                          <span className="text-slate-900 font-semibold">
                            {prediction.origin_district_risk.district}, {prediction.origin_district_risk.state}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-blue-600">
                            {prediction.origin_district_risk.risk_score} / 100
                          </span>
                          <span className="text-[10px] block text-rose-600 font-semibold uppercase">
                            {prediction.origin_district_risk.risk_tier} Risk
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* TAB 2: SHAP WATERFALL EXPLAINABILITY */}
                {activeTab === 'shap' && shap && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-xs font-semibold text-slate-900 uppercase flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span>Feature Attribution (Shapley Value Decomposition)</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {shap.summary}
                      </p>
                    </div>

                    {/* WATERFALL FACTORS */}
                    <div className="space-y-2">
                      {shap.topFactors.map((f, idx) => (
                        <div 
                          key={idx} 
                          className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                f.direction === 'positive' 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {f.direction === 'positive' ? `+${f.impactPercentage}%` : `-${f.impactPercentage}%`}
                              </span>
                              <span className="text-slate-900 font-medium">{f.feature}</span>
                            </div>
                            <span className="text-slate-500 text-xs font-mono">{f.value}</span>
                          </div>

                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${f.direction === 'positive' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, f.impactPercentage * 2.2)}%` }}
                            />
                          </div>

                          <p className="text-[11px] text-slate-500 pt-0.5">
                            {f.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOTTOM DISPATCH & BROADCAST ACTIONS */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDispatchToDossier}
                      disabled={savedSuccess}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{savedSuccess ? 'Dossier Dispatched & Anchored ✓' : 'Save & Dispatch to Case'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBroadcastAlert}
                      disabled={alertSuccess}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>{alertSuccess ? 'Broadcast Sent ✓' : 'Broadcast Alert'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendSmsAlert}
                      disabled={isSendingSms}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      title="Transmit immediate police SMS alert to field units via ADB hardware bridge"
                    >
                      <Radio className={`h-4 w-4 ${isSendingSms ? 'animate-spin' : 'animate-pulse'}`} />
                      <span>{isSendingSms ? 'Transmitting SMS...' : smsSuccess ? 'Police SMS Sent ✓' : 'Dispatch Police SMS'}</span>
                    </button>
                  </div>

                  {smsFeedback && (
                    <div className="w-full text-xs text-amber-800 font-mono flex items-center gap-1.5 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                      <Smartphone className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{smsFeedback}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors ml-auto"
                  >
                    Close Window
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
