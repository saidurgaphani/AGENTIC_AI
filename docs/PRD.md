# PRD.md --- AI Agents for Resilient Supply Chain Manufacturing

**Document type:** Product Requirements Document\
**Project type:** Hackathon proof of concept (POC)\
**Version:** 1.0\
**Status:** Baseline specification\
**Primary scenario:** Seven-day shutdown of a critical supplier\
**Architecture:** Next.js + TypeScript + Tailwind, Clerk, FastAPI,
Google ADK + Gemini, OR-Tools, Neon PostgreSQL, SQLAlchemy, Alembic,
Pandas

------------------------------------------------------------------------

## 1. Executive Summary

AI Agents for Resilient Supply Chain Manufacturing is a planner-facing
decision-support application that helps a manufacturing business respond
to a seven-day shutdown of a critical supplier in a defined
three-echelon supply network.

The application will load a reproducible dataset describing demand,
inventory, suppliers, production capacity, lead times, transport costs,
and service constraints. It will simulate the disruption, identify the
affected products and commitments, generate alternative recovery
actions, and use mathematical optimization to produce a feasible
recovery plan.

Specialized agents may analyze demand, inventory, supplier risk,
logistics, and production scheduling. Agents are advisory components:
they can explain risks and propose candidate actions, but they cannot
override authoritative data, business constraints, or the optimizer. A
deterministic coordinator validates agent outputs, reconciles conflicts,
invokes the optimization engine, and presents a traceable recommendation
for planner approval.

The product must compare three strategies under identical initial
conditions and disruption assumptions:

1.  **Reorder-rule baseline:** a clearly specified, deterministic
    replenishment policy.
2.  **Optimization-only baseline:** the mathematical optimizer runs
    without agent-generated recommendations.
3.  **Multi-agent + optimization:** specialized agents contribute
    candidate actions and evidence; the coordinator and optimizer
    produce the final feasible plan.

The application must report service, cost, recovery, inventory,
constraint, runtime, and stability metrics. It must also expose
assumptions, data-quality issues, infeasibility, and model limitations
instead of concealing them.

The system is a proof of concept. It recommends actions for human review
and does not place real purchase orders, book freight, alter production
systems, or execute external transactions.

## 2. Problem Statement

Supply-chain planning is often fragmented across demand planning,
inventory management, procurement, production, and logistics. A critical
supplier disruption can be detected too late, and teams may respond
independently using inconsistent data and local priorities. This can
lead to shortages, missed commitments, unnecessary expediting, excess
inventory, and expensive or infeasible recovery plans.

The challenge is to demonstrate how a multi-agent planning system can
coordinate these perspectives while remaining grounded in explicit
business constraints and measurable optimization.

### 2.1 Challenge scenario

A critical supplier becomes unavailable for seven consecutive days. The
network must continue to meet demand as well as possible using available
inventory, alternative suppliers, expediting, allocation, and production
rescheduling.

The simulation must define precisely: - the supplier and components
affected; - disruption start and end times; - which inbound receipts are
cancelled, delayed, or unaffected; - demand by product, location, and
time period; - current inventory and any inventory already allocated; -
supplier capacities, lead times, and costs; - production capacities and
bill-of-material requirements, if modeled; - transport capacity, costs,
and expedite options; - service-level requirements and any customer
priorities; - the evaluation horizon and recovery definition.

These assumptions must be visible in the application and stored with
each scenario run.

## 3. Product Goals

### 3.1 Primary goals

1.  Demonstrate an end-to-end response to a seven-day critical-supplier
    shutdown.
2.  Provide a reproducible three-echelon network dataset and scenario
    configuration.
3.  Separate agent reasoning from deterministic calculations and
    optimization.
4.  Produce feasible, explainable recommendations with cost/service
    trade-offs.
5.  Require an authenticated planner to approve or reject the proposed
    plan.
6.  Compare all three planning strategies using the same dataset,
    disruption, horizon, and metric definitions.
7.  Persist inputs, outputs, assumptions, run status, and approval
    history for auditability.
8.  Clearly identify data-quality problems, infeasible constraints,
    uncertain assumptions, and system failures.

### 3.2 Secondary goals

-   Allow planners to edit selected scenario parameters and rerun
    what-if analyses.
-   Provide an understandable timeline of the disruption and recovery.
-   Show why a recommendation was selected and which alternatives were
    rejected.
-   Support repeatable evaluation runs using fixed random seeds wherever
    randomness is used.
-   Keep the system modular so the network can later include more
    products, suppliers, plants, and warehouses.

### 3.3 Non-goals

The hackathon POC will not: - connect to live ERP, MES, WMS, TMS,
supplier portals, or procurement systems; - execute real purchases,
freight bookings, production orders, or inventory movements; - promise
globally optimal results for every possible formulation; - use an LLM as
the authority for quantities, costs, stock balances, lead times, or
feasibility; - train a large custom forecasting model; - implement a
complete enterprise planning suite; - support unrestricted multi-tenant
access or complex enterprise permissions; - assume agents are correct
merely because they provide a confidence score; - claim causal business
impact from a single synthetic scenario.

## 4. Users and Permissions

### 4.1 Primary user: Supply-chain planner

The planner can: - sign in; - inspect network data and data-quality
warnings; - create or select a disruption scenario; - run the three
planning strategies; - inspect agent proposals and evidence; - compare
recovery plans and metrics; - review constraint violations and
infeasibility explanations; - edit allowed plan parameters; - approve or
reject a recommendation; - record a reason for rejection or
modification; - view prior runs and their audit history.

### 4.2 Secondary user: Demo administrator

For the POC, the administrator can: - import or reset the reproducible
dataset; - manage the demo scenario configuration; - configure the
planner account's application role; - inspect failed runs and diagnostic
summaries; - rerun evaluation experiments.

The administrator role may be implemented as a minimal application role.
Do not build a complex role-management console unless time remains.

### 4.3 Authentication and authorization

-   Clerk provides the sign-in experience for the Next.js application.
-   The frontend sends a valid Clerk session token with protected API
    requests.
-   FastAPI verifies the token signature, expiry, issuer/audience where
    configured, and allowed application origin/party according to the
    chosen Clerk verification method.
-   The backend derives the authenticated identity from verified claims;
    it must not trust a user ID supplied in the request body.
-   The backend maps the verified Clerk subject to an application user
    record and role.
-   All scenario mutations, run creation, and approval actions require
    authentication.
-   Planner approval must be checked server-side.
-   Secrets, database URLs, Gemini keys, and Clerk secret keys must
    never be exposed to the browser.
-   Local development may provide a clearly marked development-only
    bypass, but it must be disabled by default in production and must
    never be used in the judged deployment.

## 5. Product Principles

1.  **Evidence before explanation:** every recommendation must refer to
    data, calculated values, constraints, or a named scenario
    assumption.
2.  **Deterministic authority:** code and the optimizer own numeric
    calculations and feasibility.
