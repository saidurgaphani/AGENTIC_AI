import {
  AppUser,
  NetworkSummary,
  Supplier,
  Product,
  InventoryBalance,
  DemandRecord,
  TransportLane,
  DataQualityReport,
  DisruptionScenario,
  DisruptionImpact,
  PlanningRun,
  RunEvent,
  AgentProposal,
  RecoveryPlan,
  StrategyResult,
  PlannerDecision,
  EvaluationComparison,
  ApiContractError,
} from '@/types/planner-api';

function getBaseUrl(): string {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (!envUrl) {
    return '/api/v1';
  }
  const clean = envUrl.replace(/\/+$/, '');
  if (clean.startsWith('http') && !clean.endsWith('/api/v1')) {
    return `${clean}/api/v1`;
  }
  return clean;
}

export function buildApiUrl(endpoint: string): string {
  const base = getBaseUrl();
  let cleanEndpoint = endpoint.replace(/^\/+/, '');
  if (base.endsWith('/api/v1') && cleanEndpoint.startsWith('api/v1/')) {
    cleanEndpoint = cleanEndpoint.substring('api/v1/'.length);
  }
  return `${base}/${cleanEndpoint}`;
}

export class ApiError extends Error {
  status: number;
  endpoint: string;
  detail: string;
  contractDependency?: string;
  timestamp: string;

  constructor(errorData: ApiContractError) {
    super(errorData.detail || errorData.error);
    this.name = 'ApiError';
    this.status = errorData.status;
    this.endpoint = errorData.endpoint;
    this.detail = errorData.detail;
    this.contractDependency = errorData.contractDependency;
    this.timestamp = errorData.timestamp;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = buildApiUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      let contractDependency: string | undefined;

      try {
        const json = await res.json();
        errorDetail = json.detail || json.details || json.error || json.message || errorDetail;
        contractDependency = json.contract_dependency || json.contractDependency;
      } catch {
        // Fallback for non-JSON responses
      }

      const err: ApiContractError = {
        status: res.status,
        error: res.statusText || 'API_ERROR',
        detail: errorDetail,
        endpoint,
        contractDependency:
          contractDependency || `FastAPI /api/v1 contract specification per docs/PRD.md Section 14`,
        timestamp: new Date().toISOString(),
      };
      throw new ApiError(err);
    }

    return (await res.json()) as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    const netErr: ApiContractError = {
      status: 0,
      error: 'NETWORK_CONNECTION_FAILED',
      detail:
        error.message ||
        `Unable to reach backend service at ${url}. Ensure the database-backed API service is running.`,
      endpoint,
      contractDependency: 'FastAPI /api/v1 (PRD §14) with Neon PostgreSQL',
      timestamp: new Date().toISOString(),
    };
    throw new ApiError(netErr);
  }
}

// ---------------------------------------------------------------------------
// Health & Current User
// ---------------------------------------------------------------------------

export async function checkBackendHealth(): Promise<{
  connected: boolean;
  status: string;
  latencyMs: number;
  endpoint: string;
  database?: string;
  error?: string;
}> {
  const start = performance.now();
  try {
    const res = await request<any>('/overview/metrics', { method: 'GET' });
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: true,
      status: 'ONLINE',
      latencyMs,
      endpoint: buildApiUrl('/overview/metrics'),
      database: res?.environment?.database || 'Neon PostgreSQL',
    };
  } catch (err: any) {
    // Try fallback to network summary
    try {
      await request<any>('/network/summary', { method: 'GET' });
      const latencyMs = Math.round(performance.now() - start);
      return {
        connected: true,
        status: 'ONLINE',
        latencyMs,
        endpoint: buildApiUrl('/network/summary'),
      };
    } catch (innerErr: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        connected: false,
        status: 'OFFLINE',
        latencyMs,
        endpoint: buildApiUrl('/overview/metrics'),
        error: innerErr.detail || innerErr.message,
      };
    }
  }
}

export async function fetchCurrentUser(): Promise<AppUser> {
  return request<AppUser>('/me', { method: 'GET' });
}

// ---------------------------------------------------------------------------
// Overview Operational Metrics
// ---------------------------------------------------------------------------

export interface OverviewMetricsResponse {
  environment: {
    database: string;
    branch: string;
    serverTime: string;
  };
  networkCounts: {
    totalProducts: number;
    finishedGoodsCount: number;
    componentsCount: number;
    totalSuppliers: number;
    disruptedSuppliers: number;
    totalPlants: number;
    totalDCs: number;
    totalLanes: number;
    totalInventoryUnits: number;
    trackedInventorySkus: number;
  };
  dataset: any;
  activeScenario: any;
  recentRuns: any[];
  agents: any[];
  recoveryPlans: any[];
  auditEvents: any[];
  dataQuality: {
    status: string;
    checks: Array<{
      id: string;
      name: string;
      passed: boolean;
      description: string;
    }>;
  };
}

export async function fetchOverviewMetrics(): Promise<OverviewMetricsResponse> {
  return request<OverviewMetricsResponse>('/overview/metrics', { method: 'GET' });
}

// ---------------------------------------------------------------------------
// Network & Data APIs
// ---------------------------------------------------------------------------

export async function fetchNetworkSummary(): Promise<any> {
  return request<any>('/network/summary', { method: 'GET' });
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    return await request<Supplier[]>('/network/suppliers', { method: 'GET' });
  } catch {
    return request<Supplier[]>('/suppliers', { method: 'GET' });
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    return await request<Product[]>('/network/products', { method: 'GET' });
  } catch {
    return request<Product[]>('/products', { method: 'GET' });
  }
}

