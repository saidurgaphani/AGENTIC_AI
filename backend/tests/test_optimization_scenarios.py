import pytest
from backend.app.services.optimization_service import SupplyChainOptimizer

def test_no_disruption_baseline():
    """Verify that under no disruption, conventional policy satisfies 100% of demand at minimum cost."""
    optimizer = SupplyChainOptimizer(
        horizon_days=14,
        daily_demand=200,
        initial_stock=600,
        disruption_start=0,
        disruption_end=0,
        shortage_penalty=150.0,
        primary_sup_cap=300,
        primary_sup_lead=3,
        primary_sup_cost=140.0,
        primary_freight_cost=18.0,
        alt_sup_cap=250,
        alt_sup_lead_norm=5,
        alt_sup_lead_exp=2,
        alt_sup_cost=195.0,
        alt_freight_norm=22.0,
        alt_freight_exp=44.0,
        prod_unit_cost=84.0,
        holding_cost_per_day=2.0,
    )
    result = optimizer.solve(
        strategy="REORDER_BASELINE",
        allow_alternate=False,
        allow_expediting=False,
    )
    assert result["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    assert result["total_backorders"] == 0
    assert result["fill_rate_percent"] == 100.0
    assert result["hard_violations"] == 0
    # Cost reconciliation
    breakdown = result["cost_breakdown"]
    reconciled_sum = (
        breakdown["procurement"]
        + breakdown["freight"]
        + breakdown["expedite_premium"]
        + breakdown["production"]
        + breakdown["holding"]
        + breakdown["shortage_penalties"]
    )
    assert abs(result["total_landed_cost"] - reconciled_sum) < 0.01

def test_seven_day_shutdown_strategy_comparison():
    """Verify 7-day shutdown causes shortage in baseline and is mitigated by multi-agent optimization."""
    optimizer = SupplyChainOptimizer(
        horizon_days=14,
        daily_demand=200,
        initial_stock=600,
        disruption_start=4,
        disruption_end=10,
        shortage_penalty=150.0,
        primary_sup_cap=300,
        primary_sup_lead=3,
        primary_sup_cost=140.0,
        primary_freight_cost=18.0,
        alt_sup_cap=250,
        alt_sup_lead_norm=5,
        alt_sup_lead_exp=2,
        alt_sup_cost=195.0,
        alt_freight_norm=22.0,
        alt_freight_exp=44.0,
        prod_unit_cost=84.0,
        holding_cost_per_day=2.0,
    )

    # 1. Baseline: no alternate sourcing
    res_base = optimizer.solve(strategy="REORDER_BASELINE", allow_alternate=False, allow_expediting=False)
    assert res_base["feasibilityStatus"] == "UNMITIGATED_SHORTAGE"
    assert res_base["fill_rate_percent"] < 75.0
    assert res_base["total_backorders"] > 0

    # 2. Optimization Only: alternate sourcing without air expediting (has transit delay gap)
    res_opt = optimizer.solve(strategy="OPTIMIZATION_ONLY", allow_alternate=True, allow_expediting=False)
    assert res_opt["solver_status"] in ["OPTIMAL", "FEASIBLE"]

    # 3. Multi-Agent Optimization: alternate sourcing + 2-day air expedite
    res_multi = optimizer.solve(
        strategy="MULTI_AGENT_OPTIMIZATION",
        allow_alternate=True,
        allow_expediting=True,
        priority_dc_protection=True,
    )
    assert res_multi["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    assert res_multi["fill_rate_percent"] >= 98.0
    assert res_multi["hard_violations"] == 0
    assert res_multi["feasibilityStatus"] == "FEASIBLE"

def test_insufficient_alternate_capacity():
    """Verify solver behavior when alternate supplier capacity is severely restricted."""
    optimizer = SupplyChainOptimizer(
        horizon_days=14,
        daily_demand=200,
        initial_stock=100,
        disruption_start=4,
        disruption_end=10,
        shortage_penalty=150.0,
        primary_sup_cap=200,
        primary_sup_lead=3,
        primary_sup_cost=140.0,
        primary_freight_cost=18.0,
        alt_sup_cap=50, # Only 50 units/day vs 200 needed
        alt_sup_lead_norm=5,
        alt_sup_lead_exp=2,
        alt_sup_cost=195.0,
        alt_freight_norm=22.0,
        alt_freight_exp=44.0,
        prod_unit_cost=84.0,
        holding_cost_per_day=2.0,
    )
    res = optimizer.solve(strategy="MULTI_AGENT_OPTIMIZATION", allow_alternate=True, allow_expediting=True)
    # With only 50 units capacity, backorders must occur
    assert res["total_backorders"] > 0
    assert res["fill_rate_percent"] < 100.0

def test_candidate_actions_override():
    """Verify that candidate_actions passed to solver correctly overrides capacities and parameters."""
    optimizer = SupplyChainOptimizer(
        horizon_days=14,
        daily_demand=200,
        initial_stock=100,
        disruption_start=4,
        disruption_end=10,
        shortage_penalty=150.0,
        primary_sup_cap=300,
        primary_sup_lead=3,
        primary_sup_cost=140.0,
        primary_freight_cost=18.0,
        alt_sup_cap=250, # Physical capacity is 250
        alt_sup_lead_norm=5,
        alt_sup_lead_exp=2, # Physical expedite limit is 2
        alt_sup_cost=195.0,
        alt_freight_norm=22.0,
        alt_freight_exp=44.0,
        prod_unit_cost=84.0,
        holding_cost_per_day=2.0,
    )
    
    # Pass candidate_actions that restricts alternate capacity to 50
    # Even though physical is 250, the agent only negotiated 50.
    candidate_actions = {
        "alternate_daily_capacity": 50,
        "allow_alternate_sourcing": True,
        "allow_expedited_shipping": True
    }
    
    res = optimizer.solve(
        strategy="MULTI_AGENT_OPTIMIZATION",
        candidate_actions=candidate_actions
    )
    
    # With capacity limited to 50, it cannot meet 200 demand during 7 day disruption
    assert res["total_backorders"] > 0
    assert res["fill_rate_percent"] < 100.0
