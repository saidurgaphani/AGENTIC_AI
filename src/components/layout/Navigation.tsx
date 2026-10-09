'use client';

import Link from 'next/link';
import { ShieldCheck, Activity, Database, Cpu } from 'lucide-react';

export function Navigation() {
  return (
    <header className="w-full h-32 flex items-center justify-between px-6 lg:px-12 max-w-[1360px] mx-auto">
      {/* Brand mark */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-[#000000] text-[#ffffff] flex items-center justify-center font-bold font-mono text-sm tracking-tighter">
          SCM
        </div>
        <div>
          <span className="font-display text-2xl tracking-tight text-[#000000] block leading-none">
            RESILIENT OPS
          </span>
          <span className="font-mono text-[11px] text-[#979797] uppercase tracking-wider block mt-0.5">
            ADK + OR-Tools v1.0
          </span>
        </div>
      </Link>

      {/* Floating Centered Nav Pill */}
      <nav className="hidden md:flex items-center bg-[#ffffff] px-8 py-3.5 rounded-[48px] gap-7 border border-[#c6c6c6]/40">
        <Link
          href="#disruption"
          className="text-sm font-medium text-[#444444] hover:text-[#000000] transition-colors"
        >
          Disruption
        </Link>
        <Link
          href="#network"
          className="text-sm font-medium text-[#444444] hover:text-[#000000] transition-colors"
        >
          3-Echelon Network
        </Link>
        <Link
          href="#agents"
          className="text-sm font-medium text-[#444444] hover:text-[#000000] transition-colors"
        >
          Agent Intelligence
        </Link>
        <Link
          href="#scenarios"
          className="text-sm font-medium text-[#444444] hover:text-[#000000] transition-colors"
        >
          Scenario Metrics
        </Link>
        <Link
          href="#workflow"
          className="text-sm font-medium text-[#444444] hover:text-[#000000] transition-colors"
        >
          Traceability
        </Link>
      </nav>

      {/* Functional Entry Points: Planner & Admin */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-[#444444] hover:text-[#000000] hover:bg-[#ffffff] rounded-lg transition-colors border border-transparent hover:border-[#c6c6c6]"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Admin</span>
        </Link>
        <Link
          href="/planner"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#000000] text-[#ffffff] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Activity className="w-4 h-4 text-[#d1ffca]" />
          <span>Planner Console</span>
        </Link>
      </div>
    </header>
  );
}