3.  **Agents advise; the coordinator decides:** agent outputs are
    candidates, not executable commands.
4.  **Human approval:** the final plan remains pending until a planner
    approves it.
5.  **Reproducibility:** the same versioned input and settings should
    produce comparable results.
6.  **Fair evaluation:** all strategies use the same starting state,
    demand, disruption, horizon, cost assumptions, and metric
    definitions.
7.  **Visible uncertainty:** missing data, infeasibility, solver
    timeouts, and agent failures must be shown.
8.  **No silent fabrication:** missing supplier, capacity, or cost data
    must not be invented by an LLM.
9.  **Traceability:** every run must link to its inputs, proposals,
    optimizer result, metrics, and planner decision.
10. **Useful fallback:** if Gemini or an agent fails, deterministic
    baselines and optimization must still be available.

## 6. Scope and Network Model

### 6.1 Three-echelon network

The POC must represent a defined network with three explicitly labeled
echelons. The recommended minimum model is:

1.  **Echelon 1 --- Suppliers:** critical and alternate suppliers
    provide components or materials.
2.  **Echelon 2 --- Manufacturing plants:** plants consume components,
    produce finished products, and have finite production capacity.
3.  **Echelon 3 --- Distribution centers / customer fulfillment nodes:**
    finished goods are allocated to downstream demand.

If the supplied dataset defines a different three-echelon
interpretation, use that interpretation consistently and document it in
the dataset manifest. Do not silently change the network topology.

### 6.2 Minimum viable dataset

The dataset must include, at minimum: - products or components; -
suppliers and supplier-product eligibility; - plants and
distribution/fulfillment nodes; - demand by product, node, and time
period; - on-hand inventory and inventory already committed; - supplier
capacity and availability; - lead times for normal and alternate
sourcing; - transport lanes, capacity if modeled, and transport cost; -
plant production capacity and production rates; - component requirements
or bill of materials if production consumes components; - purchase,
production, holding, shortage/backorder, and expedite costs where
used; - service requirements or priority classes; - disruption
details; - dataset version and units.

A small synthetic dataset is acceptable if it is reproducible,
internally consistent, documented, and nontrivial enough to create
genuine trade-offs. The seed and generation rules must be recorded. Do
not label synthetic data as real operational data.

### 6.3 Units and time model

-   Choose one consistent time bucket, preferably daily, for the
    seven-day disruption and recovery timeline.
-   Store timestamps in UTC and show the scenario's declared business
    timezone in the UI if needed.
-   Use explicit units for quantities, costs, time, and capacity.
-   Avoid mixing unit costs and total costs.
-   Represent money using a fixed currency per scenario; do not mix
    currencies without a conversion model.
-   Define whether lead times count calendar days or business days.
-   Define the exact disruption start and end boundary to avoid
    off-by-one errors.

### 6.4 Scenario configuration

Each scenario must contain: - scenario name and description; - dataset
version; - critical supplier identifier; - disruption start period; -
disruption duration, defaulting to seven days; - disruption effect on
open orders and inbound shipments; - planning horizon; - baseline policy
parameters; - optimizer objective weights or priority order; - cost
assumptions; - service constraints; - random seed, if applicable; -
created-by identity and creation time.

The default scenario must be runnable from a clean seed dataset without
manual data editing.

## 7. Functional Requirements

Priority levels: - **P0:** mandatory for a valid POC. - **P1:**
important if time allows. - **P2:** stretch goal.

### FR-01 --- Dataset import and validation (P0)

The system shall load the bundled reproducible dataset into PostgreSQL
through a repeatable seed/import process.

Validation must detect at least: - missing required fields; - duplicate
business identifiers; - unknown supplier, product, plant, node, or lane
references; - negative inventory, demand, capacity, or lead times where
invalid; - invalid costs; - inconsistent units or currencies; - missing
supplier-product eligibility; - impossible or missing lane data required
by a proposed action; - invalid dates and disruption boundaries; -
demand rows outside the selected evaluation horizon.

The application shall display validation results with severity, affected
records, and remediation guidance. Blocking data errors must prevent a
run from starting. Non-blocking warnings may allow a run if the user
explicitly acknowledges them.

### FR-02 --- Network visibility (P0)

The planner shall be able to inspect the network's suppliers, plants,
downstream nodes, products, inventory, demand, supplier capacities, lead
times, and transport lanes.

The UI must distinguish source data from derived calculations and
generated agent commentary.

### FR-03 --- Disruption scenario creation (P0)

The planner shall be able to load the default seven-day shutdown
scenario and change permitted what-if parameters such as disruption
start date, affected supplier, duration, selected cost assumptions, and
planning horizon.

A modified scenario must create a new scenario version or run snapshot;
it must not overwrite historical run inputs.

### FR-04 --- Impact analysis (P0)

Before generating a plan, the system shall calculate: - affected
products and components; - demand exposed during the disruption; -
available and committed inventory; - expected shortage periods under the
baseline state; - inbound receipts affected by the shutdown; - alternate
supplier and transport options that are eligible; - affected production
schedules and downstream demand, where modeled.

All displayed quantities must be computed from validated data.

### FR-05 --- Reorder-rule baseline (P0)

The system shall run a deterministic reorder-rule policy on the same
scenario data.

The policy must be explicitly documented and configurable. A practical
baseline may use reorder points and target stock or a simple
replenishment rule based on demand during lead time plus safety stock.

The baseline must respect the same available source data and must apply
the same disruption assumptions. If it cannot model an action type
available to the optimizer, that limitation must be documented rather
than hidden.

### FR-06 --- Optimization-only baseline (P0)

The system shall formulate a mathematical optimization problem
independent of LLM-generated proposals.

The optimizer should choose among feasible sourcing, allocation,
expediting, and production-rescheduling decisions supported by the
dataset. The exact decision variables depend on the implemented model
and must be documented.

The optimization objective must balance service and cost using explicit
weights or lexicographic priorities. Recommended approach: 1. enforce
hard physical and business constraints; 2. prioritize required service
or minimize shortage/backorder penalties; 3. minimize total relevant
cost among acceptable service outcomes.

If a weighted objective is used, document units, coefficients, and
sensitivity. Avoid arbitrary weights that silently make one objective
dominate all others.

The system shall record solver status, objective value, runtime, gap
where available, and any infeasibility or timeout.

### FR-07 --- Specialized agents (P0)

Agents shall be implemented using Google ADK and Gemini where LLM
reasoning adds value. Agents may call read-only tools to obtain
authoritative data and deterministic analysis. Each agent must have a
documented role, permitted inputs, tools, output schema, permissions,
and failure behavior.

#### Demand Agent

-   **Purpose:** summarize demand exposure and identify high-priority
    demand periods.
-   **Inputs:** validated demand history/forecast, current demand,
    service classes, planning horizon.
-   **Outputs:** structured demand-risk observations, affected
    products/nodes, evidence references, assumptions, and candidate
    priorities.
