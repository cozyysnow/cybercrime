'use client';

import React from 'react';
import { content } from '@/data/content';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function ChallengesSection() {
  const { challenges } = content;

  return (
    <section id="challenges" className="relative w-full bg-white text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Production Engineering & Resilience</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {challenges.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Mitigating systemic friction, adversarial syndicate drift, and multi-jurisdictional operational latency.
          </p>
        </div>

        {/* 4 Challenge Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.cards.map((card) => (
            <div
              key={card.id}
              className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/70">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Resilience Vector 0{card.id}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Production Mitigation
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {card.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {card.text}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Resolution Status</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Architected & Verified
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
