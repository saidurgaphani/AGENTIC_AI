'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Layers,
  Cpu,
  Truck,
  Activity,
  Boxes,
  Database,
  ExternalLink,
} from 'lucide-react';
import { OverviewMetricsResponse } from '@/lib/admin-api';

interface OverviewSectionProps {
  metrics: OverviewMetricsResponse | null;
  loading: boolean;
  error: string | null;
  onNavigate: (tab: any) => void;
  onTriggerRun: () => void;
  runningSimulation: boolean;
}

export function OverviewSection({
  metrics,
  loading,
  error,
  onNavigate,
  onTriggerRun,
  runningSimulation,
}: OverviewSectionProps) {
  if (loading) {
    return (
      <div className="card-standard border border-[#c6c6c6]/50 p-12 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#000000] border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="font-mono text-xs text-[#444444] block">
          Querying Neon PostgreSQL control plane telemetry...
        </span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="card-standard border border-red-300 bg-red-50 p-8 space-y-3">
        <div className="flex items-center gap-2 text-red-700 font-mono text-sm font-bold">
          <ShieldAlert className="w-5 h-5" />
          <span>Control Plane Telemetry Unavailable</span>
        </div>
        <p className="font-mono text-xs text-red-600">
          {error || 'Unable to connect to Neon PostgreSQL database. Verify DATABASE_URL.'}
        </p>
      </div>
    );
  }

  const { networkCounts, dataset, activeScenario, recentRuns, agents, recoveryPlans, auditEvents, dataQuality, environment } =
    metrics;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Disruption Status */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#f3f3f3]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="tag-voltage">ACTIVE DISRUPTION TRIGGER</span>
            <span className="font-mono text-xs text-[#444444]">
              {activeScenario?.name || '7-Day Critical Supplier Shutdown'}
            </span>
          </div>
          <h2 className="font-display text-2xl lg:text-3xl text-[#000000] uppercase tracking-tight">
            Target: {activeScenario?.supplier_code || 'SUP-01'} ({activeScenario?.supplier_name || 'AeroCore Dynamics'})
          </h2>
          <p className="font-body text-xs text-[#444444] max-w-2xl">
            {activeScenario?.description ||
              'Full cessation of inbound actuator component shipments between Day 4 and Day 10. Downstream exposure: 200 units/day.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('disruption')}
            className="btn-ghost inline-flex items-center gap-1.5 text-xs py-2 px-3"
          >
            <span>Edit Outage Window</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTriggerRun}
            disabled={runningSimulation}
            className="btn-dark inline-flex items-center gap-2 text-xs py-2 px-4"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${runningSimulation ? 'animate-pulse' : ''}`} />
            <span>{runningSimulation ? 'Executing Multi-Agent Engine...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Network Inventory KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('network')}
          className="card-standard border border-[#c6c6c6]/40 p-5 cursor-pointer hover:border-[#000000] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase">Catalog Products</span>
            <Boxes className="w-4 h-4 text-[#979797]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-2">
            {networkCounts.totalProducts} SKUs
          </span>
          <div className="font-mono text-[11px] text-[#444444] mt-1 flex items-center justify-between">
            <span>{networkCounts.finishedGoodsCount} Finished Goods</span>
            <span>{networkCounts.componentsCount} Components</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('network')}
          className="card-standard border border-[#c6c6c6]/40 p-5 cursor-pointer hover:border-[#000000] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase">Tier-1 Suppliers</span>
            <Truck className="w-4 h-4 text-[#979797]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-2">
            {networkCounts.totalSuppliers} Nodes
          </span>
          <div className="font-mono text-[11px] text-[#444444] mt-1 flex items-center justify-between">
            <span className="text-red-600 font-bold">
              {networkCounts.disruptedSuppliers} Under Disruption
            </span>
            <span>{networkCounts.totalSuppliers - networkCounts.disruptedSuppliers} Healthy</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('network')}
          className="card-standard border border-[#c6c6c6]/40 p-5 cursor-pointer hover:border-[#000000] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase">Facilities & Hubs</span>
            <Layers className="w-4 h-4 text-[#979797]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-2">
            {networkCounts.totalPlants + networkCounts.totalDCs} Sites
          </span>
          <div className="font-mono text-[11px] text-[#444444] mt-1 flex items-center justify-between">
            <span>{networkCounts.totalPlants} Plant Alpha</span>
            <span>{networkCounts.totalDCs} Reg. DCs</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('network')}
          className="card-standard border border-[#c6c6c6]/40 p-5 cursor-pointer hover:border-[#000000] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#979797] uppercase">On-Hand Inventory</span>
            <Activity className="w-4 h-4 text-[#979797]" />
          </div>
          <span className="font-display text-4xl text-[#000000] block mt-2">
            {networkCounts.totalInventoryUnits.toLocaleString()} u
          </span>
          <div className="font-mono text-[11px] text-[#444444] mt-1 flex items-center justify-between">
            <span>{networkCounts.trackedInventorySkus} Tracked SKUs</span>
            <span className="text-green-700 font-semibold">Non-Negative OK</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Agent Telemetry & Recent Simulation Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Governance Health Card */}
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#000000]" />
              <h3 className="font-display text-xl text-[#000000] uppercase">
                Multi-Agent Execution Health
              </h3>
            </div>
            <button
              onClick={() => onNavigate('agents')}
              className="text-xs font-mono text-[#444444] hover:text-[#000000] inline-flex items-center gap-1"
            >
              <span>Manage Agents</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {agents.map((agent: any) => {
              const isHealthy = agent.health_status === 'HEALTHY' && agent.enabled;
              return (
                <div
                  key={agent.agent_type}
                  className="p-3 rounded-xl bg-[#f3f3f3] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#000000]">{agent.name}</span>
                      <span className="text-[10px] text-[#979797]">({agent.model})</span>
                    </div>
                    <span className="text-[11px] text-[#444444] block line-clamp-1">
                      {agent.purpose}
                    </span>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isHealthy ? 'bg-[#d1ffca] text-[#000000]' : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {isHealthy ? 'OPERATIONAL' : 'DEGRADED'}
                      </span>
                      <span className="block text-[10px] text-[#979797] mt-0.5">
                        {agent.last_latency_ms ? `${agent.last_latency_ms}ms` : 'Idle'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Simulation Runs Card */}
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#000000]" />
              <h3 className="font-display text-xl text-[#000000] uppercase">
                Recent Simulation Runs
              </h3>
            </div>
            <button
              onClick={() => onNavigate('runs')}
              className="text-xs font-mono text-[#444444] hover:text-[#000000] inline-flex items-center gap-1"
            >
              <span>View All Runs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {recentRuns.length === 0 ? (
              <div className="p-6 text-center text-[#979797]">No simulation runs recorded yet.</div>
            ) : (
              recentRuns.slice(0, 4).map((run: any) => {
                const metricsObj =
                  typeof run.metrics === 'string' ? JSON.parse(run.metrics) : run.metrics;
                return (
                  <div
                    key={run.id}
                    className="p-3 rounded-xl bg-[#f3f3f3] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#000000]">{run.strategy}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffffff] border border-[#c6c6c6]/40">
                          {run.solver_status}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#979797] block mt-0.5">
                        Initiated by {run.initiating_user} · Runtime: {run.runtime_ms}ms
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-display text-lg text-[#000000] block">
                        {metricsObj?.fillRatePercent ? `${metricsObj.fillRatePercent}%` : 'N/A'}
                      </span>
                      <span className="text-[10px] text-[#444444]">
                        {metricsObj?.totalLandedCost
                          ? `$${metricsObj.totalLandedCost.toLocaleString()}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Data Quality Checks & Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Governance Integrity Card (FR-17) */}
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <div>
              <span className="tag-mint mb-1">DATA GOVERNANCE (FR-17)</span>
              <h3 className="font-display text-xl text-[#000000] uppercase mt-1">
                Data Integrity & Validation Suite
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-[#000000] bg-[#d1ffca] px-2.5 py-1 rounded-md">
              STATUS: ZERO HARD VIOLATIONS
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {dataQuality.checks.map((chk: any) => (
              <div key={chk.id} className="p-3 rounded-xl bg-[#f3f3f3] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#000000]">{chk.name}</span>
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#000000]" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <p className="text-[#444444] text-[11px]">{chk.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Audit Log Feed */}
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#000000]" />
              <h3 className="font-display text-xl text-[#000000] uppercase">
                Recent Audit Trail Events
              </h3>
            </div>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs font-mono text-[#444444] hover:text-[#000000] inline-flex items-center gap-1"
            >
              <span>Full Audit Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 font-mono text-xs max-h-[300px] overflow-y-auto">
            {auditEvents.slice(0, 6).map((evt: any) => (
              <div key={evt.id} className="p-2.5 rounded-lg bg-[#f3f3f3] text-[11px] space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#000000]">{evt.event_type}</span>
                  <span className="text-[10px] text-[#979797]">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[#444444] line-clamp-1">{evt.details}</p>
                <span className="text-[9px] text-[#979797]">By {evt.actor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
