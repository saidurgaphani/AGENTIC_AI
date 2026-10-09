// Admin API Integration Layer with typed responses and error handling

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
    checks: {
      id: string;
      name: string;
      passed: boolean;
      description: string;
    }[];
  };
}

export interface NetworkSummaryResponse {
  summary: {
    productsCount: number;
    suppliersCount: number;
    facilitiesCount: number;
    distributionCentersCount: number;
    transportLanesCount: number;
    bomEntriesCount: number;
    inventoryRecordsCount: number;
    demandRecordsCount: number;
  };
  products: any[];
  suppliers: any[];
  facilities: any[];
  distributionCenters: any[];
  transportLanes: any[];
  billOfMaterials: any[];
  inventory: any[];
  demand: any[];
}

export interface CsvValidationResponse {
  valid: boolean;
  rowCount: number;
  errors: {
    row: number;
    column: string;
    value: any;
    message: string;
  }[];
  preview?: any[];
  message: string;
}

export const adminApi = {
  // 1. Current user
  async getMe() {
    const res = await fetch('/api/v1/me');
    if (!res.ok) throw new Error('Failed to fetch user session');
    return res.json();
  },

  // 2. Overview metrics
  async getOverviewMetrics(): Promise<OverviewMetricsResponse> {
    const res = await fetch('/api/v1/overview/metrics', { cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Failed to load metrics from Neon PostgreSQL');
    }
    return res.json();
  },

  // 3. Network Summary & Entities
  async getNetworkSummary(): Promise<NetworkSummaryResponse> {
    const res = await fetch('/api/v1/network/summary', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load network summary');
    return res.json();
  },

  async getSuppliers(params?: { search?: string; criticality?: string; active?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/v1/network/suppliers?${query}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    return res.json();
  },

  async createSupplier(data: any) {
    const res = await fetch('/api/v1/network/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create supplier');
    }
    return res.json();
  },

  async updateSupplier(id: string, data: any) {
    const res = await fetch(`/api/v1/network/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update supplier');
    return res.json();
  },

  async deleteSupplier(id: string, force = false) {
    const res = await fetch(`/api/v1/network/suppliers/${id}?force=${force}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || 'Failed to deactivate supplier');
      err.dependencies = data.dependencies;
      err.recommendation = data.recommendation;
      throw err;
    }
    return data;
  },

  async checkDependencies(entityType: string, entityId: string) {
    const res = await fetch(`/api/v1/network/dependencies/${entityType}/${entityId}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to analyze dependencies');
    return res.json();
  },

  async createProduct(data: any) {
    const res = await fetch('/api/v1/network/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(id: string, data: any) {
    const res = await fetch(`/api/v1/network/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`/api/v1/network/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  async updateFacility(id: string, data: any) {
    const res = await fetch(`/api/v1/network/facilities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update facility');
    return res.json();
  },

  async updateDistributionCenter(id: string, data: any) {
    const res = await fetch(`/api/v1/network/distribution-centers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update distribution center');
    return res.json();
  },

  async updateTransportLane(id: string, data: any) {
    const res = await fetch(`/api/v1/network/transport-lanes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transport lane');
    return res.json();
  },

  async updateInventory(id: string, data: any) {
    const res = await fetch('/api/v1/network/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update inventory balance');
    }
    return res.json();
  },

  // 4. Dataset Management
  async getDatasets() {
    const res = await fetch('/api/v1/datasets', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch dataset versions');
    return res.json();
  },

  async validateCsvImport(entityType: string, csvContent: string): Promise<CsvValidationResponse> {
    const res = await fetch('/api/v1/datasets/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, csvContent, dryRun: true }),
    });
    return res.json();
  },

  async commitCsvImport(entityType: string, csvContent: string, versionTag: string, description?: string) {
    const res = await fetch('/api/v1/datasets/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType,
        csvContent,
        dryRun: false,
        versionTag,
        description,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Import commit failed');
    return data;
  },

  async resetCanonicalDataset() {
    const res = await fetch('/api/v1/datasets/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset dataset');
    return res.json();
  },

  // 5. Disruption Scenarios
  async getScenarios() {
    const res = await fetch('/api/v1/scenarios', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return res.json();
  },

  async updateScenario(id: string, data: any) {
    const res = await fetch(`/api/v1/scenarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update scenario');
    return res.json();
  },

  async validateScenario(id: string) {
    const res = await fetch(`/api/v1/scenarios/${id}/validate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to validate scenario');
    return res.json();
  },

  async getScenarioImpact(id: string) {
    const res = await fetch(`/api/v1/scenarios/${id}/impact-analysis`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run impact analysis');
    return res.json();
  },

  async launchSimulationRun(scenarioId: string, strategy: string = 'MULTI_AGENT_OPTIMIZATION') {
    const res = await fetch(`/api/v1/scenarios/${scenarioId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy }),
    });
    if (!res.ok) throw new Error('Failed to launch simulation run');
    return res.json();
  },

  // 6. Agents
  async getAgents() {
    const res = await fetch('/api/v1/agents', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch agent configurations');
    return res.json();
  },

  async updateAgent(agentType: string, data: any) {
    const res = await fetch(`/api/v1/agents/${agentType}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update agent');
    }
    return res.json();
  },

  async testAgent(agentType: string) {
    const res = await fetch(`/api/v1/agents/${agentType}/test`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to test agent');
    return res.json();
  },

  // 7. Constraints
  async getConstraints() {
    const res = await fetch('/api/v1/constraints', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch constraints');
    return res.json();
  },

  async updateConstraint(id: string, data: { value: number; hard_constraint?: boolean; description?: string; reason?: string }) {
    const res = await fetch(`/api/v1/constraints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update constraint');
    }
    return res.json();
  },

  // 8. Planning Runs
  async getRuns(params?: { strategy?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/v1/runs?${query}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch runs');
    return res.json();
  },

  async getRunDetail(id: string) {
    const res = await fetch(`/api/v1/runs/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch run details');
    return res.json();
  },

  // 9. Users & Audit
  async getUsers() {
    const res = await fetch('/api/v1/users', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async updateUserRole(id: string, role: string, active = true) {
    const res = await fetch(`/api/v1/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, active }),
    });
    if (!res.ok) throw new Error('Failed to update user role');
    return res.json();
  },

  async getAuditEvents(params?: { eventType?: string; targetEntity?: string; actor?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/v1/audit?${query}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch audit events');
    return res.json();
  },
};