-   **Restrictions:** cannot create demand facts not present in data or
    a documented forecast.

#### Inventory Agent

-   **Purpose:** identify coverage gaps, constrained stock, and
    allocation risks.
-   **Inputs:** on-hand stock, commitments, expected receipts, demand,
    inventory policy.
-   **Outputs:** projected coverage, shortage windows, stock allocation
    candidates, evidence references.
-   **Restrictions:** quantities and coverage calculations must come
    from deterministic tools, not free-form model arithmetic.

#### Supplier-Risk Agent

-   **Purpose:** assess exposure to the disrupted supplier and evaluate
    alternate suppliers.
-   **Inputs:** supplier-product eligibility, capacities, lead times,
    costs, disruption state, quality or risk fields if present.
-   **Outputs:** eligible alternatives, risk factors, possible source
    shifts, and evidence references.
-   **Restrictions:** cannot recommend an ineligible supplier, invent
    capacity, or assume an alternate source can deliver before its lead
    time.

#### Logistics Agent

-   **Purpose:** identify feasible transport and expediting options.
-   **Inputs:** lanes, lane capacities, transport costs,
    standard/expedite lead times, affected shipments.
-   **Outputs:** candidate routing/expedite actions, incremental cost,
    expected arrival period, evidence references.
-   **Restrictions:** all route availability, capacity, time, and cost
    claims must be grounded in data and deterministic calculations.

#### Production Scheduling Agent (P0 if production is in scope; otherwise P1)

-   **Purpose:** identify candidate schedule changes that reduce
    shortage or protect priority demand.
-   **Inputs:** plant capacity, production rates, component
    requirements, current schedule, due dates, changeover assumptions if
    available.
-   **Outputs:** candidate rescheduling actions, affected
    products/periods, trade-offs, evidence references.
-   **Restrictions:** cannot exceed capacity or ignore component
    availability. The optimizer must validate schedule feasibility.

### FR-08 --- Shared structured proposal schema (P0)

Every agent proposal must be validated against a common typed schema.
Minimum fields: - `proposal_id`; - `run_id`; - `agent_type`; -
`proposal_type`; - `affected_entity_ids`; - `action_summary`; -
`action_parameters` as typed, validated data; - `evidence_refs` pointing
to source records or calculation results; - `expected_benefits`; -
`expected_cost_delta` when computable; - `risks`; - `assumptions`; -
`confidence` with a defined interpretation; - `created_at`; -
`validation_status`; - `rejection_reasons` if rejected.

Agent output must be machine-readable JSON or a validated Pydantic
model, not unstructured text alone. Free-form explanation can accompany
but cannot replace the structured fields.

Confidence is a measure of the agent's self-assessed certainty, not
proof of correctness. The UI must not present it as a calibrated
probability unless calibration has been measured.

### FR-09 --- Coordinator and conflict resolution (P0)

The coordinator shall: 1. create a versioned run snapshot; 2. calculate
deterministic facts needed by the agents; 3. invoke the relevant agents
with least-privilege tools; 4. validate each proposal's schema and
evidence; 5. reject or flag unsupported, contradictory, stale, or
infeasible proposals; 6. deduplicate equivalent proposals; 7. translate
supported proposals into candidate decisions or constraints for the
optimizer; 8. invoke the optimizer; 9. validate the final plan
independently; 10. calculate metrics; 11. persist all results and
provenance; 12. mark the run ready for planner review or clearly report
failure.

The coordinator must not simply concatenate agent responses or choose
whichever response sounds most confident. Conflicts shall be resolved by
deterministic policy and optimization. Hard constraints cannot be
overridden by a majority vote or an LLM.

If no feasible solution exists, the system shall report infeasibility
and relevant causes. It may provide a clearly labeled best-effort
diagnostic or relaxed scenario, but it must never label a
constraint-violating plan as feasible.

### FR-10 --- Constraint validation (P0)

The final plan must be checked by deterministic validation independent
of agent explanations.

Constraints should include those supported by the dataset: - inventory
conservation and nonnegative inventory; - supplier eligibility; -
supplier capacity by period; - plant production capacity by period; -
component availability and bill-of-material consumption; - transport
lane capacity where modeled; - lead-time feasibility and arrival
dates; - shipment and production timing; - allocation limited to
available supply; - demand fulfillment not exceeding available or
producible units; - service constraints and customer priorities; -
budget or expedite limits where specified; - no double allocation of the
same inventory or supply; - no use of supply before its available
period.

Every hard constraint must have an identifier, a definition, and a
validation result. Soft constraints must be explicitly labeled and
associated with penalties or trade-offs.

### FR-11 --- Final recovery recommendation (P0)

The recommendation must include: - proposed sourcing changes; -
alternate supplier quantities and timing; - expedite actions and
incremental costs; - allocation decisions across
products/nodes/customers; - production schedule changes where modeled; -
expected shortages and backorders; - expected service outcomes; - total
landed cost and cost breakdown; - recovery timeline; - constraints
checked and result; - key assumptions and risks; - comparison with both
baselines; - reasons for selected actions and notable rejected
alternatives.

Recommendations are advisory until approved. The system must not execute
external actions.

### FR-12 --- Planner approval workflow (P0)

Each multi-agent recommendation must move through: - `PENDING_REVIEW`; -
`APPROVED`; - `REJECTED`; - `MODIFIED_AND_APPROVED`.

The planner shall be able to inspect the plan, approve it, reject it
with a reason, or edit allowed decision parameters and approve the
modified plan. Edits must trigger validation and metric recalculation.
An invalid edit cannot be approved as a valid plan.

The system shall store the planner identity, timestamp, original plan,
modified plan if any, decision, and reason. Approval records are
append-only from the application perspective; a later decision creates a
new audit event rather than erasing the prior event.

### FR-13 --- What-if comparison dashboard (P0)

The dashboard shall compare the three strategies on the same scenario: -
reorder-rule baseline; - optimization-only baseline; - multi-agent +
optimization.

It shall show: - fill rate; - total units backordered; - total landed
cost and cost breakdown; - recovery time; - average inventory days or
inventory-days measure; - hard-constraint violations; - runtime; -
recommendation stability across repeated runs where applicable.

The dashboard must state the scenario version, dataset version,
evaluation horizon, metric definitions, and solver/agent run status.
Missing metrics must be shown as unavailable with a reason, not replaced
by zero.

### FR-14 --- Run history and audit trail (P0)

The planner shall be able to inspect prior runs, including: - dataset
and scenario snapshot; - strategy; - model and prompt/config version
where applicable; - solver configuration; - proposals and validation
outcomes; - final plan; - metrics and runtime; - planner decisions; -
errors and warnings.

### FR-15 --- Failure handling and fallbacks (P0)

-   If Gemini or an agent fails, record the failure and continue with
    available deterministic strategies.
