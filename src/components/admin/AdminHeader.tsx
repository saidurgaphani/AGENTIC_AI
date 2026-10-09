'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  RefreshCw,
  Shield,
  Layers,
  Activity,
  FileSpreadsheet,
  AlertOctagon,
  Cpu,
  Sliders,
  PlayCircle,
  Users,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'network'
  | 'datasets'
  | 'disruption'
  | 'agents'
  | 'constraints'
  | 'runs'
  | 'users';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  datasetVersion: string;
  seed: string;
  userRole: string;
  onResetSeed: () => void;
  resetting: boolean;
}

export function AdminHeader({
  activeTab,
  setActiveTab,
  datasetVersion,
  seed,
  userRole,
  onResetSeed,
  resetting,
}: AdminHeaderProps) {
  const navItems: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'network', label: 'Network Entities', icon: Layers },
    { id: 'datasets', label: 'Dataset & Import', icon: FileSpreadsheet },
    { id: 'disruption', label: 'Disruption Scenario', icon: AlertOctagon },
    { id: 'agents', label: 'Agent Governance', icon: Cpu },
    { id: 'constraints', label: 'Optimization & Constraints', icon: Sliders },
    { id: 'runs', label: 'Simulation Runs', icon: PlayCircle },
    { id: 'users', label: 'Access & Audit', icon: Users },
  ];

  return (
    <header className="w-full bg-[#ffffff] border-b border-[#c6c6c6] px-4 lg:px-8 py-3.5 sticky top-0 z-30 shadow-none">
      <div className="max-w-[1440px] mx-auto space-y-3">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#444444] hover:text-[#000000] p-1.5 rounded-lg hover:bg-[#f3f3f3] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Landing</span>
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#444444] hover:text-[#000000] p-1.5 rounded-lg hover:bg-[#f3f3f3] transition-colors"
            >
              <span>Planner Console</span>
            </Link>
            <div className="h-4 w-[1px] bg-[#c6c6c6]" />
            <div>
              <span className="font-display text-xl lg:text-2xl text-[#000000] uppercase block leading-none tracking-tight">
                SUPPLY-CHAIN CONTROL PLANE & ADMINISTRATION
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[10px] text-[#979797] uppercase">
                  VERSION: {datasetVersion || '1.0.0-canonical'} · SEED: {seed || 'SEED_2026_SCM_V1'}
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#f3f3f3] text-[#444444] border border-[#c6c6c6]/40 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5 text-[#000000]" />
                  <span>NEON POSTGRESQL</span>
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#d1ffca] text-[#000000] font-bold">
                  ROLE: {userRole}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetSeed}
              disabled={resetting}
              className="btn-ghost inline-flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Reset Neon DB state to SEED_2026_SCM_V1 canonical baseline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting DB...' : 'Reset Canonical Seed'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 border-t border-[#f3f3f3] pt-2 text-xs font-mono scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#000000] text-[#ffffff] font-semibold'
                    : 'text-[#444444] hover:bg-[#f3f3f3] hover:text-[#000000]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
