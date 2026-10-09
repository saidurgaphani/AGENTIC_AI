import Link from 'next/link';
import { DATASET_MANIFEST } from '@/data/benchmark-dataset';

export function Footer() {
  return (
    <footer className="w-full bg-[#000000] text-[#ffffff] py-16 px-6 lg:px-12 mt-20">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-12 border-b border-[#2f2f2f]">
        <div>
          <span className="font-display text-3xl tracking-tight text-[#ffffff] block leading-none">
            SUPPLY CHAIN RESILIENCE PLATFORM
          </span>
          <p className="font-mono text-xs text-[#979797] mt-2">
            Grounded in deterministic mathematics, ADK agent coordination, and OR-Tools optimization.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <Link href="/planner" className="hover:text-[#d1ffca] transition-colors">
            Planner Workspace
          </Link>
          <Link href="/admin" className="hover:text-[#d1ffca] transition-colors">
            Data Governance & Admin
          </Link>
          <a
            href="#disruption"
            className="text-[#979797] hover:text-[#ffffff] transition-colors"
          >
            Disruption Mechanics
          </a>
          <a
            href="#network"
            className="text-[#979797] hover:text-[#ffffff] transition-colors"
          >
            Network Model
          </a>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono text-[#979797]">
        <div>
          <span>SEED: {DATASET_MANIFEST.seed}</span>
          <span className="mx-3">|</span>
          <span>VERSION: {DATASET_MANIFEST.version}</span>
          <span className="mx-3">|</span>
          <span>CURRENCY: {DATASET_MANIFEST.currency}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d1ffca]"></span>
          <span>DECISION SUPPORT POC — HUMAN-IN-THE-LOOP AUTHORIZED</span>
        </div>
      </div>
    </footer>
  );
}