-   If the optimizer times out, report solver status and whether a
    feasible incumbent was found.
-   If input data are invalid, prevent execution and display actionable
    errors.
-   If the database is unavailable, fail safely and do not claim that
    results were persisted.
-   If a run is interrupted, mark it failed or interrupted and allow a
    new run; do not silently present partial results as complete.
-   Use bounded retries only for transient errors; do not retry
    indefinitely.
-   Store safe, actionable error messages for users and detailed
    diagnostics in server logs without leaking secrets.

### FR-16 --- Evaluation and repeatability (P0)

The system shall execute all three strategies against the same input
snapshot and store a comparable evaluation record.

Repeatability requirements: - identical initial data and scenario
parameters; - identical horizon and metric definitions; - identical cost
assumptions; - documented baseline policies; - recorded agent/model
settings and solver settings; - fixed random seeds for any stochastic
synthetic-data generation; - repeated runs for stability analysis where
time permits.

The application must distinguish deterministic output differences from
variation caused by LLM responses or solver configuration.

### FR-17 --- Data-quality and governance report (P0)

The report shall document: - dataset source and whether it is
synthetic; - generation rules, seed, units, and limitations; - missing,
stale, inconsistent, or out-of-range data; - assumptions used to fill
permitted gaps; - agent failure modes and hallucination risks; -
optimization model simplifications; - constraints not represented in the
POC; - security and authorization boundaries; - human approval
responsibilities; - scenarios where recommendations should not be
trusted without further review.

### FR-18 --- Export results (P1)

Allow the planner to download comparison results and plan details as CSV
or JSON. Export must include scenario and dataset identifiers and units.

### FR-19 --- Advanced scenario library (P2)

Support multiple disruption types or simultaneous disruptions only after
the seven-day critical-supplier shutdown is working and evaluated. This
is not a launch requirement.

## 8. Mathematical and Operational Definitions

Definitions must be implemented consistently across all strategies.

### 8.1 Fill rate

Recommended unit fill rate over the evaluation horizon:

`Fill Rate = Units of demand fulfilled on time / Total units demanded`

The project must define whether late fulfillment counts as unfilled for
the original due period. Use the same definition across strategies. If
demand is zero, return unavailable rather than dividing by zero.

### 8.2 Backorders

`Backorders = Total unmet demand units carried past their required fulfillment period`

Track period-level backlog and end-of-horizon backlog separately. Do not
count the same unit repeatedly as new demand each day. If the model
treats lost sales rather than backorders, label the metric accordingly.

### 8.3 Total landed cost

Include only cost categories represented in the data and model. The
report should break out, where available: - purchase or sourcing cost; -
normal transport cost; - expedite premium; - production cost; -
inventory holding cost; - shortage/backorder penalty; - transfer cost; -
other explicitly modeled cost.

Do not silently omit a cost category from one strategy while including
it in another. Document excluded costs. Report both total cost and cost
delta against each baseline.

### 8.4 Recovery time

Define recovery time before evaluation. Recommended definition: the
earliest period after disruption begins at which the network returns to
the declared service threshold and sustains it for a specified number of
consecutive periods. If the network never recovers during the horizon,
report `NOT_RECOVERED_WITHIN_HORIZON`.

The threshold and persistence window must be visible scenario
parameters. Do not define recovery time differently for each strategy.

### 8.5 Inventory days

Use a declared formula, for example:

`Inventory Days = Average Inventory Units / Average Daily Demand Units`

If demand is zero, report unavailable. Because products may have
different units and values, also consider reporting aggregate
inventory-days by product or value-weighted inventory days. State the
exact aggregation method in the UI and report.

### 8.6 Constraint violations

Count hard-constraint violations after independent final-plan
validation. The expected count for a plan labeled feasible is zero.
Report soft-constraint breaches separately with severity and penalty.
Distinguish model infeasibility from invalid agent proposals.

### 8.7 Runtime

Measure wall-clock time from run start to final result for each
strategy. Record agent time, optimizer time, validation time, and total
time separately. Compare like-for-like infrastructure and disclose
external API latency.

### 8.8 Recommendation stability

Repeat the multi-agent strategy on the same scenario under documented
settings. Compare: - action set overlap; - quantities and timing
differences; - objective value and service/cost variation.

A possible action-set stability metric is Jaccard similarity between the
sets of recommended actions across runs. Quantity stability can use
normalized absolute differences. Define the metric before reporting
results. Do not call a plan stable merely because its textual
explanation is similar.

## 9. Optimization Model Requirements

The exact mathematical formulation depends on the dataset. The POC must
document the decision variables, objective, hard constraints, soft
constraints, solver, time limit, and status interpretation.

### 9.1 Candidate decision variables

Where supported by data: - quantity sourced from supplier `s` for
product/component `p` in period `t`; - quantity shipped on lane `l` in
period `t`; - quantity expedited; - quantity allocated to downstream
node/customer `n`; - quantity produced at plant `m` in period `t`; -
quantity of demand fulfilled and backordered by period; - optional
binary variables for selecting a source or activating a rescheduling
action.

### 9.2 Core constraints

-   material and inventory balance by item, location, and period;
-   supply cannot exceed supplier capacity or availability;
-   sourcing only from eligible suppliers;
-   inbound supply arrives no earlier than the relevant lead time;
-   production respects plant capacity and component requirements;
-   shipments respect lane capacity and timing where modeled;
-   downstream allocations do not exceed available inventory;
-   no negative inventory unless explicitly modeling backlog separately;
-   hard service, budget, or expedite limits where provided;
-   each supply quantity is allocated at most once.

### 9.3 Objective

The objective must make trade-offs explicit. A defensible POC approach
is either: - lexicographic optimization: first satisfy hard constraints,
then minimize unmet demand/priority-weighted shortage, then minimize
total cost; or - a documented weighted objective with sensitivity
checks.

The implementation must not describe an unproven heuristic as globally
optimal. If a solver returns feasible but not proven optimal, label the
result accurately.

### 9.4 Infeasibility

If the scenario cannot satisfy every service target, the system
should: 1. preserve hard physical constraints; 2. minimize unmet demand
according to the declared objective; 3. report the unmet service
targets; 4. identify likely binding constraints where solver diagnostics
allow; 5. never fabricate a feasible plan.

## 10. Agent Governance and Tool Permissions

### 10.1 Least privilege

-   Demand and inventory agents may read scenario facts and call
    deterministic analysis tools.
-   Supplier-risk and logistics agents may read supplier, lane,
    lead-time, and cost data.
-   Production scheduling agent may read plant capacity, schedule, and
    bill-of-material data.
-   Agents must not directly write to the operational source tables.
-   Agents cannot approve recommendations, alter authorization, or
    invoke external purchasing/shipping actions.
-   Only the coordinator may request optimization and persist the
    resulting run artifacts through backend services.
-   Only an authenticated planner with the appropriate role may approve
    or reject a recommendation.

