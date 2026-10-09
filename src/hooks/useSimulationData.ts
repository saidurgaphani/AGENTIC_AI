import { useState, useEffect } from 'react';
import { StrategyResult } from '@/types/supply-chain';

let cachedPromise: Promise<any> | null = null;

const STRATEGY_INFO = {
  REORDER_BASELINE: {
    strategyName: 'Reorder-Rule Baseline (Unmitigated Disruption)',
    strategyDescription: 'Standard fixed-order MRP logic. Does not dynamically divert purchase orders or expedite alternate freight lanes during supplier outage.',
  },
  OPTIMIZATION_ONLY: {
    strategyName: 'Deterministic Optimization-Only Baseline',
    strategyDescription: 'Solves pure MILP with standard supplier and lane parameters. Discovers alternate supplier SUP-02 but incurs a delivery gap due to standard transit.',
  },
  MULTI_AGENT_OPTIMIZATION: {
    strategyName: 'Multi-Agent Coordinated + Optimization',
    strategyDescription: 'Multi-agent cross-functional synthesis: Supplier-Risk qualifies SUP-02, Logistics initiates priority air freight, Demand shields Tier-1 SLAs, and Optimizer validates.',
  }
};

export function useSimulationData() {
  const [data, setData] = useState<{
    reorderBaseline: StrategyResult;
    optimizationOnly: StrategyResult;
    multiAgentOptimization: StrategyResult;
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!cachedPromise) {
      cachedPromise = fetch('/api/v1/scenarios/SCN-2026-SHUTDOWN-07D/runs', { method: 'POST' })
        .then(res => {
          if (!res.ok) throw new Error('Simulation failed to run');
          return res.json();
        })
        .then(json => {
          const mapResult = (strategyKey: string) => {
            const raw = json.results.find((r: any) => r.strategy === strategyKey);
            if (!raw) return null;
            return {
              ...raw,
              strategyKey,
              strategyName: (STRATEGY_INFO as any)[strategyKey].strategyName,
              strategyDescription: (STRATEGY_INFO as any)[strategyKey].strategyDescription,
              fillRatePercent: raw.fillRatePercent ?? raw.fill_rate_percent,
              totalBackorders: raw.totalBackorders ?? raw.total_backorders,
              totalLandedCost: raw.totalLandedCost ?? raw.total_landed_cost,
              costDeltaAgainstBaseline: raw.costDeltaAgainstBaseline ?? 0,
              recoveryTimeDays: raw.recoveryTimeDays ?? raw.recovery_time_days,
              avgInventoryDays: raw.avgInventoryDays ?? 0,
              hardConstraintViolations: raw.hardConstraintViolations ?? raw.hard_violations ?? 0,
              softConstraintBreaches: raw.softConstraintBreaches || 0,
              solverRuntimeMs: raw.runtimeMs ?? raw.solver_runtime_ms ?? 0,
              agentRuntimeMs: raw.agentRuntimeMs ?? 0,
              feasibilityStatus: raw.feasibilityStatus ?? raw.feasibility_status,
              dayByDayMetrics: raw.dayByDayMetrics ?? raw.day_by_day_metrics ?? [],
            };
          };

          return {
            reorderBaseline: mapResult('REORDER_BASELINE'),
            optimizationOnly: mapResult('OPTIMIZATION_ONLY'),
            multiAgentOptimization: mapResult('MULTI_AGENT_OPTIMIZATION'),
          };
        });
    }

    cachedPromise
      .then(setData)
      .catch(setError);
  }, []);

  return { data, isLoading: !data && !error, error };
}
