'use client';

import React from 'react';
import Image from 'next/image';
import { content } from '@/data/content';
import { Database, CheckCircle2 } from 'lucide-react';

const SOURCE_LOGOS: Record<string, { src: string; alt: string }> = {
  'National Crime Records Bureau (NCRB)': {
    src: '/logos/ncrb.png',
    alt: 'NCRB Logo',
  },
  'Reserve Bank of India (RBI)': {
    src: '/logos/rbi.svg',
    alt: 'Reserve Bank of India Seal',
  },
  'OpenStreetMap': {
    src: '/logos/osm.svg',
    alt: 'OpenStreetMap Logo',
  },
  'Sanchar Saathi (DoT)': {
    src: '/logos/sanchar_saathi.png',
    alt: 'Sanchar Saathi Logo',
  },
  'TRAI': {
    src: '/logos/trai.png',
    alt: 'TRAI Logo',
  },
  'CERT-In': {
    src: '/logos/cert_in.png',
    alt: 'CERT-In Logo',
  },
  'data.gov.in': {
    src: '/logos/data_gov.svg',
    alt: 'data.gov.in Open Data Logo',
  },
  'NewsAPI': {
    src: '/logos/newsapi.png',
    alt: 'NewsAPI Logo',
  },
  'Kaggle Fraud Datasets': {
    src: '/logos/kaggle.png',
    alt: 'Kaggle Logo',
  },
};

export default function DataSourcesSection() {
  const { dataSources } = content;

  return (
    <section id="data-sources" className="relative w-full bg-slate-50 text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Data Provenance & Corpus</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {dataSources.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed border-l-2 border-blue-600 pl-4">
            {dataSources.mainParagraph}
          </p>
        </div>

        {/* 9 Data Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataSources.sources.map((source, idx) => {
            const logoInfo = SOURCE_LOGOS[source.name];

            return (
              <div
                key={idx}
                className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400">
                      Feed 0{idx + 1}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active Ingestion
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    {logoInfo && (
                      <div className="relative h-10 w-10 flex-shrink-0 flex items-center justify-center p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <Image
                          src={logoInfo.src}
                          alt={logoInfo.alt}
                          width={32}
                          height={32}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {source.name}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {source.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Data Layer</span>
                  <span className="font-semibold text-blue-600">ETL Verified</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
