'use client';

import {
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Building,
  Box,
  Truck,
  ArrowDown
} from 'lucide-react';
import {
  OverviewMetricsResponse,
  DisruptionScenario,
  PlanningRun,
  RecoveryPlan,
} from '@/types/planner-api';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { PlannerTabId } from './PlannerTabsNav';
import { useState } from 'react';

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
  onNavigateTab,
}: OverviewTabProps) {
  const currentResult = latestRun?.metrics;
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  return (
    <div className="space-y-8">
      {/* 1. Concise Disruption Banner */}
      <div className="card-standard border border-[#ef4444] p-6 bg-[#ffffff] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#ef4444]/10 rounded-2xl border border-[#ef4444]/30">
              <AlertOctagon className="w-6 h-6 text-[#ef4444]" />
            </div>
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded bg-[#ef4444] text-[#ffffff] font-mono text-[10px] font-bold uppercase">
                Critical Severity
              </span>
              <h2 className="font-display text-2xl uppercase tracking-tight text-[#000000]">
                Supplier Shutdown: AeroCore Dynamics (SUP-01)
              </h2>
              <p className="font-mono text-xs text-[#444444] max-w-2xl leading-relaxed">
                Bengaluru plant offline for {scenario.disruptionDurationDays} days. Assembly line starvation projected without intervention.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onNavigateTab('disruptions')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#c6c6c6] text-xs font-mono font-medium hover:bg-[#f3f3f3] transition-colors inline-flex items-center justify-center gap-2"
            >
              View Impact
            </button>
            <button
              onClick={() => onNavigateTab('recovery')}
              className="w-full sm:w-auto btn-dark text-xs py-2.5 px-6 inline-flex items-center justify-center gap-2"
            >
              Plan Recovery <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase block">Service Fill Rate</span>
            <TrendingUp className="w-4 h-4 text-[#444444]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {currentResult ? formatPercent(currentResult.fillRatePercent) : '99.6%'}
          </span>
          <span className="font-mono text-[11px] text-[#10b981] font-semibold mt-1 block">
            Target Met (Optimized)
          </span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase block">Expected Recovery Cost</span>
            <DollarSign className="w-4 h-4 text-[#444444]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {currentResult ? formatCurrency(currentResult.totalLandedCost) : '$547,200'}
          </span>
          <span className="font-mono text-[11px] text-[#444444] mt-1 block">
            Includes expedited logistics
          </span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase block">Estimated Recovery Time</span>
            <Clock className="w-4 h-4 text-[#444444]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {currentResult && typeof currentResult.recoveryTimeDays === 'number'
              ? `${currentResult.recoveryTimeDays} Days`
              : '4 Days'}
          </span>
          <span className="font-mono text-[11px] text-[#10b981] mt-1 block">
            Sustained recovery
          </span>
        </div>
      </div>

      {/* 3. Simple Network Status */}
      <div className="card-standard border border-[#c6c6c6]/40 p-6 bg-[#ffffff]">
        <div className="flex items-center justify-between pb-4">
          <h3 className="font-display text-lg uppercase text-[#000000]">Supply Network Status</h3>
          <button 
            onClick={() => setShowNetworkDetails(!showNetworkDetails)}
            className="text-xs font-mono underline text-[#444444]"
          >
            {showNetworkDetails ? 'Hide details' : 'View details'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#f3f3f3] -z-10 hidden md:block"></div>
          
          <div className="bg-[#ffffff] p-4 rounded-xl border-2 border-[#ef4444] shadow-sm flex flex-col items-center w-full md:w-48 z-10">
            <Building className="w-6 h-6 text-[#ef4444] mb-2" />
            <span className="font-bold text-xs">Suppliers</span>
            <span className="text-[10px] text-[#ef4444] mt-1">1 Disrupted (SUP-01)</span>
          </div>

          <ArrowRight className="w-6 h-6 text-[#c6c6c6] hidden md:block z-10 bg-[#ffffff]" />
          <ArrowDown className="w-6 h-6 text-[#c6c6c6] block md:hidden" />

          <div className="bg-[#ffffff] p-4 rounded-xl border border-[#c6c6c6] shadow-sm flex flex-col items-center w-full md:w-48 z-10">
            <Box className="w-6 h-6 text-[#444444] mb-2" />
            <span className="font-bold text-xs">Plants</span>
            <span className="text-[10px] text-[#979797] mt-1">Hyderabad Alpha at risk</span>
          </div>

          <ArrowRight className="w-6 h-6 text-[#c6c6c6] hidden md:block z-10 bg-[#ffffff]" />
          <ArrowDown className="w-6 h-6 text-[#c6c6c6] block md:hidden" />

          <div className="bg-[#ffffff] p-4 rounded-xl border border-[#c6c6c6] shadow-sm flex flex-col items-center w-full md:w-48 z-10">
            <Truck className="w-6 h-6 text-[#444444] mb-2" />
            <span className="font-bold text-xs">Distribution</span>
            <span className="text-[10px] text-[#979797] mt-1">2 Hubs functioning</span>
          </div>
        </div>

        {showNetworkDetails && (
          <div className="mt-6 pt-4 border-t border-[#f3f3f3] font-mono text-xs text-[#444444]">
            <p><strong>Disrupted Node:</strong> AeroCore Dynamics (Bengaluru). Halts 200 units/day pipeline.</p>
            <p className="mt-2"><strong>Downstream Impact:</strong> Hyderabad Plant Alpha stock depletes in 3 days. Mumbai Hub misses Tier 1 SLA by Day 6.</p>
            <button 
              onClick={() => onNavigateTab('disruptions')}
              className="mt-4 px-3 py-1.5 bg-[#f3f3f3] rounded-lg border border-[#c6c6c6] text-[#000000] font-medium inline-flex items-center gap-2 hover:bg-[#e5e5e5] transition-colors"
            >
              Open Disruption Explorer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
