'use client';

import React from 'react';
import Image from 'next/image';
import { content } from '@/data/content';
import { Network, ShieldCheck } from 'lucide-react';

export default function EcosystemSection() {
  const { ecosystem } = content;

  const stakeholderLogos: Record<string, { src: string; alt: string }> = {
    '01': { src: '/logos/i4c.png', alt: 'I4C Command Center' },
    '02': { src: '/logos/emblem_india.svg', alt: 'State Police Cyber Cell' },
    '03': { src: '/logos/emblem_india.svg', alt: 'District Cyber Unit' },
    '04': { src: '/logos/rbi.svg', alt: 'Reserve Bank of India & Financial Institutions' },
  };

  return (
    <section id="ecosystem" className="relative w-full bg-white text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <span>Inter-Agency Collaboration</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {ecosystem.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed border-l-2 border-blue-600 pl-4">
            {ecosystem.mainParagraph}
          </p>
        </div>

        {/* 4 Stakeholder Cards Grid with Logos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ecosystem.cards.map((card) => {
            const logo = stakeholderLogos[card.id];
            return (
              <div
                key={card.id}
                className="p-6 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/70">
                    <span className="text-xs font-bold text-slate-400">
                      Tier {card.id}
                    </span>
                    {logo && (
                      <div className="relative h-9 w-9 flex items-center justify-center p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <Image
                          src={logo.src}
                          alt={logo.alt}
                          width={32}
                          height={32}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {card.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {card.text}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Stakeholder Node</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Synchronized
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
