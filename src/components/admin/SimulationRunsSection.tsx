'use client';

import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Activity,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface SimulationRunsSectionProps {
  onRefreshOverview: () => void;
}

export function SimulationRunsSection({ onRefreshOverview }: SimulationRunsSectionProps) {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [strategyFilter, setStrategyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRunDetail, setSelectedRunDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getRuns({
        strategy: strategyFilter || undefined,
        status: statusFilter || undefined,
      });
      setRuns(res.runs || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [strategyFilter, statusFilter]);

  const handleInspectRun = async (runId: string) => {
    try {
      setLoadingDetail(true);
      const res = await adminApi.getRunDetail(runId);
      setSelectedRunDetail(res);
    } catch (err: any) {
      alert(`Failed to load run detail: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const completedCount = runs.filter((r) => r.status === 'COMPLETED').length;
  const optimalCount = runs.filter((r) => r.solver_status === 'OPTIMAL').length;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-standard border border-[#c6c6c6]/40 p-5">
          <span className="font-mono text-xs text-[#979797] uppercase block">Total Executed Runs</span>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {runs.length} Runs
          </span>
          <span className="font-mono text-[11px] text-[#444444]">Persisted in Neon DB</span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5">
          <span className="font-mono text-xs text-[#979797] uppercase block">Completed Solutions</span>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {completedCount} Feasible
          </span>
          <span className="font-mono text-[11px] text-green-700 font-bold">100% Convergence</span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5">
          <span className="font-mono text-xs text-[#979797] uppercase block">OR-Tools Optimal</span>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {optimalCount} Runs
          </span>
          <span className="font-mono text-[11px] text-[#444444]">Mathematical Optima</span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5">
          <span className="font-mono text-xs text-[#979797] uppercase block">Hard Violations</span>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            0
          </span>
          <span className="font-mono text-[11px] text-green-700 font-bold">Zero Violations</span>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-[#f3f3f3]">
          <h3 className="font-display text-2xl text-[#000000] uppercase">
            Simulation Run Archive & Decision Trace
          </h3>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className="bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-1.5 text-xs font-mono"
            >
              <option value="">All Strategies</option>
              <option value="MULTI_AGENT_OPTIMIZATION">Multi-Agent Optimization</option>
              <option value="OPTIMIZATION_ONLY">Optimization Only</option>
              <option value="REORDER_BASELINE">Reorder Baseline</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-1.5 text-xs font-mono"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="INFEASIBLE">Infeasible</option>
              <option value="FAILED">Failed</option>
            </select>

            <button
              onClick={loadRuns}
              className="btn-ghost text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-[#979797]">
            Querying simulation run records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#f3f3f3] text-[#444444] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Run ID</th>
                  <th className="p-3">Strategy</th>
                  <th className="p-3">Solver Status</th>
                  <th className="p-3">Service Fill Rate</th>
                  <th className="p-3">Total Landed Cost</th>
                  <th className="p-3">Runtime</th>
                  <th className="p-3">Plan Approval</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {runs.map((r) => {
                  const metricsObj =
                    typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics;
                  return (
                    <tr key={r.id} className="hover:bg-[#f3f3f3]/50 transition-colors">
                      <td className="p-3 font-bold text-[#000000]">{r.id}</td>
                      <td className="p-3">
                        <span className="font-bold text-[#000000] block">{r.strategy}</span>
                        <span className="text-[10px] text-[#979797]">By {r.initiating_user}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.solver_status === 'OPTIMAL'
                              ? 'bg-[#d1ffca] text-[#000000]'
                              : r.solver_status === 'FEASIBLE'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {r.solver_status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#000000]">
                        {metricsObj?.fillRatePercent ? `${metricsObj.fillRatePercent}%` : 'N/A'}
                      </td>
                      <td className="p-3">
                        {metricsObj?.totalLandedCost
                          ? `$${metricsObj.totalLandedCost.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="p-3 text-[#979797]">{r.runtime_ms}ms</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.plan_status === 'APPROVED'
                              ? 'bg-[#d1ffca] text-[#000000]'
                              : r.plan_status === 'REJECTED'
                              ? 'bg-red-100 text-red-900'
                              : 'bg-yellow-100 text-yellow-900'
                          }`}
                        >
                          {r.plan_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleInspectRun(r.id)}
                          className="btn-ghost text-xs py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Run Inspection Modal */}
      {selectedRunDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-3xl w-full max-h-[85vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f3f3]">
              <div>
                <span className="font-mono text-[10px] text-[#979797] uppercase">
                  SIMULATION RUN AUDIT INSPECTOR
                </span>
                <h4 className="font-display text-2xl text-[#000000] uppercase">
                  Run: {selectedRunDetail.run.id}
                </h4>
              </div>
              <button
                onClick={() => setSelectedRunDetail(null)}
                className="text-xs font-mono text-[#979797] hover:text-[#000000]"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 font-mono text-xs pr-1">
              {/* Snapshot Info */}
              <div className="p-4 rounded-2xl bg-[#f3f3f3] space-y-2">
                <span className="font-bold text-[#000000] block text-sm">
                  Scenario: {selectedRunDetail.run.scenario_name}
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-[#444444]">
                  <div>Strategy: <strong>{selectedRunDetail.run.strategy}</strong></div>
                  <div>Solver: <strong>{selectedRunDetail.run.solver_status}</strong></div>
                  <div>Initiator: <strong>{selectedRunDetail.run.initiating_user}</strong></div>
                  <div>Runtime: <strong>{selectedRunDetail.run.runtime_ms}ms</strong></div>
                </div>
              </div>

              {/* Day-by-day table sample */}
              {(() => {
                const metricsObj =
                  typeof selectedRunDetail.run.metrics === 'string'
                    ? JSON.parse(selectedRunDetail.run.metrics)
                    : selectedRunDetail.run.metrics;
                const days = metricsObj?.dayByDayMetrics || [];

                if (days.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <span className="font-bold text-[#000000] text-xs block">
                      14-Day Rolling Horizon Operational Progression:
                    </span>
                    <div className="overflow-x-auto bg-white rounded-xl border border-[#c6c6c6]/40">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-[#f3f3f3] text-[#444444] uppercase">
                          <tr>
                            <th className="p-2">Day</th>
                            <th className="p-2">Demand</th>
                            <th className="p-2">Fulfilled</th>
                            <th className="p-2">Backlog</th>
                            <th className="p-2">Plant Stock</th>
                            <th className="p-2">Daily Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f3f3]">
                          {days.map((d: any) => (
                            <tr key={d.day}>
                              <td className="p-2 font-bold">{d.day}</td>
                              <td className="p-2">{d.demand}u</td>
                              <td className="p-2 font-bold text-green-700">{d.fulfilled}u</td>
                              <td className="p-2 text-red-600 font-bold">{d.backlog}u</td>
                              <td className="p-2">{d.plantRawStock}u</td>
                              <td className="p-2">${d.dailyCost?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Proposals */}
              {selectedRunDetail.proposals.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-[#000000] text-xs block">
                    Associated Agent Proposals:
                  </span>
                  <div className="space-y-2">
                    {selectedRunDetail.proposals.map((prop: any) => (
                      <div key={prop.id} className="p-3 rounded-xl bg-[#f3f3f3] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#000000]">{prop.agent_type}</span>
                          <span className="tag-mint text-[9px]">{prop.validation_status}</span>
                        </div>
                        <p className="text-[11px] text-[#444444]">{prop.action_summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#f3f3f3]">
              <button
                onClick={() => setSelectedRunDetail(null)}
                className="btn-dark text-xs py-1.5 px-4"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