### 10.2 Evidence and grounding

Each important factual claim in a proposal must include evidence
references, such as: - source record identifiers; - named calculation
results; - scenario assumption identifiers; - constraint identifiers.

A proposal without adequate evidence must be rejected or labeled
unsupported. LLM-generated citations to nonexistent internal records are
invalid.

### 10.3 Prompt injection and untrusted data

Treat imported descriptions, supplier notes, and other free-text fields
as untrusted data. They must not be allowed to override agent
instructions or permissions. Agent tools must enforce authorization and
validate arguments independently of the model.

### 10.4 Confidence

Confidence must be accompanied by a definition. If it is model-reported
confidence, label it as such and do not present it as a statistical
probability. Where possible, derive operational confidence indicators
from data completeness, evidence coverage, constraint validation, and
stability tests.

## 11. User Experience Requirements

### 11.1 Main application areas

1.  **Overview:** current scenario, network health, disruption summary,
    latest run, and key metrics.
2.  **Network & Data:** suppliers, plants, downstream nodes, products,
    inventory, demand, lanes, and data-quality status.
3.  **Scenario Builder:** select the critical supplier, disruption
    timing/duration, horizon, and permitted assumptions.
4.  **Run Analysis:** run baselines and multi-agent strategy; show
    progress and failure status.
5.  **Agent Findings:** show each agent's role, observations, evidence,
    proposed actions, and validation results.
6.  **Recovery Plan:** timeline and action list for sourcing,
    expediting, allocation, and production changes.
7.  **Strategy Comparison:** side-by-side metrics, cost breakdown,
    service outcomes, and constraint status.
8.  **Approval & Audit:** approve/reject/edit actions, record rationale,
    and inspect history.
9.  **Evaluation & Governance:** metric definitions, repeatability
    results, data limitations, and failure analysis.

### 11.2 Interaction requirements

-   Every action must have clear loading, success, empty, and failure
    states.
-   Long-running runs must show progress by stage where possible.
-   The UI must differentiate `RUNNING`, `COMPLETED`,
    `COMPLETED_WITH_WARNINGS`, `FAILED`, `INFEASIBLE`, and `CANCELLED`
    states.
-   Never show a fake success state before the backend confirms
    completion and persistence.
-   Charts must include labels, units, and time ranges.
-   A user must be able to inspect the data behind a metric.
-   The plan must visibly show `Pending approval`, `Approved`,
    `Rejected`, or `Modified and approved`.
-   If one strategy fails, display its error and retain successful
    strategy results without pretending the comparison is complete.

## 12. Technical Architecture

### 12.1 Frontend

**Next.js + TypeScript + Tailwind CSS** - Clerk frontend SDK for sign-in
and session handling. - Calls FastAPI endpoints over HTTPS. - Does not
connect directly to Neon. - Does not hold Gemini API keys or database
credentials. - Uses typed request/response contracts and clear
loading/error states. - Protects pages for user experience, while
backend authorization remains authoritative.

### 12.2 Backend

**FastAPI** - Owns domain logic, authorization checks, orchestration,
validation, simulation, and persistence. - Exposes versioned REST APIs
under `/api/v1`. - Uses Pydantic schemas for request/response
validation. - Uses SQLAlchemy for database operations and Alembic for
schema migrations. - Runs the ADK orchestration and OR-Tools solver in
controlled services. - Enforces request limits, run timeouts, and error
handling. - Does not trust client-supplied identity or role fields.

### 12.3 Database

**Neon PostgreSQL** - Stores source dataset, scenario snapshots, run
metadata, agent proposals, plans, metrics, approvals, and audit
events. - Uses SQLAlchemy with a clear repository/data-access
boundary. - Uses Alembic migrations committed to source control. - Uses
TLS/SSL connection settings and environment-based secrets. - Uses
transactions for state changes that must remain consistent. - Uses
unique constraints and foreign keys for referential integrity. - Uses
indexes for scenario/run lookups and common filtering. - Avoids storing
secrets or unnecessary personal information.

### 12.4 Agent layer

**Google ADK + Gemini** - Defines specialized agents with narrow roles
and tools. - Uses typed output schemas and backend validation. - Calls
deterministic tools for inventory projections, cost calculations,
lead-time checks, and evidence retrieval. - Records model identifier,
prompt/config version, tool outcomes, latency, and errors for each run
where feasible. - Does not own direct database writes. - Uses bounded
timeouts and retries. - Must be possible to run deterministic baselines
if the model provider is unavailable.

### 12.5 Optimization and simulation

**OR-Tools + Python + Pandas** - Pandas handles import, normalization,
data-quality checks, and evaluation aggregation. - OR-Tools handles the
explicitly modeled allocation, sourcing, capacity, and scheduling
decisions. - A deterministic simulation engine applies the selected plan
across the horizon. - The optimizer and simulator share documented
domain definitions and units. - Final metrics are calculated from
simulation results, not from LLM-generated text.

### 12.6 Data access layer

Use a single backend-owned DAL/repository layer in Python. Recommended
logical boundaries: - `NetworkRepository` - `InventoryRepository` -
`DemandRepository` - `SupplierRepository` - `ScenarioRepository` -
`RunRepository` - `ProposalRepository` - `PlanRepository` -
`EvaluationRepository` - `AuditRepository`

These are logical boundaries, not a requirement to create one class per
entity on day one. Keep repositories focused and avoid duplicate query
logic. Do not add Prisma to this Python backend; SQLAlchemy is the ORM
for this architecture.

## 13. Suggested Data Model

The exact schema should follow the selected dataset, but the following
entities are recommended.

### 13.1 Core reference tables

-   **`app_users`**: internal ID, Clerk subject, display name if needed,
    role, created timestamp, active flag.
-   **`products`**: ID, SKU, name, unit of measure, product type, active
    flag.
-   **`network_nodes`**: ID, code, name, node type, echelon, location
    label.
-   **`suppliers`**: ID, code, name, criticality, active flag.
-   **`supplier_products`**: supplier ID, product/component ID,
    eligibility, normal lead time, expedite lead time, capacity by
    period or a related capacity table, purchase cost.
-   **`production_resources`**: plant/resource ID, product or process
    ID, capacity, production rate, cost, period.
-   **`bill_of_materials`**: parent product, component, quantity
    required, effective period if applicable.
-   **`inventory_balances`**: item, node, period/snapshot, on-hand
    quantity, reserved quantity.
-   **`demand_records`**: product, fulfillment node, period, quantity,
    service class/priority.
-   **`transport_lanes`**: origin, destination, mode, normal lead time,
    expedite lead time, capacity, normal and expedite costs.
-   **`cost_parameters`**: scenario or dataset scope, cost type,
    item/node scope, amount, currency, unit, effective period.
-   **`dataset_versions`**: version, source type, generation seed,
    imported time, validation summary, manifest.

### 13.2 Scenario and execution tables

