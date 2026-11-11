'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  OFFICER_ROLES, 
  OfficerRole, 
  OfficerProfile,
  CASES_DATA,
  CaseEntity,
  AUDIT_LOGS_DATA,
  AuditLogEntry
} from '@/data/collabData';
import CollabHeader from '@/components/collab/CollabHeader';
import CaseManagementModule from '@/components/collab/CaseManagementModule';
import CommunicationModule from '@/components/collab/CommunicationModule';
import IntelligenceReportsModule from '@/components/collab/IntelligenceReportsModule';
import EvidenceModule from '@/components/collab/EvidenceModule';
import TaskManagementModule from '@/components/collab/TaskManagementModule';
import SearchAndAuditModule from '@/components/collab/SearchAndAuditModule';
import AuthModal from '@/components/collab/AuthModal';
import { 
  Briefcase, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  CheckSquare, 
  Search, 
  Clock, 
  Shield, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export default function CollabPage() {
  const [currentRole, setCurrentRole] = useState<OfficerRole>('i4c_admin');
  const [activeTab, setActiveTab] = useState<
    'cases' | 'comms' | 'intel' | 'evidence' | 'tasks' | 'nexus_audit'
  >('cases');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Cross-module selected case
  const [directSelectedCaseId, setDirectSelectedCaseId] = useState<string | null>(null);

  // Dynamic Audit logs state to capture in-session actions
  const [inSessionAuditLogs, setInSessionAuditLogs] = useState<AuditLogEntry[]>(AUDIT_LOGS_DATA);

  const currentOfficer: OfficerProfile = OFFICER_ROLES[currentRole];

  // Helper to log user interactions to the immutable audit trail
  const handleAuditLog = (action: string, entityId: string, entityType: string) => {
    const newLog: AuditLogEntry = {
      id: `AUD-${Math.floor(90200 + inSessionAuditLogs.length)}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
      officerName: currentOfficer.name,
      officerId: currentOfficer.id,
      role: currentOfficer.roleName,
      action: action,
      entityType: entityType as any,
      entityId: entityId,
      ipAddress: '10.24.110.19',
      deviceInfo: `${currentOfficer.rank} Console (Secured Terminal)`,
      integrityHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: 'VERIFIED',
    };
    setInSessionAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleRoleChange = (newRole: OfficerRole) => {
    setCurrentRole(newRole);
    handleAuditLog(`SWITCHED_OPERATIONAL_ROLE_TO_${newRole.toUpperCase()}`, newRole, 'LOGIN');
  };

  const handleSelectCaseFromSearch = (caseId: string) => {
    setDirectSelectedCaseId(caseId);
    setActiveTab('cases');
  };

  const navTabs = [
    {
      id: 'cases',
      label: 'Case Management & Dossiers',
      sublabel: '6-Tab Master Dossier',
      icon: <Briefcase className="w-4 h-4" />,
      badge: '8 Active',
    },
    {
      id: 'comms',
      label: 'Inter-State Collaboration',
      sublabel: '15+ Indian Languages Chat',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: '3 Live',
    },
    {
      id: 'intel',
      label: 'AI Intelligence & SITREP',
      sublabel: 'Bilingual Daily Bulletins',
      icon: <FileText className="w-4 h-4" />,
      badge: 'New',
    },
    {
      id: 'evidence',
      label: 'Digital Evidence Locker',
      sublabel: 'Polygon Amoy & BSA Sec 63',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: 'BSA Sec 63',
    },
    {
      id: 'tasks',
      label: 'Field Task Coordination',
      sublabel: '4h SLA Escalation Protocol',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: '5 Orders',
    },
    {
      id: 'nexus_audit',
      label: 'Nexus Search & Audit Trail',
      sublabel: 'Pan-India AI Graph & Logs',
      icon: <Search className="w-4 h-4" />,
      badge: 'Certified',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Law Enforcement Command Bar */}
      <CollabHeader
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onLoginClick={() => setShowAuthModal(true)}
      />

      {/* Role Banner / Context Strip */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
              <Shield className="w-4 h-4" />
              Authenticated As:
            </span>
            <span className="font-bold text-slate-900">{currentOfficer.name}</span>
            <span className="text-slate-500">[{currentOfficer.rank}]</span>
            <span className="text-slate-300 hidden lg:inline">•</span>
            <span className="text-slate-600 hidden lg:inline">{currentOfficer.department}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-semibold">I4C Secure Node: Online</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>Jurisdiction: <span className="text-slate-800 font-medium">{currentOfficer.state}</span></span>
            <span className="text-slate-300">•</span>
            <span>Active Cases: <span className="text-blue-700 font-bold">{currentOfficer.assignedCasesCount}</span></span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Module Navigation Tabs */}
        <div className="border border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`p-3.5 text-left transition-all rounded-xl border flex flex-col justify-between relative cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={isActive ? 'text-white' : 'text-blue-600'}>
                      {tab.icon}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </div>

                  <div>
                    <div
                      className={`text-xs font-semibold leading-snug ${
                        isActive ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {tab.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Module Views */}
        <div className="transition-all duration-200">
          {activeTab === 'cases' && (
            <CaseManagementModule
              currentOfficer={currentOfficer}
              onOpenCaseChat={(caseId) => setActiveTab('comms')}
              onAuditLog={handleAuditLog}
            />
          )}

          {activeTab === 'comms' && (
            <CommunicationModule
              currentOfficer={currentOfficer}
              onAuditLog={handleAuditLog}
            />
          )}

          {activeTab === 'intel' && (
            <IntelligenceReportsModule
              currentOfficer={currentOfficer}
              onAuditLog={handleAuditLog}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceModule
              currentOfficer={currentOfficer}
              onAuditLog={handleAuditLog}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskManagementModule
              currentOfficer={currentOfficer}
              onAuditLog={handleAuditLog}
            />
          )}

          {activeTab === 'nexus_audit' && (
            <SearchAndAuditModule
              currentOfficer={currentOfficer}
              onSelectCase={handleSelectCaseFromSearch}
              onAuditLog={handleAuditLog}
            />
          )}
        </div>
      </main>

      {/* Institutional Legal Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 md:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-blue-700 font-semibold">CyberCast National Command Portal</span>
            <span>•</span>
            <span>Ministry of Home Affairs, Govt of India</span>
            <span>•</span>
            <span>Indian Cyber Crime Coordination Centre (I4C)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span>BSA Section 63 Compliant</span>
            <span>•</span>
            <span>CFCFRMS Gateway Integrated</span>
            <span>•</span>
            <span>Tamper-Evident Audit Trail</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(role) => setCurrentRole(role)}
        currentRole={currentRole}
      />
    </div>
  );
}
