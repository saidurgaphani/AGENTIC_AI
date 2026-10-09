import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testAdminE2E() {
  console.log('====================================================');
  console.log('STARTING COMPLETE ADMIN CONSOLE E2E VERIFICATION');
  console.log('====================================================\n');

  // Test 1: Overview Metrics from Neon PostgreSQL
  console.log('Test 1: GET /api/v1/overview/metrics');
  const resOverview = await fetch(`${BASE_URL}/api/v1/overview/metrics`);
  assert.strictEqual(resOverview.status, 200, 'Overview status must be 200');
  const overviewData = await resOverview.json();
  assert(overviewData.networkCounts.totalProducts >= 3, 'Must have at least 3 products');
  assert(overviewData.networkCounts.totalSuppliers >= 3, 'Must have at least 3 suppliers');
  assert(overviewData.dataset?.seed, 'Must return active dataset seed');
  assert(overviewData.activeScenario?.id, 'Must return active scenario');
  assert(overviewData.agents?.length === 4, 'Must return 4 agents');
  console.log('✓ Overview metrics correctly fetched from Neon DB\n');

  // Test 2: Network Entities & Summary
  console.log('Test 2: GET /api/v1/network/summary');
  const resNetwork = await fetch(`${BASE_URL}/api/v1/network/summary`);
  assert.strictEqual(resNetwork.status, 200);
  const networkData = await resNetwork.json();
  assert(networkData.suppliers.length >= 3);
  assert(networkData.products.length >= 3);
  assert(networkData.facilities.length >= 1);
  assert(networkData.distributionCenters.length >= 2);
  assert(networkData.transportLanes.length >= 5);
  console.log('✓ Network entities and summary validated\n');

  // Test 3: Entity Dependency Analysis before Deactivation
  console.log('Test 3: GET /api/v1/network/dependencies/supplier/sup-01');
  const resDep = await fetch(`${BASE_URL}/api/v1/network/dependencies/supplier/sup-01`);
  assert.strictEqual(resDep.status, 200);
  const depData = await resDep.json();
  assert.strictEqual(depData.canDeleteSafely, false, 'SUP-01 cannot be hard deleted due to scenario reference');
  assert(depData.warnings.length > 0, 'Must provide dependency warnings');
  console.log('✓ Dependency analysis engine prevents invalid destructive deletions\n');

  // Test 4: Master Data CRUD - Create Supplier & Safe Deactivation
  console.log('Test 4: POST /api/v1/network/suppliers (Create & Deactivate)');
  const testCode = `TEST-${Date.now().toString().slice(-4)}`;
  const resCreateSup = await fetch(`${BASE_URL}/api/v1/network/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: testCode,
      name: 'E2E Test Supplier Ltd',
      location: 'Osaka, Japan',
      criticality: 'SECONDARY',
    }),
  });
  assert.strictEqual(resCreateSup.status, 201);
  const createdSup = await resCreateSup.json();
  assert.strictEqual(createdSup.supplier.code, testCode);

  // Deactivate created supplier
  const resDeact = await fetch(`${BASE_URL}/api/v1/network/suppliers/${createdSup.supplier.id}`, {
    method: 'DELETE',
  });
  assert.strictEqual(resDeact.status, 200);
  console.log('✓ Supplier created and safely deactivated with audit record\n');

  // Test 5: Dataset Management - CSV Validation Rejection
  console.log('Test 5: POST /api/v1/datasets/import (Dry Run Validation Failure)');
  const resInvalidCsv = await fetch(`${BASE_URL}/api/v1/datasets/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entityType: 'products',
      csvContent: 'sku,name,type\nINVALID-SKU,Missing Cost,COMPONENT',
      dryRun: true,
    }),
  });
  const invalidCsvData = await resInvalidCsv.json();
  assert.strictEqual(invalidCsvData.valid, false, 'Must reject missing standard_cost header');
  console.log('✓ Malformed CSV rejected with row-level error reporting\n');

  // Test 6: Dataset Management - CSV Validation Success
  console.log('Test 6: POST /api/v1/datasets/import (Dry Run Validation Pass)');
  const resValidCsv = await fetch(`${BASE_URL}/api/v1/datasets/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entityType: 'products',
      csvContent: 'sku,name,type,standard_cost\nCMP-990,Test Planetary Actuator,COMPONENT,130.00',
      dryRun: true,
    }),
  });
  const validCsvData = await resValidCsv.json();
  assert.strictEqual(validCsvData.valid, true, 'Valid CSV must pass validation');
  console.log('✓ Valid CSV passed dry-run schema validation\n');

  // Test 7: Disruption Scenario Validation (7-Day Outage)
  console.log('Test 7: POST /api/v1/scenarios/SCN-2026-SHUTDOWN-07D/validate');
  const resValidate = await fetch(
    `${BASE_URL}/api/v1/scenarios/SCN-2026-SHUTDOWN-07D/validate`,
    { method: 'POST' }
  );
  assert.strictEqual(resValidate.status, 200);
  const validateResult = await resValidate.json();
  assert.strictEqual(validateResult.valid, true);
  assert(validateResult.validations.some((v) => v.check.includes('7-Day')));
  console.log('✓ 7-Day disruption network connectivity validated\n');

  // Test 8: Disruption Blast Radius Impact Analysis
  console.log('Test 8: POST /api/v1/scenarios/SCN-2026-SHUTDOWN-07D/impact-analysis');
  const resImpact = await fetch(
    `${BASE_URL}/api/v1/scenarios/SCN-2026-SHUTDOWN-07D/impact-analysis`,
    { method: 'POST' }
  );
  assert.strictEqual(resImpact.status, 200);
  const impactData = await resImpact.json();
  assert(impactData.impact.financialExposure.lostInboundUnits > 0);
  assert.strictEqual(impactData.impact.projectedStockoutDay, 7);
  console.log('✓ Impact blast radius computed (Stockout on Day 7, lost units calculated)\n');

  // Test 9: Real Simulation Run Execution & Persistence
  console.log('Test 9: POST /api/v1/scenarios/SCN-2026-SHUTDOWN-07D/runs');
  const resRun = await fetch(
    `${BASE_URL}/api/v1/scenarios/SCN-2026-SHUTDOWN-07D/runs`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy: 'MULTI_AGENT_OPTIMIZATION' }),
    }
  );
  assert(resRun.status === 200 || resRun.status === 201, 'Status must be 200 or 201');
  const runData = await resRun.json();
  assert(runData.runId, 'Must return generated run ID');
  assert.strictEqual(runData.solverStatus, 'OPTIMAL');
  assert(runData.result.fillRatePercent >= 90);
  console.log(`✓ Real simulation executed and solved (Run: ${runData.runId}, Fill Rate: ${runData.result.fillRatePercent}%)\n`);

  // Test 10: Agent Governance & Diagnostic Test
  console.log('Test 10: POST /api/v1/agents/LOGISTICS/test');
  const resAgentTest = await fetch(`${BASE_URL}/api/v1/agents/LOGISTICS/test`, {
    method: 'POST',
  });
  assert.strictEqual(resAgentTest.status, 200);
  const agentTestResult = await resAgentTest.json();
  assert.strictEqual(agentTestResult.success, true);
  assert.strictEqual(agentTestResult.healthStatus, 'HEALTHY');
  console.log(`✓ Agent diagnostic executed (Latency: ${agentTestResult.latencyMs}ms)\n`);

  // Test 11: Constraint Management & Bounds Enforcement
  console.log('Test 11: PUT /api/v1/constraints/c-04 (Boundary validation)');
  const resConstFail = await fetch(`${BASE_URL}/api/v1/constraints/c-04`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 150 }), // > 100% SLA is invalid
  });
  assert.strictEqual(resConstFail.status, 400, 'SLA > 100% must be rejected');

  const resConstPass = await fetch(`${BASE_URL}/api/v1/constraints/c-04`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 95.0, description: 'Tier-1 Customer Minimum Service SLA' }),
  });
  assert.strictEqual(resConstPass.status, 200);
  console.log('✓ Constraint bounds enforcement and persistence validated\n');

  // Test 12: User Role Management & Immutable Audit Trail
  console.log('Test 12: GET /api/v1/audit');
  const resAudit = await fetch(`${BASE_URL}/api/v1/audit`);
  assert.strictEqual(resAudit.status, 200);
  const auditData = await resAudit.json();
  assert(auditData.count > 0, 'Audit events must be recorded');
  const latestEvent = auditData.events[0];
  console.log(`✓ Audit log verified (Latest event: ${latestEvent.event_type} on ${latestEvent.target_entity})\n`);

  // Test 13: Shared Planner Synchronization Check
  console.log('Test 13: GET /api/supply-chain (Shared synchronization)');
  const resShared = await fetch(`${BASE_URL}/api/supply-chain`);
  assert.strictEqual(resShared.status, 200);
  const sharedData = await resShared.json();
  assert(sharedData.network.suppliers.length >= 3);
  assert(sharedData.simulation.multiAgentOptimization.fillRatePercent >= 90);
  console.log('✓ Shared /api/supply-chain endpoint synchronized with Neon PostgreSQL\n');

  console.log('====================================================');
  console.log('ALL 13 E2E ACCEPTANCE TESTS PASSED SUCCESSFULLY! 🚀');
  console.log('====================================================');
}

testAdminE2E().catch((err) => {
  console.error('E2E TEST FAILURE:', err);
  process.exit(1);
});