-   **`scenarios`**: scenario ID, name, description, dataset version,
    configuration JSON, created by, created time.
-   **`scenario_disruptions`**: scenario ID, supplier ID, start period,
    duration, disruption type, affected receipt policy.
-   **`scenario_snapshots`**: immutable normalized input snapshot or
    reference to a versioned dataset plus parameter snapshot.
-   **`planning_runs`**: run ID, scenario snapshot, strategy, status,
    start/end times, model/config version, solver status, runtime, error
    summary.
-   **`agent_proposals`**: proposal ID, run ID, agent type, typed
    proposal payload, evidence references, validation status, rejection
    reasons, created time.
-   **`recovery_plans`**: plan ID, run ID, status, objective value,
    feasibility status, summary.
-   **`recovery_actions`**: plan ID, action type, entity references,
    quantity, period, cost delta, parameters, evidence.
-   **`period_results`**: run ID, strategy, period, demand, fulfilled
    units, backlog, inventory, costs, service results.
-   **`evaluation_metrics`**: run ID, metric name, value, unit,
    definition/version, metadata.
-   **`planner_decisions`**: plan ID, planner user ID, decision, reason,
    timestamp, modified-plan reference.
-   **`audit_events`**: actor, event type, target entity, timestamp,
    safe structured details.
-   **`run_events`**: run ID, event type, stage, timestamp, status, safe
    details for progress/debugging.

JSON/JSONB is acceptable for versioned configuration and structured
agent payloads, but authoritative entities, key relationships,
quantities, and searchable metrics should be represented in relational
columns where practical. Do not store the entire application state in
one JSON column.

### 13.3 Data integrity

-   Use primary keys and foreign keys.
-   Use unique constraints for business codes within their declared
    scope.
-   Use check constraints for nonnegative quantities/costs where
    appropriate.
-   Store timestamps in timezone-aware form.
-   Store units and currency explicitly.
-   Use decimal/numeric types for money; avoid binary floating-point for
    persisted currency amounts.
-   Define whether quantities must be integers or may be fractional.
-   Snapshot all parameters needed to reproduce a run.
-   Preserve audit history rather than overwriting past decisions.

## 14. API Requirements

All endpoints are under `/api/v1`. Exact request/response schemas should
be implemented as Pydantic models and documented through FastAPI
OpenAPI.

### 14.1 Authentication and current user

-   `GET /api/v1/me` --- return verified user identity and application
    role.
-   Backend must verify Clerk authentication for protected routes.

### 14.2 Dataset and network

-   `GET /api/v1/datasets`
-   `POST /api/v1/datasets/import` --- admin-only; import a versioned
    dataset.
-   `GET /api/v1/network/summary`
-   `GET /api/v1/suppliers`
-   `GET /api/v1/products`
-   `GET /api/v1/inventory`
-   `GET /api/v1/demand`
-   `GET /api/v1/transport-lanes`
-   `GET /api/v1/data-quality`

### 14.3 Scenarios

-   `GET /api/v1/scenarios`
-   `POST /api/v1/scenarios`
-   `GET /api/v1/scenarios/{scenario_id}`
-   `PATCH /api/v1/scenarios/{scenario_id}` --- create a new version or
    enforce versioning; do not mutate a snapshot used by a completed
    run.
-   `POST /api/v1/scenarios/{scenario_id}/validate`
-   `POST /api/v1/scenarios/{scenario_id}/impact-analysis`

### 14.4 Planning runs

-   `POST /api/v1/scenarios/{scenario_id}/runs` --- start one or more
    selected strategies.
-   `GET /api/v1/runs`
-   `GET /api/v1/runs/{run_id}`
-   `GET /api/v1/runs/{run_id}/events`
-   `GET /api/v1/runs/{run_id}/proposals`
-   `GET /api/v1/runs/{run_id}/plan`
-   `GET /api/v1/runs/{run_id}/metrics`
-   `POST /api/v1/runs/{run_id}/cancel` --- if safe cancellation is
    supported.

### 14.5 Planner decisions

-   `POST /api/v1/plans/{plan_id}/approve`
-   `POST /api/v1/plans/{plan_id}/reject`
-   `POST /api/v1/plans/{plan_id}/modify-and-approve`

Every mutation must be authorized, validated, and audited. Approval
endpoints must use optimistic concurrency or plan-version checks to
prevent approving a stale plan. A modified plan must be revalidated and
re-evaluated before approval.

### 14.6 Evaluation

-   `POST /api/v1/evaluations` --- run selected strategies against the
    same snapshot.
-   `GET /api/v1/evaluations/{evaluation_id}`
-   `GET /api/v1/evaluations/{evaluation_id}/comparison`
-   `GET /api/v1/evaluations/{evaluation_id}/export` --- P1.

For a hackathon implementation, long-running analysis may initially be
handled synchronously with strict timeouts if the dataset is small. The
API contract should not assume that every run completes immediately. If
asynchronous execution is used, expose run status and progress events.

## 15. Run Lifecycle and State Machines

### 15.1 Planning run

Allowed states: - `QUEUED` - `RUNNING` - `COMPLETED` -
`COMPLETED_WITH_WARNINGS` - `INFEASIBLE` - `FAILED` - `CANCELLED`

Transitions must be controlled by backend services. A run may only be
marked `COMPLETED` when required outputs and metrics are persisted. A
run with an agent failure but valid optimizer result may be
`COMPLETED_WITH_WARNINGS`. An infeasible model must not be shown as a
valid completed feasible plan.

### 15.2 Plan approval

Allowed states: - `PENDING_REVIEW` - `APPROVED` - `REJECTED` -
`MODIFIED_AND_APPROVED`

A rejected plan remains available for analysis. Editing an approved plan
creates a new version requiring a new validation and approval record.

## 16. Security, Reliability, and Observability

### 16.1 Security

-   Keep secrets in environment variables or the deployment platform's
    secret manager.
-   Never commit `.env` files or credentials.
-   Validate all input at the API boundary and again at critical domain
    boundaries.
-   Verify Clerk tokens in FastAPI; frontend route protection alone is
    insufficient.
-   Enforce authorization for all write and approval operations.
-   Restrict CORS to known frontend origins.
-   Avoid logging access tokens, secrets, or unnecessary user data.
-   Treat imported free text and agent output as untrusted.
-   Do not execute arbitrary code or SQL generated by agents.
-   Keep the database inaccessible directly from the browser.

### 16.2 Reliability

-   Use transaction boundaries for multi-table state changes.
-   Make run creation idempotent where practical, using a client request
    key or deduplication mechanism.
-   Use bounded timeouts for Gemini calls and solver execution.
-   Avoid duplicate runs caused by double-clicks.
-   Record partial failure states clearly.
-   Provide a reset/seed command that creates a known reproducible
    environment.
-   Include database connection and migration checks in
    startup/deployment validation.

### 16.3 Observability

