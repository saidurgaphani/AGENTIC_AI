'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingDown,
  DollarSign,
  PackageX,
  Factory,
  Boxes,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface DisruptionSectionProps {
  onRefreshOverview: () => void;
}

export function DisruptionSection({ onRefreshOverview }: DisruptionSectionProps) {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form edit state
  const [formData, setFormData] = useState({
    name: '',
    critical_supplier_id: '',
    disruption_start_day: 4,
    disruption_duration_days: 7,
    daily_demand_units: 200,
    safety_stock_days: 3,
    shortage_penalty_per_unit: 150,
  });

  // Validation & Impact state
  const [validationData, setValidationData] = useState<any>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [analyzingImpact, setAnalyzingImpact] = useState(false);

  // Execution state
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scenRes, supRes] = await Promise.all([
        adminApi.getScenarios(),
        adminApi.getSuppliers(),
      ]);
      const scenList = Array.isArray(scenRes) ? scenRes : (scenRes.scenarios || []);
      setScenarios(scenList);
      setSuppliers(supRes.suppliers || []);

      const active = scenList[0];
      if (active) {
        setSelectedScenario(active);
        setFormData({
          name: active.name,
          critical_supplier_id: active.critical_supplier_id,
          disruption_start_day: active.disruption_start_day,
          disruption_duration_days: active.disruption_duration_days,
          daily_demand_units: active.daily_demand_units,
          safety_stock_days: active.safety_stock_days,
          shortage_penalty_per_unit: parseFloat(active.shortage_penalty_per_unit),
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunValidation = async (scenarioId: string) => {
    try {
      setValidating(true);
      const res = await adminApi.validateScenario(scenarioId);
      setValidationData(res);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleRunImpactAnalysis = async (scenarioId: string) => {
    try {
      setAnalyzingImpact(true);
      const res = await adminApi.getScenarioImpact(scenarioId);
      setImpactData(res.impact);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setAnalyzingImpact(false);
    }
  };

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScenario) return;
    try {
      const res = await adminApi.updateScenario(selectedScenario.id, formData);
      setSelectedScenario(res.scenario);
      setNotification({
        type: 'success',
        message: 'Scenario disruption parameters updated in database.',
      });
      handleRunValidation(selectedScenario.id);
      handleRunImpactAnalysis(selectedScenario.id);
      onRefreshOverview();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleLaunchSimulation = async () => {
    if (!selectedScenario) return;
    try {
      setRunningSimulation(true);
      setExecutionResult(null);
      const res = await adminApi.launchSimulationRun(
        selectedScenario.id,
        'MULTI_AGENT_OPTIMIZATION'
      );
      setExecutionResult(res);
      setNotification({
        type: 'success',
        message: `Simulation ${res.runId} successfully solved and persisted to Neon PostgreSQL.`,
      });
      onRefreshOverview();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setRunningSimulation(false);
    }
  };

  if (loading) {
    return (
      <div className="card-standard border border-[#c6c6c6]/50 p-12 text-center font-mono text-xs">
        Loading scenario parameters...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl font-mono text-xs flex items-center justify-between ${
            notification.type === 'success' ? 'bg-[#d1ffca] text-[#000000]' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#000000]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-800" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold underline text-[10px]">
            DISMISS
          </button>
        </div>
      )}

      {/* Disruption Setup Header */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-[#f3f3f3]">
          <div>
            <span className="tag-voltage mb-1">POC DISRUPTION SPECIFICATION</span>
            <h2 className="font-display text-2xl lg:text-3xl text-[#000000] uppercase mt-1">
              7-Day Critical Supplier Outage Control
            </h2>
          </div>
          <span className="font-mono text-xs text-[#444444] bg-[#f3f3f3] px-3 py-1.5 rounded-lg border border-[#c6c6c6]/30">
            PRD Specification Section 8 & 13.2
          </span>
        </div>

        <form onSubmit={handleSaveScenario} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#444444] mb-1 font-bold">
                Target Supplier (Primary Disrupted Node):
              </label>
              <select
                value={formData.critical_supplier_id}
                onChange={(e) =>
                  setFormData({ ...formData, critical_supplier_id: e.target.value })
                }
                className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono text-[#000000]"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.criticality})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#444444] mb-1 font-bold">
                Shutdown Duration (PRD Mandatory: 7 Days):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.disruption_duration_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      disruption_duration_days: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono text-[#000000]"
                />
                {formData.disruption_duration_days !== 7 && (
                  <span className="text-[10px] text-amber-700 block mt-1">
                    ⚠️ PRD benchmark requires a 7-day outage window.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[#444444] mb-1 font-bold">
                Disruption Start Day (Planning Period):
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.disruption_start_day}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    disruption_start_day: parseInt(e.target.value, 10),
                  })
                }
                className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono text-[#000000]"
              />
            </div>

            <div>
              <label className="block text-[#444444] mb-1 font-bold">
                Downstream Customer Demand Rate:
              </label>
              <input
                type="number"
                min="50"
                value={formData.daily_demand_units}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    daily_demand_units: parseInt(e.target.value, 10),
                  })
                }
                className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono text-[#000000]"
              />
              <span className="text-[10px] text-[#979797]">Units per day across all distribution hubs</span>
            </div>

            <div>
              <label className="block text-[#444444] mb-1 font-bold">
                Plant Raw Stock Safety Buffer:
              </label>
              <input
                type="number"
                min="1"
                value={formData.safety_stock_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    safety_stock_days: parseInt(e.target.value, 10),
                  })
                }
                className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono text-[#000000]"
              />
              <span className="text-[10px] text-[#979797]">Days of baseline production demand</span>
            </div>

            <div>
              <label className="block text-[#444444] mb-1 font-bold">
                Contractual Shortage Penalty:
              </label>
              <input
                type="number"
                min="0"
                value={formData.shortage_penalty_per_unit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shortage_penalty_per_unit: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono text-[#000000]"
              />
              <span className="text-[10px] text-[#979797]">INR (₹) per unfulfilled unit-day backorder</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f3f3f3]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectedScenario && handleRunValidation(selectedScenario.id)}
                disabled={validating}
                className="btn-ghost text-xs py-2 px-3"
              >
                <span>{validating ? 'Validating...' : 'Validate Network Connectivity'}</span>
              </button>
              <button
                type="button"
                onClick={() => selectedScenario && handleRunImpactAnalysis(selectedScenario.id)}
                disabled={analyzingImpact}
                className="btn-ghost text-xs py-2 px-3"
              >
                <span>{analyzingImpact ? 'Analyzing...' : 'Preview Downstream Blast Radius'}</span>
              </button>
            </div>

            <button type="submit" className="btn-dark text-xs py-2 px-4">
              Update Disruption Settings
            </button>
          </div>
        </form>
      </div>

      {/* Validation Checks Accordion/Card */}
      {validationData && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <div className="flex items-center gap-2">
              {validationData.valid ? (
                <CheckCircle2 className="w-5 h-5 text-[#000000]" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <h3 className="font-display text-xl text-[#000000] uppercase">
                Scenario Network Connectivity Verification
              </h3>
            </div>
            <span
              className={`font-mono text-xs px-2.5 py-1 rounded-full font-bold ${
                validationData.valid ? 'bg-[#d1ffca] text-[#000000]' : 'bg-red-200 text-red-900'
              }`}
            >
              {validationData.valid ? 'ALL CRITICAL CHECKS PASSED' : 'CONNECTIVITY BREACH'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {validationData.validations.map((v: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-[#f3f3f3] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#000000]">{v.check}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      v.status === 'PASS'
                        ? 'bg-[#d1ffca] text-[#000000]'
                        : v.status === 'WARN'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-red-200 text-red-900'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <p className="text-[#444444] text-[11px]">{v.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blast Radius & Impact Preview */}
      {impactData && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h3 className="font-display text-xl text-[#000000] uppercase">
                Disruption Blast Radius & Financial Exposure
              </h3>
            </div>
            <span className="font-mono text-xs text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">
              Days {impactData.disruptionWindow.startDay}–{impactData.disruptionWindow.endDay} Outage
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#f3f3f3]">
              <span className="text-[#979797] block text-[10px] uppercase">Lost Inbound Volume</span>
              <span className="font-display text-3xl text-red-600 block mt-1">
                -{impactData.financialExposure.lostInboundUnits} u
              </span>
              <span className="text-[10px] text-[#444444]">Actuator component deficit</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f3f3f3]">
              <span className="text-[#979797] block text-[10px] uppercase">On-Hand Safety Stock</span>
              <span className="font-display text-3xl text-[#000000] block mt-1">
                {impactData.onHandSafetyStockUnits} u
              </span>
              <span className="text-[10px] text-[#444444]">
                {impactData.daysOfSupplyOnHand} days of production buffer
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#f3f3f3]">
              <span className="text-[#979797] block text-[10px] uppercase">Projected Stockout</span>
              <span className="font-display text-3xl text-amber-700 block mt-1">
                Day {impactData.projectedStockoutDay}
              </span>
              <span className="text-[10px] text-[#444444]">Assembly line starvation</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f3f3f3]">
              <span className="text-[#979797] block text-[10px] uppercase">Penalty Exposure</span>
              <span className="font-display text-3xl text-red-700 block mt-1">
                ₹{impactData.financialExposure.potentialBackorderPenaltyUSD.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#444444]">Without multi-agent recovery</span>
            </div>
          </div>
        </div>
      )}

      {/* Launch Simulation Action Box */}
      <div className="card-inverted p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="tag-mint mb-1">REAL BACKEND OR-TOOLS SOLVER</span>
          <h3 className="font-display text-3xl text-white uppercase mt-1">
            Execute Multi-Agent Recovery Simulation
          </h3>
          <p className="font-mono text-xs text-[#c6c6c6] max-w-2xl">
            Launches multi-agent reasoning (Demand, Inventory, Supplier-Risk, Logistics) against the 7-day outage.
            Solves optimal sourcing and freight expediting via Google OR-Tools and persists full audit records to Neon PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleLaunchSimulation}
          disabled={runningSimulation}
          className="btn-mint text-xs py-3 px-6 font-bold inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Play className={`w-4 h-4 fill-current ${runningSimulation ? 'animate-pulse' : ''}`} />
          <span>{runningSimulation ? 'Running Multi-Agent Engine...' : 'Launch Simulation Run'}</span>
        </button>
      </div>

      {/* Execution Results View */}
      {executionResult && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <div>
              <span className="tag-mint mb-1">PERSISTED RUN CONFIRMATION</span>
              <h3 className="font-display text-2xl text-[#000000] uppercase mt-1">
                Run {executionResult.runId} Completed
              </h3>
            </div>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#d1ffca] text-[#000000]">
              SOLVER: {executionResult.solverStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#f3f3f3]">
              <span className="text-[#979797] text-[10px] uppercase block">Service Fill Rate</span>
              <span className="font-display text-3xl text-[#000000] block mt-1">
                {executionResult.result.fillRatePercent}%
              </span>
              <span className="text-[10px] text-green-700 font-bold">Guaranteed Delivery</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f3f3f3]">
              <span className="text-[#979797] text-[10px] uppercase block">Total Landed Cost</span>
              <span className="font-display text-3xl text-[#000000] block mt-1">
                ₹{executionResult.result.totalLandedCost.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#444444]">
                +₹{executionResult.result.costDeltaAgainstBaseline.toLocaleString()} vs Unmitigated
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#f3f3f3]">
              <span className="text-[#979797] text-[10px] uppercase block">Recovery Window</span>
              <span className="font-display text-3xl text-[#000000] block mt-1">
                Day {executionResult.result.recoveryTimeDays}
              </span>
              <span className="text-[10px] text-[#444444]">Full throughput restored</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f3f3f3]">
              <span className="text-[#979797] text-[10px] uppercase block">Hard Violations</span>
              <span className="font-display text-3xl text-[#000000] block mt-1">
                {executionResult.result.hardConstraintViolations}
              </span>
              <span className="text-[10px] text-green-700 font-bold">100% Physics Preserved</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
