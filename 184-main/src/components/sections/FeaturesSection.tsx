'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { content, FeatureItem } from '@/data/content';
import { Cpu, Map, Shield, Bell, ArrowRight } from 'lucide-react';

export default function FeaturesSection() {
  const { features } = content;
  const [activeFilter, setActiveFilter] = useState<'all' | 'analytics' | 'operations'>('all');

  const getIcon = (icon: FeatureItem['icon']) => {
    switch (icon) {
      case 'brain':
        return <Cpu className="h-6 w-6 text-blue-600" />;
      case 'map':
        return <Map className="h-6 w-6 text-blue-600" />;
      case 'shield':
        return <Shield className="h-6 w-6 text-blue-600" />;
      case 'bell':
        return <Bell className="h-6 w-6 text-blue-600" />;
      default:
        return <Cpu className="h-6 w-6 text-blue-600" />;
    }
  };

  const getTargetRoute = (idx: number) => {
    switch (idx) {
      case 0: return '/benchmarks';
      case 1: return '/dashboard';
      case 2: return '/collab';
      case 3: return '/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <section id="features" className="relative w-full bg-slate-50 text-slate-900 py-16 lg:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-slate-200">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span>Core Capabilities</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {features.sectionTitle}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              A synchronized intelligence stack bridging machine learning predictions with field interdiction.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Features
            </button>
            <button
              onClick={() => setActiveFilter('analytics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeFilter === 'analytics' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              AI & GIS Engine
            </button>
            <button
              onClick={() => setActiveFilter('operations')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeFilter === 'operations' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Ops & Response
            </button>
          </div>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.items.map((item, idx) => {
            if (activeFilter === 'analytics' && idx >= 2) return null;
            if (activeFilter === 'operations' && idx < 2) return null;

            return (
              <div
                key={item.id}
                className="p-8 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 group-hover:bg-blue-100/60 transition-colors">
                      {getIcon(item.icon)}
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      Module {item.id}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.text}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    Production Ready
                  </span>
                  <Link
                    href={getTargetRoute(idx)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <span>Explore Component</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
