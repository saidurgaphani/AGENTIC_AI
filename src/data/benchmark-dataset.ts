import {
  Product,
  Supplier,
  SupplierProduct,
  PlantResource,
  BillOfMaterial,
  DistributionCenter,
  TransportLane,
  DisruptionScenario,
  AgentProposal,
} from '@/types/supply-chain';

export const DATASET_MANIFEST = {
  version: '1.0.0-canonical',
  datasetId: 'SCM-ECHO-2026-POC',
  seed: 'SEED_2026_SCM_V1',
  currency: 'INR (₹)',
  timeBucket: 'Daily (14 periods)',
  createdAt: '2026-10-09T00:00:00Z',
  validatedBy: 'Antigravity Deterministic Coordinator',
};

// 1. Products
export const PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    sku: 'CMP-101',
    name: 'Precision Harmonic Actuator Core',
    type: 'COMPONENT',
    uom: 'units',
    standardCost: 11760,
  },
  {
    id: 'prod-02',
    sku: 'CMP-102',
    name: 'Machined Titanium Frame Housing',
    type: 'COMPONENT',
    uom: 'units',
    standardCost: 7140,
  },
  {
    id: 'prod-03',
    sku: 'SKU-900',
    name: 'Autonomous Industrial Robotic Drive Unit',
    type: 'FINISHED_GOOD',
    uom: 'units',
    standardCost: 37800,
  },
];

// 2. Suppliers
export const SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    code: 'SUP-01',
    name: 'AeroCore Dynamics',
    location: 'Bengaluru, India (Precision Micro-Machining)',
    criticality: 'CRITICAL',
    active: true,
    disrupted: true, // Disrupted for 7 days
  },
  {
    id: 'sup-02',
    code: 'SUP-02',
    name: 'Vanguard Mechatronics',
    location: 'Pune, India (Specialty Drive Components)',
    criticality: 'ALTERNATE',
    active: true,
    disrupted: false,
  },
  {
    id: 'sup-03',
    code: 'SUP-03',
    name: 'Global Alloy Castings',
    location: 'Chennai, India (Structural Housings)',
    criticality: 'SECONDARY',
    active: true,
    disrupted: false,
  },
];

// 3. Supplier Products & Contracts
export const SUPPLIER_PRODUCTS: SupplierProduct[] = [
  {
    supplierId: 'sup-01',
    productId: 'prod-01', // CMP-101
    eligible: true,
    normalLeadTimeDays: 3,
    expediteLeadTimeDays: 2,
    dailyCapacity: 300,
    unitPurchaseCost: 11760,
    expediteUnitCost: 15960,
  },
  {
    supplierId: 'sup-02',
    productId: 'prod-01', // CMP-101 (Qualified alternate)
    eligible: true,
    normalLeadTimeDays: 5,
    expediteLeadTimeDays: 2,
    dailyCapacity: 250,
    unitPurchaseCost: 16380,
    expediteUnitCost: 21840,
  },
  {
    supplierId: 'sup-03',
    productId: 'prod-02', // CMP-102 (Housing)
    eligible: true,
    normalLeadTimeDays: 2,
    expediteLeadTimeDays: 1,
    dailyCapacity: 400,
    unitPurchaseCost: 7140,
    expediteUnitCost: 10080,
  },
];

// 4. Manufacturing Plant (Echelon 2)
export const PLANTS: PlantResource[] = [
  {
    id: 'plant-01',
    name: 'Hyderabad Advanced Manufacturing Facility (Plant Alpha)',
    location: 'Hyderabad, Telangana, India',
    producedSku: 'SKU-900',
    dailyCapacity: 300,
    dailyOperatingCost: 1050000,
  },
];

// 5. Bill of Materials
export const BILL_OF_MATERIALS: BillOfMaterial[] = [
  {
    parentSku: 'SKU-900',
    componentSku: 'CMP-101',
    quantityRequired: 1,
  },
  {
    parentSku: 'SKU-900',
    componentSku: 'CMP-102',
    quantityRequired: 1,
  },
];

// 6. Distribution Centers (Echelon 3)
export const DISTRIBUTION_CENTERS: DistributionCenter[] = [
  {
    id: 'dc-01',
    code: 'DC-EAST',
    name: 'Mumbai Regional Distribution Center',
    location: 'Mumbai, Maharashtra, India',
    serviceTier: 'TIER_1_CRITICAL',
    targetSlaPercent: 98,
  },
  {
    id: 'dc-02',
    code: 'DC-WEST',
    name: 'Ahmedabad Inbound Logistics Hub',
    location: 'Ahmedabad, Gujarat, India',
    serviceTier: 'TIER_2_STANDARD',
    targetSlaPercent: 90,
  },
];

