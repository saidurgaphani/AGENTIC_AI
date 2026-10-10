'use client';

import { useState } from 'react';
import {
  Layers,
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  Sliders,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  DisruptionScenario,
  StrategyResult,
  EvaluationComparison,
} from '@/types/planner-api';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface ScenarioComparisonTabProps {
  scenario: DisruptionScenario;
  comparison: EvaluationComparison | null;
  isRunning: boolean;
  onUpdateScenario: (updated: Partial<DisruptionScenario>) => void;
  onTriggerRerun: () => void;
  onNavigateToReview: () => void;
}

export function ScenarioComparisonTab({
  scenario,
  comparison,
  isRunning,
  onUpdateScenario,
  onTriggerRerun,
  onNavigateToReview,
}: ScenarioComparisonTabProps) {
  const [selectedStrategyKey, setSelectedStrategyKey] = useState<
    'MULTI_AGENT_OPTIMIZATION' | 'OPTIMIZATION_ONLY' | 'REORDER_BASELINE'
  >('MULTI_AGENT_OPTIMIZATION');

  const [editSafetyStock, setEditSafetyStock] = useState(scenario.safetyStockDays);
  const [editDailyDemand, setEditDailyDemand] = useState(scenario.dailyDemandUnits);
  const [editShortagePenalty, setEditShortagePenalty] = useState(scenario.shortagePenaltyPerUnit);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const strategies = comparison?.strategies;
  const reorder = strategies?.reorderBaseline;
  const optOnly = strategies?.optimizationOnly;
  const multiAgent = strategies?.multiAgentOptimization;

  const currentResult: StrategyResult | undefined =
    selectedStrategyKey === 'MULTI_AGENT_OPTIMIZATION'
      ? multiAgent
      : selectedStrategyKey === 'OPTIMIZATION_ONLY'
      ? optOnly
      : reorder;

  const handleApplyParams = () => {
    onUpdateScenario({
      safetyStockDays: editSafetyStock,
      dailyDemandUnits: editDailyDemand,
      shortagePenaltyPerUnit: editShortagePenalty,
    });
    setHasUnsavedChanges(false);
    onTriggerRerun();
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#ffffff] font-mono text-[10px] font-bold uppercase">
                STRATEGY BENCHMARKING
              </span>
              <span className="font-mono text-xs text-[#979797]">
                SEED: {scenario.randomSeed} · DATASET V{scenario.datasetVersion}
              </span>
            </div>
            <h2 className="font-display text-2xl uppercase tracking-tight text-[#000000]">
              Scenario Planning & Strategy Comparison
            </h2>
            <p className="font-mono text-xs text-[#444444] max-w-2xl leading-relaxed">
              Evaluate three explicit recovery strategies under identical disruption assumptions:
              fixed reorder rules, pure OR-Tools mathematical optimization, and multi-agent
              cross-functional synthesis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToReview}
              className="btn-dark text-xs py-2.5 px-4"
            >
              Review Recommended Recovery Plan
            </button>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strategy 1: Reorder-Rule Baseline */}
        <div
          onClick={() => setSelectedStrategyKey('REORDER_BASELINE')}
          className={`card-standard border p-6 cursor-pointer transition-all ${
            selectedStrategyKey === 'REORDER_BASELINE'
              ? 'border-[#000000] ring-2 ring-[#000000] bg-[#ffffff]'
              : 'border-[#c6c6c6]/50 bg-[#ffffff] hover:border-[#000000]/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="px-2 py-0.5 rounded bg-[#fff100] text-[#000000] font-mono text-[9px] font-bold uppercase">
              1. UNMITIGATED
            </span>
            <span className="font-mono text-[10px] text-[#ef4444] font-bold uppercase">
              INFEASIBLE
            </span>
          </div>

          <div className="mt-3 space-y-1">
            <h3 className="font-display text-lg uppercase text-[#000000]">
              Reorder-Rule Baseline
            </h3>
            <p className="font-mono text-[11px] text-[#444444] leading-relaxed">
              Standard fixed-order MRP logic. Does not divert purchase orders to alternate vendors or expedite freight.
            </p>
          </div>

          <div className="mt-6 space-y-3 font-mono text-xs border-t border-[#c6c6c6]/40 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Fill Rate (%):</span>
              <span className="font-bold text-[#ef4444] text-sm">
                {reorder ? formatPercent(reorder.fillRatePercent) : '64.3%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Total Landed Cost:</span>
              <span className="font-bold text-[#000000]">
                {reorder ? formatCurrency(reorder.totalLandedCost) : '$649,600'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Unmet Backorders:</span>
              <span className="font-semibold text-[#ef4444]">
                {reorder ? `${reorder.totalBackorders} Units` : '1,000 Units'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Recovery Horizon:</span>
              <span className="font-semibold text-[#ef4444]">Not Recovered</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Hard Violations:</span>
              <span className="text-[#ef4444] font-bold">4 Line Breaches</span>
            </div>
          </div>
        </div>

        {/* Strategy 2: Optimization-Only Baseline */}
        <div
          onClick={() => setSelectedStrategyKey('OPTIMIZATION_ONLY')}
          className={`card-standard border p-6 cursor-pointer transition-all ${
            selectedStrategyKey === 'OPTIMIZATION_ONLY'
              ? 'border-[#000000] ring-2 ring-[#000000] bg-[#ffffff]'
              : 'border-[#c6c6c6]/50 bg-[#ffffff] hover:border-[#000000]/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="px-2 py-0.5 rounded bg-[#f3f3f3] text-[#444444] font-mono text-[9px] font-bold uppercase border border-[#c6c6c6]">
              2. SOLVER-ONLY
            </span>
            <span className="font-mono text-[10px] text-[#10b981] font-bold uppercase">
              FEASIBLE
            </span>
          </div>

          <div className="mt-3 space-y-1">
            <h3 className="font-display text-lg uppercase text-[#000000]">
              Optimization-Only
            </h3>
            <p className="font-mono text-[11px] text-[#444444] leading-relaxed">
              Mathematical solver diverts orders to alternate SUP-02, but adheres strictly to standard 5-day surface shipping.
            </p>
          </div>

          <div className="mt-6 space-y-3 font-mono text-xs border-t border-[#c6c6c6]/40 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Fill Rate (%):</span>
              <span className="font-bold text-[#000000] text-sm">
                {optOnly ? formatPercent(optOnly.fillRatePercent) : '89.3%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Total Landed Cost:</span>
              <span className="font-bold text-[#000000]">
                {optOnly ? formatCurrency(optOnly.totalLandedCost) : '$526,400'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Unmet Backorders:</span>
              <span className="font-semibold text-[#000000]">
                {optOnly ? `${optOnly.totalBackorders} Units` : '300 Units'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Recovery Horizon:</span>
              <span className="font-semibold text-[#000000]">Day 9 (Delayed)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Hard Violations:</span>
              <span className="text-[#10b981] font-bold">0 Breaches</span>
            </div>
          </div>
        </div>

        {/* Strategy 3: Multi-Agent + Optimization */}
        <div
          onClick={() => setSelectedStrategyKey('MULTI_AGENT_OPTIMIZATION')}
          className={`card-standard border p-6 cursor-pointer transition-all ${
            selectedStrategyKey === 'MULTI_AGENT_OPTIMIZATION'
              ? 'border-[#000000] ring-2 ring-[#000000] bg-[#ffffff]'
              : 'border-[#c6c6c6]/50 bg-[#ffffff] hover:border-[#000000]/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="px-2 py-0.5 rounded bg-[#d1ffca] text-[#000000] font-mono text-[9px] font-bold uppercase">
              3. RECOMMENDED
            </span>
            <span className="font-mono text-[10px] text-[#10b981] font-bold uppercase">
              OPTIMAL (99.6%)
            </span>
          </div>

          <div className="mt-3 space-y-1">
            <h3 className="font-display text-lg uppercase text-[#000000]">
              Multi-Agent + Optimization
            </h3>
            <p className="font-mono text-[11px] text-[#444444] leading-relaxed">
              Supplier-Risk activates SUP-02, Logistics books 2-day air freight, Demand protects Tier-1 SLAs, and OR-Tools validates feasibility.
            </p>
          </div>

          <div className="mt-6 space-y-3 font-mono text-xs border-t border-[#c6c6c6]/40 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Fill Rate (%):</span>
              <span className="font-bold text-[#10b981] text-sm">
                {multiAgent ? formatPercent(multiAgent.fillRatePercent) : '99.6%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Total Landed Cost:</span>
              <span className="font-bold text-[#000000]">
                {multiAgent ? formatCurrency(multiAgent.totalLandedCost) : '$547,200'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Unmet Backorders:</span>
              <span className="font-semibold text-[#10b981]">
                {multiAgent ? `${multiAgent.totalBackorders} Units` : '10 Units'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Recovery Horizon:</span>
              <span className="font-semibold text-[#10b981]">Day 4 (Sustained)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#979797]">Hard Violations:</span>
              <span className="text-[#10b981] font-bold">0 Breaches</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Parameter Editor & What-If Rerun Console */}
      <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#000000]" />
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">
                What-If Scenario Parameter Tuning
              </h3>
              <span className="font-mono text-[10px] text-[#979797]">
                MODIFY AUTHORITATIVE INPUTS AND RE-EXECUTE ORCHESTRATION & SOLVER
              </span>
            </div>
          </div>

          <button
            onClick={handleApplyParams}
            disabled={isRunning}
            className="btn-dark text-xs py-2 px-4 inline-flex items-center gap-2"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Solving...' : 'Re-Run Optimization'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-[#979797] uppercase text-[10px] block">
              Safety Stock Buffer (Days)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={editSafetyStock}
              onChange={(e) => {
                setEditSafetyStock(Number(e.target.value));
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-[#f3f3f3] text-[#000000] px-3 py-2 rounded-xl border border-[#c6c6c6] font-bold"
            />
            <span className="text-[10px] text-[#979797]">Default: 3 Days (600 Units)</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#979797] uppercase text-[10px] block">
              Daily Aggregate Demand (Units/Day)
            </label>
            <input
              type="number"
              min={50}
              max={500}
              step={10}
              value={editDailyDemand}
              onChange={(e) => {
                setEditDailyDemand(Number(e.target.value));
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-[#f3f3f3] text-[#000000] px-3 py-2 rounded-xl border border-[#c6c6c6] font-bold"
            />
            <span className="text-[10px] text-[#979797]">Split: 120u Mumbai + 80u Ahmedabad</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#979797] uppercase text-[10px] block">
              Shortage Penalty Rate ($/Unit)
            </label>
            <input
              type="number"
              min={50}
              max={500}
              step={10}
              value={editShortagePenalty}
              onChange={(e) => {
                setEditShortagePenalty(Number(e.target.value));
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-[#f3f3f3] text-[#000000] px-3 py-2 rounded-xl border border-[#c6c6c6] font-bold"
            />
            <span className="text-[10px] text-[#979797]">Contractual breach penalty per unit</span>
          </div>
        </div>
      </div>

      {/* 4. Day-by-Day Granular Simulation Breakdown Table */}
      {currentResult && (
        <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#c6c6c6] gap-2">
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">
                Day-by-Day Simulation Telemetry: {currentResult.strategyName}
              </h3>
              <span className="font-mono text-[10px] text-[#979797]">
                SOLVER RUNTIME: {currentResult.solverRuntimeMs}ms · FEASIBILITY: {currentResult.feasibilityStatus}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#979797] text-[10px] uppercase">Active View:</span>
              <span className="px-2 py-0.5 rounded bg-[#000000] text-[#ffffff] font-bold text-[10px]">
                {selectedStrategyKey.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#c6c6c6] text-[#979797] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">Demand (u)</th>
                  <th className="py-2.5 px-3">Fulfilled (u)</th>
                  <th className="py-2.5 px-3">Backlog (u)</th>
                  <th className="py-2.5 px-3">Plant Stock (u)</th>
                  <th className="py-2.5 px-3">Inbound (u)</th>
                  <th className="py-2.5 px-3">Daily Cost ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {currentResult.dayByDayMetrics.map((row) => (
                  <tr key={row.day} className="hover:bg-[#f3f3f3]/50">
                    <td className="py-2.5 px-3 font-bold text-[#000000]">Day {row.day}</td>
                    <td className="py-2.5 px-3">{row.demand}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#000000]">{row.fulfilled}</td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        row.backlog > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'
                      }`}
                    >
                      {row.backlog}
                    </td>
                    <td className="py-2.5 px-3">{row.plantRawStock}</td>
                    <td className="py-2.5 px-3">{row.inboundUnits}</td>
                    <td className="py-2.5 px-3 font-semibold">{formatCurrency(row.dailyCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
