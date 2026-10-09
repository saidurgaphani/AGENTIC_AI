import pytest
from backend.app.services.optimization_service import SupplyChainOptimizer

def test_ortools_reorder_baseline():
    optimizer = SupplyChainOptimizer(
        horizon_days=14,
        daily_demand=200,
        initial_stock=600,
        plant_capacity=300,
        disruption_start=4,
        disruption_end=10,
        shortage_penalty=150.0,
    )
    result = optimizer.solve(strategy="REORDER_BASELINE", allow_alternate=False, allow_expediting=False)
    
    assert result["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    assert result["fill_rate_percent"] < 90.0, "Reorder baseline should suffer stockouts during shutdown"
    assert result["total_backorders"] > 0
    assert result["hard_violations"] == 0

def test_ortools_multi_agent_optimization():
    optimizer = SupplyChainOptimizer(
        horizon_days=14,
        daily_demand=200,
        initial_stock=600,
        plant_capacity=300,
        disruption_start=4,
        disruption_end=10,
        shortage_penalty=150.0,
    )
    result = optimizer.solve(strategy="MULTI_AGENT_OPTIMIZATION", allow_alternate=True, allow_expediting=True)
    
    assert result["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    assert result["fill_rate_percent"] >= 95.0, "Multi-agent optimization should achieve >= 95% fill rate via air freight"
    assert result["hard_violations"] == 0
    assert len(result["day_by_day_metrics"]) == 14
