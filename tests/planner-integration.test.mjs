import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

test('1. Planner data loads from the backend (/api/v1/overview/metrics and /network/summary)', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/overview/metrics`);
  assert.equal(res.status, 200, 'Metrics endpoint should return 200 OK');
  const data = await res.json();
  assert.ok(data.networkCounts, 'Should include networkCounts');
  assert.equal(data.networkCounts.totalSuppliers, 3, 'Should have 3 suppliers');
  assert.equal(data.networkCounts.disruptedSuppliers, 1, 'Should have 1 disrupted supplier');
  assert.equal(data.networkCounts.totalPlants, 1, 'Should have 1 assembly plant');
  assert.equal(data.networkCounts.totalDCs, 2, 'Should have 2 distribution centers');
  assert.ok(data.environment, 'Should include environment metadata');
  assert.ok(data.environment.database.includes('Neon PostgreSQL'), 'Database should be Neon PostgreSQL');
});

test('2. The configured supplier shutdown is displayed correctly', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/scenarios/SCN-POC-001-CANONICAL/impact-analysis`, {
    method: 'POST',
  });
  assert.equal(res.status, 200, 'Impact analysis should return 200');
  const impact = await res.json();
  assert.equal(impact.criticalSupplier.id, 'sup-01', 'Critical supplier should be sup-01');
  assert.equal(impact.criticalSupplier.code, 'SUP-01', 'Supplier code should be SUP-01');
  assert.equal(impact.disruptionPeriod.durationDays, 7, 'Disruption duration must be 7 days');
  assert.equal(impact.disruptionPeriod.startDay, 4, 'Disruption start day must be Day 4');
  assert.equal(impact.affectedProducts[0].sku, 'CMP-101', 'Affected component must be CMP-101');
  assert.equal(impact.affectedProducts[0].stockoutProjectedDay, 6, 'Projected stockout day must be Day 6');
  assert.equal(impact.inventoryDepletionTimeline.length, 14, 'Timeline should cover 14 days');
  // First 3 days are measured data
  assert.equal(impact.inventoryDepletionTimeline[0].isMeasured, true, 'Day 1 should be measured data');
  assert.equal(impact.inventoryDepletionTimeline[3].isMeasured, false, 'Day 4 should be projected data');
});

test('3. Entity dependency graph is navigable from backend', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/network/dependencies/supplier/sup-01`);
  assert.equal(res.status, 200, 'Dependency lookup should return 200');
  const deps = await res.json();
  assert.equal(deps.entityId, 'sup-01');
  assert.equal(deps.canDeleteSafely, false, 'Critical supplier cannot be deleted safely');
  assert.ok(deps.warnings.length > 0, 'Should include active disruption warnings');
});

test('4. Analysis triggers actual agent execution & returns proposals', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/scenarios/SCN-POC-001-CANONICAL/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      strategies: ['REORDER_BASELINE', 'OPTIMIZATION_ONLY', 'MULTI_AGENT_OPTIMIZATION'],
    }),
  });
  assert.equal(res.status, 201, 'Run trigger should return 201 Created');
  const data = await res.json();
  assert.ok(Array.isArray(data.runIds), 'Should return array of runIds');
  assert.equal(data.runIds.length, 3, 'Should generate run IDs for all 3 strategies');

  // Verify multi-agent proposals
  const propRes = await fetch(`${BASE_URL}/api/v1/runs/RUN-2026-MULTI-01/proposals`);
  assert.equal(propRes.status, 200);
  const proposals = await propRes.json();
  assert.ok(proposals.length >= 4, 'Should contain proposals from all 4 specialized agents');
  const roles = proposals.map((p) => p.agentType);
  assert.ok(roles.includes('SUPPLIER_RISK'), 'Should include Supplier Risk Agent proposal');
  assert.ok(roles.includes('LOGISTICS'), 'Should include Logistics Agent proposal');
  assert.ok(roles.includes('INVENTORY'), 'Should include Inventory Agent proposal');
  assert.ok(roles.includes('DEMAND'), 'Should include Demand Agent proposal');
});

test('5. Scenario comparison uses persisted, computed results', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/evaluations/SCN-POC-001-CANONICAL/comparison`);
  assert.equal(res.status, 200);
  const comp = await res.json();
  const reorder = comp.strategies.reorderBaseline;
  const opt = comp.strategies.optimizationOnly;
  const multi = comp.strategies.multiAgentOptimization;

  // Verify baseline metrics per PRD Section 1 & 8
  assert.ok(reorder.fillRatePercent < 75, `Reorder fill rate should be low (${reorder.fillRatePercent}%)`);
  assert.ok(opt.fillRatePercent > 85, `Optimization-only fill rate should be ~89% (${opt.fillRatePercent}%)`);
  assert.ok(multi.fillRatePercent >= 98, `Multi-agent fill rate should be ~99%+ (${multi.fillRatePercent}%)`);

  // Hard constraint violations
  assert.equal(multi.hardConstraintViolations, 0, 'Multi-agent plan must have 0 hard constraint violations');
  assert.equal(multi.feasibilityStatus, 'FEASIBLE', 'Multi-agent plan must be marked FEASIBLE');
  assert.equal(reorder.feasibilityStatus, 'UNMITIGATED_SHORTAGE', 'Reorder baseline must be marked UNMITIGATED_SHORTAGE');
});

