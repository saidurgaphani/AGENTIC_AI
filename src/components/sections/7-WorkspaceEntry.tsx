'use client';

import Link from 'next/link';
import { ArrowUpRight, Activity, Database, CheckCircle, ShieldCheck, Cpu } from 'lucide-react';

export function WorkspaceEntry() {
  return (
    <section className="w-full py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-[#c6c6c6]">
      <div className="flex items-center gap-3 mb-4">
        <span className="tag-mint">OPERATIONAL INTERFACES</span>
        <span className="font-mono text-xs text-[#979797]">DIRECT ACCESS · ZERO FRICTION</span>
      </div>

      <div className="mb-12">
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#000000] leading-none uppercase">
          CHOOSE YOUR WORKSPACE
        </h2>
        <p className="font-body text-base sm:text-lg text-[#444444] max-w-2xl mt-4">
          Access the real-time operational consoles. Run what-if simulations, inspect agent proposal citations, or manage benchmark dataset governance.
        </p>
      </div>

      {/* Two High-Impact Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Planner Console Card (Inverted Black Surface) */}
        <div className="card-inverted p-8 lg:p-10 flex flex-col justify-between rounded-[32px] group relative overflow-hidden">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="tag-mint font-bold">PRIMARY WORKSPACE</span>
              <Activity className="w-6 h-6 text-[#d1ffca]" />
            </div>

            <h3 className="font-display text-4xl lg:text-5xl text-[#ffffff] uppercase leading-none mb-4">
              Planner Decision Console
            </h3>

            <p className="font-body text-sm sm:text-base text-[#c6c6c6] leading-relaxed mb-8">
              Interactive scenario configuration, real-time solver execution, agent observation inspection, trade-off comparison charts, and authenticated plan approval.
            </p>

            <div className="space-y-2.5 font-mono text-xs text-[#979797] mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#d1ffca]" />
                <span className="text-[#ffffff]">Live OR-Tools MILP Solver</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#d1ffca]" />
                <span className="text-[#ffffff]">Agent Observation Citations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#d1ffca]" />
                <span className="text-[#ffffff]">One-Click Sign-Off & Audit Logging</span>
              </div>
            </div>
          </div>

          <Link
            href="/planner"
            className="w-full py-4 px-6 rounded-xl bg-[#ffffff] text-[#000000] font-bold text-sm flex items-center justify-between hover:bg-[#d1ffca] transition-colors"
          >
            <span>Open Planner Console</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Admin Console Card (Standard White Surface) */}
        <div className="card-standard border border-[#c6c6c6]/50 p-8 lg:p-10 flex flex-col justify-between rounded-[32px] group">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="font-mono text-xs bg-[#f3f3f3] text-[#444444] px-3 py-1 rounded-full font-semibold">
                ADMINISTRATION & DATA
              </span>
              <Database className="w-6 h-6 text-[#000000]" />
            </div>

            <h3 className="font-display text-4xl lg:text-5xl text-[#000000] uppercase leading-none mb-4">
              Data Governance & Admin
            </h3>

            <p className="font-body text-sm sm:text-base text-[#444444] leading-relaxed mb-8">
              Manage dataset versions, trigger clean database resets, inspect schema validation warnings, and audit system repeatability benchmarks.
            </p>

            <div className="space-y-2.5 font-mono text-xs text-[#444444] mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#000000]" />
                <span>Deterministic Seed Reset (SEED_2026_SCM_V1)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#000000]" />
                <span>Schema & Integrity Report (Check-06)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#000000]" />
                <span>Audit Log Export (JSON/CSV)</span>
              </div>
            </div>
          </div>

          <Link
            href="/admin"
            className="w-full py-4 px-6 rounded-xl bg-[#000000] text-[#ffffff] font-bold text-sm flex items-center justify-between hover:opacity-90 transition-opacity"
          >
            <span>Open Admin Console</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
