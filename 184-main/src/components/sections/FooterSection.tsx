'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { content } from '@/data/content';
import { Shield, ArrowRight, ExternalLink } from 'lucide-react';

export default function FooterSection() {
  const { footer } = content;

  return (
    <footer id="footer" className="relative w-full bg-white text-slate-600 border-t border-slate-200">
      
      {/* Modern SaaS CTA Banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-4">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 sm:p-12 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-3xl space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
              National Cyber Defense Platform
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              {footer.closingStatement}
            </h2>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              Equipping Indian law enforcement and banking liaison officers with actionable predictive geospatial intelligence.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-white text-blue-700 font-bold text-sm shadow hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/benchmarks"
              className="px-5 py-3 rounded-lg bg-blue-700/80 hover:bg-blue-800 text-white font-semibold text-sm transition-colors border border-white/20"
            >
              View Predictions
            </Link>
          </div>
        </div>
      </div>

      {/* Institutional Trust Logo Strip */}
      <div className="border-y border-slate-200 bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 my-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Institutional Inter-Agency Coordination & Law Enforcement Network
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {/* MHA Emblem */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Image
                src="/logos/emblem_india.svg"
                alt="Government of India Emblem"
                width={16}
                height={20}
                className="h-5 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-900 font-bold leading-none">MHA</span>
                <span className="text-[9px] text-slate-500">Govt of India</span>
              </div>
            </div>

            {/* I4C Logo */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Image
                src="/logos/i4c.png"
                alt="I4C Logo"
                width={28}
                height={20}
                className="h-5 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-900 font-bold leading-none">I4C</span>
                <span className="text-[9px] text-slate-500">Cyber Crime Center</span>
              </div>
            </div>

            {/* NCRB Logo */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Image
                src="/logos/ncrb.png"
                alt="National Crime Records Bureau Logo"
                width={20}
                height={20}
                className="h-5 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-900 font-bold leading-none">NCRB</span>
                <span className="text-[9px] text-slate-500">Crime Telemetry</span>
              </div>
            </div>

            {/* CERT-In Logo */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Image
                src="/logos/cert_in.png"
                alt="CERT-In Logo"
                width={24}
                height={20}
                className="h-5 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-900 font-bold leading-none">CERT-In</span>
                <span className="text-[9px] text-slate-500">Cyber Emergency</span>
              </div>
            </div>

            {/* RBI Liaison */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Image
                src="/logos/rbi.png"
                alt="Reserve Bank of India Logo"
                width={20}
                height={20}
                className="h-5 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-900 font-bold leading-none">RBI</span>
                <span className="text-[9px] text-slate-500">Banking Liaison</span>
              </div>
            </div>

            {/* Sanchar Saathi */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <Image
                src="/logos/sanchar_saathi.png"
                alt="Sanchar Saathi DoT Logo"
                width={24}
                height={20}
                className="h-5 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-900 font-bold leading-none">DoT</span>
                <span className="text-[9px] text-slate-500">Sanchar Saathi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-200">
          
          {/* Brand & Mission (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 overflow-hidden">
                <Image
                  src="/logos/cybercast.png"
                  alt="CyberCast Logo"
                  width={28}
                  height={28}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-lg font-bold text-slate-900">
                Cyber<span className="text-blue-600">Cast</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              National predictive analytics & tactical interdiction platform forecasting cybercrime ATM cash withdrawals in real-time for law enforcement agencies and financial institutions across 964 police districts.
            </p>

            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>All Predictive Subsystems Operational</span>
              </div>
              <div>Security Protocol: Tamper-Evident Electronic Evidence (Section 63 BSA 2023)</div>
            </div>
          </div>

          {/* Project Details (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
              Statutory Architecture & Specifications
            </div>
            
            <div className="space-y-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Genesis / Context:</span>
                <span className="text-slate-800 font-medium">{footer.projectDetails.event}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Core Operational Objective:</span>
                <span className="text-slate-800 font-semibold">{footer.projectDetails.problemStatement}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Governing Authority:</span>
                <span className="text-slate-800 font-medium">{footer.projectDetails.organization} — {footer.projectDetails.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Evidentiary Standard & Integration:</span>
                <span className="text-slate-800 font-medium">{footer.projectDetails.categoryTheme}</span>
              </div>
            </div>
          </div>

          {/* Operational Hierarchy (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
              Operational Command Structure
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Division:</span>
                <span className="text-sm font-bold text-slate-900">{footer.teamSection.teamName}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Central Command:</span>
                <span className="text-slate-800 font-medium">{footer.teamSection.college}</span>
              </div>

              <div className="pt-1">
                <span className="text-slate-400 block mb-1.5">Command Entities:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {footer.teamSection.memberList.map((member, idx) => (
                    <div key={idx} className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700">
                      {member.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 CyberCast — National Cybercrime Predictive Analytics Platform • Ministry of Home Affairs & Indian Cyber Crime Coordination Centre (I4C). All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Radar Dashboard
            </Link>
            <Link href="/benchmarks" className="hover:text-blue-600 transition-colors">
              Model Predictions
            </Link>
            <Link href="/collab" className="hover:text-blue-600 transition-colors">
              Inter-State Collab
            </Link>
            <Link href="/verify" className="hover:text-blue-600 transition-colors">
              Evidence Ledger
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
