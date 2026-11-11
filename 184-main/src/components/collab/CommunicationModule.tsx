'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, Send, Languages, Mic, Paperclip, 
  MapPin, Shield, CheckCheck, Users, Radio, AlertTriangle, 
  CornerDownRight, Volume2, Globe, Clock, ChevronDown, 
  FileText, ArrowRight, Share2, Check, X
} from 'lucide-react';
import { 
  OfficerRole, OFFICER_ROLES, OfficerProfile, CHAT_CHANNELS, CHAT_MESSAGES, 
  ChatMessage, INDIAN_LANGUAGES 
} from '@/data/collabData';
import { sendAdbSms } from '@/lib/hardwareService';

interface CommunicationModuleProps {
  currentRole?: OfficerRole;
  currentOfficer?: OfficerProfile;
  activeCaseId?: string | null;
  onAuditLog?: (action: string, entityId: string, entityType: string) => void;
}

export default function CommunicationModule({
  currentRole: propRole,
  currentOfficer,
  activeCaseId,
  onAuditLog,
}: CommunicationModuleProps) {
  const currentRole = propRole || currentOfficer?.role || 'i4c_admin';
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    activeCaseId ? `case-${activeCaseId.split('-')[2] || '44521'}` : 'case-44521'
  );
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(CHAT_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [autoTranslateMode, setAutoTranslateMode] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState<string>('hi');
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  // Quick message template open state
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Inter-State Action Modals
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [jointModalOpen, setJointModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Form states for modals
  const [helpDetails, setHelpDetails] = useState({ targetState: 'Haryana', atmLocation: 'Tauru Chowk ATM', reason: 'Urgent CCTV DVR retrieval' });
  const [transferDetails, setTransferDetails] = useState({ targetState: 'Rajasthan', reason: 'Victim FIR originating in Mumbai, cash withdrawal transit confirmed in Jaipur' });

  // Quick Templates List
  const QUICK_TEMPLATES = [
    'Requesting immediate backup at [Sindhi Camp ATM Terminal]',
    'Suspect spotted at ATM wearing black hoodie, proceeding to detain',
    'CFCFRMS Account freeze confirmed for beneficiary [SBI-XXXX-4491]',
    'Funds successfully intercepted and recovered: ₹[2,65,000]',
    'False alert, area verified clear by field patrol squad',
    'Requesting inter-state CDR & tower dump analysis for case CY-44521',
  ];

  const activeOfficer = OFFICER_ROLES[currentRole];
  const currentMessages = messages[selectedChannelId] || [];

  // Toggle showing original vs translated text
  const toggleShowOriginal = (msgId: string) => {
    setShowOriginalMap(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Send Message
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    // Simulate AI Auto-Translation for outgoing message
    let simulatedTrans = '';
    let simLang = 'Hindi';
    if (activeOfficer.preferredLanguage === 'English') {
      simulatedTrans = `[AI Auto-Translated to Hindi]: ${text}`;
      simLang = 'Hindi';
    } else {
      simulatedTrans = `[AI Auto-Translated to English]: ${text}`;
      simLang = 'English';
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: activeOfficer.id,
      senderName: activeOfficer.name,
      senderRank: activeOfficer.rank,
      senderState: activeOfficer.state,
      channelId: selectedChannelId,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      originalText: text,
      originalLanguage: activeOfficer.preferredLanguage,
      translatedText: simulatedTrans,
      translatedLanguage: simLang,
      translationConfidence: 97,
      type: 'text',
      reactions: [],
    };

    setMessages(prev => ({
      ...prev,
      [selectedChannelId]: [...(prev[selectedChannelId] || []), newMsg],
    }));

    setInputMessage('');
    setTemplatesOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans text-slate-900 bg-slate-50 select-none">
      
      {/* 1. TOP SECURE COMMUNICATION BAR */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              Inter-State Encrypted Collaboration & Multi-Language Bridge
              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                E2E Encrypted
              </span>
            </h2>
            <div className="text-xs text-slate-500">
              Live AI Translation supporting 15+ Indian Languages for Cross-State Police Coordination
            </div>
          </div>
        </div>

        {/* Translation Mode Controls */}
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-slate-600 font-semibold uppercase">Auto-Translate:</span>
            <button
              onClick={() => setAutoTranslateMode(!autoTranslateMode)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                autoTranslateMode 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {autoTranslateMode ? 'Active' : 'Off'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">Target:</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-white border border-slate-200 px-2 py-1 text-xs text-blue-700 font-semibold focus:outline-none rounded-lg"
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* 2. MAIN 2-PANEL CHAT LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: CHANNELS & INTER-STATE TOOLS */}
        <div className="w-72 sm:w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
          
          <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Coordination Channels
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {CHAT_CHANNELS.map((ch) => {
              const isSelected = ch.id === selectedChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-2 shadow-sm ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 truncate">
                    {ch.type === 'case' ? <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" /> :
                     ch.type === 'group' ? <Users className="h-4 w-4 text-sky-600 mt-0.5 flex-shrink-0" /> :
                     ch.type === 'broadcast' ? <Radio className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" /> :
                     <Shield className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />}
                    <div className="truncate">
                      <div className="font-semibold truncate text-xs text-slate-900">{ch.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {ch.stateTags.map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {ch.unread > 0 && (
                    <span className="h-5 w-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {ch.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* INTER-STATE COLLAB WORKFLOW BUTTONS */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
              Inter-State Directives
            </div>
            <button
              onClick={() => setTransferModalOpen(true)}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold text-left px-3 rounded-lg flex items-center justify-between shadow-sm transition-colors"
            >
              <span>Inter-State Case Transfer</span>
              <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
            </button>
            <button
              onClick={() => setJointModalOpen(true)}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold text-left px-3 rounded-lg flex items-center justify-between shadow-sm transition-colors"
            >
              <span>Create Joint Task Force</span>
              <Users className="h-3.5 w-3.5 text-sky-600" />
            </button>
            <button
              onClick={() => setHelpModalOpen(true)}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold text-left px-3 rounded-lg flex items-center justify-between shadow-sm transition-colors"
            >
              <span>Formal Help Request (4h SLA)</span>
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            </button>
          </div>

        </div>

        {/* RIGHT PANEL: CHAT THREAD & MULTI-LANGUAGE TRANSLATION DISPLAY */}
        <div className="flex-1 flex flex-col bg-slate-50/40">
          
          {/* Active Chat Header */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />
              <span className="text-xs font-semibold text-slate-900">
                {CHAT_CHANNELS.find(c => c.id === selectedChannelId)?.name}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>Active Participants: <strong className="text-slate-800">5 Units</strong></span>
              <span className="text-slate-300">|</span>
              <span className="text-blue-600 font-semibold">Translation Confidence: 96%</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {currentMessages.map((msg) => {
              const isMe = msg.senderId === activeOfficer.id;
              const isOriginalExpanded = showOriginalMap[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-2xl ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  {/* Sender Metadata Bar */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 px-1">
                    <strong className="text-slate-800 font-semibold">{msg.senderName}</strong>
                    <span>• {msg.senderRank} ({msg.senderState})</span>
                    <span>• {msg.timestamp}</span>
                    {msg.isPinned && (
                      <span className="text-blue-700 text-[10px] bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-4 rounded-2xl space-y-2 text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}>
                    
                    {/* BILINGUAL TRANSLATION ENGINE CARD */}
                    {msg.translatedText && autoTranslateMode ? (
                      <div className="space-y-2">
                        
                        {/* Primary Translated View */}
                        <div className={`font-normal ${isMe ? 'text-white' : 'text-slate-900'}`}>
                          {msg.translatedText}
                        </div>

                        {/* Translation Metadata Bar */}
                        <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                          isMe ? 'border-blue-500/50 text-blue-100' : 'border-slate-100 text-slate-500'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              🇮🇳 {msg.originalLanguage} → {msg.translatedLanguage || 'Target'}
                            </span>
                            <span>Conf: {msg.translationConfidence}%</span>
                          </div>

                          <button
                            onClick={() => toggleShowOriginal(msg.id)}
                            className={`underline text-xs ${isMe ? 'text-white hover:text-blue-100' : 'text-blue-600 hover:text-blue-700'}`}
                          >
                            {isOriginalExpanded ? 'Hide Original' : 'View Original'}
                          </button>
                        </div>

                        {/* Collapsed/Expanded Original Regional Text */}
                        {isOriginalExpanded && (
                          <div className={`p-2.5 rounded-lg text-xs font-sans mt-1.5 ${
                            isMe ? 'bg-blue-700/60 text-blue-50' : 'bg-slate-50 border border-slate-200 text-slate-700'
                          }`}>
                            <span className="text-[10px] block uppercase font-semibold mb-0.5 opacity-80">
                              Original Unaltered Transcript:
                            </span>
                            {msg.originalText}
                          </div>
                        )}

                      </div>
                    ) : (
                      /* Plain text without translation */
                      <div>{msg.originalText}</div>
                    )}

                    {/* Voice Message Player UI (If voice message) */}
                    {msg.type === 'voice' && (
                      <div className={`p-3 rounded-xl space-y-1.5 mt-2 ${
                        isMe ? 'bg-blue-700/60' : 'bg-slate-50 border border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <button className={`p-2 rounded-lg ${isMe ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                            <Volume2 className="h-4 w-4" />
                          </button>
                          <div className="flex-1 flex items-center gap-1 h-5">
                            {[40, 70, 90, 60, 80, 100, 50, 65, 85, 45, 95, 30].map((h, i) => (
                              <div key={i} className={`flex-1 rounded-full ${isMe ? 'bg-white/80' : 'bg-blue-600'}`} style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <span className={`text-xs ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>{msg.voiceDuration || '0:30'}</span>
                        </div>
                        {msg.voiceTranscript && (
                          <div className={`text-xs border-t pt-1 ${isMe ? 'border-blue-500/40 text-blue-100' : 'border-slate-200 text-slate-600'}`}>
                            Voice STT: <span>{msg.voiceTranscript}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {msg.reactions.map((r, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                              isMe ? 'bg-blue-700 text-white' : 'bg-slate-100 border border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[10px] font-semibold">{r.count}</span>
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>

          {/* Chat Input & Action Bar */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-2.5">
            
            {/* Quick Templates Drawer */}
            {templatesOpen && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs shadow-sm">
                <div className="text-[11px] text-blue-700 font-semibold uppercase tracking-wider mb-1">
                  Select Rapid Intervention Template:
                </div>
                {QUICK_TEMPLATES.map((tmpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(tmpl)}
                    className="w-full text-left p-2 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-xs text-slate-700 transition-colors shadow-sm"
                  >
                    • {tmpl}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTemplatesOpen(!templatesOpen)}
                className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg whitespace-nowrap shadow-sm transition-colors"
                title="Quick Police Response Templates"
              >
                Templates
              </button>

              <button
                onClick={() => alert('GPS Location shared: 26.9196° N, 75.7942° E (Sindhi Camp ATM Terminal)')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 rounded-lg shadow-sm transition-colors"
                title="Share Live Officer GPS Location"
              >
                <MapPin className="h-4 w-4" />
              </button>

              <button
                onClick={() => alert('Simulated microphone recording: Audio captured and transcribed via regional STT.')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 rounded-lg shadow-sm transition-colors"
                title="Voice Memo Recording & Transcription"
              >
                <Mic className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Type message in any Indian language (Auto-Translates to recipient's language)...`}
                className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg"
              />

              <button
                onClick={() => handleSendMessage()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>AI Translation disclaimer: Verify all evidentiary statements for statutory legal compliance.</span>
              <span>Supported: HI, EN, TA, TE, KN, ML, BN, MR, GU, PA, OR, UR, AS, RAJ, BHO</span>
            </div>

          </div>

        </div>

      </div>

      {/* 3. INTER-STATE CASE TRANSFER MODAL */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm select-none font-sans text-slate-900 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              Initiate Inter-State Case Transfer
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Transfer case jurisdiction when primary cash withdrawal nexus originates in another state.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Receiving State Cyber Cell:</label>
                <select
                  value={transferDetails.targetState}
                  onChange={(e) => setTransferDetails({ ...transferDetails, targetState: e.target.value })}
                  className="w-full bg-white border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="Rajasthan">Rajasthan (State Cyber Cell, Jaipur)</option>
                  <option value="Haryana">Haryana (Cyber Crime Cell, Gurugram)</option>
                  <option value="Delhi">Delhi (IFSO / Special Cell)</option>
                  <option value="Jharkhand">Jharkhand (State CID Cyber, Ranchi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Statutory Justification:</label>
                <textarea
                  rows={3}
                  value={transferDetails.reason}
                  onChange={(e) => setTransferDetails({ ...transferDetails, reason: e.target.value })}
                  className="w-full bg-white border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    sendAdbSms({
                      phone: '+919829041209',
                      message: `[CYBERCAST CASE TRANSFER DIRECTIVE] Inter-State Case Transfer dispatched to ${transferDetails.targetState} Nodal Officer. Justification: ${transferDetails.reason}. Evidence chain attached.`,
                      priority: 'FLASH_P1',
                      officerName: `${transferDetails.targetState} Nodal Officer`,
                      caseId: selectedChannelId,
                    }).catch(() => {});
                    alert(`Inter-State Transfer request dispatched to ${transferDetails.targetState} Nodal Officer with full evidentiary chain & SMS sent!`);
                    setTransferModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
                >
                  Dispatch Transfer Dossier →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FORMAL HELP REQUEST (4H SLA) MODAL */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm select-none font-sans text-slate-900 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Formal Help Request (4-Hour SLA)
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Formal mutual assistance dispatch requiring neighboring cyber cells to respond within 4 hours before escalating to I4C Joint Director.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Jurisdiction:</label>
                <input
                  type="text"
                  value={helpDetails.targetState}
                  onChange={(e) => setHelpDetails({ ...helpDetails, targetState: e.target.value })}
                  className="w-full bg-white border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Required Ground Operation:</label>
                <input
                  type="text"
                  value={helpDetails.reason}
                  onChange={(e) => setHelpDetails({ ...helpDetails, reason: e.target.value })}
                  className="w-full bg-white border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setHelpModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const ticketId = `SLA-${Date.now().toString().slice(-4)}`;
                    sendAdbSms({
                      phone: '+919829041209',
                      message: `[CYBERCAST 4H SLA MANDATE] Formal Mutual Assistance Request (${ticketId}) for ${helpDetails.targetState}: ${helpDetails.reason}. Inter-State SLA: 4 Hours. Authorized by I4C Command.`,
                      priority: 'FLASH_P1',
                      officerName: `${helpDetails.targetState} Ground Unit`,
                      caseId: ticketId,
                    }).catch(() => {});
                    alert(`Formal Help Request logged with Ticket #${ticketId}. 4-hour countdown initiated & SMS directive dispatched!`);
                    setHelpModalOpen(false);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
                >
                  Transmit Mandate →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE JOINT TASK FORCE MODAL */}
      {jointModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm select-none font-sans text-slate-900 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <div className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" />
              Convene Multi-State Joint Task Force
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Establish a unified operational room uniting cyber crime cells across multiple state borders for coordinated syndicate takedowns.
            </p>

            <div className="space-y-2 text-xs mb-4">
              <div className="text-xs text-slate-700 font-semibold">Participating State Cyber Units:</div>
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  <span>Rajasthan Cyber Crime Police (Jaipur HQ)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  <span>Haryana Cyber Unit (Mewat / Gurugram)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  <span>Uttar Pradesh Cyber Police (Lucknow HQ)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  <span>Maharashtra Crime Branch (Mumbai)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setJointModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Task Force "Operation Dark Corridor" convened! Joint workspace and encrypted channel activated.`);
                  setJointModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
              >
                Activate Task Force →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
