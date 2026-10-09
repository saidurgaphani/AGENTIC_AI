'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ShieldAlert, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';

export function HeroIntroduction() {
  return (
    <section className="w-full pt-6 pb-20 px-6 lg:px-12 max-w-[1240px] mx-auto">
      {/* Editorial Category Tag */}
      <div className="flex items-center gap-3 mb-6">
        <span className="tag-mint">POC V1.0 · CANONICAL RUN</span>
        <span className="font-mono text-xs text-[#979797] uppercase">
          Autonomous Manufacturing Disruption Recovery
        </span>
      </div>

      {/* Split Hero: Massive Condensed Display Left, 3D Tactile Render Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column: 130px Display Headline */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <h1 className="font-display text-6xl sm:text-7xl lg:text-[112px] xl:text-[124px] text-[#000000] tracking-tighter leading-[0.88] uppercase mb-8">
              CRITICAL
              <br />
              SUPPLIER
              <br />
              RECOVERY
              <br />
              ORCHESTRATION
            </h1>

            <p className="font-body text-lg sm:text-xl text-[#444444] leading-relaxed max-w-xl mb-10">
              When a tier-one supplier shuts down for seven days, traditional MRP fails and single-echelon optimization lags. We combine specialized advisory agents with deterministic constraints and Google OR-Tools to deliver a feasible, planner-approved recovery plan in seconds.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#c6c6c6]">
            <Link
              href="/planner"
              className="btn-dark inline-flex items-center gap-3 text-base font-medium group"
            >
              <span>Launch Planner Workspace</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              href="/admin"
              className="btn-ghost inline-flex items-center gap-2 text-sm font-medium"
            >
              <Terminal className="w-4 h-4 text-[#444444]" />
              <span>Admin & Data Governance</span>
            </Link>

            <div className="ml-auto hidden xl:flex items-center gap-2 font-mono text-xs text-[#979797]">
              <span className="w-2 h-2 rounded-full bg-[#d1ffca] animate-pulse"></span>
              <span>OR-TOOLS SOLVER READY</span>
            </div>
          </div>
        </div>

        {/* Right Column: Tactile 3D Physical Object Render */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="relative w-full h-full min-h-[420px] rounded-[32px] overflow-hidden bg-[#ffffff] border border-[#c6c6c6]/50 p-3 flex flex-col justify-between">
            <div className="relative w-full flex-1 rounded-[24px] overflow-hidden bg-[#e5e5e5]">
              <Image
                src="/hero-render.jpg"
                alt="Tactile brutalist physical 3D model of modular supply chain nodes"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute top-4 left-4">
                <span className="tag-voltage">SAP / ORACLE / MES GROUNDED</span>
              </div>
            </div>

            {/* Micro Caption Card */}
            <div className="pt-3 px-2 flex justify-between items-center text-xs font-mono text-[#444444]">
              <span>NODE: ALPHA-AUSTIN PLANT</span>
              <span className="text-[#000000] font-semibold">HORIZON: 14 DAYS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Footnote Metrics Banner */}
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-standard border border-[#c6c6c6]/30 py-5 px-6">
          <span className="font-mono text-xs text-[#979797] uppercase block mb-1">Disruption Window</span>
          <span className="font-display text-4xl text-[#000000] block leading-none">7 DAYS</span>
          <span className="font-mono text-[11px] text-[#444444] mt-1 block">Full shutdown at SUP-01</span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/30 py-5 px-6">
          <span className="font-mono text-xs text-[#979797] uppercase block mb-1">Supply Network</span>
          <span className="font-display text-4xl text-[#000000] block leading-none">3 ECHELONS</span>
          <span className="font-mono text-[11px] text-[#444444] mt-1 block">Suppliers → Plants → Hubs</span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/30 py-5 px-6">
          <span className="font-mono text-xs text-[#979797] uppercase block mb-1">Recovery Fill Rate</span>
          <span className="font-display text-4xl text-[#000000] block leading-none">99.6%</span>
          <span className="font-mono text-[11px] text-[#000000] mt-1 block font-medium">vs 64.3% Unmitigated</span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/30 py-5 px-6">
          <span className="font-mono text-xs text-[#979797] uppercase block mb-1">Decision Latency</span>
          <span className="font-display text-4xl text-[#000000] block leading-none">1.67s</span>
          <span className="font-mono text-[11px] text-[#444444] mt-1 block">Agents + MILP validation</span>
        </div>
      </div>
    </section>
  );
}