Record: - run ID and correlation ID; - stage start/end times; -
strategy; - agent name and version; - model/config version; - tool-call
success/failure; - solver status and runtime; - validation errors; -
final metric calculation status.

Logs must not contain API keys, raw session tokens, or sensitive
secrets.

## 17. Non-Functional Requirements

### Performance

-   The seeded POC dataset should run end-to-end within a practical
    live-demo window; set a target after measuring the selected dataset
    and solver.
-   Show progress for longer-running jobs.
-   Avoid repeated database reads for identical immutable scenario facts
    within a single run.
-   Apply a documented solver time limit and report timeout behavior.

### Correctness

-   All strategies use identical metric definitions and scenario inputs.
-   Every final plan receives independent deterministic constraint
    validation.
-   Numeric calculations use code, not model-generated estimates.
-   Cost and quantity units are explicit.
-   A feasible plan must have zero hard-constraint violations.

### Reproducibility

-   Version datasets and scenario configurations.
-   Record model/agent settings and solver settings.
-   Fix synthetic-data seeds.
-   Store metric definitions and versions.
-   Make it possible to rerun a scenario and compare results.

### Maintainability

-   Keep domain models separate from API schemas and agent prompts.
-   Keep the optimizer independent of the UI.
-   Keep deterministic baseline logic independent of Gemini.
-   Use migrations for schema changes.
-   Add tests around inventory balance, lead times, constraints,
    metrics, and approval state transitions.

### Scalability

-   Separate frontend, API, agent orchestration, optimizer, and
    persistence responsibilities.
-   Avoid shared mutable in-memory state as the source of truth.
-   Use persisted run states and bounded workloads.
-   Design repository and service boundaries so future workers/queues
    can be added if run volume grows.
-   Do not introduce distributed infrastructure before the POC requires
    it.

### Accessibility and usability

-   Use labels, units, clear status text, and accessible chart legends.
-   Do not rely on color alone to communicate feasible/infeasible
    status.
-   Make errors and warnings actionable.
-   Show evidence and metric definitions in context.

## 18. Evaluation Plan

### 18.1 Required strategies

**A. Reorder rules** - Deterministic, documented, and reproducible. -
Uses the same disruption and source dataset. - Produces period-level
inventory and fulfillment outcomes.

**B. Optimization only** - Uses the mathematical model without
agent-generated candidate proposals. - Uses the same cost and service
assumptions. - Produces solver status and feasible decisions or explicit
infeasibility.

**C. Multi-agent + optimization** - Agents analyze risk and propose
candidate actions. - Coordinator validates evidence and candidate
actions. - Optimizer produces a feasible plan. - Final plan is
independently validated and simulated.

### 18.2 Required metrics

For each strategy, report: - fill rate; - total backorders and
end-of-horizon backlog; - total landed cost and modeled cost
breakdown; - recovery time; - inventory days; - hard-constraint
violations; - runtime; - recommendation stability where repeated runs
apply.

### 18.3 Fairness rules

-   Use the same data snapshot and scenario parameters.
-   Use the same demand and cost assumptions.
-   Use the same evaluation horizon.
-   Apply the same metric definitions.
-   Do not selectively tune one strategy on the final scenario without
    disclosing it.
-   If the reorder baseline cannot express an action, document the
    limitation.
-   Report solver optimality status accurately.
-   Report agent failures and extra API latency.
-   Show absolute values and deltas, not percentages alone.
-   If a metric is undefined, show why.

### 18.4 Evaluation scenarios

P0: 1. Default seven-day critical-supplier shutdown. 2. A modified
disruption start or duration as a what-if run. 3. At least one case
where alternatives are sufficient and one case where service cannot be
fully maintained, if the data can support both.

P1: - repeated multi-agent runs for stability; - a missing-data
scenario; - an infeasible-capacity or no-alternate-supplier scenario; -
a solver timeout or agent failure test.

### 18.5 Success criteria

The POC is successful when: - a clean seed and migration process creates
a runnable dataset; - a planner can sign in and run the default
disruption scenario; - all three strategies execute or return explicit
failure/infeasibility statuses; - the multi-agent pipeline uses
structured, validated proposals; - the optimizer enforces the modeled
hard constraints; - the final plan has zero hard-constraint violations
when labeled feasible; - the dashboard compares the strategies with
persisted, consistently calculated metrics; - a planner can approve,
reject, or modify-and-approve the proposed plan; - a previous run can be
inspected and reproduced from its stored inputs/settings; - the
governance report describes limitations and failure modes.

Do not set a fabricated target such as "30% cost reduction" before
baseline runs. Establish measured results from the chosen dataset and
report the actual trade-offs.

## 19. Testing Requirements

### Unit tests

-   inventory balance and stock coverage;
-   lead-time and arrival calculations;
-   supplier eligibility;
-   capacity validation;
-   cost calculations;
-   fill rate, backorders, recovery time, inventory days;
-   structured proposal validation;
-   coordinator conflict handling;
-   plan state transitions;
-   authorization checks.

### Integration tests

-   Neon/PostgreSQL connection and migrations;
-   dataset import and validation;
-   scenario creation and immutable run snapshot;
-   each baseline strategy;
-   agent failure fallback;
-   optimizer infeasibility handling;
-   plan persistence and audit events;
-   Clerk-protected API routes;
-   approval and modified-plan revalidation.

### End-to-end acceptance tests

1.  Sign in through Clerk.
2.  Open the default seven-day shutdown scenario.
3.  Run all three strategies against the same snapshot.
4.  Inspect agent proposals and evidence.
5.  Compare metrics and cost/service trade-offs.
6.  Confirm the final feasible plan has zero hard-constraint violations.
7.  Approve the plan and verify the audit record.
8.  Create a what-if variation and verify the previous run remains
    unchanged.
9.  Trigger an invalid dataset or infeasible case and verify the UI
    explains the problem without showing false success.
10. Reload the application and verify runs and decisions persist.

## 20. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  LLM invents a supplier, quantity,   Restrict tools, use structured
  cost, or lead time                  outputs, require evidence, and
                                      recalculate with deterministic
                                      code.

  Agents disagree                     Use coordinator policy and
                                      optimization; never decide by
                                      narrative confidence alone.

  Optimizer is infeasible             Explain the status, preserve hard
                                      constraints, show unmet service
                                      goals, and offer a labeled
                                      diagnostic.

  Dataset is too simple to show       Build a small but nontrivial
  meaningful trade-offs               network with bottlenecks, alternate
                                      sources, varying lead times, and
                                      realistic costs.

  Synthetic data produces misleading  Label it synthetic, publish
  conclusions                         generation assumptions, and avoid
                                      claims of real-world causal impact.

  Gemini API quota, latency, or       Keep baselines independent; use
  outage                              bounded timeouts and graceful
                                      fallback.

  Database/schema changes break demos Commit Alembic migrations and a
                                      deterministic seed/reset workflow.

  Frontend shows stale or hardcoded   Read metrics from persisted backend
  results                             responses and test reload behavior.

  Authentication only exists in the   Verify Clerk tokens and roles in
  UI                                  FastAPI.

  One strategy receives unfair        Snapshot inputs and apply identical
  assumptions                         metric and cost rules to all
                                      strategies.

  Over-scoping                        Prioritize one network, one
                                      seven-day disruption, three
                                      strategies, approval, and core
                                      metrics before stretch features.
  -----------------------------------------------------------------------

