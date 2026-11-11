'use client';

import React from 'react';
import { content } from '@/data/content';
import Badge from '@/components/ui/Badge';
import { AlertCircle, Clock, ZapOff, TrendingUp } from 'lucide-react';

export default function ProblemSection() {
  const { problem } = content;

  const cardIcons = [
    <TrendingUp key="1" className="w-6 h-6 text-rose-600" />,
    <Clock key="2" className="w-6 h-6 text-amber-600" />,
    <ZapOff key="3" className="w-6 h-6 text-blue-600" />
  ];

  return (
    <section id="problem" className="relative w-full bg-slate-50 text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span>The Challenge We Are Solving</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {problem.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed border-l-2 border-rose-500 pl-4">
            {problem.mainParagraph}
          </p>
        </div>

        {/* 3 Problem Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {problem.cards.map((card, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    {cardIcons[idx] || <AlertCircle className="w-6 h-6 text-rose-600" />}
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                  {card.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {card.text}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">System Vulnerability</span>
                <span className="font-semibold text-rose-600">Critical Barrier</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
