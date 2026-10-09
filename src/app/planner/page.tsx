'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  checkBackendHealth,
  fetchCurrentUser,
  fetchOverviewMetrics,
  fetchScenarios,
  fetchDisruptionImpact,
  fetchEvaluationComparison,
  fetchRuns,
  fetchRunEvents,
  fetchRunProposals,
  fetchRunPlan,
  fetchDecisionHistory,
  fetchSuppliers,
  fetchProducts,
  createScenario,
  updateScenario,
  startPlanningRuns,
  ApiError,
  OverviewMetricsResponse,
} from '@/lib/planner-api';
import {
  DisruptionScenario,
  DisruptionImpact,
  EvaluationComparison,
  PlanningRun,
  RunEvent,
  AgentProposal,
  RecoveryPlan,
  PlannerDecision,
  Supplier,
  Product,
  AppUser,
} from '@/types/planner-api';

import { PlannerHeader } from '@/components/planner/PlannerHeader';
import { PlannerTabsNav, PlannerTabId } from '@/components/planner/PlannerTabsNav';
import { OverviewTab } from '@/components/planner/OverviewTab';
import { DisruptionExplorerTab } from '@/components/planner/DisruptionExplorerTab';
import { RecoveryIntelligenceTab } from '@/components/planner/RecoveryIntelligenceTab';
import { ScenarioComparisonTab } from '@/components/planner/ScenarioComparisonTab';
import { PlanReviewTab } from '@/components/planner/PlanReviewTab';
import { DecisionHistoryTab } from '@/components/planner/DecisionHistoryTab';
import { NewScenarioModal } from '@/components/planner/NewScenarioModal';
import { ErrorState, LoadingSkeleton } from '@/components/planner/ErrorState';

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<PlannerTabId>('overview');

  // Core Data States
  const [scenarios, setScenarios] = useState<DisruptionScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCN-POC-001-CANONICAL');
  const [metrics, setMetrics] = useState<OverviewMetricsResponse | null>(null);
  const [impact, setImpact] = useState<DisruptionImpact | null>(null);
  const [comparison, setComparison] = useState<EvaluationComparison | null>(null);
  const [latestRun, setLatestRun] = useState<PlanningRun | null>(null);
  const [runEvents, setRunEvents] = useState<RunEvent[]>([]);
  const [proposals, setProposals] = useState<AgentProposal[]>([]);
  const [pendingPlan, setPendingPlan] = useState<RecoveryPlan | null>(null);
  const [decisions, setDecisions] = useState<PlannerDecision[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser>({
    userId: 'usr-planner-01',
    displayName: 'Elena Rostova',
    email: 'elena.rostova@manufacturing.corp',
    role: 'SUPPLY_CHAIN_PLANNER',
    active: true,
  });

  const [backendHealth, setBackendHealth] = useState({
    connected: true,
    status: 'ONLINE',
    latencyMs: 14,
    database: 'Neon PostgreSQL',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState<boolean>(false);

  // Load all initial workspace data
  const loadWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Check Backend Health
      const health = await checkBackendHealth();
      setBackendHealth({
        connected: health.connected,
        status: health.status,
        latencyMs: health.latencyMs,
        database: health.database || 'Neon PostgreSQL',
      });

      // 2. Fetch User & Scenarios in parallel
      const [userRes, scList, supps, prods] = await Promise.all([
        fetchCurrentUser().catch(() => currentUser),
        fetchScenarios().catch(() => []),
        fetchSuppliers().catch(() => []),
        fetchProducts().catch(() => []),
      ]);

      if (userRes) setCurrentUser(userRes);
      if (scList && scList.length > 0) {
        setScenarios(scList);
        // Default to first scenario or canonical
        const activeSc = scList.find((s) => s.id === selectedScenarioId) || scList[0];
        setSelectedScenarioId(activeSc.id);
      }
      setSuppliers(supps);
      setProducts(prods);

      // 3. Load Metrics & Scenario specific data
      const currentScId = selectedScenarioId || (scList[0]?.id ?? 'SCN-POC-001-CANONICAL');
      const [overviewRes, impactRes, compRes, runsList, decList] = await Promise.all([
        fetchOverviewMetrics().catch(() => null),
        fetchDisruptionImpact(currentScId).catch(() => null),
        fetchEvaluationComparison(currentScId).catch(() => null),
        fetchRuns(currentScId).catch(() => []),
        fetchDecisionHistory(currentScId).catch(() => []),
      ]);

      setMetrics(overviewRes);
      setImpact(impactRes);
      setComparison(compRes);
      setDecisions(decList);

      // 4. Fetch details for latest run
      if (runsList && runsList.length > 0) {
        const topRun = runsList.find((r) => r.strategy === 'MULTI_AGENT_OPTIMIZATION') || runsList[0];
        setLatestRun(topRun);

        const [evts, props, plan] = await Promise.all([
          fetchRunEvents(topRun.runId).catch(() => []),
          fetchRunProposals(topRun.runId).catch(() => []),
          fetchRunPlan(topRun.runId).catch(() => null),
        ]);

        setRunEvents(evts);
        setProposals(props);
        setPendingPlan(plan);
      }
    } catch (err: any) {
      console.error('Planner initialization error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedScenarioId]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Trigger Multi-Strategy Execution & Solver Rerun
  const handleTriggerRun = async () => {
    setIsRunning(true);
    try {
      const runRes = await startPlanningRuns(selectedScenarioId, [
        'REORDER_BASELINE',
        'OPTIMIZATION_ONLY',
        'MULTI_AGENT_OPTIMIZATION',
      ]);

      // Refresh comparison, runs, and plan
      const [compRes, runsList, decList, impactRes] = await Promise.all([
        fetchEvaluationComparison(selectedScenarioId),
        fetchRuns(selectedScenarioId),
        fetchDecisionHistory(selectedScenarioId),
        fetchDisruptionImpact(selectedScenarioId),
      ]);

      setComparison(compRes);
      setDecisions(decList);
      setImpact(impactRes);

      if (runsList && runsList.length > 0) {
        const multiRun = runsList.find((r) => r.strategy === 'MULTI_AGENT_OPTIMIZATION') || runsList[0];
        setLatestRun(multiRun);

        const [evts, props, plan] = await Promise.all([
          fetchRunEvents(multiRun.runId),
          fetchRunProposals(multiRun.runId),
          fetchRunPlan(multiRun.runId),
        ]);

        setRunEvents(evts);
        setProposals(props);
        setPendingPlan(plan);
      }
    } catch (err: any) {
      console.error('Failed to trigger simulation runs:', err);
      setError(err);
    } finally {
      setIsRunning(false);
    }
  };

  // What-If Parameter Update
  const handleUpdateScenario = async (params: Partial<DisruptionScenario>) => {
    try {
      await updateScenario(selectedScenarioId, params);
      await loadWorkspaceData();
    } catch (err: any) {
      setError(err);
    }
  };

  // Create New What-If Scenario
  const handleCreateScenario = async (payload: Partial<DisruptionScenario>) => {
    const created = await createScenario(payload);
    setScenarios((prev) => [created, ...prev]);
    setSelectedScenarioId(created.id);
    await loadWorkspaceData();
  };

  const currentScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ||
    scenarios[0] || {
      id: 'SCN-POC-001-CANONICAL',
      name: 'Seven-Day Critical Supplier Shutdown',
      description: 'Sendai harmonic actuator plant shutdown during Days 4-10 of 14-day horizon.',
      datasetVersion: '1.0.0-canonical',
      randomSeed: 'SEED_2026_SCM_V1',
      criticalSupplierId: 'sup-01',
      disruptionStartDay: 4,
      disruptionDurationDays: 7,
      evaluationHorizonDays: 14,
      safetyStockDays: 3,
      dailyDemandUnits: 200,
      shortagePenaltyPerUnit: 150,
    };

  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000] flex flex-col">
      {/* 1. Header with Live Status & Scenario Selector */}
      <PlannerHeader
        scenarios={scenarios.length > 0 ? scenarios : [currentScenario]}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={(id) => setSelectedScenarioId(id)}
        isRunning={isRunning}
        onTriggerRun={handleTriggerRun}
        backendHealth={backendHealth}
        currentUser={currentUser}
        onOpenNewScenarioModal={() => setIsNewScenarioModalOpen(true)}
      />

      {/* 2. Top Navigation Pills for the 6 Core Workspaces */}
      <PlannerTabsNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        pendingReviewsCount={pendingPlan?.status === 'PENDING_REVIEW' ? 1 : 0}
        activeDisruptionsCount={1}
      />

      {/* 3. Main Workspace Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 lg:p-12">
        {isLoading ? (
          <LoadingSkeleton text="Loading authoritative supply-chain planner workspace..." />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={loadWorkspaceData}
            title="Planner API Integration Error"
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                metrics={metrics}
                scenario={currentScenario}
                latestRun={latestRun}
                pendingPlan={pendingPlan}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onTriggerRun={handleTriggerRun}
                isRunning={isRunning}
              />
            )}

            {activeTab === 'disruption' && (
              <DisruptionExplorerTab
                impact={impact}
                scenario={currentScenario}
                suppliers={suppliers}
                products={products}
              />
            )}

            {activeTab === 'agents' && (
              <RecoveryIntelligenceTab
                proposals={proposals}
                latestRun={latestRun}
                runEvents={runEvents}
                isRunning={isRunning}
                onTriggerRun={handleTriggerRun}
              />
            )}

            {activeTab === 'scenarios' && (
              <ScenarioComparisonTab
                scenario={currentScenario}
                comparison={comparison}
                isRunning={isRunning}
                onUpdateScenario={handleUpdateScenario}
                onTriggerRerun={handleTriggerRun}
                onNavigateToReview={() => setActiveTab('review')}
              />
            )}

            {activeTab === 'review' && pendingPlan && (
              <PlanReviewTab
                plan={pendingPlan}
                onPlanUpdated={(updated) => {
                  setPendingPlan(updated);
                  fetchDecisionHistory(selectedScenarioId).then(setDecisions);
                }}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'history' && (
              <DecisionHistoryTab
                decisions={decisions}
                runs={latestRun ? [latestRun] : []}
                scenarios={scenarios}
                auditEvents={metrics?.auditEvents || []}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}
          </>
        )}
      </main>

      {/* 4. New Scenario Creation Modal */}
      <NewScenarioModal
        isOpen={isNewScenarioModalOpen}
        onClose={() => setIsNewScenarioModalOpen(false)}
        onCreate={handleCreateScenario}
        suppliers={suppliers}
      />
    </div>
  );
}
