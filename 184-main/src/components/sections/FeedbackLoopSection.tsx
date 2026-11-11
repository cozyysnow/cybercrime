'use client';

import React from 'react';
import { content } from '@/data/content';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export default function FeedbackLoopSection() {
  const { feedbackLoop } = content;

  return (
    <section id="feedback-loop" className="relative w-full bg-slate-50 text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Closed-Loop Active Learning</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {feedbackLoop.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed border-l-2 border-blue-600 pl-4">
            {feedbackLoop.mainParagraph}
          </p>
        </div>

        {/* Closed-Loop Diagram Container */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Continuous Retraining & Drift Recalibration Loop
              </span>
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              Active Feedback Loop
            </div>
          </div>

          {/* Flow Strip */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 overflow-x-auto whitespace-nowrap">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pipeline Flow Sequence:
            </div>
            <p className="text-blue-700 font-bold">
              {feedbackLoop.visualText}
            </p>
          </div>

          {/* 7-Step Circular / Sequential Node Visualizer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {feedbackLoop.cycleSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400">NODE</span>
                  <span className="text-xs font-extrabold text-blue-600">{step.number}</span>
                </div>

                <div className="text-xs font-bold text-slate-900 my-2">
                  {step.label}
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Step {idx + 1}</span>
                  <span className="text-blue-600 font-bold">→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Telemetry Status Bar */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>Batch Retraining: Continuous Cadence</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span>Recalibration Drift Tolerance: &lt; 0.05%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>Field Outcome Reinforcement: Verified</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
