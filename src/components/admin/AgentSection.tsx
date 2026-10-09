'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings,
  ShieldCheck,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  FileCode,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface AgentSectionProps {
  onRefreshOverview: () => void;
}

export function AgentSection({ onRefreshOverview }: AgentSectionProps) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit agent modal state
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    model: 'gemini-1.5-pro',
    temperature: 0.2,
    timeout_seconds: 30,
    max_retries: 3,
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  // Diagnostic test state
  const [testingAgentType, setTestingAgentType] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Proposal view modal
  const [selectedAgentProposals, setSelectedAgentProposals] = useState<{
    agentName: string;
    proposals: any[];
  } | null>(null);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAgents();
      setAgents(res.agents || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleOpenEdit = (agent: any) => {
    setEditingAgent(agent);
    setEditForm({
      model: agent.model || 'gemini-1.5-pro',
      temperature: parseFloat(agent.temperature) || 0.2,
      timeout_seconds: agent.timeout_seconds || 30,
      max_retries: agent.max_retries || 3,
      enabled: agent.enabled !== false,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    try {
      setSaving(true);
      await adminApi.updateAgent(editingAgent.agent_type, editForm);
      setEditingAgent(null);
      setNotification({
        type: 'success',
        message: `Agent configuration for ${editingAgent.name} saved to database.`,
      });
      loadAgents();
      onRefreshOverview();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRunDiagnostic = async (agentType: string) => {
    try {
      setTestingAgentType(agentType);
      setTestResult(null);
      const res = await adminApi.testAgent(agentType);
      setTestResult({
        agentType,
        ...res,
      });
      setNotification({
        type: 'success',
        message: `Diagnostic run completed for ${agentType} in ${res.latencyMs}ms. Status: ${res.healthStatus}.`,
      });
      loadAgents();
      onRefreshOverview();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setTestingAgentType(null);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="card-standard border border-[#c6c6c6]/50 p-12 text-center font-mono text-xs">
        Loading agent governance configurations from Neon PostgreSQL...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification banner */}
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

      {/* Header Card */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="tag-mint mb-1">GOOGLE ADK & GEMINI ORCHESTRATION</span>
          <h2 className="font-display text-2xl lg:text-3xl text-[#000000] uppercase mt-1">
            Multi-Agent Governance & Proposal Validator
          </h2>
          <p className="font-body text-xs text-[#444444] mt-1">
            Control specialized reasoning agents across Demand, Inventory, Supplier-Risk, and Logistics echelons.
            Outputs are deterministically validated before passing to the OR-Tools optimization engine.
          </p>
        </div>

        <button
          onClick={loadAgents}
          className="btn-ghost inline-flex items-center gap-2 text-xs py-2 px-3 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const isOperational = agent.health_status === 'HEALTHY' && agent.enabled;
          const proposals = agent.recentProposals || [];

          return (
            <div
              key={agent.agent_type}
              className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-[#979797] uppercase">
                      ROLE: {agent.agent_type}
                    </span>
                    <h3 className="font-display text-xl text-[#000000] uppercase">
                      {agent.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold ${
                      isOperational ? 'bg-[#d1ffca] text-[#000000]' : 'bg-red-200 text-red-900'
                    }`}
                  >
                    {isOperational ? 'HEALTHY' : 'DEGRADED / DISABLED'}
                  </span>
                </div>

                <p className="font-mono text-xs text-[#444444] leading-relaxed">
                  {agent.purpose}
                </p>

                {/* Parameters bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#f3f3f3] font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-[#f3f3f3]">
                    <span className="text-[#979797] block text-[9px] uppercase">LLM Model</span>
                    <span className="font-bold text-[#000000]">{agent.model}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#f3f3f3]">
                    <span className="text-[#979797] block text-[9px] uppercase">Temperature</span>
                    <span className="font-bold text-[#000000]">{agent.temperature}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#f3f3f3]">
                    <span className="text-[#979797] block text-[9px] uppercase">Timeout</span>
                    <span className="font-bold text-[#000000]">{agent.timeout_seconds}s</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#f3f3f3]">
                    <span className="text-[#979797] block text-[9px] uppercase">Max Retries</span>
                    <span className="font-bold text-[#000000]">{agent.max_retries}</span>
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[#979797] pt-1">
                  <span>
                    Last latency: {agent.last_latency_ms ? `${agent.last_latency_ms}ms` : 'None'}
                  </span>
                  <span>Failures: {agent.failure_count}</span>
                  <span>
                    Proposals generated: <strong className="text-[#000000]">{proposals.length}</strong>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#f3f3f3]">
                <button
                  onClick={() =>
                    setSelectedAgentProposals({
                      agentName: agent.name,
                      proposals,
                    })
                  }
                  className="text-xs font-mono text-[#444444] hover:text-[#000000] inline-flex items-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Inspect Proposals ({proposals.length})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunDiagnostic(agent.agent_type)}
                    disabled={testingAgentType === agent.agent_type}
                    className="btn-ghost text-xs py-1.5 px-3 inline-flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{testingAgentType === agent.agent_type ? 'Testing...' : 'Test Health'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(agent)}
                    className="btn-dark text-xs py-1.5 px-3 inline-flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostic Test Output Display */}
      {testResult && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#f3f3f3]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#000000]" />
              <h4 className="font-display text-lg uppercase">
                Diagnostic Health Check: {testResult.agentType}
              </h4>
            </div>
            <span className="text-[#979797]">Execution latency: {testResult.latencyMs}ms</span>
          </div>

          <div className="p-4 rounded-xl bg-[#f3f3f3] space-y-2">
            <span className="font-bold text-[#000000] block">Schema Validation Suite:</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              {Object.entries(testResult.diagnostics.schemaValidation).map(([k, v]: [string, any]) => (
                <div key={k} className="p-2 rounded bg-white flex justify-between">
                  <span className="text-[#444444]">{k}</span>
                  <span className="font-bold text-green-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f3f3]">
              <div>
                <span className="font-mono text-[10px] text-[#979797] uppercase">
                  AGENT CONFIGURATION
                </span>
                <h4 className="font-display text-xl text-[#000000] uppercase">
                  {editingAgent.name}
                </h4>
              </div>
              <button
                onClick={() => setEditingAgent(null)}
                className="text-xs font-mono text-[#979797] hover:text-[#000000]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#444444] mb-1">Model Engine:</label>
                <select
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono"
                >
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (High Reasoning Capacity)</option>
                  <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra-Low Latency)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[#444444]">Temperature (Deterministic Bound):</label>
                  <span className="font-bold text-[#000000]">{editForm.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editForm.temperature}
                  onChange={(e) =>
                    setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full accent-black"
                />
                <span className="text-[10px] text-[#979797] block">
                  Values &le; 0.20 guarantee reproducible supply chain decision outputs.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#444444] mb-1">Timeout (Sec):</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={editForm.timeout_seconds}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        timeout_seconds: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#444444] mb-1">Max Retries:</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editForm.max_retries}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        max_retries: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agent-enabled"
                  checked={editForm.enabled}
                  onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                  className="rounded accent-black"
                />
                <label htmlFor="agent-enabled" className="text-[#000000] font-bold cursor-pointer">
                  Agent Active & Enabled in Orchestration Pipeline
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f3f3f3]">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-dark text-xs py-1.5 px-4"
                >
                  {saving ? 'Persisting...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proposals Drawer / Modal */}
      {selectedAgentProposals && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-2xl w-full max-h-[80vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f3f3]">
              <div>
                <span className="font-mono text-[10px] text-[#979797] uppercase">
                  AGENT PROPOSAL AUDIT INSPECTOR
                </span>
                <h4 className="font-display text-xl text-[#000000] uppercase">
                  {selectedAgentProposals.agentName} Proposals
                </h4>
              </div>
              <button
                onClick={() => setSelectedAgentProposals(null)}
                className="text-xs font-mono text-[#979797] hover:text-[#000000]"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 font-mono text-xs pr-1">
              {selectedAgentProposals.proposals.length === 0 ? (
                <div className="p-8 text-center text-[#979797]">
                  No structured proposals recorded yet for this agent.
                </div>
              ) : (
                selectedAgentProposals.proposals.map((prop: any) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-2xl bg-[#f3f3f3] space-y-2 border border-[#c6c6c6]/40"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#000000] block text-sm">
                          {prop.action_summary}
                        </span>
                        <span className="text-[10px] text-[#979797]">
                          Action Type: {prop.action_type} · Confidence: {prop.confidence_score * 100}%
                        </span>
                      </div>
                      <span className="tag-mint text-[10px]">
                        {prop.validation_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#c6c6c6]/20">
                      <div>
                        <span className="text-[#979797] block">Expected Cost Delta:</span>
                        <span className="font-bold text-[#000000]">
                          +${Number(prop.expected_cost_delta).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#979797] block">Benefits:</span>
                        <span className="text-[#444444]">{prop.expected_benefits || 'Mitigates stockout'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#f3f3f3]">
              <button
                onClick={() => setSelectedAgentProposals(null)}
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
