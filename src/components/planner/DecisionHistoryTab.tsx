'use client';

import { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Database,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import {
  PlannerDecision,
  PlanningRun,
  DisruptionScenario,
} from '@/types/planner-api';
import { formatCurrency } from '@/lib/utils';
import { PlannerTabId } from './PlannerTabsNav';

interface DecisionHistoryTabProps {
  decisions: PlannerDecision[];
  runs: PlanningRun[];
  scenarios: DisruptionScenario[];
  auditEvents: any[];
  onNavigateTab: (tab: PlannerTabId) => void;
}

export function DecisionHistoryTab({
  decisions,
  runs,
  scenarios,
  auditEvents,
  onNavigateTab,
}: DecisionHistoryTabProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'RUNS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDecisions = decisions.filter((d) => {
    if (filterType === 'APPROVED' && d.decision !== 'APPROVED') return false;
    if (filterType === 'REJECTED' && d.decision !== 'REJECTED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.planId.toLowerCase().includes(q) ||
        d.rationale.toLowerCase().includes(q) ||
        d.plannerId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#ffffff] font-mono text-[10px] font-bold uppercase">
                AUDIT & COMPLIANCE
              </span>
              <span className="font-mono text-xs text-[#979797]">
                IMMUTABLE PERSISTENCE IN NEON POSTGRESQL
              </span>
            </div>
            <h2 className="font-display text-2xl uppercase tracking-tight text-[#000000]">
              Saved Scenarios & Decision Audit History
            </h2>
            <p className="font-mono text-xs text-[#444444] max-w-2xl leading-relaxed">
              Trace previous operational scenarios, inspect completed solver runs, review human planner
              authorizations and budget deltas, and reopen past recovery plans.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('recovery')}
              className="btn-dark text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>Reopen Active Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="card-standard border border-[#c6c6c6]/50 p-4 bg-[#ffffff] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-[#979797]" />
          <input
            type="text"
            placeholder="Search by Plan ID, rationale, or decider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#f3f3f3] px-3 py-1.5 rounded-xl border border-[#c6c6c6] w-full sm:w-72 text-[#000000]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-[#979797] text-[10px] uppercase mr-1">Filter:</span>
          {(['ALL', 'APPROVED', 'REJECTED', 'RUNS'] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                filterType === ft
                  ? 'bg-[#000000] text-[#ffffff]'
                  : 'bg-[#f3f3f3] text-[#444444] hover:bg-[#e5e5e5]'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Planner Decision Records List */}
      {filterType !== 'RUNS' && (
        <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">
                Planner Governance Authorizations ({filteredDecisions.length})
              </h3>
              <span className="font-mono text-[10px] text-[#979797]">
                HUMAN DECISIONS LOGGED PER CONTRACT PRD §14.5
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {filteredDecisions.length === 0 ? (
              <div className="p-8 text-center text-[#979797]">
                No decision records match the current filter.
              </div>
            ) : (
              filteredDecisions.map((decision, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#c6c6c6]/50 bg-[#f3f3f3]/50 space-y-2 hover:bg-[#f3f3f3] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          decision.decision === 'APPROVED'
                            ? 'bg-[#d1ffca] text-[#000000]'
                            : 'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}
                      >
                        {decision.decision}
                      </span>
                      <span className="font-bold text-[#000000]">Plan: {decision.planId}</span>
                      <span className="text-[#979797] text-[10px]">({decision.runId})</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#444444]">
                      <span>
                        Delta: <strong>{formatCurrency(decision.authorizedBudgetDelta)}</strong>
                      </span>
                      <span className="text-[#979797]">
                        {decision.timestamp?.replace('T', ' ').slice(0, 19)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[#444444] text-[11px] leading-relaxed italic">
                    &quot;{decision.rationale}&quot;
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-[#979797] border-t border-[#c6c6c6]/30">
                    <span>Authorized By: <strong>{decision.plannerId}</strong></span>
                    <button
                      onClick={() => onNavigateTab('recovery')}
                      className="text-[#000000] underline font-semibold hover:text-[#000000]"
                    >
                      Inspect Plan Details →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Previous Planning Runs Table */}
      {(filterType === 'ALL' || filterType === 'RUNS') && (
        <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">
                Persisted Planning Runs ({runs.length})
              </h3>
              <span className="font-mono text-[10px] text-[#979797]">
                MULTI-AGENT & SOLVER RUN HISTORY
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#c6c6c6] text-[#979797] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Scenario ID</th>
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Solver</th>
                  <th className="py-2.5 px-3">Fill Rate</th>
                  <th className="py-2.5 px-3">Total Cost</th>
                  <th className="py-2.5 px-3">Runtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {runs.map((r) => (
                  <tr key={r.runId} className="hover:bg-[#f3f3f3]/50">
                    <td className="py-3 px-3 font-bold text-[#000000]">{r.runId}</td>
                    <td className="py-3 px-3 text-[#979797]">{r.scenarioId}</td>
                    <td className="py-3 px-3">{r.strategy.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'COMPLETED'
                            ? 'bg-[#d1ffca] text-[#000000]'
                            : 'bg-[#fff100] text-[#000000]'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#000000]">{r.solverStatus}</td>
                    <td className="py-3 px-3 font-bold">
                      {r.metrics ? `${r.metrics.fillRatePercent}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      {r.metrics ? formatCurrency(r.metrics.totalLandedCost) : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-[#979797]">
                      {r.runtime?.totalMs || 1000}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Neon Database Audit Events Trail */}
      {auditEvents?.length > 0 && (
        <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">
                Raw Database Audit Log (`audit_events` Table)
              </h3>
              <span className="font-mono text-[10px] text-[#979797]">
                SYSTEM INTEGRITY & TRANSACTION RECORD
              </span>
            </div>
            <Database className="w-4 h-4 text-[#979797]" />
          </div>

          <div className="space-y-2 font-mono text-xs max-h-56 overflow-y-auto">
            {auditEvents.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="p-3 rounded-lg bg-[#f3f3f3] text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#979797] text-[10px]">
                    {evt.timestamp?.replace('T', ' ').slice(0, 19)}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#000000] text-[#ffffff] font-bold text-[9px] uppercase">
                    {evt.event_type}
                  </span>
                  <span className="font-semibold text-[#000000]">
                    {evt.actor} ({evt.role})
                  </span>
                  <span className="text-[#444444]">— {evt.details}</span>
                </div>
                <span className="text-[#979797] text-[10px] shrink-0">
                  Target: {evt.target_entity} / {evt.target_id}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
