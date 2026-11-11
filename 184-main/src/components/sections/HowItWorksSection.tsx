'use client';

import React from 'react';
import { content } from '@/data/content';
import { Clock, Shield, CheckCircle2 } from 'lucide-react';

export default function HowItWorksSection() {
  const { howItWorks } = content;

  return (
    <section id="how-it-works" className="relative w-full bg-white text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span>Operational Workflow</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {howItWorks.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Real-time NCRP ingestion flowing into multi-stage machine learning and automated tactical law enforcement dispatch.
          </p>
        </div>

        {/* 6 Steps Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {howItWorks.steps.map((step, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/70">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Phase {step.step}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    T+{idx * 30}s
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.text}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Step {idx + 1} of 6</span>
                <span className="font-semibold text-blue-600">Automated Pipeline</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