## 21. Recommended Repository Structure

``` text
project-root/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── types/
│   └── middleware.ts
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/
│   │   ├── core/                 # settings, auth, logging
│   │   ├── db/                   # session, base, migrations config
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic API and proposal schemas
│   │   ├── repositories/         # data access layer
│   │   ├── services/             # scenario, run, approval, evaluation
│   │   ├── simulation/
│   │   ├── optimization/
│   │   ├── agents/
│   │   ├── orchestration/
│   │   └── evaluation/
│   ├── alembic/
│   ├── tests/
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── manifest.json
│   ├── scripts/
│   ├── alembic.ini
│   └── pyproject.toml
├── docs/
│   ├── DATASET.md
│   ├── OPTIMIZATION_MODEL.md
│   ├── METRICS.md
│   └── GOVERNANCE.md
├── .env.example
├── PRD.md
└── README.md
```

This is a suggested structure, not a requirement to create empty folders
before implementation. Keep the repository proportionate to the actual
code.

## 22. Environment Configuration

The project should document these variables in `.env.example` without
real secrets:

### Frontend

-   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
-   `CLERK_SECRET_KEY` (server-side only where needed)
-   `NEXT_PUBLIC_API_BASE_URL`

### Backend

-   `DATABASE_URL`
-   `CLERK_JWT_KEY` or the configured Clerk backend verification
    credentials
-   `CLERK_ISSUER` / authorized parties if required by the selected
    verification method
-   `GEMINI_API_KEY`
-   `GEMINI_MODEL`
-   `APP_ENV`
-   `CORS_ORIGINS`
-   `OPTIMIZER_TIME_LIMIT_SECONDS`
-   `DEFAULT_DATASET_VERSION`

Use the exact environment variables required by the selected Clerk SDK
and database driver. Never commit actual values. For Neon, use the
connection string and SSL settings recommended for the chosen
driver/deployment. Use a pooled connection string for high-concurrency
serverless deployment only when appropriate; do not assume pooling is
mandatory for a local POC.

## 23. Implementation Sequence

### Phase 1 --- Foundation

-   Create the frontend and FastAPI backend.
-   Configure Clerk sign-in and server-side token verification.
-   Connect Neon PostgreSQL.
-   Create SQLAlchemy models and Alembic migrations.
-   Seed a versioned, reproducible network dataset.
-   Implement dataset validation and network summary endpoints.

**Exit condition:** a signed-in planner can inspect persistent network
data after a reload.

### Phase 2 --- Deterministic simulation and baselines

-   Implement the seven-day disruption mechanics.
-   Implement inventory, lead-time, and production calculations.
-   Implement the reorder-rule baseline.
-   Implement the OR-Tools optimization-only baseline.
-   Add independent constraint validation and metric calculation.

**Exit condition:** both baselines return persisted results with defined
metrics.

### Phase 3 --- Agent layer and coordinator

-   Define Pydantic schemas for proposals.
-   Implement demand, inventory, supplier-risk, logistics, and
    production scheduling agents as scoped by the data model.
-   Provide read-only deterministic tools.
-   Implement the coordinator, proposal validation, conflict resolution,
    optimizer invocation, and fallback behavior.
-   Persist proposals, evidence, results, and errors.

**Exit condition:** the multi-agent strategy returns a validated plan or
a clear infeasibility/failure status.

### Phase 4 --- Planner experience

-   Build scenario controls and impact analysis.
-   Build agent findings, recovery plan, and comparison views.
-   Add approval/rejection/modification workflow and audit trail.
-   Ensure no hardcoded metrics are used in the real workflow.

**Exit condition:** a planner can inspect, compare, and approve a
persisted plan.

### Phase 5 --- Evaluation and hardening

-   Run all strategies on identical snapshots.
-   Add repeatability and failure tests.
-   Document dataset assumptions, model limitations, and measured
    results.
-   Test the full demo path from a clean database.
-   Prepare a short reproducible demo scenario.

**Exit condition:** the complete demo is repeatable, its metrics are
traceable, and limitations are disclosed.

## 24. Demo Narrative

The demo should tell one coherent operational story:

1.  Show the baseline network and its current inventory, demand, and
    supplier dependencies.
2.  Trigger the seven-day shutdown of the critical supplier.
3.  Show the calculated exposure: affected products, shortage windows,
    and impacted demand.
4.  Run reorder rules and inspect their outcome.
5.  Run optimization-only and inspect its feasible plan and trade-offs.
6.  Run the multi-agent strategy and inspect evidence-backed proposals.
7.  Show the coordinator rejecting unsupported or infeasible proposals
    and passing valid candidates to the optimizer.
8.  Compare service, cost, recovery, inventory, constraint violations,
    and runtime.
9.  Let the planner approve or reject the recommendation.
10. Reopen run history and show the saved scenario, metrics, and
    approval audit.

The demo must use actual backend results from the selected dataset. If
an agent or solver fails during the live demo, show the recorded failure
state and continue with a successful baseline rather than displaying
invented outputs.

## 25. Official Technical References

These references inform the selected architecture and should be
rechecked during implementation because SDK APIs and deployment guidance
can change.

-   Google Agent Development Kit (ADK): https://adk.dev/
-   ADK agents and workflows:
    https://github.com/google/adk-docs/blob/main/docs/agents/index.md
-   Gemini API documentation: https://ai.google.dev/gemini-api/docs
-   Google OR-Tools: https://developers.google.com/optimization
-   Clerk backend token verification:
    https://clerk.com/docs/guides/sessions/manual-jwt-verification
-   Clerk Python backend guidance:
    https://clerk.com/articles/how-to-add-authentication-to-a-python-backend
-   Neon: https://neon.tech/docs
-   SQLAlchemy: https://docs.sqlalchemy.org/
-   Alembic: https://alembic.sqlalchemy.org/
-   FastAPI: https://fastapi.tiangolo.com/
-   Next.js: https://nextjs.org/docs
-   Pandas: https://pandas.pydata.org/docs/

------------------------------------------------------------------------

## Final Product Definition

The deliverable is a working, reproducible supply-chain disruption
decision-support POC. It combines specialized agent analysis with
deterministic validation and mathematical optimization, compares the
result against two baselines, explains service/cost trade-offs, persists
evidence and evaluation metrics, and requires planner approval. Its
credibility comes from feasible actions, consistent metrics,
reproducibility, and honest failure reporting---not from the number of
agents or the amount of generated text.
