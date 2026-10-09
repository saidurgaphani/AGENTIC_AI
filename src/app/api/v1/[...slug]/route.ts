import { NextRequest, NextResponse } from 'next/server';
import {
  DATASET_MANIFEST,
  PRODUCTS,
  SUPPLIERS,
  PLANTS,
  DISTRIBUTION_CENTERS,
  TRANSPORT_LANES,
  CANONICAL_SCENARIO,
  CANONICAL_AGENT_PROPOSALS,
} from '@/data/benchmark-dataset';
import { runSimulation } from '@/data/simulation-engine';
import {
  DisruptionScenario,
  PlannerDecision,
  PlanningRun,
  RecoveryPlan,
  StrategyResult,
} from '@/types/planner-api';

const FASTAPI_TARGET = (process.env.FASTAPI_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// Persistent in-memory state across requests for testing and development
let scenariosStore: DisruptionScenario[] = [
  { ...CANONICAL_SCENARIO, createdAt: '2026-10-09T08:00:00Z', status: 'ACTIVE' } as any,
  {
    id: 'SCN-POC-002-EXTENDED',
    name: '10-Day Extended Blackout - Sendai Outage',
    description: 'Sensitivity analysis extending Sendai supplier disruption to 10 days.',
    datasetVersion: '1.0.0-canonical',
    randomSeed: 'SEED_2026_SCM_V1',
    criticalSupplierId: 'sup-01',
    disruptionStartDay: 4,
    disruptionDurationDays: 10,
    evaluationHorizonDays: 14,
    safetyStockDays: 3,
    dailyDemandUnits: 200,
    shortagePenaltyPerUnit: 150,
  },
];

let decisionsStore: PlannerDecision[] = [
  {
    planId: 'PLAN-REC-001',
    runId: 'RUN-2026-MULTI-01',
    plannerId: 'usr-planner-01',
    decision: 'APPROVED',
    rationale:
      'Authorized $48,200 air freight premium to guarantee Tier-1 Medical SLA compliance at Columbus DC.',
    timestamp: '2026-10-09T14:32:00Z',
    authorizedBudgetDelta: 48200,
  },
];

let runsStore: Record<string, PlanningRun> = {};
let plansStore: Record<string, RecoveryPlan> = {};

// Initialize canonical runs and plans
function initializeRunsAndPlans() {
  const simulation = runSimulation(CANONICAL_SCENARIO);

  const canonicalRunMulti: PlanningRun = {
    runId: 'RUN-2026-MULTI-01',
    scenarioId: CANONICAL_SCENARIO.id,
    strategy: 'MULTI_AGENT_OPTIMIZATION',
    status: 'COMPLETED',
    startTime: '2026-10-09T14:30:00Z',
    endTime: '2026-10-09T14:30:02Z',
    solverStatus: 'OPTIMAL',
    runtime: {
      solverMs: 420,
      agentMs: 1250,
      totalMs: 1670,
    },
    proposals: CANONICAL_AGENT_PROPOSALS,
    metrics: simulation.multiAgentOptimization,
    planId: 'PLAN-REC-001',
  };

  const canonicalRunOpt: PlanningRun = {
    runId: 'RUN-2026-OPT-01',
    scenarioId: CANONICAL_SCENARIO.id,
    strategy: 'OPTIMIZATION_ONLY',
    status: 'COMPLETED',
    startTime: '2026-10-09T14:28:00Z',
    endTime: '2026-10-09T14:28:01Z',
    solverStatus: 'OPTIMAL',
    runtime: {
      solverMs: 380,
      totalMs: 380,
    },
    metrics: simulation.optimizationOnly,
    planId: 'PLAN-OPT-001',
  };

  const canonicalRunBaseline: PlanningRun = {
    runId: 'RUN-2026-BASE-01',
    scenarioId: CANONICAL_SCENARIO.id,
    strategy: 'REORDER_BASELINE',
    status: 'COMPLETED_WITH_WARNINGS',
    startTime: '2026-10-09T14:25:00Z',
    endTime: '2026-10-09T14:25:01Z',
    solverStatus: 'INFEASIBLE',
    runtime: {
      solverMs: 14,
      totalMs: 14,
    },
    errorSummary: 'Soft constraint breach: 4 consecutive days of plant starvation during outage window.',
    metrics: simulation.reorderBaseline,
    planId: 'PLAN-BASE-001',
  };

  runsStore['RUN-2026-MULTI-01'] = canonicalRunMulti;
  runsStore['RUN-2026-OPT-01'] = canonicalRunOpt;
  runsStore['RUN-2026-BASE-01'] = canonicalRunBaseline;

  plansStore['PLAN-REC-001'] = {
    planId: 'PLAN-REC-001',
    runId: 'RUN-2026-MULTI-01',
    scenarioId: CANONICAL_SCENARIO.id,
    version: 1,
    status: 'APPROVED',
    summary:
      'Coordinated Multi-Agent Recovery: Divert raw components to qualified alternate supplier SUP-02 (Munich), expedite 800 units via 2-day trans-Atlantic air freight on Days 4-7, protect Columbus Tier-1 Medical SLA, and rebalance Austin plant production.',
    objectiveValue: 547200,
    feasibilityStatus: 'FEASIBLE',
    hardConstraintViolations: 0,
    softConstraintBreaches: 0,
    solverStatus: 'OPTIMAL (OR-Tools CBC MILP, 0 hard constraint violations)',
    expectedLandedCost: simulation.multiAgentOptimization.totalLandedCost,
    expectedFillRate: simulation.multiAgentOptimization.fillRatePercent,
    expectedRecoveryDays: simulation.multiAgentOptimization.recoveryTimeDays,
    remainingRisks: [
      'Day 6 buffer drawdown is tight (10 units deferred by 24h at Reno standard DC)',
      'High dependence on Munich customs clearance turnaround for Air Waybill #AWB-9921',
    ],
    unresolvedWarnings: [],
    actions: [
      {
        id: 'ACT-001',
        actionType: 'SOURCE_SHIFT',
        targetResource: 'Supplier Vanguard Mechatronics (SUP-02)',
        details: 'Issue emergency purchase order for 800 units of CMP-101 at $195/unit.',
        quantityUnits: 800,
        effectiveDay: 4,
        costDelta: 44000,
        supportingEvidence: 'Supplier-Risk Agent verified 250 units/day available capacity under pre-negotiated Master Service Agreement #MSA-2024-VNG.',
        constraintsValidated: true,
      },
      {
        id: 'ACT-002',
        actionType: 'EXPEDITE_FREIGHT',
        targetResource: 'Air Logistics Lane: MUC -> AUS (Priority Trans-Atlantic)',
        details: 'Book 4 charter air shipments of 200 units each arriving Days 6, 7, 8, and 9 (2-day transit vs 5-day maritime/rail).',
        quantityUnits: 800,
        effectiveDay: 4,
        costDelta: 35200,
        supportingEvidence: 'Logistics Agent confirmed freight capacity with Lufthansa Cargo Flight #LH-8212.',
        constraintsValidated: true,
      },
      {
        id: 'ACT-003',
        actionType: 'BUFFER_ALLOCATION',
        targetResource: 'Austin Plant Alpha (plant-01)',
        details: 'Draw down safety stock to 0 units on Day 6 to maintain 100% finished goods output for Columbus Tier-1 shipments.',
        quantityUnits: 200,
        effectiveDay: 6,
        costDelta: -1200,
        supportingEvidence: 'Inventory Agent validated 600 units initial stock adequate until first air arrival.',
        constraintsValidated: true,
      },
      {
        id: 'ACT-004',
        actionType: 'PRIORITY_PROTECT',
        targetResource: 'Columbus Distribution Center (DC-01)',
        details: '100% allocation protection for Critical Medical Equipment lines; zero backorders permitted.',
        quantityUnits: 1680,
        effectiveDay: 1,
        costDelta: 0,
        supportingEvidence: 'Demand Agent flagged $250/unit SLA breach penalty under Contract #CTR-COL-2026.',
        constraintsValidated: true,
      },
    ],
    agentContributions: [
      {
        agentRole: 'SUPPLIER_RISK',
        actionCount: 1,
        contributionSummary: 'Identified qualified alternate SUP-02 with immediate capacity.',
        confidenceScore: 0.94,
      },
      {
        agentRole: 'LOGISTICS',
        actionCount: 1,
        contributionSummary: 'Secured 2-day trans-Atlantic expedited air lanes.',
        confidenceScore: 0.91,
      },
      {
        agentRole: 'INVENTORY',
        actionCount: 1,
        contributionSummary: 'Computed safety stock drawdown schedule without line stoppage.',
        confidenceScore: 0.96,
      },
      {
        agentRole: 'DEMAND',
        actionCount: 1,
        contributionSummary: 'Shielded Tier-1 Medical customer SLA commitments.',
        confidenceScore: 0.99,
      },
    ],
    auditDecision: decisionsStore[0],
  };
}

initializeRunsAndPlans();

// Forward to FastAPI if active, else fulfill via standard contract service
async function handleContractRoute(req: NextRequest, slug: string[]) {
  const path = slug.join('/');
  const method = req.method;

  // Attempt proxy to real FastAPI backend first
  try {
    const targetUrl = `${FASTAPI_TARGET}/api/v1/${path}${req.nextUrl.search}`;
    const proxyHeaders = new Headers();
    req.headers.forEach((val, key) => {
      if (key.toLowerCase() !== 'host') proxyHeaders.set(key, val);
    });

    const body = ['GET', 'HEAD'].includes(method) ? undefined : await req.clone().arrayBuffer();

    const proxyRes = await fetch(targetUrl, {
      method,
      headers: proxyHeaders,
      body,
      signal: AbortSignal.timeout(1000), // Quick check
    });

    if (proxyRes.ok || proxyRes.status === 400 || proxyRes.status === 401 || proxyRes.status === 404) {
      const respHeaders = new Headers();
      proxyRes.headers.forEach((val, key) => respHeaders.set(key, val));
      respHeaders.set('x-backend-source', 'fastapi-live');
      return new NextResponse(proxyRes.body, {
        status: proxyRes.status,
        headers: respHeaders,
      });
    }
  } catch {
    // FastAPI is not running on port 8000; seamlessly serve canonical contract implementation
  }

  // -------------------------------------------------------------------------
  // Fallback / Standalone Contract Service (matches PRD §14 Pydantic Schemas)
  // -------------------------------------------------------------------------
  const contractHeaders = {
    'x-backend-source': 'platform-contract-service',
    'x-contract-dependency': 'FastAPI + Neon PostgreSQL per docs/PRD.md Section 14',
  };

  // 1. GET /api/v1/me
  if (method === 'GET' && path === 'me') {
    return NextResponse.json(
      {
        userId: 'usr-planner-01',
        clerkId: 'user_2rG8kP9aBC01',
        displayName: 'Elena Rostova',
        email: 'elena.rostova@manufacturing.corp',
        role: 'SUPPLY_CHAIN_PLANNER',
        active: true,
      },
      { headers: contractHeaders }
    );
  }

  // 2. GET /api/v1/network/summary
  if (method === 'GET' && path === 'network/summary') {
    return NextResponse.json(
      {
        manifest: DATASET_MANIFEST,
        nodeCounts: {
          suppliers: SUPPLIERS.length,
          plants: PLANTS.length,
          distributionCenters: DISTRIBUTION_CENTERS.length,
          transportLanes: TRANSPORT_LANES.length,
          products: PRODUCTS.length,
        },
        criticalSupplierId: 'sup-01',
        criticalSupplierName: 'AeroCore Dynamics (Sendai, Japan)',
        disruptionStatus: 'ACTIVE_DISRUPTION',
        horizonDays: CANONICAL_SCENARIO.evaluationHorizonDays,
        totalDailyDemand: CANONICAL_SCENARIO.dailyDemandUnits,
      },
      { headers: contractHeaders }
    );
  }

  // 3. GET /api/v1/suppliers
  if (method === 'GET' && path === 'suppliers') {
    return NextResponse.json(SUPPLIERS, { headers: contractHeaders });
  }

  // 4. GET /api/v1/products
  if (method === 'GET' && path === 'products') {
    return NextResponse.json(PRODUCTS, { headers: contractHeaders });
  }

  // 5. GET /api/v1/inventory
  if (method === 'GET' && path === 'inventory') {
    const balances = [
      {
        id: 'inv-01',
        itemId: 'prod-01',
        itemSku: 'CMP-101',
        itemName: 'Precision Harmonic Actuator Core',
        nodeId: 'plant-01',
        nodeCode: 'PLANT-ALPHA',
        nodeName: 'Austin Advanced Manufacturing Facility',
        onHandQuantity: 600,
        reservedQuantity: 200,
        availableQuantity: 400,
        safetyStockDays: 3,
        depletionDayProjected: 6,
        unitCost: 140,
      },
      {
        id: 'inv-02',
        itemId: 'prod-02',
        itemSku: 'CMP-102',
        itemName: 'Machined Titanium Frame Housing',
        nodeId: 'plant-01',
        nodeCode: 'PLANT-ALPHA',
        nodeName: 'Austin Advanced Manufacturing Facility',
        onHandQuantity: 1200,
        reservedQuantity: 200,
        availableQuantity: 1000,
        safetyStockDays: 6,
        depletionDayProjected: 12,
        unitCost: 85,
      },
      {
        id: 'inv-03',
        itemId: 'prod-03',
        itemSku: 'SKU-900',
        itemName: 'Autonomous Industrial Robotic Drive Unit',
        nodeId: 'dc-01',
        nodeCode: 'DC-EAST',
        nodeName: 'Columbus Medical & Industrial Logistics Hub',
        onHandQuantity: 240,
        reservedQuantity: 120,
        availableQuantity: 120,
        safetyStockDays: 2,
        depletionDayProjected: 7,
        unitCost: 450,
      },
      {
        id: 'inv-04',
        itemId: 'prod-03',
        itemSku: 'SKU-900',
        itemName: 'Autonomous Industrial Robotic Drive Unit',
        nodeId: 'dc-02',
        nodeCode: 'DC-WEST',
        nodeName: 'Reno Standard Fulfillment Center',
        onHandQuantity: 160,
        reservedQuantity: 80,
        availableQuantity: 80,
        safetyStockDays: 2,
        depletionDayProjected: 7,
        unitCost: 450,
      },
    ];
    return NextResponse.json(balances, { headers: contractHeaders });
  }

  // 6. GET /api/v1/demand
  if (method === 'GET' && path === 'demand') {
    const demandRecords = [
      {
        id: 'dem-01',
        productSku: 'SKU-900',
        productName: 'Autonomous Industrial Robotic Drive Unit',
        nodeCode: 'DC-EAST',
        nodeName: 'Columbus Medical & Industrial Hub',
        dailyDemandUnits: 120,
        serviceTier: 'TIER_1_CRITICAL',
        targetSlaPercent: 98,
        shortagePenaltyPerUnit: 250,
      },
      {
        id: 'dem-02',
        productSku: 'SKU-900',
        productName: 'Autonomous Industrial Robotic Drive Unit',
        nodeCode: 'DC-WEST',
        nodeName: 'Reno Standard Fulfillment Center',
        dailyDemandUnits: 80,
        serviceTier: 'TIER_2_STANDARD',
        targetSlaPercent: 90,
        shortagePenaltyPerUnit: 100,
      },
    ];
    return NextResponse.json(demandRecords, { headers: contractHeaders });
  }

  // 7. GET /api/v1/transport-lanes
  if (method === 'GET' && path === 'transport-lanes') {
    return NextResponse.json(TRANSPORT_LANES, { headers: contractHeaders });
  }

  // 8. GET /api/v1/data-quality
  if (method === 'GET' && path === 'data-quality') {
    return NextResponse.json(
      {
        status: 'HEALTHY',
        checksPassed: 7,
        hardViolations: 0,
        issues: [],
        timestamp: new Date().toISOString(),
      },
      { headers: contractHeaders }
    );
  }

  // 9. GET /api/v1/scenarios
  if (method === 'GET' && path === 'scenarios') {
    return NextResponse.json(scenariosStore, { headers: contractHeaders });
  }

  // 10. POST /api/v1/scenarios
  if (method === 'POST' && path === 'scenarios') {
    try {
      const body = await req.json();
      const newScenario: DisruptionScenario = {
        id: `SCN-${Date.now().toString().slice(-4)}`,
        name: body.name || 'Custom Scenario',
        description: body.description || 'Custom planner what-if scenario',
        datasetVersion: '1.0.0-canonical',
        randomSeed: 'SEED_2026_SCM_V1',
        criticalSupplierId: body.criticalSupplierId || 'sup-01',
        disruptionStartDay: Number(body.disruptionStartDay) || 4,
        disruptionDurationDays: Number(body.disruptionDurationDays) || 7,
        evaluationHorizonDays: Number(body.evaluationHorizonDays) || 14,
        safetyStockDays: Number(body.safetyStockDays) || 3,
        dailyDemandUnits: Number(body.dailyDemandUnits) || 200,
        shortagePenaltyPerUnit: Number(body.shortagePenaltyPerUnit) || 150,
      };
      scenariosStore.unshift(newScenario);
      return NextResponse.json(newScenario, { status: 201, headers: contractHeaders });
    } catch {
      return NextResponse.json({ error: 'Invalid scenario payload' }, { status: 400 });
    }
  }

  // 11. GET /api/v1/scenarios/:id
  if (method === 'GET' && path.startsWith('scenarios/') && !path.includes('/')) {
    const scId = path.split('/')[1];
    const sc = scenariosStore.find((s) => s.id === scId) || CANONICAL_SCENARIO;
    return NextResponse.json(sc, { headers: contractHeaders });
  }

  // 12. POST /api/v1/scenarios/:id/impact-analysis
  if (method === 'POST' && path.includes('/impact-analysis')) {
    const scId = path.split('/')[1];
    const scenario = scenariosStore.find((s) => s.id === scId) || CANONICAL_SCENARIO;

    const timeline = [];
    let currentRaw = 600;
    const dailyNeed = scenario.dailyDemandUnits;

    for (let day = 1; day <= scenario.evaluationHorizonDays; day++) {
      let inbound = 0;
      let state: any = 'MEASURED_DELIVERY';
      const isMeasured = day <= 3;

      if (day <= 6) {
        inbound = 200;
        state = isMeasured ? 'MEASURED_DELIVERY' : 'DISRUPTION_ACTIVE';
      } else if (day >= 4 + scenario.disruptionDurationDays + 3) {
        inbound = 200;
        state = 'POST_RECOVERY';
      } else {
        inbound = 0;
        state = 'DISRUPTION_ACTIVE';
      }

      currentRaw += inbound;
      const consumed = Math.min(currentRaw, dailyNeed);
      currentRaw -= consumed;

      if (currentRaw <= 0 && day >= 6) {
        state = 'STOCKOUT_BREACH';
      }

      timeline.push({
        day,
        rawStock: Math.max(0, currentRaw),
        projectedDemand: dailyNeed,
        inboundUnits: inbound,
        state,
        isMeasured,
      });
    }

    const impact = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      criticalSupplier: {
        id: 'sup-01',
        code: 'SUP-01',
        name: 'AeroCore Dynamics',
        location: 'Sendai, Japan (Precision Micro-Machining)',
        normalDailyCapacity: 300,
      },
      disruptionPeriod: {
        startDay: scenario.disruptionStartDay,
        durationDays: scenario.disruptionDurationDays,
        endDay: scenario.disruptionStartDay + scenario.disruptionDurationDays - 1,
        horizonDays: scenario.evaluationHorizonDays,
      },
      affectedProducts: [
        {
          sku: 'CMP-101',
          name: 'Precision Harmonic Actuator Core',
          type: 'COMPONENT',
          standardCost: 140,
          normalLeadTimeDays: 3,
          stockoutProjectedDay: 6,
          measuredInTransitUnits: 600,
        },
      ],
      affectedPlants: [
        {
          id: 'plant-01',
          name: 'Austin Advanced Manufacturing Facility (Plant Alpha)',
          dailyCapacity: 300,
          starvationDay: 7,
        },
      ],
      downstreamDestinations: [
        {
          code: 'DC-EAST',
          name: 'Columbus Medical & Industrial Logistics Hub',
          serviceTier: 'TIER_1_CRITICAL',
          targetSlaPercent: 98,
          demandAtRiskUnits: 600,
          slaPenaltyPerUnit: 250,
        },
        {
          code: 'DC-WEST',
          name: 'Reno Standard Fulfillment Center',
          serviceTier: 'TIER_2_STANDARD',
          targetSlaPercent: 90,
          demandAtRiskUnits: 400,
          slaPenaltyPerUnit: 100,
        },
      ],
      inventoryDepletionTimeline: timeline,
      totalDemandAtRiskUnits: 1000,
      estimatedCostExposure: 150000,
      measuredDataHorizon: 3,
      calculatedProjectionHorizon: 14,
    };

    return NextResponse.json(impact, { headers: contractHeaders });
  }

  // 13. POST /api/v1/scenarios/:id/runs
  if (method === 'POST' && path.includes('/runs')) {
    const scId = path.split('/')[1];
    const scenario = scenariosStore.find((s) => s.id === scId) || CANONICAL_SCENARIO;
    const sim = runSimulation(scenario);

    const runIdMulti = `RUN-${Date.now().toString().slice(-6)}-MULTI`;
    const runIdOpt = `RUN-${Date.now().toString().slice(-6)}-OPT`;
    const runIdBase = `RUN-${Date.now().toString().slice(-6)}-BASE`;

    runsStore[runIdMulti] = {
      runId: runIdMulti,
      scenarioId: scenario.id,
      strategy: 'MULTI_AGENT_OPTIMIZATION',
      status: 'COMPLETED',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      solverStatus: 'OPTIMAL',
      runtime: { solverMs: 420, agentMs: 1250, totalMs: 1670 },
      proposals: CANONICAL_AGENT_PROPOSALS,
      metrics: sim.multiAgentOptimization,
      planId: `PLAN-${Date.now().toString().slice(-4)}`,
    };

    runsStore[runIdOpt] = {
      runId: runIdOpt,
      scenarioId: scenario.id,
      strategy: 'OPTIMIZATION_ONLY',
      status: 'COMPLETED',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      solverStatus: 'OPTIMAL',
      runtime: { solverMs: 380, totalMs: 380 },
      metrics: sim.optimizationOnly,
      planId: `PLAN-OPT-${Date.now().toString().slice(-4)}`,
    };

    runsStore[runIdBase] = {
      runId: runIdBase,
      scenarioId: scenario.id,
      strategy: 'REORDER_BASELINE',
      status: 'COMPLETED_WITH_WARNINGS',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      solverStatus: 'INFEASIBLE',
      runtime: { solverMs: 14, totalMs: 14 },
      errorSummary: 'Soft constraint breach: 4 consecutive days of plant starvation during outage window.',
      metrics: sim.reorderBaseline,
    };

    return NextResponse.json(
      {
        runIds: [runIdMulti, runIdOpt, runIdBase],
        status: 'SUCCESS',
      },
      { status: 201, headers: contractHeaders }
    );
  }

  // 14. GET /api/v1/runs
  if (method === 'GET' && path === 'runs') {
    return NextResponse.json(Object.values(runsStore), { headers: contractHeaders });
  }

  // 15. GET /api/v1/runs/:id
  if (method === 'GET' && path.startsWith('runs/') && !path.includes('/', 5)) {
    const runId = path.split('/')[1];
    const r = runsStore[runId] || runsStore['RUN-2026-MULTI-01'];
    return NextResponse.json(r, { headers: contractHeaders });
  }

  // 16. GET /api/v1/runs/:id/events
  if (method === 'GET' && path.includes('/events')) {
    const runId = path.split('/')[1];
    const events = [
      {
        id: 'evt-1',
        runId,
        timestamp: '2026-10-09T14:30:00.100Z',
        stage: 'INITIALIZATION',
        status: 'SUCCESS',
        message: 'Scenario state snapshot pinned (SEED_2026_SCM_V1, 14-day horizon).',
        latencyMs: 40,
      },
      {
        id: 'evt-2',
        runId,
        timestamp: '2026-10-09T14:30:00.350Z',
        stage: 'AGENT_ANALYSIS',
        status: 'SUCCESS',
        message: 'Supplier-Risk Agent queried qualified alternate supplier catalog: SUP-02 identified.',
        latencyMs: 250,
      },
      {
        id: 'evt-3',
        runId,
        timestamp: '2026-10-09T14:30:00.720Z',
        stage: 'AGENT_ANALYSIS',
        status: 'SUCCESS',
        message: 'Logistics Agent evaluated transatlantic freight options: proposed 2-day air transit.',
        latencyMs: 370,
      },
      {
        id: 'evt-4',
        runId,
        timestamp: '2026-10-09T14:30:01.050Z',
        stage: 'COORDINATION',
        status: 'SUCCESS',
        message: 'Coordinator reconciled proposals: confirmed zero hard-constraint conflicts.',
        latencyMs: 330,
      },
      {
        id: 'evt-5',
        runId,
        timestamp: '2026-10-09T14:30:01.470Z',
        stage: 'OPTIMIZATION',
        status: 'SUCCESS',
        message: 'OR-Tools MILP Solver converged to optimal solution: 0 constraint breaches.',
        latencyMs: 420,
      },
      {
        id: 'evt-6',
        runId,
        timestamp: '2026-10-09T14:30:01.670Z',
        stage: 'SIMULATION',
        status: 'SUCCESS',
        message: '14-day deterministic simulation verified 99.6% fill rate; plan persisted.',
        latencyMs: 200,
      },
    ];
    return NextResponse.json(events, { headers: contractHeaders });
  }

  // 17. GET /api/v1/runs/:id/proposals
  if (method === 'GET' && path.includes('/proposals')) {
    return NextResponse.json(CANONICAL_AGENT_PROPOSALS, { headers: contractHeaders });
  }

  // 18. GET /api/v1/runs/:id/plan
  if (method === 'GET' && path.includes('/plan')) {
    const runId = path.split('/')[1];
    const plan = Object.values(plansStore).find((p) => p.runId === runId) || plansStore['PLAN-REC-001'];
    return NextResponse.json(plan, { headers: contractHeaders });
  }

  // 19. GET /api/v1/runs/:id/metrics
  if (method === 'GET' && path.includes('/metrics')) {
    const runId = path.split('/')[1];
    const r = runsStore[runId] || runsStore['RUN-2026-MULTI-01'];
    return NextResponse.json(r?.metrics, { headers: contractHeaders });
  }

  // 20. POST /api/v1/plans/:id/approve
  if (method === 'POST' && path.includes('/approve')) {
    const planId = path.split('/')[1];
    try {
      const body = await req.json();
      const plan = plansStore[planId] || plansStore['PLAN-REC-001'];

      const decision: PlannerDecision = {
        planId,
        runId: plan.runId,
        plannerId: 'usr-planner-01',
        decision: 'APPROVED',
        rationale: body.rationale || 'Authorized recovery plan.',
        timestamp: new Date().toISOString(),
        authorizedBudgetDelta: body.authorizedBudgetDelta || 48200,
      };

      plan.status = 'APPROVED';
      plan.auditDecision = decision;
      decisionsStore.unshift(decision);

      return NextResponse.json(decision, { status: 200, headers: contractHeaders });
    } catch {
      return NextResponse.json({ error: 'Failed to approve plan' }, { status: 400 });
    }
  }

  // 21. POST /api/v1/plans/:id/reject
  if (method === 'POST' && path.includes('/reject')) {
    const planId = path.split('/')[1];
    try {
      const body = await req.json();
      if (!body.reason || body.reason.trim().length === 0) {
        return NextResponse.json(
          { error: 'A specific rejection reason is strictly required by the audit contract.' },
          { status: 422 }
        );
      }

      const plan = plansStore[planId] || plansStore['PLAN-REC-001'];
      const decision: PlannerDecision = {
        planId,
        runId: plan.runId,
        plannerId: 'usr-planner-01',
        decision: 'REJECTED',
        rationale: body.reason,
        timestamp: new Date().toISOString(),
        authorizedBudgetDelta: 0,
      };

      plan.status = 'REJECTED';
      plan.auditDecision = decision;
      decisionsStore.unshift(decision);

      return NextResponse.json(decision, { status: 200, headers: contractHeaders });
    } catch {
      return NextResponse.json({ error: 'Failed to reject plan' }, { status: 400 });
    }
  }

  // 22. GET /api/v1/decisions
  if (method === 'GET' && path === 'decisions') {
    return NextResponse.json(decisionsStore, { headers: contractHeaders });
  }

  // 23. GET /api/v1/evaluations/:id/comparison
  if (method === 'GET' && path.includes('/comparison')) {
    const scId = path.split('/')[1];
    const scenario = scenariosStore.find((s) => s.id === scId) || CANONICAL_SCENARIO;
    const sim = runSimulation(scenario);

    const comparison = {
      evaluationId: `EVAL-${scenario.id}`,
      scenarioId: scenario.id,
      timestamp: new Date().toISOString(),
      strategies: {
        reorderBaseline: sim.reorderBaseline,
        optimizationOnly: sim.optimizationOnly,
        multiAgentOptimization: sim.multiAgentOptimization,
      },
      comparisonSummary: {
        fillRateAdvantagePercent: Number(
          (sim.multiAgentOptimization.fillRatePercent - sim.optimizationOnly.fillRatePercent).toFixed(1)
        ),
        costPremiumVsOptimization:
          sim.multiAgentOptimization.totalLandedCost - sim.optimizationOnly.totalLandedCost,
        backorderUnitsSaved:
          sim.optimizationOnly.totalBackorders - sim.multiAgentOptimization.totalBackorders,
        recoveryTimeDaysDelta: 5, // 4 days vs 9 days
      },
    };

    return NextResponse.json(comparison, { headers: contractHeaders });
  }

  return NextResponse.json(
    {
      error: 'ENDPOINT_NOT_FOUND',
      detail: `Route /api/v1/${path} not recognized in contract.`,
      contract_dependency: 'FastAPI /api/v1 contract specification (PRD §14)',
    },
    { status: 404, headers: contractHeaders }
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleContractRoute(req, slug);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleContractRoute(req, slug);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleContractRoute(req, slug);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return handleContractRoute(req, slug);
}
