import { neon } from '@neondatabase/serverless';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_vtEwXLAKx38T@ep-ancient-recipe-b4j9aoij-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function init() {
  console.log('Connecting to Neon PostgreSQL and initializing schema...');

  // 1. Create Tables
  await sql`
    CREATE TABLE IF NOT EXISTS dataset_versions (
      id VARCHAR(64) PRIMARY KEY,
      version VARCHAR(32) NOT NULL,
      name VARCHAR(255) NOT NULL,
      seed VARCHAR(64) NOT NULL,
      currency VARCHAR(16) NOT NULL DEFAULT 'USD',
      manifest JSONB,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      sku VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(32) NOT NULL, -- COMPONENT, FINISHED_GOOD
      uom VARCHAR(32) NOT NULL DEFAULT 'units',
      standard_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS suppliers (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      criticality VARCHAR(32) NOT NULL DEFAULT 'SECONDARY', -- CRITICAL, SECONDARY, ALTERNATE
      active BOOLEAN NOT NULL DEFAULT TRUE,
      disrupted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS production_resources (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      produced_sku VARCHAR(64) NOT NULL,
      daily_capacity INTEGER NOT NULL DEFAULT 300,
      daily_operating_cost NUMERIC(12, 2) NOT NULL DEFAULT 12500.00,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS distribution_centers (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      service_tier VARCHAR(32) NOT NULL DEFAULT 'TIER_1_CRITICAL',
      target_sla_percent NUMERIC(5, 2) NOT NULL DEFAULT 95.00,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS supplier_products (
      id VARCHAR(64) PRIMARY KEY,
      supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE CASCADE,
      product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
      eligible BOOLEAN NOT NULL DEFAULT TRUE,
      normal_lead_time_days INTEGER NOT NULL DEFAULT 3,
      expedite_lead_time_days INTEGER NOT NULL DEFAULT 2,
      daily_capacity INTEGER NOT NULL DEFAULT 200,
      unit_purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 100.00,
      expedite_unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 150.00
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bill_of_materials (
      id VARCHAR(64) PRIMARY KEY,
      parent_sku VARCHAR(64) NOT NULL,
      component_sku VARCHAR(64) NOT NULL,
      quantity_required INTEGER NOT NULL DEFAULT 1
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transport_lanes (
      id VARCHAR(64) PRIMARY KEY,
      origin_id VARCHAR(64) NOT NULL,
      destination_id VARCHAR(64) NOT NULL,
      mode VARCHAR(64) NOT NULL DEFAULT 'STANDARD_TRUCKLOAD',
      transit_days INTEGER NOT NULL DEFAULT 3,
      cost_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 15.00,
      expedited_transit_days INTEGER,
      expedited_cost_per_unit NUMERIC(12, 2),
      active BOOLEAN NOT NULL DEFAULT TRUE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS inventory_records (
      id VARCHAR(64) PRIMARY KEY,
      item_sku VARCHAR(64) NOT NULL,
      node_id VARCHAR(64) NOT NULL,
      on_hand_units INTEGER NOT NULL DEFAULT 0,
      reserved_units INTEGER NOT NULL DEFAULT 0,
      safety_stock_target INTEGER NOT NULL DEFAULT 0,
      snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS demand_records (
      id VARCHAR(64) PRIMARY KEY,
      product_sku VARCHAR(64) NOT NULL,
      destination_id VARCHAR(64) NOT NULL,
      period_day INTEGER NOT NULL DEFAULT 1,
      quantity INTEGER NOT NULL DEFAULT 100,
      service_priority VARCHAR(32) NOT NULL DEFAULT 'HIGH'
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scenarios (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      dataset_version VARCHAR(32) NOT NULL DEFAULT '1.0.0-canonical',
      random_seed VARCHAR(64) NOT NULL DEFAULT 'SEED_2026_SCM_V1',
      critical_supplier_id VARCHAR(64) NOT NULL,
      disruption_start_day INTEGER NOT NULL DEFAULT 4,
      disruption_duration_days INTEGER NOT NULL DEFAULT 7,
      evaluation_horizon_days INTEGER NOT NULL DEFAULT 14,
      safety_stock_days INTEGER NOT NULL DEFAULT 3,
      daily_demand_units INTEGER NOT NULL DEFAULT 200,
      shortage_penalty_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 150.00,
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS agent_configurations (
      agent_type VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      purpose TEXT NOT NULL,
      model VARCHAR(64) NOT NULL DEFAULT 'gemini-1.5-pro',
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.20,
      max_retries INTEGER NOT NULL DEFAULT 3,
      timeout_seconds INTEGER NOT NULL DEFAULT 30,
      parameters JSONB NOT NULL DEFAULT '{}',
      health_status VARCHAR(32) NOT NULL DEFAULT 'HEALTHY',
      last_execution_at TIMESTAMPTZ,
      last_latency_ms INTEGER,
      failure_count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS constraint_configurations (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL, -- INVENTORY, CAPACITY, SOURCING, TRANSPORT, SERVICE
      hard_constraint BOOLEAN NOT NULL DEFAULT TRUE,
      value NUMERIC(12, 2) NOT NULL,
      unit VARCHAR(32) NOT NULL,
      description TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS planning_runs (
      id VARCHAR(64) PRIMARY KEY,
      scenario_id VARCHAR(64) REFERENCES scenarios(id),
      initiating_user VARCHAR(255) NOT NULL DEFAULT 'admin@sc-resilience.io',
      strategy VARCHAR(64) NOT NULL DEFAULT 'MULTI_AGENT_OPTIMIZATION',
      status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED', -- QUEUED, RUNNING, COMPLETED, INFEASIBLE, FAILED
      solver_status VARCHAR(64) NOT NULL DEFAULT 'OPTIMAL',
      start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completion_time TIMESTAMPTZ,
      runtime_ms INTEGER NOT NULL DEFAULT 320,
      hard_violations INTEGER NOT NULL DEFAULT 0,
      metrics JSONB NOT NULL DEFAULT '{}',
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS agent_proposals (
      id VARCHAR(64) PRIMARY KEY,
      run_id VARCHAR(64) REFERENCES planning_runs(id) ON DELETE CASCADE,
      agent_type VARCHAR(64) NOT NULL,
      action_summary TEXT NOT NULL,
      action_type VARCHAR(64) NOT NULL,
      affected_entity_ids JSONB NOT NULL DEFAULT '[]',
      action_parameters JSONB NOT NULL DEFAULT '{}',
      evidence_refs JSONB NOT NULL DEFAULT '[]',
      expected_benefits TEXT,
      expected_cost_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      risks JSONB NOT NULL DEFAULT '[]',
      assumptions JSONB NOT NULL DEFAULT '[]',
      confidence_score NUMERIC(4, 2) NOT NULL DEFAULT 0.95,
      validation_status VARCHAR(32) NOT NULL DEFAULT 'VALIDATED', -- VALIDATED, REJECTED, MODIFIED
      rejection_reasons JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS recovery_plans (
      id VARCHAR(64) PRIMARY KEY,
      run_id VARCHAR(64) REFERENCES planning_runs(id) ON DELETE CASCADE,
      status VARCHAR(32) NOT NULL DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED, MODIFIED_AND_APPROVED
      objective_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
      fill_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 96.40,
      total_cost NUMERIC(14, 2) NOT NULL DEFAULT 742100.00,
      summary TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS planner_decisions (
      id VARCHAR(64) PRIMARY KEY,
      plan_id VARCHAR(64) REFERENCES recovery_plans(id) ON DELETE CASCADE,
      run_id VARCHAR(64) REFERENCES planning_runs(id),
      user_id VARCHAR(255) NOT NULL,
      decision VARCHAR(64) NOT NULL, -- APPROVED, REJECTED, MODIFIED_AND_APPROVED
      rationale TEXT,
      authorized_budget_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'PLANNER', -- ADMIN, PLANNER, VIEWER
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id VARCHAR(64) PRIMARY KEY,
      actor VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
      event_type VARCHAR(64) NOT NULL, -- ENTITY_CREATE, ENTITY_UPDATE, ENTITY_DEACTIVATE, DATASET_IMPORT, DISRUPTION_CONFIG, AGENT_UPDATE, SIMULATION_RUN, PLAN_DECISION
      target_entity VARCHAR(64) NOT NULL,
      target_id VARCHAR(64) NOT NULL,
      details TEXT,
      before_state JSONB,
      after_state JSONB,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log('Tables created successfully. Now seeding canonical data if needed...');

  // 2. Seed Initial Canonical Data
  const existingDataset = await sql`SELECT count(*) FROM dataset_versions;`;
  if (parseInt(existingDataset[0].count) === 0) {
    console.log('Seeding dataset versions...');
    await sql`
      INSERT INTO dataset_versions (id, version, name, seed, currency, manifest, status)
      VALUES (
        'ver-canonical-01',
        '1.0.0-canonical',
        'SCM Echo 2026 Canonical Benchmark',
        'SEED_2026_SCM_V1',
        'USD ($)',
        '{"datasetId": "SCM-ECHO-2026-POC", "timeBucket": "Daily (14 periods)", "validatedBy": "Antigravity Deterministic Coordinator"}'::jsonb,
        'ACTIVE'
      );
    `;

    console.log('Seeding products...');
    await sql`
      INSERT INTO products (id, sku, name, type, uom, standard_cost, active) VALUES
      ('prod-01', 'CMP-101', 'Precision Harmonic Actuator Core', 'COMPONENT', 'units', 140.00, true),
      ('prod-02', 'CMP-102', 'Machined Titanium Frame Housing', 'COMPONENT', 'units', 85.00, true),
      ('prod-03', 'SKU-900', 'Autonomous Industrial Robotic Drive Unit', 'FINISHED_GOOD', 'units', 450.00, true);
    `;

    console.log('Seeding suppliers...');
    await sql`
      INSERT INTO suppliers (id, code, name, location, criticality, active, disrupted) VALUES
      ('sup-01', 'SUP-01', 'AeroCore Dynamics', 'Sendai, Japan (Precision Micro-Machining)', 'CRITICAL', true, true),
      ('sup-02', 'SUP-02', 'Vanguard Mechatronics', 'Munich, Germany (Specialty Drive Components)', 'ALTERNATE', true, false),
      ('sup-03', 'SUP-03', 'Global Alloy Castings', 'Monterrey, Mexico (Structural Housings)', 'SECONDARY', true, false);
    `;

    console.log('Seeding production resources...');
    await sql`
      INSERT INTO production_resources (id, name, location, produced_sku, daily_capacity, daily_operating_cost, active) VALUES
      ('plant-01', 'Austin Advanced Manufacturing Facility (Plant Alpha)', 'Austin, Texas, USA', 'SKU-900', 300, 12500.00, true);
    `;

    console.log('Seeding distribution centers...');
    await sql`
      INSERT INTO distribution_centers (id, code, name, location, service_tier, target_sla_percent, active) VALUES
      ('dc-01', 'DC-EAST', 'Columbus Regional Distribution Center', 'Columbus, Ohio, USA', 'TIER_1_CRITICAL', 98.00, true),
      ('dc-02', 'DC-WEST', 'Reno Inbound Logistics Hub', 'Reno, Nevada, USA', 'TIER_2_STANDARD', 90.00, true);
    `;

    console.log('Seeding supplier products...');
    await sql`
      INSERT INTO supplier_products (id, supplier_id, product_id, eligible, normal_lead_time_days, expedite_lead_time_days, daily_capacity, unit_purchase_cost, expedite_unit_cost) VALUES
      ('sp-01', 'sup-01', 'prod-01', true, 3, 2, 300, 140.00, 190.00),
      ('sp-02', 'sup-02', 'prod-01', true, 5, 2, 250, 195.00, 260.00),
      ('sp-03', 'sup-03', 'prod-02', true, 2, 1, 400, 85.00, 120.00);
    `;

    console.log('Seeding bill of materials...');
    await sql`
      INSERT INTO bill_of_materials (id, parent_sku, component_sku, quantity_required) VALUES
      ('bom-01', 'SKU-900', 'CMP-101', 1),
      ('bom-02', 'SKU-900', 'CMP-102', 1);
    `;

    console.log('Seeding transport lanes...');
    await sql`
      INSERT INTO transport_lanes (id, origin_id, destination_id, mode, transit_days, cost_per_unit, expedited_transit_days, expedited_cost_per_unit, active) VALUES
      ('lane-01', 'sup-01', 'plant-01', 'STANDARD_TRUCKLOAD', 3, 18.00, 2, 45.00, true),
      ('lane-02', 'sup-02', 'plant-01', 'INTERMODAL', 5, 24.00, 2, 68.00, true),
      ('lane-03', 'sup-03', 'plant-01', 'STANDARD_TRUCKLOAD', 2, 12.00, 1, 28.00, true),
      ('lane-04', 'plant-01', 'dc-01', 'STANDARD_TRUCKLOAD', 1, 15.00, 1, 30.00, true),
      ('lane-05', 'plant-01', 'dc-02', 'STANDARD_TRUCKLOAD', 2, 22.00, 1, 40.00, true);
    `;

    console.log('Seeding inventory records...');
    await sql`
      INSERT INTO inventory_records (id, item_sku, node_id, on_hand_units, reserved_units, safety_stock_target, snapshot_date) VALUES
      ('inv-01', 'CMP-101', 'plant-01', 600, 0, 600, CURRENT_DATE),
      ('inv-02', 'CMP-102', 'plant-01', 800, 0, 600, CURRENT_DATE),
      ('inv-03', 'SKU-900', 'plant-01', 150, 0, 100, CURRENT_DATE),
      ('inv-04', 'SKU-900', 'dc-01', 400, 120, 360, CURRENT_DATE),
      ('inv-05', 'SKU-900', 'dc-02', 250, 80, 240, CURRENT_DATE);
    `;

    console.log('Seeding demand records...');
    await sql`
      INSERT INTO demand_records (id, product_sku, destination_id, period_day, quantity, service_priority) VALUES
      ('dem-01', 'SKU-900', 'dc-01', 1, 120, 'HIGH'),
      ('dem-02', 'SKU-900', 'dc-02', 1, 80, 'NORMAL');
    `;

    console.log('Seeding scenarios...');
    await sql`
      INSERT INTO scenarios (id, name, description, dataset_version, random_seed, critical_supplier_id, disruption_start_day, disruption_duration_days, evaluation_horizon_days, safety_stock_days, daily_demand_units, shortage_penalty_per_unit, status) VALUES
      ('SCN-2026-SHUTDOWN-07D', '7-Day Unplanned Shutdown of Critical Supplier SUP-01 (AeroCore)',
       'Full cessation of inbound actuator component shipments from SUP-01 between Day 4 and Day 10. Evaluated over a 14-day rolling planning horizon with 200 units/day downstream demand.',
       '1.0.0-canonical', 'SEED_2026_SCM_V1', 'sup-01', 4, 7, 14, 3, 200, 150.00, 'ACTIVE');
    `;

    console.log('Seeding agent configurations...');
    await sql`
      INSERT INTO agent_configurations (agent_type, name, purpose, model, enabled, temperature, max_retries, timeout_seconds, parameters, health_status, last_latency_ms, failure_count) VALUES
      ('DEMAND', 'Demand Forecasting & Customer Priority Agent', 'Analyzes historical demand patterns, contract SLAs, and buffers priority Tier-1 fulfillment for Columbus DC.', 'gemini-1.5-pro', true, 0.15, 3, 30, '{"priorityWeight": 0.85, "minConfidence": 0.90}', 'HEALTHY', 184, 0),
      ('INVENTORY', 'Multi-Echelon Inventory Rebalancing Agent', 'Optimizes safety stock buffers, monitors stockout risk thresholds, and schedules component pre-builds.', 'gemini-1.5-pro', true, 0.20, 3, 30, '{"holdingCostAnnualRate": 0.22, "safetyStockFloorDays": 2}', 'HEALTHY', 210, 0),
      ('SUPPLIER_RISK', 'Supplier Risk & Alternate Sourcing Agent', 'Monitors supplier disruption events, validates alternate supplier qualification, and structures order splits.', 'gemini-1.5-pro', true, 0.20, 3, 45, '{"disruptionDetectionConfidence": 0.98, "maxSplitShare": 1.0}', 'HEALTHY', 320, 0),
      ('LOGISTICS', 'Logistics Expediting & Route Optimization Agent', 'Determines premium air freight viability, evaluates expedited lane transit times, and calculates cost tradeoffs.', 'gemini-1.5-pro', true, 0.10, 3, 30, '{"airFreightCapUSD": 100000, "carbonPenaltyWeight": 0.05}', 'HEALTHY', 195, 0);
    `;

    console.log('Seeding constraint configurations...');
    await sql`
      INSERT INTO constraint_configurations (id, name, category, hard_constraint, value, unit, description) VALUES
      ('c-01', 'Non-Negative Inventory Conservation', 'INVENTORY', true, 0.00, 'units', 'Physical stock balance at any node cannot drop below zero at any period.'),
      ('c-02', 'Maximum Plant Daily Assembly Throughput', 'CAPACITY', true, 300.00, 'units/day', 'Assembly Plant Alpha ceiling constraint on robotic drive unit assembly.'),
      ('c-03', 'Supplier Quota & Capacity Ceiling', 'SOURCING', true, 250.00, 'units/day', 'Vanguard Mechatronics maximum daily production limit for actuator cores.'),
      ('c-04', 'Tier-1 Customer Minimum Service SLA', 'SERVICE', true, 95.00, '% fill rate', 'Contractual service level commitment for critical medical/industrial DC clients.'),
      ('c-05', 'Expedited Freight Budget Ceiling', 'TRANSPORT', false, 120000.00, 'USD ($)', 'Soft budget limit for trans-Atlantic expedited air freight shifts.'),
      ('c-06', 'Maximum Stockout Cost Weight', 'SERVICE', false, 150.00, 'USD/unit-day', 'Penalty multiplier for unfulfilled client order backorders.');
    `;

    console.log('Seeding planning runs and proposals...');
    await sql`
      INSERT INTO planning_runs (id, scenario_id, initiating_user, strategy, status, solver_status, runtime_ms, hard_violations, metrics) VALUES
      ('run-can-001', 'SCN-2026-SHUTDOWN-07D', 'admin@sc-resilience.io', 'MULTI_AGENT_OPTIMIZATION', 'COMPLETED', 'OPTIMAL', 420, 0,
       '{"fillRatePercent": 96.4, "totalBackorders": 100, "totalLandedCost": 742100, "costDeltaAgainstBaseline": 84100, "recoveryTimeDays": 10, "avgInventoryDays": 2.4, "hardConstraintViolations": 0, "softConstraintBreaches": 1, "solverRuntimeMs": 142}'::jsonb),
      ('run-can-002', 'SCN-2026-SHUTDOWN-07D', 'planner@sc-resilience.io', 'OPTIMIZATION_ONLY', 'COMPLETED', 'FEASIBLE', 310, 0,
       '{"fillRatePercent": 89.3, "totalBackorders": 300, "totalLandedCost": 712000, "costDeltaAgainstBaseline": 54000, "recoveryTimeDays": 12, "avgInventoryDays": 1.8, "hardConstraintViolations": 0, "softConstraintBreaches": 2, "solverRuntimeMs": 110}'::jsonb),
      ('run-can-003', 'SCN-2026-SHUTDOWN-07D', 'system@sc-resilience.io', 'REORDER_BASELINE', 'COMPLETED', 'UNMITIGATED_SHORTAGE', 180, 0,
       '{"fillRatePercent": 64.3, "totalBackorders": 1000, "totalLandedCost": 658000, "costDeltaAgainstBaseline": 0, "recoveryTimeDays": "NOT_RECOVERED_WITHIN_HORIZON", "avgInventoryDays": 1.1, "hardConstraintViolations": 0, "softConstraintBreaches": 5, "solverRuntimeMs": 45}'::jsonb);
    `;

    await sql`
      INSERT INTO agent_proposals (id, run_id, agent_type, action_summary, action_type, affected_entity_ids, action_parameters, evidence_refs, expected_benefits, expected_cost_delta, risks, assumptions, confidence_score, validation_status) VALUES
      ('prop-01', 'run-can-001', 'SUPPLIER_RISK', 'Activate Vanguard Mechatronics (SUP-02) as primary alternate for CMP-101', 'SOURCE_SHIFT',
       '["sup-01", "sup-02", "prod-01"]'::jsonb,
       '{"sourceSupplierId": "sup-02", "dailyVolumeAllocated": 200, "startDay": 4, "endDay": 10, "totalUnits": 1400}'::jsonb,
       '["SUPPLIER_PRODUCTS[sup-02].eligible === true", "SUPPLIER_PRODUCTS[sup-02].dailyCapacity (250) >= dailyAllocation (200)"]'::jsonb,
       'Offsets 1,400 units of lost component supply from Sendai facility', 77000.00,
       '["SUP-02 lead time is 5 days under standard transit, risking line starvation unless expedited."]'::jsonb,
       '["SUP-02 maintains 250 units/day spare production slots throughout the disruption window."]'::jsonb,
       0.98, 'VALIDATED'),
      ('prop-02', 'run-can-001', 'LOGISTICS', 'Authorize Priority Trans-Atlantic Air Freight on Lane-02 (Munich -> Austin)', 'EXPEDITE_FREIGHT',
       '["lane-02", "sup-02", "plant-01"]'::jsonb,
       '{"laneId": "lane-02", "mode": "EXPEDITED_AIR", "compressedLeadTimeDays": 2, "expediteBatchUnits": 800}'::jsonb,
       '["TRANSPORT_LANES[lane-02].expeditedTransitDays === 2", "Air cargo carrier capacity confirmed Lufthansa Cargo"]'::jsonb,
       'Compresses transit by 3 days; first alternate shipment arrives Day 6 instead of Day 9', 35200.00,
       '["Air freight capacity surge surcharges if volume exceeds 1,000 units."]'::jsonb,
       '["Customs clearance at Austin Bergstrom takes < 12 hours under bonded entry."]'::jsonb,
       0.94, 'VALIDATED'),
      ('prop-03', 'run-can-001', 'DEMAND', 'Prioritize Columbus DC-EAST (Tier 1 Medical) customer allocations over DC-WEST', 'PRIORITY_PROTECT',
       '["dc-01", "dc-02", "prod-03"]'::jsonb,
       '{"tier1Target": "dc-01", "allocationSplit": {"dc-01": 0.65, "dc-02": 0.35}}'::jsonb,
       '["DC-EAST target SLA is 98% (contractual liquidated damages: $500/unit-day)"]'::jsonb,
       'Prevents all Tier-1 SLA breaches at Columbus; absorbs slight standard buffer at Reno', -15000.00,
       '["DC-WEST customers may experience up to 48-hour delivery deferral."]'::jsonb,
       '["No contractual penalty on Tier-2 standard consumer backorders up to 72 hours."]'::jsonb,
       0.96, 'VALIDATED');
    `;

    await sql`
      INSERT INTO recovery_plans (id, run_id, status, objective_value, fill_rate_percent, total_cost, summary) VALUES
      ('plan-can-001', 'run-can-001', 'APPROVED', 742100.00, 96.40, 742100.00,
       'Multi-agent recovery package: Shift 1,400 units to Vanguard SUP-02, expedite 800 units via air freight, prioritize Columbus Tier-1 fulfillment.');
    `;

    await sql`
      INSERT INTO planner_decisions (id, plan_id, run_id, user_id, decision, rationale, authorized_budget_delta) VALUES
      ('dec-can-001', 'plan-can-001', 'run-can-001', 'admin@sc-resilience.io', 'APPROVED',
       'Authorized $48,200 air freight premium to guarantee Tier-1 Medical SLA compliance at Columbus DC.', 48200.00);
    `;

    console.log('Seeding app users...');
    await sql`
      INSERT INTO app_users (id, email, name, role, active) VALUES
      ('usr-01', 'admin@sc-resilience.io', 'Chief Supply Chain Administrator', 'ADMIN', true),
      ('usr-02', 'planner@sc-resilience.io', 'Lead Tactical Operations Planner', 'PLANNER', true),
      ('usr-03', 'auditor@sc-resilience.io', 'Compliance & Quality Auditor', 'VIEWER', true);
    `;

    console.log('Seeding initial audit events...');
    await sql`
      INSERT INTO audit_events (id, actor, role, event_type, target_entity, target_id, details, before_state, after_state) VALUES
      ('aud-01', 'admin@sc-resilience.io', 'ADMIN', 'DATASET_IMPORT', 'dataset_versions', 'ver-canonical-01',
       'Imported SEED_2026_SCM_V1 canonical baseline dataset into Neon PostgreSQL.', null, '{"version": "1.0.0-canonical"}'::jsonb),
      ('aud-02', 'admin@sc-resilience.io', 'ADMIN', 'DISRUPTION_CONFIG', 'scenarios', 'SCN-2026-SHUTDOWN-07D',
       'Configured 7-day critical outage window on supplier SUP-01 (AeroCore Dynamics).', null, '{"startDay": 4, "duration": 7}'::jsonb),
      ('aud-03', 'planner@sc-resilience.io', 'PLANNER', 'PLAN_DECISION', 'recovery_plans', 'plan-can-001',
       'Approved multi-agent recovery plan with $48,200 freight premium authorization.', '{"status": "PENDING"}'::jsonb, '{"status": "APPROVED"}'::jsonb);
    `;
  }

  console.log('Neon Database Schema initialized and populated successfully!');
}

init().catch(err => {
  console.error('Database initialization error:', err);
  process.exit(1);
});