test('6. Plan approval persists decision and records auditable history', async () => {
  const testRationale = 'Integration Test: Authorized $48,200 emergency freight allocation.';
  const approveRes = await fetch(`${BASE_URL}/api/v1/plans/PLAN-REC-001/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rationale: testRationale,
      authorizedBudgetDelta: 48200,
      planVersion: 1,
    }),
  });
  assert.equal(approveRes.status, 200, 'Approve plan should succeed');
  const decision = await approveRes.json();
  assert.equal(decision.decision, 'APPROVED');
  assert.equal(decision.rationale, testRationale);
  assert.equal(decision.authorizedBudgetDelta, 48200);

  // Verify decision is in decision history
  const histRes = await fetch(`${BASE_URL}/api/v1/decisions`);
  assert.equal(histRes.status, 200);
  const decisions = await histRes.json();
  const found = decisions.find((d) => d.rationale === testRationale);
  assert.ok(found, 'Approval must persist in decision history');
});

test('7. Plan rejection requires explicit reason per contract', async () => {
  // Attempt reject without reason -> should fail with 422
  const badRes = await fetch(`${BASE_URL}/api/v1/plans/PLAN-REC-001/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: '' }),
  });
  assert.equal(badRes.status, 422, 'Empty rejection reason must return 422 Unprocessable Entity');

  // Reject with valid reason
  const goodRes = await fetch(`${BASE_URL}/api/v1/plans/PLAN-REC-001/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Integration Test: Air expedite premium exceeds threshold.' }),
  });
  assert.equal(goodRes.status, 200, 'Valid rejection reason should succeed');
  const rejection = await goodRes.json();
  assert.equal(rejection.decision, 'REJECTED');
});

test('8. What-if scenario creation persists to scenario registry', async () => {
  const newName = `Integration Test Scenario ${Date.now()}`;
  const res = await fetch(`${BASE_URL}/api/v1/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      description: 'Automated integration test what-if scenario',
      criticalSupplierId: 'sup-01',
      disruptionStartDay: 4,
      disruptionDurationDays: 8,
      safetyStockDays: 4,
      dailyDemandUnits: 250,
      shortagePenaltyPerUnit: 200,
    }),
  });
  assert.equal(res.status, 201, 'Create scenario should return 201 Created');
  const sc = await res.json();
  assert.equal(sc.name, newName);

  // Verify it appears in scenario list
  const listRes = await fetch(`${BASE_URL}/api/v1/scenarios`);
  const list = await listRes.json();
  const match = list.find((s) => s.id === sc.id);
  assert.ok(match, 'Newly created scenario must be retrievable from GET /scenarios');
});

test('9. Current user endpoint returns authenticated planner identity', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/me`);
  assert.equal(res.status, 200);
  const me = await res.json();
  const userId = me.user?.id || me.userId;
  assert.ok(userId, 'Should return a valid user ID');
  const role = me.user?.role || me.role;
  assert.ok(['SUPPLY_CHAIN_PLANNER', 'ADMIN'].includes(role), 'Should have authorized role');
});