// 7. Transport Lanes
export const TRANSPORT_LANES: TransportLane[] = [
  {
    id: 'lane-01',
    originId: 'sup-01',
    destinationId: 'plant-01',
    mode: 'STANDARD_TRUCKLOAD',
    transitDays: 3,
    costPerUnit: 1512,
    expeditedTransitDays: 2,
    expeditedCostPerUnit: 3780,
  },
  {
    id: 'lane-02',
    originId: 'sup-02',
    destinationId: 'plant-01',
    mode: 'INTERMODAL',
    transitDays: 5,
    costPerUnit: 2016,
    expeditedTransitDays: 2,
    expeditedCostPerUnit: 5712, // Priority air
  },
  {
    id: 'lane-03',
    originId: 'sup-03',
    destinationId: 'plant-01',
    mode: 'STANDARD_TRUCKLOAD',
    transitDays: 2,
    costPerUnit: 1008,
  },
  {
    id: 'lane-04',
    originId: 'plant-01',
    destinationId: 'dc-01',
    mode: 'STANDARD_TRUCKLOAD',
    transitDays: 1,
    costPerUnit: 1260,
  },
  {
    id: 'lane-05',
    originId: 'plant-01',
    destinationId: 'dc-02',
    mode: 'STANDARD_TRUCKLOAD',
    transitDays: 2,
    costPerUnit: 1848,
  },
];

// 8. Canonical Disruption Scenario Specification
export const CANONICAL_SCENARIO: DisruptionScenario = {
  id: 'SCN-2026-SHUTDOWN-07D',
  name: '7-Day Unplanned Shutdown of Critical Supplier SUP-01 (AeroCore)',
  description:
    'Full cessation of inbound actuator component shipments from SUP-01 between Day 4 and Day 10. Evaluated over a 14-day rolling planning horizon with 200 units/day downstream demand.',
  datasetVersion: DATASET_MANIFEST.version,
  randomSeed: DATASET_MANIFEST.seed,
  criticalSupplierId: 'sup-01',
  disruptionStartDay: 4,
  disruptionDurationDays: 7, // Days 4, 5, 6, 7, 8, 9, 10
  evaluationHorizonDays: 14,
  safetyStockDays: 3, // 600 units (200 units/day * 3 days)
  dailyDemandUnits: 200, // 120 units at DC-EAST (Tier 1), 80 units at DC-WEST (Tier 2)
  shortagePenaltyPerUnit: 12600, // Contractual penalty per unit-day backordered
};

