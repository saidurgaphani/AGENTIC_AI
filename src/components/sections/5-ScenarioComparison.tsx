'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { useSimulationData } from '@/hooks/useSimulationData';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { StrategyResult } from '@/types/supply-chain';

export function ScenarioComparison() {
  const { data, isLoading, error } = useSimulationData();
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyResult['strategyKey']>(
    'MULTI_AGENT_OPTIMIZATION'
  );

  if (isLoading) {
    return <section id="scenarios" className="w-full py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-[#c6c6c6] text-center font-mono">LOADING SIMULATION DATA...</section>;
  }

  if (error || !data) {
    return null;
  }

  const { reorderBaseline, optimizationOnly, multiAgentOptimization } = data;

  const strategies = [
    { key: 'REORDER_BASELINE', data: reorderBaseline, tag: 'BASELINE MRP' },
    { key: 'OPTIMIZATION_ONLY', data: optimizationOnly, tag: 'SOLVER ONLY' },
    { key: 'MULTI_AGENT_OPTIMIZATION', data: multiAgentOptimization, tag: 'PROPOSED PLAN' },
  ] as const;

  const currentStrategy =
    strategies.find((s) => s.key === selectedStrategy)?.data || multiAgentOptimization;

  return (
    <section id="scenarios" className="w-full py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-[#c6c6c6]">
      <div className="flex items-center gap-3 mb-4">
        <span className="tag-mint">COMPUTED SIMULATION RUNS</span>
        <span className="font-mono text-xs text-[#979797]">14-DAY HORIZON · IDENTICAL CONDITIONS</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#000000] leading-none uppercase">
            THREE STRATEGIES.
            <br />
            CALCULATED TRADEOFFS.
          </h2>
          <p className="font-body text-base sm:text-lg text-[#444444] max-w-2xl mt-4">
            Under identical initial conditions (600 units raw stock, 200 units/day demand, 7-day shutdown at SUP-01), the multi-agent synthesis delivers a 99.6% fill rate by spending $48k on expedited freight, averting $150k in contractual penalties.
          </p>
        </div>

        {/* Strategy Selector Pills */}
        <div className="flex items-center gap-2 bg-[#ffffff] p-1.5 rounded-2xl border border-[#c6c6c6]/50">
          {strategies.map((s) => (
            <button
              key={s.key}
              onClick={() => setSelectedStrategy(s.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition-all ${
                selectedStrategy === s.key
                  ? 'bg-[#000000] text-[#ffffff] font-bold'
                  : 'text-[#444444] hover:text-[#000000] hover:bg-[#f3f3f3]'
              }`}
            >
              {s.data.strategyName.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side 3-Column Comparative Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {strategies.map((s) => {
          const isSelected = selectedStrategy === s.key;
          const isProposed = s.key === 'MULTI_AGENT_OPTIMIZATION';

          return (
            <div
              key={s.key}
              onClick={() => setSelectedStrategy(s.key)}
              className={`cursor-pointer rounded-3xl p-6 transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#ffffff] border-2 border-[#000000]'
                  : 'bg-[#ffffff] border-[#c6c6c6]/40 hover:border-[#979797]'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      isProposed ? 'bg-[#d1ffca] text-[#000000]' : 'bg-[#f3f3f3] text-[#444444]'
                    }`}
                  >
                    {s.tag}
                  </span>
                  {isSelected && (
                    <span className="font-mono text-[10px] text-[#000000] font-bold">
                      ACTIVE VIEW
                    </span>
                  )}
                </div>

                <h3 className="font-display text-2xl text-[#000000] uppercase mb-1 leading-tight">
                  {s.data.strategyName}
                </h3>

                <p className="font-body text-xs text-[#444444] mb-6 line-clamp-2">
                  {s.data.strategyDescription}
                </p>

                {/* Key Metrics Stack */}
                <div className="space-y-3 pt-4 border-t border-[#f3f3f3] font-mono text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#979797]">FILL RATE (14D):</span>
                    <span
                      className={`font-display text-3xl leading-none ${
                        s.data.fillRatePercent > 95
                          ? 'text-[#000000] font-black'
                          : s.data.fillRatePercent > 80
                          ? 'text-[#444444]'
                          : 'text-[#000000]'
                      }`}
                    >
                      {formatPercent(s.data.fillRatePercent)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#979797]">TOTAL BACKORDERS:</span>
                    <span className="font-bold text-[#000000]">
                      {s.data.totalBackorders.toLocaleString()} units
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#979797]">TOTAL LANDED COST:</span>
                    <span className="font-bold text-[#000000]">
                      {formatCurrency(s.data.totalLandedCost)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#979797]">RECOVERY DURATION:</span>
                    <span className="font-bold text-[#000000]">
                      {typeof s.data.recoveryTimeDays === 'number'
                        ? `${s.data.recoveryTimeDays} Days`
                        : 'Unrecovered (14d+)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#979797]">HARD VIOLATIONS:</span>
                    <span className="font-bold text-[#000000]">
                      {s.data.hardConstraintViolations} (Feasible)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#f3f3f3] flex justify-between items-center font-mono text-[11px]">
                <span className="text-[#979797]">SOLVER TIME:</span>
                <span className="text-[#000000] font-semibold">{s.data.solverRuntimeMs} ms</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trajectory Breakdown Chart for Current Strategy */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#f3f3f3] gap-4">
          <div>
            <span className="font-mono text-xs text-[#979797] uppercase">
              14-Day Trajectory Analysis · {currentStrategy.strategyName}
            </span>
            <h4 className="font-display text-3xl text-[#000000] uppercase mt-1">
              Plant Inventory vs Demand Fulfillment
            </h4>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#000000] rounded-sm"></span>
              <span>Raw Inventory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#d1ffca] border border-[#000000]/20 rounded-sm"></span>
              <span>Fulfilled Demand</span>
            </div>
          </div>
        </div>

        {/* Day-by-Day Histogram Bars */}
        <div className="pt-6">
          <div className="grid grid-cols-14 gap-1.5 sm:gap-2 items-end h-44 pb-2 border-b border-[#c6c6c6]">
            {currentStrategy.dayByDayMetrics.map((m) => {
              const maxStock = 800;
              const stockHeightPercent = Math.min(100, (m.plantRawStock / maxStock) * 100);
              const isDisruptedWindow = m.day >= 4 && m.day <= 10;

              return (
                <div key={m.day} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-12 bg-[#000000] text-[#ffffff] px-2 py-1 rounded text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    Day {m.day}: Stock {m.plantRawStock}u | Fulfilled {m.fulfilled}u
                  </div>

                  <div className="w-full flex gap-0.5 items-end h-full">
                    {/* Stock Bar */}
                    <div
                      style={{ height: `${stockHeightPercent}%` }}
                      className={`flex-1 rounded-t-sm transition-all ${
                        isDisruptedWindow ? 'bg-[#000000]' : 'bg-[#444444]'
                      }`}
                    ></div>

                    {/* Fulfilled Bar */}
                    <div
                      style={{ height: `${(m.fulfilled / 200) * 100}%` }}
                      className="flex-1 rounded-t-sm bg-[#d1ffca] border-t border-l border-r border-[#000000]/30"
                    ></div>
                  </div>

                  <span className="font-mono text-[9px] sm:text-[10px] text-[#979797] mt-2 block">
                    D{m.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-3 font-mono text-xs text-[#979797]">
            <span>DAY 1 (NORMAL)</span>
            <span className="text-[#000000] font-semibold">DAYS 4–10 (CRITICAL DISRUPTION WINDOW)</span>
            <span>DAY 14 (EVALUATION HORIZON)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
