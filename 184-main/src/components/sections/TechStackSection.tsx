'use client';

import React from 'react';
import { content } from '@/data/content';
import { Layers, CheckCircle2 } from 'lucide-react';

export default function TechStackSection() {
  const { techStack } = content;

  return (
    <section id="tech-stack" className="relative w-full bg-slate-50 text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Architecture & Framework</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {techStack.sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Full-stack enterprise integration architecture engineered for nationwide scale and real-time processing.
          </p>
        </div>

        {/* 6 Architecture Layers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.layers.map((layer, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Layer 0{idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Production Component
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {layer.layer}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {layer.description}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100">
                  {layer.technologies.map((tech, techIdx) => (
                    <span
                      key={techIdx}
                      className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
