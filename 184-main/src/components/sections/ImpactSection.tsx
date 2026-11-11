'use client';

import React from 'react';
import { content } from '@/data/content';
import { BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function ImpactSection() {
  const { impact } = content;

  return (
    <section id="impact" className="relative w-full bg-slate-50 text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Platform Telemetry & Impact</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {impact.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Measurable operational impact across India&apos;s financial cyber defence architecture.
          </p>
        </div>

        {/* 6 Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {impact.stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400">
                  Metric 0{idx + 1}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  {stat.number}
                </div>
                
                <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">
                  {stat.label}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>National Scope</span>
                <span className="font-semibold text-blue-600">Production Tier</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
