'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminHeader, AdminTab } from '@/components/admin/AdminHeader';
import { OverviewSection } from '@/components/admin/OverviewSection';
import { NetworkSection } from '@/components/admin/NetworkSection';
import { DatasetSection } from '@/components/admin/DatasetSection';
import { DisruptionSection } from '@/components/admin/DisruptionSection';
import { AgentSection } from '@/components/admin/AgentSection';
import { ConstraintSection } from '@/components/admin/ConstraintSection';
import { SimulationRunsSection } from '@/components/admin/SimulationRunsSection';
import { UserAuditSection } from '@/components/admin/UserAuditSection';
import { adminApi, OverviewMetricsResponse } from '@/lib/admin-api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<OverviewMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({
    email: 'admin@sc-resilience.io',
    role: 'ADMIN',
  });

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsRes, meRes] = await Promise.all([
        adminApi.getOverviewMetrics(),
        adminApi.getMe().catch(() => ({ user: { role: 'ADMIN' } })),
      ]);
      setMetrics(metricsRes);
      if (meRes.user) {
        setCurrentUser(meRes.user);
      }
    } catch (err: any) {
      console.error('Failed to load metrics:', err);
      setError(err.message || 'Failed to connect to Neon PostgreSQL database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleResetSeed = async () => {
    try {
      setResetting(true);
      setResetMessage(null);
      await adminApi.resetCanonicalDataset();
      await loadMetrics();
      setResetMessage('Database successfully reset to SEED_2026_SCM_V1 canonical baseline in Neon PostgreSQL.');
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleTriggerRun = async () => {
    if (!metrics?.activeScenario?.id) return;
    try {
      setRunningSimulation(true);
      await adminApi.launchSimulationRun(metrics.activeScenario.id, 'MULTI_AGENT_OPTIMIZATION');
      await loadMetrics();
      setActiveTab('runs');
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setRunningSimulation(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000]">
      {/* Admin Header with Tab Navigation and Telemetry Badges */}
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetVersion={metrics?.dataset?.version || '1.0.0-canonical'}
        seed={metrics?.dataset?.seed || 'SEED_2026_SCM_V1'}
        userRole={currentUser?.role || 'ADMIN'}
        onResetSeed={handleResetSeed}
        resetting={resetting}
      />

      {/* Main Workspace Area */}
      <main className="max-w-[1440px] mx-auto p-4 lg:p-8 space-y-6">
        {resetMessage && (
          <div className="p-4 rounded-2xl bg-[#d1ffca] text-[#000000] font-mono text-xs flex items-center justify-between">
            <span>{resetMessage}</span>
            <button onClick={() => setResetMessage(null)} className="font-bold underline text-[10px]">
              DISMISS
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <OverviewSection
            metrics={metrics}
            loading={loading}
            error={error}
            onNavigate={(tab) => setActiveTab(tab)}
            onTriggerRun={handleTriggerRun}
            runningSimulation={runningSimulation}
          />
        )}

        {activeTab === 'network' && (
          <NetworkSection onRefreshOverview={loadMetrics} />
        )}

        {activeTab === 'datasets' && (
          <DatasetSection onRefreshOverview={loadMetrics} />
        )}

        {activeTab === 'disruption' && (
          <DisruptionSection onRefreshOverview={loadMetrics} />
        )}

        {activeTab === 'agents' && (
          <AgentSection onRefreshOverview={loadMetrics} />
        )}

        {activeTab === 'constraints' && (
          <ConstraintSection onRefreshOverview={loadMetrics} />
        )}

        {activeTab === 'runs' && (
          <SimulationRunsSection onRefreshOverview={loadMetrics} />
        )}

        {activeTab === 'users' && (
          <UserAuditSection onRefreshOverview={loadMetrics} />
        )}
      </main>
    </div>
  );
}
