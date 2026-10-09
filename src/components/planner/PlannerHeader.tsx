'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  Database,
  Layers,
  ShieldCheck,
  User,
  PlusCircle,
} from 'lucide-react';
import { DisruptionScenario } from '@/types/planner-api';

interface PlannerHeaderProps {
  scenarios: DisruptionScenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  isRunning: boolean;
  onTriggerRun: () => void;
  backendHealth: {
    connected: boolean;
    status: string;
    latencyMs: number;
    database?: string;
  };
  currentUser: {
    displayName: string;
    role: string;
  };
  onOpenNewScenarioModal: () => void;
}

export function PlannerHeader({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  isRunning,
  onTriggerRun,
  backendHealth,
  currentUser,
  onOpenNewScenarioModal,
}: PlannerHeaderProps) {
  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <header className="w-full bg-[#ffffff] border-b border-[#c6c6c6] px-6 lg:px-12 py-4 sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Branding & Scenario Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#444444] hover:text-[#000000] p-1.5 rounded-lg hover:bg-[#f3f3f3] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Landing Page</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#c6c6c6] hidden sm:block"></div>

          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-[#000000] uppercase block leading-none">
                PLANNER DECISION CONSOLE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#d1ffca] text-[#000000] font-mono text-[10px] font-bold">
                POC V1.0
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] text-[#979797] uppercase">SCENARIO:</span>
              <select
                value={selectedScenarioId}
                onChange={(e) => onSelectScenario(e.target.value)}
                className="bg-[#f3f3f3] text-[#000000] font-mono text-xs px-2 py-1 rounded border border-[#c6c6c6] focus:outline-none focus:ring-1 focus:ring-[#000000]"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>

              <button
                onClick={onOpenNewScenarioModal}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#444444] hover:text-[#000000] hover:underline"
              >
                <PlusCircle className="w-3 h-3" />
                <span>New Scenario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Backend State & Run Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Neon DB / Backend status pill */}
          <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 bg-[#f3f3f3] rounded-xl border border-[#c6c6c6]/50">
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealth.connected ? 'bg-[#10b981] animate-pulse' : 'bg-[#ef4444]'
              }`}
            ></span>
            <Database className="w-3.5 h-3.5 text-[#444444]" />
            <span className="text-[#000000] font-semibold">
              {backendHealth.connected ? 'NEON POSTGRESQL' : 'BACKEND OFFLINE'}
            </span>
            <span className="text-[#979797] text-[10px]">
              {backendHealth.connected ? `${backendHealth.latencyMs}ms` : '503'}
            </span>
          </div>

          {/* User Auth Role */}
          <div className="hidden lg:flex items-center gap-2 font-mono text-xs px-3 py-1.5 bg-[#ffffff] rounded-xl border border-[#c6c6c6]">
            <User className="w-3.5 h-3.5 text-[#444444]" />
            <span className="text-[#000000]">{currentUser.displayName}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#000000] text-[#ffffff] text-[9px] font-bold">
              PLANNER
            </span>
          </div>

          {/* Run Analysis Trigger */}
          <button
            onClick={onTriggerRun}
            disabled={isRunning}
            className="btn-dark inline-flex items-center gap-2 text-xs py-2 px-4 shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Solving MILP & Running Agents...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