export async function fetchFacilities(): Promise<any[]> {
  try {
    return await request<any[]>('/network/facilities', { method: 'GET' });
  } catch {
    return [];
  }
}

export async function fetchDistributionCenters(): Promise<any[]> {
  try {
    return await request<any[]>('/network/distribution-centers', { method: 'GET' });
  } catch {
    return [];
  }
}

export async function fetchInventoryBalances(): Promise<InventoryBalance[]> {
  try {
    return await request<InventoryBalance[]>('/network/inventory', { method: 'GET' });
  } catch {
    return request<InventoryBalance[]>('/inventory', { method: 'GET' });
  }
}

export async function fetchDemandRecords(): Promise<DemandRecord[]> {
  try {
    return await request<DemandRecord[]>('/network/demand', { method: 'GET' });
  } catch {
    return request<DemandRecord[]>('/demand', { method: 'GET' });
  }
}

export async function fetchTransportLanes(): Promise<TransportLane[]> {
  try {
    return await request<TransportLane[]>('/network/transport-lanes', { method: 'GET' });
  } catch {
    return request<TransportLane[]>('/transport-lanes', { method: 'GET' });
  }
}

export async function fetchDataQuality(): Promise<DataQualityReport> {
  return request<DataQualityReport>('/data-quality', { method: 'GET' });
}

export async function fetchEntityDependencies(
  entityType: 'supplier' | 'product' | 'facility' | 'dc',
  entityId: string
): Promise<{
  entityType: string;
  entityId: string;
  canDeleteSafely: boolean;
  warnings: string[];
  references: Record<string, any>;
}> {
  return request<any>(`/network/dependencies/${entityType}/${encodeURIComponent(entityId)}`, {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// Scenarios & Impact Analysis
// ---------------------------------------------------------------------------

export async function fetchScenarios(): Promise<DisruptionScenario[]> {
  return request<DisruptionScenario[]>('/scenarios', { method: 'GET' });
}

export async function fetchScenarioById(scenarioId: string): Promise<DisruptionScenario> {
  return request<DisruptionScenario>(`/scenarios/${scenarioId}`, { method: 'GET' });
}

export async function createScenario(
  payload: Partial<DisruptionScenario>
): Promise<DisruptionScenario> {
  return request<DisruptionScenario>('/scenarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateScenario(
  scenarioId: string,
  payload: Partial<DisruptionScenario>
): Promise<DisruptionScenario> {
  return request<DisruptionScenario>(`/scenarios/${scenarioId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchDisruptionImpact(scenarioId: string): Promise<DisruptionImpact> {
  return request<DisruptionImpact>(`/scenarios/${scenarioId}/impact-analysis`, {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// Planning Runs & Multi-Agent Execution
// ---------------------------------------------------------------------------

export async function startPlanningRuns(
  scenarioId: string,
  strategies: Array<'REORDER_BASELINE' | 'OPTIMIZATION_ONLY' | 'MULTI_AGENT_OPTIMIZATION'>
): Promise<{ runIds: string[]; status: string }> {
  return request<{ runIds: string[]; status: string }>(`/scenarios/${scenarioId}/runs`, {
    method: 'POST',
    body: JSON.stringify({ strategies }),
  });
}

export async function fetchRuns(scenarioId?: string): Promise<PlanningRun[]> {
  const query = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
  return request<PlanningRun[]>(`/runs${query}`, { method: 'GET' });
}

export async function fetchRunById(runId: string): Promise<PlanningRun> {
  return request<PlanningRun>(`/runs/${runId}`, { method: 'GET' });
}

export async function fetchRunEvents(runId: string): Promise<RunEvent[]> {
  return request<RunEvent[]>(`/runs/${runId}/events`, { method: 'GET' });
}

export async function fetchRunProposals(runId: string): Promise<AgentProposal[]> {
  return request<AgentProposal[]>(`/runs/${runId}/proposals`, { method: 'GET' });
}

export async function fetchRunPlan(runId: string): Promise<RecoveryPlan> {
  return request<RecoveryPlan>(`/runs/${runId}/plan`, { method: 'GET' });
}

export async function fetchRunMetrics(runId: string): Promise<StrategyResult> {
  return request<StrategyResult>(`/runs/${runId}/metrics`, { method: 'GET' });
}

// ---------------------------------------------------------------------------
// Decision Governance & Approvals
// ---------------------------------------------------------------------------

export async function approvePlan(
  planId: string,
  rationale: string,
  authorizedBudgetDelta: number = 48200,
  planVersion: number = 1
): Promise<PlannerDecision> {
  return request<PlannerDecision>(`/plans/${planId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      rationale,
      authorizedBudgetDelta,
      planVersion,
    }),
  });
}

export async function rejectPlan(
  planId: string,
  reason: string,
  planVersion: number = 1
): Promise<PlannerDecision> {
  return request<PlannerDecision>(`/plans/${planId}/reject`, {
    method: 'POST',
    body: JSON.stringify({
      reason,
      planVersion,
    }),
  });
}

export async function fetchDecisionHistory(scenarioId?: string): Promise<PlannerDecision[]> {
  const query = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
  return request<PlannerDecision[]>(`/decisions${query}`, { method: 'GET' });
}

// ---------------------------------------------------------------------------
// Evaluations & Strategy Comparisons
// ---------------------------------------------------------------------------

export async function fetchEvaluationComparison(scenarioId: string): Promise<EvaluationComparison> {
  return request<EvaluationComparison>(`/evaluations/${scenarioId}/comparison`, {
    method: 'GET',
  });
}
