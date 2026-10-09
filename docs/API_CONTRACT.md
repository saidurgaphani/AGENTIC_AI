# AI Agents for Resilient Supply Chain — API Contract Specification

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Protocol:** REST over HTTPS  
**Single Source of Truth:** Neon PostgreSQL  
**Authentication:** Bearer token (Clerk JWT or authenticated dev token)  
**Roles:** `planner`, `admin`, `viewer`

---

## 1. Response Envelope & Error Format

All responses follow standard HTTP status codes.

### Success Envelope
For entity operations, payloads return typed JSON objects or arrays:
```json
{
  "status": "success",
  "data": { ... },
  "metadata": {
    "timestamp": "2026-10-09T17:00:00Z",
    "version": "1.0.0-canonical"
  }
}
```

### Structured Error Envelope
```json
{
  "status": "error",
  "error": {
    "code": "CONSTRAINT_VIOLATION",
    "message": "Supplier capacity exceeded for SUP-02 on Day 6",
    "details": {
      "supplier_id": "sup-02",
      "requested_volume": 320,
      "max_capacity": 250
    }
  }
}
```

---

## 2. API Endpoints

### 2.1 Health & Readiness
* `GET /api/v1/health`  
  * Returns: `{ "status": "ok", "database": "connected", "solver": "ready", "neon_branch": "production" }`
* `GET /api/v1/ready`  
  * Readiness probe checking Neon PostgreSQL connection pool and OR-Tools library initialization.

### 2.2 Network & Master Data
* `GET /api/v1/network/summary`  
  * Returns overall counts of echelons, suppliers, plants, distribution centers, products, and active lanes.
* `GET /api/v1/network/suppliers`  
  * List all suppliers (`SUP-01`, `SUP-02`, `SUP-03`), locations, criticality, and capacities.
* `GET /api/v1/network/products`  
  * List products (`CMP-101`, `CMP-102`, `SKU-900`) and BOM component relationships.
* `GET /api/v1/network/plants`  
  * Manufacturing facilities (`PLANT-A`), capacities, and on-hand component buffers.
* `GET /api/v1/network/distribution-centers`  
  * Regional hubs (`DC-EAST`, `DC-WEST`), customer tiers, demand schedules, and target SLAs.
* `GET /api/v1/network/transport-lanes`  
  * Sourcing and transit lanes with standard vs expedited air freight options.

### 2.3 Datasets & Governance (Admin)
* `GET /api/v1/datasets/current`  
  * Returns active dataset version (`1.0.0-canonical`) and seed identifier (`SEED_2026_SCM_V1`).
* `POST /api/v1/datasets/seed`  
  * **Role:** `admin`  
  * Idempotent seed/reset of reference dataset into Neon PostgreSQL.
* `GET /api/v1/datasets/validate`  
  * Runs FR-17 dataset integrity checks (conservation laws, primary keys, BOM completeness).

### 2.4 Disruption Scenarios (Planner & Admin)
* `GET /api/v1/scenarios`  
  * List configured disruption scenarios.
* `POST /api/v1/scenarios`  
  * **Role:** `planner` or `admin`  
  * Create disruption scenario (e.g. 7-day shutdown of `SUP-01`).
* `GET /api/v1/scenarios/{id}`  
  * Retrieve scenario configuration, parameters, and baseline assumptions.

### 2.5 Planning Runs & Multi-Agent Execution
* `POST /api/v1/scenarios/{id}/runs`  
  * **Payload:** `{ "strategies": ["REORDER_BASELINE", "OPTIMIZATION_ONLY", "MULTI_AGENT_OPTIMIZATION"] }`  
  * Triggers agent proposal collection, coordinator conflict resolution, and OR-Tools optimization.
* `GET /api/v1/runs`  
  * List historical runs with runtime status (`RUNNING`, `COMPLETED`, `INFEASIBLE`, `FAILED`).
* `GET /api/v1/runs/{id}`  
  * Detailed run execution record with comparative metrics across strategies.
* `GET /api/v1/runs/{id}/proposals`  
  * Inspect specialized agent proposals (Demand, Inventory, Supplier-Risk, Logistics) and grounding evidence.
* `GET /api/v1/runs/{id}/plan`  
  * Feasible recovery plan recommendation, action schedule, and cost breakdown.

### 2.6 Plan Decisions & Governance (Planner)
* `POST /api/v1/plans/{id}/approve`  
  * **Role:** `planner`  
  * **Payload:** `{ "rationale": "Authorized priority air freight premium", "authorized_budget_delta": 48200 }`  
  * Authorizes plan recommendation and creates immutable audit event.
* `POST /api/v1/plans/{id}/reject`  
  * **Role:** `planner`  
  * **Payload:** `{ "rationale": "Budget delta exceeds current tolerance" }`
* `GET /api/v1/audit/events`  
  * Chronological ledger of all scenario changes, solver runs, and planner decisions.

---

## 3. Strategy Enum & Operational Metrics

### Strategies
* `REORDER_BASELINE`: Deterministic MRP policy, reordering primary supplier without agile diversion.
* `OPTIMIZATION_ONLY`: Mathematical solver alone without proactive multi-agent framing.
* `MULTI_AGENT_OPTIMIZATION`: Google ADK multi-agent synthesis + deterministic coordinator + OR-Tools solver.

### Evaluated Metrics
* `fill_rate_percent`: Demanded units fulfilled on-time / Total demand over 14-day horizon.
* `total_backorders`: Cumulative unfulfilled unit-days.
* `total_landed_cost`: Procurement + transport + expediting + plant operating + shortage penalties ($).
* `cost_delta_against_baseline`: Net economic cost comparison ($).
* `recovery_time_days`: Day at which network returns to and sustains declared SLA threshold.
* `hard_constraint_violations`: Strict count of physical breaches (must equal 0 for feasibility).
