'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { content } from '@/data/content';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import GlobeCanvas from '@/components/globe/GlobeCanvas';
import { Shield, Activity, ArrowRight, MapPin, Database, CheckCircle2 } from 'lucide-react';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.9 || 1)));
      setZoom(scrollProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-[90vh] w-full bg-gradient-to-b from-blue-50/40 via-white to-slate-50 text-slate-900 overflow-hidden pt-28 pb-16 lg:pb-20 border-b border-slate-200 flex flex-col justify-between"
    >
      {/* 3D WebGL Globe Viewport in background with clean opacity */}
      <div className="absolute inset-0 z-0 pointer-events-auto flex items-center justify-end overflow-hidden opacity-30 lg:opacity-40">
        <div className="relative w-full lg:w-1/2 h-full lg:translate-x-12">
          <GlobeCanvas zoom={zoom} />
        </div>
      </div>

      {/* Foreground Ambient Soft Gradient */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent w-full lg:w-3/5" />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Tagline & Status Pill */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Badge variant="blue" dot>
            Predictive Cybercrime Defence Platform
          </Badge>
          <span className="text-xs text-slate-500 font-medium">
            National Cybercrime Hotspot Forecasting
          </span>
        </div>

        {/* Stakeholder Trust Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 py-1.5 px-3 rounded-lg border border-slate-200 bg-white/90 backdrop-blur-sm max-w-fit shadow-xs">
          <span className="text-xs text-slate-500 font-medium pr-2 border-r border-slate-200">
            Supported Framework:
          </span>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5" title="Ministry of Home Affairs">
              <Image
                src="/logos/emblem_india.svg"
                alt="Ministry of Home Affairs"
                width={16}
                height={16}
                className="h-4 w-auto object-contain"
              />
              <span>MHA</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5" title="Indian Cyber Crime Coordination Centre">
              <Image
                src="/logos/i4c.png"
                alt="I4C"
                width={18}
                height={16}
                className="h-4 w-auto object-contain"
              />
              <span>I4C</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5" title="National Crime Records Bureau">
              <Image
                src="/logos/ncrb.png"
                alt="NCRB"
                width={16}
                height={16}
                className="h-4 w-auto object-contain"
              />
              <span>NCRB</span>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5" title="National Cyber Crime Reporting Portal (NCRP 1930)">
              <span className="text-blue-600 font-bold">NCRP 1930</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Predicting Cybercrime Cash Withdrawals{' '}
            <span className="text-blue-600 font-extrabold">Before They Happen</span>
          </h1>
        </div>

        {/* 12-Column Grid: Subtitle & CTA on Left, Featured Intel on Right */}
        <div className="mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sub-headline & Call-to-Actions (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed border-l-2 border-blue-600 pl-4">
              {content.hero.subHeadline}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button href="/dashboard" variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Launch Live Radar Dashboard
              </Button>
              
              <Button href="/benchmarks" variant="secondary" size="lg">
                View Model Predictions & Accuracy
              </Button>
            </div>

            {/* Live Indicator Feed */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>NCRP Complaint Feed: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span>ATM GIS Indexed: 2,48,000+ Kiosks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <span>964 Indian Districts Mapped</span>
              </div>
            </div>
          </div>

          {/* Right Featured Intel Card Widget (Right 5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Live Threat Telemetry
                  </span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Radar Active
                </span>
              </div>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                {content.hero.featuredIntel.items.map((intel, idx) => (
                  <div key={idx} className={idx > 0 ? "pt-3" : ""}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {intel.tag.replace('_', ' ')}
                      </span>
                      <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium hover:underline text-[11px] flex items-center gap-1">
                        <span>Investigate</span>
                        <span>→</span>
                      </Link>
                    </div>
                    <p className="text-slate-800 font-semibold leading-snug">
                      {intel.headline}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Sub-bar */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium gap-2">
        <span>Predictive Analytics & Interdiction Framework • MHA & I4C National Cyber Grid</span>
        <span className="text-slate-400">Scroll to explore architecture and capabilities ↓</span>
      </div>
    </section>
  );
}
