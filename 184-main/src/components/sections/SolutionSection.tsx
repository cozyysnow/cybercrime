'use client';

import React from 'react';
import { content } from '@/data/content';
import { ArrowRight, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export default function SolutionSection() {
  const { solution } = content;

  return (
    <section id="solution" className="relative w-full bg-white text-slate-900 py-16 lg:py-24 border-b border-slate-200 overflow-hidden">
      
      {/* Action Pipeline Steps Strip */}
      <div className="mb-12 border-y border-slate-100 bg-slate-50 py-3 overflow-x-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs font-semibold text-slate-600 min-w-max">
          {solution.marqueeItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                {item}
              </span>
              {idx < solution.marqueeItems.length - 1 && (
                <span className="text-slate-300">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Architectural Paradigm</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {solution.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed border-l-2 border-blue-600 pl-4">
            {solution.mainParagraph}
          </p>
        </div>

        {/* Paradigm Shift Comparison Card */}
        <div className="mt-12 bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Core Paradigm Shift:
              </span>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {solution.highlight}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              {/* Legacy Flow */}
              <div className="p-5 rounded-xl bg-white border border-rose-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-rose-700">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>Legacy Reactive Model</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-rose-50 text-rose-600 border border-rose-100">
                    2–6 Hours Delay
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 flex-wrap">
                  <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Crime</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Complaint</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Investigation</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">Funds Dissipated ✕</span>
                </div>
              </div>

              {/* CyberCast Proactive Flow */}
              <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>CyberCast Proactive Model</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800 font-bold border border-blue-200">
                    Real-Time Interception
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 flex-wrap">
                  <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Complaint Ingest</span>
                  <span className="text-blue-600">→</span>
                  <span className="px-2.5 py-1 rounded bg-white border border-blue-300 text-blue-700 font-bold shadow-2xs">ML Prediction</span>
                  <span className="text-blue-600">→</span>
                  <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Tactical Dispatch</span>
                  <span className="text-blue-600">→</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold shadow-2xs">Account Frozen ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