// 9. Multi-Agent Structured Proposals
export const CANONICAL_AGENT_PROPOSALS: AgentProposal[] = [
  {
    proposalId: 'PROP-SR-01',
    agentType: 'SUPPLIER_RISK',
    actionSummary: 'Activate Vanguard Mechatronics (SUP-02) as primary alternate for CMP-101',
    actionType: 'SOURCE_SHIFT',
    affectedEntityIds: ['sup-01', 'sup-02', 'prod-01'],
    actionParameters: {
      sourceSupplierId: 'sup-02',
      dailyVolumeAllocated: 200,
      startDay: 4,
      endDay: 10,
      totalUnits: 1400,
    },
    evidenceRefs: [
      'SUPPLIER_PRODUCTS[sup-02].eligible === true',
      'SUPPLIER_PRODUCTS[sup-02].dailyCapacity (250) >= dailyAllocation (200)',
      'SUPPLIER_PRODUCTS[sup-02].qualificationStatus: ISO-9001/AS9100 Certified',
    ],
    expectedBenefits: 'Offsets 1,400 units of lost component supply from Bengaluru facility',
    expectedCostDelta: 6468000, // 1400 * (₹16380 - ₹11760) = +₹64,68,000 unit cost delta
    risks: ['SUP-02 lead time is 5 days under standard transit, risking Day 7–9 line starvation unless expedited.'],
    assumptions: ['SUP-02 maintains 250 units/day spare production slots throughout the disruption window.'],
    confidence: {
      score: 0.94,
      definition: 'Deterministic audit of supplier contract eligibility and confirmed capacity headroom',
    },
    validationStatus: 'VALIDATED',
    createdAt: '2026-10-09T08:15:22Z',
  },
  {
    proposalId: 'PROP-LOG-02',
    agentType: 'LOGISTICS',
    actionSummary: 'Execute Priority Air Freight on Pune-Hyderabad Lane (Lane-02)',
    actionType: 'EXPEDITE_FREIGHT',
    affectedEntityIds: ['lane-02', 'sup-02', 'plant-01'],
    actionParameters: {
      laneId: 'lane-02',
      expeditedLeadTimeDays: 2,
      expediteVolume: 800,
      expediteDays: [4, 5, 6, 7],
      premiumPerUnit: 3696, // (₹5712 - ₹2016)
    },
    evidenceRefs: [
      'TRANSPORT_LANES[lane-02].expeditedTransitDays === 2 days',
      'Plant Alpha on-hand raw stock depletes to 0 units at Day 7 without 2-day arrival',
      'Air carrier cargo space reserved under master service agreement contract L-992',
    ],
    expectedBenefits: 'Compresses transit from 5 days to 2 days, delivering first batch on Day 6 and preventing plant shutdown',
    expectedCostDelta: 2956800, // 800 * ₹3696
    risks: ['Subject to airport cargo handling congestion; requires advance slot booking.'],
    assumptions: ['Carrier honors guaranteed 48-hour tarmac-to-dock transit guarantee.'],
    confidence: {
      score: 0.91,
      definition: 'Carrier capacity reservation status confirmed with SLA penalty rebate',
    },
    validationStatus: 'VALIDATED',
    createdAt: '2026-10-09T08:16:45Z',
  },
  {
    proposalId: 'PROP-DEM-03',
    agentType: 'DEMAND',
    actionSummary: 'Protect Tier-1 Medical SLA at Mumbai (DC-EAST) and smoothly pace DC-WEST',
    actionType: 'PRIORITY_PROTECT',
    affectedEntityIds: ['dc-01', 'dc-02'],
    actionParameters: {
      protectedNode: 'dc-01',
      protectedSlaTarget: 1.0, // 100% on-time
      deprioritizedNode: 'dc-02',
      deferredVolume: 100, // defer 100 units by 48 hours with customer notification
    },
    evidenceRefs: [
      'DC-EAST contract specifies ₹2,10,000/day line-stop penalty for healthcare robotics',
      'DC-WEST industrial clients accept 48h scheduled deferrals with volume rebate credit',
      'Current finished goods stock buffer at Hyderabad: 150 units',
    ],
    expectedBenefits: 'Guarantees zero breaches on high-penalty Tier-1 accounts while minimizing overall backlog friction',
    expectedCostDelta: -378000, // avoidance of severe Tier-1 penalties offset by minor deferral rebate
    risks: ['DC-WEST customer satisfaction impact if delays exceed 48 hours.'],
    assumptions: ['Customer relations team issues automated dispatch notices on Day 5.'],
    confidence: {
      score: 0.88,
      definition: 'Customer agreement SLA terms verified in contract repository',
    },
    validationStatus: 'VALIDATED',
    createdAt: '2026-10-09T08:17:10Z',
  },
  {
    proposalId: 'PROP-IGJ-04',
    agentType: 'IGJENTORY',
    actionSummary: 'Dynamic Safety Stock Drawdown and Controlled Component Allocation',
    actionType: 'BUFFER_ALLOCATION',
    affectedEntityIds: ['plant-01', 'prod-01'],
    actionParameters: {
      initialBufferUnits: 600,
      drawdownRateDaily: 200,
      minimumAllowableThreshold: 0,
      rebuildTargetDay: 11,
      rebuildVolumeDaily: 50,
    },
    evidenceRefs: [
      'Plant Alpha on-hand raw CMP-101 balance = 600 units at Day 0',
      'Daily plant consumption rate = 200 units/day',
      'Buffer sustains 100% assembly operations until Day 3 morning without stockout',
    ],
    expectedBenefits: 'Maximizes internal asset utilization before incurring external expedited spend',
    expectedCostDelta: 0,
    risks: ['Leaves zero safety stock tolerance if alternate shipment encounters minor delay.'],
    assumptions: ['Inbound expedited shipments arrive on Day 6 without loss or QA rejection.'],
    confidence: {
      score: 0.95,
      definition: 'Direct inventory balance telemetry from SAP ERP warehouse module',
    },
    validationStatus: 'VALIDATED',
    createdAt: '2026-10-09T08:18:05Z',
  },
];
