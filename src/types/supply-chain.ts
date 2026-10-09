export type Echelon = 'ECHELON_1_SUPPLIER' | 'ECHELON_2_MANUFACTURING' | 'ECHELON_3_DISTRIBUTION';

export interface Product {
  id: string;
  sku: string;
  name: string;
  type: 'COMPONENT' | 'FINISHED_GOOD';
  uom: string; // unit of measure, e.g., 'units'
  standardCost: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  location: string;
  criticality: 'CRITICAL' | 'SECONDARY' | 'ALTERNATE';
  active: boolean;
  disrupted?: boolean;
}

export interface SupplierProduct {
  supplierId: string;
  productId: string;
  eligible: boolean;
  normalLeadTimeDays: number;
  expediteLeadTimeDays: number;
  dailyCapacity: number;
  unitPurchaseCost: number;
  expediteUnitCost: number;
}

export interface PlantResource {
  id: string;
  name: string;
  location: string;
  producedSku: string;
  dailyCapacity: number; // units/day
  dailyOperatingCost: number;
}

export interface BillOfMaterial {
  parentSku: string;
  componentSku: string;
  quantityRequired: number;
}

export interface DistributionCenter {
  id: string;
  code: string;
  name: string;
  location: string;
  serviceTier: 'TIER_1_CRITICAL' | 'TIER_2_STANDARD';
  targetSlaPercent: number;
}

export interface TransportLane {
  id: string;
  originId: string;
  destinationId: string;
  mode: 'STANDARD_TRUCKLOAD' | 'EXPEDITED_AIR' | 'INTERMODAL';
  transitDays: number;
  costPerUnit: number;
  expeditedTransitDays?: number;
  expeditedCostPerUnit?: number;
}

export interface DisruptionScenario {
  id: string;
  name: string;
  description: string;
  datasetVersion: string;
  randomSeed: string;
  criticalSupplierId: string;
  disruptionStartDay: number;
  disruptionDurationDays: number;
  evaluationHorizonDays: number;
  safetyStockDays: number;
  dailyDemandUnits: number;
  shortagePenaltyPerUnit: number;
}

export type AgentRole = 'DEMAND' | 'INVENTORY' | 'SUPPLIER_RISK' | 'LOGISTICS' | 'COORDINATOR';

export interface AgentProposal {
  proposalId: string;
  agentType: AgentRole;
  actionSummary: string;
  actionType: 'SOURCE_SHIFT' | 'EXPEDITE_FREIGHT' | 'BUFFER_ALLOCATION' | 'PRIORITY_PROTECT' | 'SCHEDULE_REBALANCE';
  affectedEntityIds: string[];
  actionParameters: Record<string, any>;
  evidenceRefs: string[];
  expectedBenefits: string;
  expectedCostDelta: number;
  risks: string[];
  assumptions: string[];
  confidence: {
    score: number;
    definition: string;
  };
  validationStatus: 'VALIDATED' | 'REJECTED' | 'MODIFIED';
  rejectionReasons?: string[];
  createdAt: string;
}

export interface StrategyResult {
  strategyKey: 'REORDER_BASELINE' | 'OPTIMIZATION_ONLY' | 'MULTI_AGENT_OPTIMIZATION';
  strategyName: string;
  strategyDescription: string;
  fillRatePercent: number; // e.g. 62.5% vs 89.2% vs 96.4%
  totalBackorders: number; // units
  totalLandedCost: number; // $
  costDeltaAgainstBaseline: number;
  recoveryTimeDays: number | 'NOT_RECOVERED_WITHIN_HORIZON';
  avgInventoryDays: number;
  hardConstraintViolations: number;
  softConstraintBreaches: number;
  solverRuntimeMs: number;
  agentRuntimeMs?: number;
  feasibilityStatus: 'FEASIBLE' | 'PARTIAL_INFEASIBLE' | 'UNMITIGATED_SHORTAGE';
  dayByDayMetrics: {
    day: number;
    demand: number;
    fulfilled: number;
    backlog: number;
    plantRawStock: number;
    finishedStock: number;
    inboundUnits: number;
    dailyCost: number;
  }[];
}

export interface PlannerDecision {
  planId: string;
  runId: string;
  plannerId: string;
  decision: 'APPROVED' | 'REJECTED' | 'MODIFIED_AND_APPROVED';
  rationale: string;
  timestamp: string;
  authorizedBudgetDelta: number;
}
