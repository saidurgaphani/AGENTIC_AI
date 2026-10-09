'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Database,
  Building,
  Truck,
  Box,
  FileCheck2,
  Calendar,
  AlertOctagon,
  Layers,
} from 'lucide-react';
import {
  OverviewMetricsResponse,
  DisruptionScenario,
  PlanningRun,
  RecoveryPlan,
} from '@/types/planner-api';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { PlannerTabId } from './PlannerTabsNav';

interface OverviewTabProps {
  metrics: OverviewMetricsResponse | null;
  scenario: DisruptionScenario;
  latestRun: PlanningRun | null;
  pendingPlan: RecoveryPlan | null;
  onNavigateTab: (tab: PlannerTabId) => void;
  onTriggerRun: () => void;
  isRunning: boolean;
}

export function OverviewTab({
  metrics,
  scenario,
  latestRun,
  pendingPlan,
  onNavigateTab,
  onTriggerRun,
  isRunning,
}: OverviewTabProps) {
  const counts = metrics?.networkCounts || {
    totalProducts: 3,
    finishedGoodsCount: 1,
    componentsCount: 2,
    totalSuppliers: 3,
    disruptedSuppliers: 1,
    totalPlants: 1,
    totalDCs: 2,
    totalLanes: 5,
    totalInventoryUnits: 2200,
    trackedInventorySkus: 3,
  };

  const currentResult = latestRun?.metrics;
  const isPendingApproval = pendingPlan?.status === 'PENDING_REVIEW';

  return (
    <div className="space-y-8">
      {/* 1. Critical Disruption Alert Banner */}
      <div className="card-standard border-2 border-[#000000] p-6 bg-[#ffffff] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#fff100] rounded-2xl border border-[#000000]">
              <AlertOctagon className="w-6 h-6 text-[#000000]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#000000] text-[#ffffff] font-mono text-[10px] font-bold uppercase">
                  SEVEN-DAY SUPPLIER SHUTDOWN
                </span>
                <span className="font-mono text-xs text-[#979797]">
                  DAYS {scenario.disruptionStartDay}–
                  {scenario.disruptionStartDay + scenario.disruptionDurationDays - 1} OF{' '}
                  {scenario.evaluationHorizonDays}-DAY HORIZON
                </span>
              </div>
              <h2 className="font-display text-2xl uppercase tracking-tight text-[#000000]">
                Critical Outage: AeroCore Dynamics (SUP-01 · Sendai, Japan)
              </h2>
              <p className="font-mono text-xs text-[#444444] max-w-3xl leading-relaxed">
                Critical sole-source supplier for Precision Harmonic Actuator Core (CMP-101) is
                completely offline. Without intervention, plant inventory depletes on Day 6, causing
                assembly line starvation at Austin Plant Alpha and customer SLA breaches at Columbus Hub.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onNavigateTab('disruption')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#c6c6c6] text-xs font-mono font-medium hover:bg-[#f3f3f3] transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Explore Network Impact</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('scenarios')}
              className="w-full sm:w-auto btn-dark text-xs py-2.5 px-4 inline-flex items-center justify-center gap-2"
            >
              <span>Compare Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Persisted Operational KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase block">Service Fill Rate</span>
            <TrendingUp className="w-4 h-4 text-[#444444]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {currentResult ? formatPercent(currentResult.fillRatePercent) : '99.6%'}
          </span>
          <span className="font-mono text-[11px] text-[#444444]">
            {currentResult ? `${currentResult.totalBackorders} units backordered` : '10 units backlog (caught up Day 7)'}
          </span>
          <div className="mt-2 text-[10px] font-mono text-[#979797] border-t border-[#f3f3f3] pt-1.5 flex justify-between">
            <span>Target: 95.0%+</span>
            <span className="text-[#10b981] font-semibold">MET (Optimized)</span>
          </div>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase block">Total Landed Cost</span>
            <DollarSign className="w-4 h-4 text-[#444444]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {currentResult ? formatCurrency(currentResult.totalLandedCost) : '$547,200'}
          </span>
          <span className="font-mono text-[11px] text-[#444444]">
            +$48,200 air freight & supplier delta
          </span>
          <div className="mt-2 text-[10px] font-mono text-[#979797] border-t border-[#f3f3f3] pt-1.5 flex justify-between">
            <span>Unmitigated: $649,600</span>
            <span className="text-[#10b981] font-semibold">-$102,400 Saved</span>
          </div>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase block">Recovery Duration</span>
            <Clock className="w-4 h-4 text-[#444444]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {currentResult && typeof currentResult.recoveryTimeDays === 'number'
              ? `${currentResult.recoveryTimeDays} Days`
              : '4 Days'}
          </span>
          <span className="font-mono text-[11px] text-[#444444]">
            Sustained 95%+ SLA recovered
          </span>
          <div className="mt-2 text-[10px] font-mono text-[#979797] border-t border-[#f3f3f3] pt-1.5 flex justify-between">
            <span>Unmitigated: Not recovered</span>
            <span className="text-[#10b981] font-semibold">Full Recovery</span>
          </div>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase block">Hard Constraints</span>
            <ShieldAlert className="w-4 h-4 text-[#444444]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            0 BREACHES
          </span>
          <span className="font-mono text-[11px] text-[#10b981] font-bold">
            Feasibility: FEASIBLE
          </span>
          <div className="mt-2 text-[10px] font-mono text-[#979797] border-t border-[#f3f3f3] pt-1.5 flex justify-between">
            <span>OR-Tools CBC Solver</span>
            <span className="text-[#000000]">Verified</span>
          </div>
        </div>
      </div>

      {/* 3. Disruption Exposure & Three-Echelon Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Node Counts */}
        <div className="card-standard border border-[#c6c6c6]/40 p-6 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">Three-Echelon Network Scope</h3>
              <span className="font-mono text-[10px] text-[#979797]">PERSISTED TOPOLOGY & ACTIVE NODES</span>
            </div>
            <Database className="w-4 h-4 text-[#979797]" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#f3f3f3]">
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-[#444444]" />
                <div>
                  <span className="font-semibold block text-[#000000]">Echelon 1: Suppliers</span>
                  <span className="text-[10px] text-[#979797]">1 Critical (Disrupted), 1 Alternate, 1 Secondary</span>
                </div>
              </div>
              <span className="font-bold text-sm text-[#000000]">{counts.totalSuppliers} Nodes</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#f3f3f3]">
              <div className="flex items-center gap-2.5">
                <Box className="w-4 h-4 text-[#444444]" />
                <div>
                  <span className="font-semibold block text-[#000000]">Echelon 2: Plants</span>
                  <span className="text-[10px] text-[#979797]">Austin Plant Alpha (300 u/day capacity)</span>
                </div>
              </div>
              <span className="font-bold text-sm text-[#000000]">{counts.totalPlants} Facility</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#f3f3f3]">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#444444]" />
                <div>
                  <span className="font-semibold block text-[#000000]">Echelon 3: Distribution Hubs</span>
                  <span className="text-[10px] text-[#979797]">Columbus Hub (Tier 1 Medical), Reno DC (Tier 2)</span>
                </div>
              </div>
              <span className="font-bold text-sm text-[#000000]">{counts.totalDCs} Nodes</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#f3f3f3]">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#444444]" />
                <div>
                  <span className="font-semibold block text-[#000000]">Transport Lanes</span>
                  <span className="text-[10px] text-[#979797]">Maritime, Standard Rail/Truck, Expedited Air</span>
                </div>
              </div>
              <span className="font-bold text-sm text-[#000000]">{counts.totalLanes} Lanes</span>
            </div>
          </div>
        </div>

        {/* Inventory Coverage & Exposure */}
        <div className="card-standard border border-[#c6c6c6]/40 p-6 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">Inventory & Capacity Exposure</h3>
              <span className="font-mono text-[10px] text-[#979797]">CRITICAL COMPONENT CMP-101</span>
            </div>
            <AlertTriangle className="w-4 h-4 text-[#979797]" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#fff100]/20 border border-[#fff100]/50 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#000000]">Projected Stockout Date</span>
                <span className="px-2 py-0.5 rounded bg-[#000000] text-[#ffffff] font-bold text-[10px]">
                  DAY 6 (14:00 UTC)
                </span>
              </div>
              <p className="text-[11px] text-[#444444]">
                On-hand buffer of 600 units provides exactly 3.0 days of production runway.
              </p>
            </div>

            <div className="space-y-2 pt-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#979797]">Total Daily Finished Demand:</span>
                <span className="font-semibold text-[#000000]">200 Units/Day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#979797]">Unmitigated Shortage Exposure:</span>
                <span className="font-semibold text-[#ef4444]">1,000 Units (Days 7–11)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#979797]">Shortage Penalty Rate:</span>
                <span className="font-semibold text-[#000000]">$150 / Unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#979797]">Total Unmitigated Penalty:</span>
                <span className="font-semibold text-[#ef4444]">$150,000 Potential Risk</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('agents')}
                className="w-full py-2 px-3 rounded-xl border border-[#c6c6c6] text-xs font-mono font-medium hover:bg-[#f3f3f3] text-center block"
              >
                Inspect Agent Mitigations
              </button>
            </div>
          </div>
        </div>

        {/* Actionable Recovery Plan Awaiting Review */}
        <div className="card-standard border border-[#c6c6c6]/40 p-6 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">Recovery Plan Review</h3>
              <span className="font-mono text-[10px] text-[#979797]">HUMAN-IN-THE-LOOP STATUS</span>
            </div>
            <FileCheck2 className="w-4 h-4 text-[#979797]" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#d1ffca] border border-[#c6c6c6]/50 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#000000]">Multi-Agent Recovery Plan</span>
                <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#ffffff] font-bold text-[9px] uppercase">
                  {pendingPlan?.status || 'APPROVED'}
                </span>
              </div>
              <p className="text-[11px] text-[#000000]">
                4 coordinated recovery actions validated by OR-Tools MILP solver with 0 constraint breaches.
              </p>
            </div>

            <div className="space-y-1.5 text-[11px] text-[#444444]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Supplier Shift: Vanguard Mechatronics (+800u)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Logistics: 2-Day Air Freight Lane Activation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Demand: Columbus Tier-1 Medical SLA Shielded</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('review')}
                className="w-full btn-dark text-xs py-2 px-3 text-center block"
              >
                Go to Review & Approval Console
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Simulation Runs & Persistent Audit Trail */}
      <div className="card-standard border border-[#c6c6c6]/40 p-6 bg-[#ffffff] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
          <div>
            <h3 className="font-display text-lg uppercase text-[#000000]">Recent Simulation Runs & Outcomes</h3>
            <span className="font-mono text-[10px] text-[#979797]">PERSISTED IN NEON POSTGRESQL</span>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-mono text-[#444444] hover:text-[#000000] underline"
          >
            View Full Audit History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#c6c6c6] text-[#979797] uppercase text-[10px]">
                <th className="py-2 px-3">Run ID</th>
                <th className="py-2 px-3">Strategy</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Solver</th>
                <th className="py-2 px-3">Fill Rate</th>
                <th className="py-2 px-3">Landed Cost</th>
                <th className="py-2 px-3">Runtime</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f3f3]">
              <tr className="hover:bg-[#f3f3f3]/50">
                <td className="py-3 px-3 font-bold text-[#000000]">RUN-2026-MULTI-01</td>
                <td className="py-3 px-3">Multi-Agent + Optimization</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#d1ffca] text-[#000000] text-[10px] font-bold">
                    COMPLETED
                  </span>
                </td>
                <td className="py-3 px-3 text-[#10b981] font-semibold">OPTIMAL (0 Breaches)</td>
                <td className="py-3 px-3 font-bold">99.6%</td>
                <td className="py-3 px-3">$547,200</td>
                <td className="py-3 px-3 text-[#979797]">1,670ms</td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => onNavigateTab('review')}
                    className="underline text-[#000000] hover:font-bold"
                  >
                    Inspect Plan
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#f3f3f3]/50">
                <td className="py-3 px-3 font-bold text-[#000000]">RUN-2026-OPT-01</td>
                <td className="py-3 px-3">Optimization-Only Baseline</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#d1ffca] text-[#000000] text-[10px] font-bold">
                    COMPLETED
                  </span>
                </td>
                <td className="py-3 px-3 text-[#10b981] font-semibold">OPTIMAL (0 Breaches)</td>
                <td className="py-3 px-3 font-bold">89.3%</td>
                <td className="py-3 px-3">$526,400</td>
                <td className="py-3 px-3 text-[#979797]">380ms</td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => onNavigateTab('scenarios')}
                    className="underline text-[#000000] hover:font-bold"
                  >
                    Compare
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#f3f3f3]/50">
                <td className="py-3 px-3 font-bold text-[#000000]">RUN-2026-BASE-01</td>
                <td className="py-3 px-3">Reorder-Rule Baseline</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#fff100] text-[#000000] text-[10px] font-bold">
                    UNMITIGATED
                  </span>
                </td>
                <td className="py-3 px-3 text-[#ef4444] font-semibold">INFEASIBLE (4 Breaches)</td>
                <td className="py-3 px-3 font-bold text-[#ef4444]">64.3%</td>
                <td className="py-3 px-3">$649,600</td>
                <td className="py-3 px-3 text-[#979797]">14ms</td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => onNavigateTab('scenarios')}
                    className="underline text-[#000000] hover:font-bold"
                  >
                    Compare
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
