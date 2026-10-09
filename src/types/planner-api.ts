import {
  Product,
  Supplier,
  SupplierProduct,
  PlantResource,
  BillOfMaterial,
  DistributionCenter,
  TransportLane,
  DisruptionScenario,
  AgentRole,
  AgentProposal,
  StrategyResult,
  PlannerDecision,
  Echelon,
} from './supply-chain';

export type {
  Product,
  Supplier,
  SupplierProduct,
  PlantResource,
  BillOfMaterial,
  DistributionCenter,
  TransportLane,
  DisruptionScenario,
  AgentRole,
  AgentProposal,
  StrategyResult,
  PlannerDecision,
  Echelon,
};

export interface AppUser {
  userId: string;
  clerkId?: string;
  displayName: string;
  email: string;
  role: 'SUPPLY_CHAIN_PLANNER' | 'DEMO_ADMINISTRATOR' | 'VIEWER';
  active: boolean;
}

export interface DatasetManifest {
  version: string;
  datasetId: string;
  seed: string;
  currency: string;
  timeBucket: string;
  createdAt: string;
  validatedBy: string;
}

export interface NetworkSummary {
  manifest: DatasetManifest;
  nodeCounts: {
    suppliers: number;
    plants: number;
    distributionCenters: number;
    transportLanes: number;
    products: number;
  };
  criticalSupplierId: string;
  criticalSupplierName: string;
  disruptionStatus: 'ACTIVE_DISRUPTION' | 'NORMAL' | 'RESOLVED';
  horizonDays: number;
  totalDailyDemand: number;
}

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

export interface InventoryBalance {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  nodeId: string;
  nodeCode: string;
  nodeName: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  safetyStockDays: number;
  depletionDayProjected: number;
  unitCost: number;
}

export interface DemandRecord {
  id: string;
  productSku: string;
  productName: string;
  nodeCode: string;
  nodeName: string;
  dailyDemandUnits: number;
  serviceTier: 'TIER_1_CRITICAL' | 'TIER_2_STANDARD';
  targetSlaPercent: number;
  shortagePenaltyPerUnit: number;
}

export interface DataQualityReport {
  status: 'HEALTHY' | 'WARNING' | 'FAILED';
  checksPassed: number;
  hardViolations: number;
  issues: Array<{
    rule: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    timestamp: string;
  }>;
  timestamp: string;
}

export interface DisruptionImpact {
  scenarioId: string;
  scenarioName: string;
  criticalSupplier: {
    id: string;
    code: string;
    name: string;
    location: string;
    normalDailyCapacity: number;
  };
  disruptionPeriod: {
    startDay: number;
    durationDays: number;
    endDay: number;
    horizonDays: number;
  };
  affectedProducts: Array<{
    sku: string;
    name: string;
    type: string;
    standardCost: number;
    normalLeadTimeDays: number;
    stockoutProjectedDay: number;
    measuredInTransitUnits: number;
  }>;
  affectedPlants: Array<{
    id: string;
    name: string;
    dailyCapacity: number;
    starvationDay: number;
  }>;
  downstreamDestinations: Array<{
    code: string;
    name: string;
    serviceTier: string;
    targetSlaPercent: number;
    demandAtRiskUnits: number;
    slaPenaltyPerUnit: number;
  }>;
  inventoryDepletionTimeline: Array<{
    day: number;
    rawStock: number;
    projectedDemand: number;
    inboundUnits: number;
    state: 'MEASURED_DELIVERY' | 'DISRUPTION_ACTIVE' | 'STOCKOUT_BREACH' | 'POST_RECOVERY';
    isMeasured: boolean;
  }>;
  totalDemandAtRiskUnits: number;
  estimatedCostExposure: number;
  measuredDataHorizon: number; // e.g. Days 1-3
  calculatedProjectionHorizon: number; // e.g. Days 4-14
}

export type RunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_WARNINGS'
  | 'INFEASIBLE'
  | 'FAILED'
  | 'CANCELLED';

export interface RunEvent {
  id: string;
  runId: string;
  timestamp: string;
  stage: 'INITIALIZATION' | 'AGENT_ANALYSIS' | 'COORDINATION' | 'OPTIMIZATION' | 'SIMULATION' | 'FINALIZED';
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
  latencyMs?: number;
}

export interface PlanningRun {
  runId: string;
  scenarioId: string;
  strategy: 'REORDER_BASELINE' | 'OPTIMIZATION_ONLY' | 'MULTI_AGENT_OPTIMIZATION';
  status: RunStatus;
  startTime: string;
  endTime?: string;
  solverStatus: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'TIMEOUT' | 'ERROR';
  runtime: {
    solverMs: number;
    agentMs?: number;
    totalMs: number;
  };
  errorSummary?: string;
  proposals?: AgentProposal[];
  metrics?: StrategyResult;
  planId?: string;
}

export interface RecoveryActionItem {
  id: string;
  actionType: 'SOURCE_SHIFT' | 'EXPEDITE_FREIGHT' | 'BUFFER_ALLOCATION' | 'PRIORITY_PROTECT' | 'SCHEDULE_REBALANCE';
  targetResource: string;
  details: string;
  quantityUnits: number;
  effectiveDay: number;
  costDelta: number;
  supportingEvidence: string;
  constraintsValidated: boolean;
}

export interface RecoveryPlan {
  planId: string;
  runId: string;
  scenarioId: string;
  version: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'MODIFIED_AND_APPROVED';
  summary: string;
  objectiveValue: number;
  feasibilityStatus: 'FEASIBLE' | 'PARTIAL_INFEASIBLE' | 'UNMITIGATED_SHORTAGE';
  hardConstraintViolations: number;
  softConstraintBreaches: number;
  actions: RecoveryActionItem[];
  solverStatus: string;
  expectedLandedCost: number;
  expectedFillRate: number;
  expectedRecoveryDays: number | 'NOT_RECOVERED_WITHIN_HORIZON';
  remainingRisks: string[];
  unresolvedWarnings: string[];
  agentContributions: Array<{
    agentRole: AgentRole;
    actionCount: number;
    contributionSummary: string;
    confidenceScore: number;
  }>;
  auditDecision?: PlannerDecision;
}

export interface EvaluationComparison {
  evaluationId: string;
  scenarioId: string;
  timestamp: string;
  strategies: {
    reorderBaseline: StrategyResult;
    optimizationOnly: StrategyResult;
    multiAgentOptimization: StrategyResult;
  };
  comparisonSummary: {
    fillRateAdvantagePercent: number;
    costPremiumVsOptimization: number;
    backorderUnitsSaved: number;
    recoveryTimeDaysDelta: number;
  };
}

export interface ApiContractError {
  status: number;
  error: string;
  detail: string;
  endpoint: string;
  contractDependency?: string;
  timestamp: string;
}
