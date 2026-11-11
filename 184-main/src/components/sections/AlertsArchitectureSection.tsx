'use client';

import React from 'react';
import Image from 'next/image';
import { Bell, Send, Database, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';

export default function AlertsArchitectureSection() {
  return (
    <section id="alerts-architecture" className="relative w-full bg-white text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            <span>Multi-Channel Dispatch</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Alert & Notification System
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Automated interdiction alert dispatcher broadcasting real-time signals across law enforcement, bank nodal officers, and field patrols.
          </p>
          
          <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 text-xs text-slate-700 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900">Operational Notice: </span>
              In standard simulation and development mode, the dispatch pipeline exercises complete payload generation, deduplication, and WebSocket broadcasting locally without outbound SMS billing.
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {/* 1. Event Trigger Pipeline */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="text-blue-600 text-sm font-bold">01 //</span>
              <span>Event Trigger & Dispatch Pipeline</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Trigger Thresholds
                </h4>
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-medium text-slate-700">High-risk district detected</span>
                    <span className="font-semibold text-slate-900">Risk score ≥ 0.85 (polled 60s)</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-medium text-slate-700">Live complaint prediction</span>
                    <span className="font-semibold text-slate-900">Confidence ≥ 0.80 + window &lt; 3h</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-medium text-slate-700">Risk score spike</span>
                    <span className="font-semibold text-slate-900">Jump ≥ 0.25 in single cycle</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">Manual officer escalation</span>
                    <span className="font-semibold text-blue-600">Immediate broadcast on action</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 shadow-2xs space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Execution Flow
                </h4>
                <pre className="text-xs font-mono text-slate-700 bg-white p-4 rounded-lg border border-slate-200 overflow-x-auto leading-relaxed shadow-2xs">
{`Complaint Submitted (NCRP)
  → /predict ML Pipeline 
    → Risk Engine Evaluates Urgency & Thresholds
      ↓
Alert Dispatcher (Next.js API Gateway)
├── SMS Channel (Twilio / Push Gateway)
├── Email Channel (Priority Briefing)
├── Dashboard Realtime WebSocket (Supabase)
└── Immutable Audit Ledger & Incident Log`}
                </pre>
              </div>
            </div>
          </div>

          {/* 2. Channel Architecture */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="text-blue-600 text-sm font-bold">02 //</span>
              <span>Dispatch Channels</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "SMS Priority Dispatch", targets: "Field Officers", desc: "Sent to registered district squad numbers with ATM ID and coordinates." },
                { title: "Financial Nodal Alert", targets: "Bank Liaisons", desc: "Structured alerts with IFSC, account number, and CFCFRMS freeze directives." },
                { title: "Executive Escalation", targets: "Senior Nodal Officers", desc: "SHAP feature attribution reports for I4C Central and State Cyber Cells." },
                { title: "Live Dashboard Push", targets: "Command Centers", desc: "Sub-2-second WebSocket broadcast to active tactical radar dashboards." },
              ].map((channel, i) => (
                <div key={i} className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 mb-2">
                      Target: {channel.targets}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">{channel.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{channel.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Priority Classification */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="text-blue-600 text-sm font-bold">03 //</span>
              <span>Alert Priority & Escalation Tiers</span>
            </h3>
            <div className="space-y-3">
              {[
                { level: "CRITICAL", criteria: "Risk ≥ 0.95 OR window < 1h", action: "All 4 channels immediately • Tactical siren & auto-escalation", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
                { level: "HIGH", criteria: "Risk ≥ 0.85 OR window < 3h", action: "SMS + Dashboard + Direct notice to senior district officers", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                { level: "MODERATE", criteria: "Risk ≥ 0.70", action: "Dashboard broadcast + Email briefing to branch contacts", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
                { level: "INFO", criteria: "Risk < 0.70", action: "Dashboard feed only (logged, low urgency, no external dispatch)", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
              ].map((p, i) => (
                <div key={i} className={`p-4 rounded-xl border ${p.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded bg-white shadow-2xs ${p.color}`}>{p.level}</span>
                    <span className="text-xs font-semibold text-slate-800">{p.criteria}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-600">{p.action}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
