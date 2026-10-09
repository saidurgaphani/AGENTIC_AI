from typing import Dict, Any, List
from ortools.linear_solver import pywraplp

class SupplyChainOptimizer:
    """
    Google OR-Tools Mixed Integer Linear Programming (MILP) formulation
    for 3-echelon supply network disruption recovery.
    """

    def __init__(
        self,
        horizon_days: int = 14,
        daily_demand: int = 200,
        initial_stock: int = 600,
        plant_capacity: int = 300,
        disruption_start: int = 4,
        disruption_end: int = 10,
        shortage_penalty: float = 150.0,
    ):
        self.horizon = horizon_days
        self.daily_demand = daily_demand
        self.initial_stock = initial_stock
        self.plant_capacity = plant_capacity
        self.disruption_start = disruption_start
        self.disruption_end = disruption_end
        self.shortage_penalty = shortage_penalty

    def solve(
        self,
        strategy: str = "MULTI_AGENT_OPTIMIZATION",
        allow_alternate: bool = True,
        allow_expediting: bool = True,
    ) -> Dict[str, Any]:
        solver = pywraplp.Solver.CreateSolver("CBC")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("GLOP")

        T = list(range(1, self.horizon + 1))

        # Decision Variables
        # 1. Orders placed at SUP-01 (Sendai, 3-day lead time, capacity 300)
        order_sup1 = {t: solver.IntVar(0, 300, f"ord_sup1_{t}") for t in T}

        # 2. Orders placed at SUP-02 (Munich, normal 5-day, expedite 2-day, capacity 250)
        cap_sup2 = 250 if allow_alternate else 0
        order_sup2_norm = {t: solver.IntVar(0, cap_sup2, f"ord_sup2_norm_{t}") for t in T}
        order_sup2_exp = {
            t: solver.IntVar(0, cap_sup2 if allow_expediting else 0, f"ord_sup2_exp_{t}") for t in T
        }

        # Joint capacity for SUP-02: normal + expedite <= 250
        for t in T:
            solver.Add(order_sup2_norm[t] + order_sup2_exp[t] <= cap_sup2)

        # 3. Plant production of SKU-900 per day (max 300)
        prod = {t: solver.IntVar(0, self.plant_capacity, f"prod_{t}") for t in T}

        # 4. Raw component inventory balance at plant
        inv = {t: solver.IntVar(0, 10000, f"inv_{t}") for t in T}

        # 5. Demand fulfilled and carried backlog
        fulfilled = {t: solver.IntVar(0, self.daily_demand * 5, f"fulfilled_{t}") for t in T}
        backlog = {t: solver.IntVar(0, self.daily_demand * 15, f"backlog_{t}") for t in T}

        # CONSTRAINTS:
        # A. Disruption at SUP-01: Days 4-10 outbound orders are 0
        for t in T:
            if self.disruption_start <= t <= self.disruption_end:
                solver.Add(order_sup1[t] == 0)

        # B. Strategy Rules:
        if strategy == "REORDER_BASELINE":
            for t in T:
                solver.Add(order_sup2_norm[t] == 0)
                solver.Add(order_sup2_exp[t] == 0)
        elif strategy == "OPTIMIZATION_ONLY":
            for t in T:
                solver.Add(order_sup2_exp[t] == 0)

        # C. Material & Inventory Balance:
        for t in T:
            # Pre-disruption pipeline orders arrive on days 1, 2, 3 (200 units each)
            pipeline_inbound = 200 if t <= 3 else 0
            arr_sup1 = order_sup1[t - 3] if t - 3 in T else 0
            arr_sup2_n = order_sup2_norm[t - 5] if t - 5 in T else 0
            arr_sup2_e = order_sup2_exp[t - 2] if t - 2 in T else 0

            inbound_t = pipeline_inbound + arr_sup1 + arr_sup2_n + arr_sup2_e

            prev_inv = self.initial_stock if t == 1 else inv[t - 1]
            # Plant raw inventory = previous stock + inbound - production
            solver.Add(inv[t] == prev_inv + inbound_t - prod[t])

            # Demand balance: Fulfilled(t) + Backlog(t) == Demand(t) + Backlog(t-1)
            prev_backlog = 0 if t == 1 else backlog[t - 1]
            solver.Add(fulfilled[t] + backlog[t] == self.daily_demand + prev_backlog)

            # Plant can only fulfill units produced today
            solver.Add(fulfilled[t] <= prod[t])

        # OBJECTIVE FUNCTION:
        # Minimize: Procurement + Transport + Expediting + Production + Shortage penalties + Holding
        cost_expr = []
        for t in T:
            # SUP-01: $140 purchase + $18 freight = $158
            cost_expr.append(order_sup1[t] * 158.0)
            # SUP-02 normal: $195 purchase + $24 intermodal = $219
            cost_expr.append(order_sup2_norm[t] * 219.0)
            # SUP-02 expedite: $195 purchase + $68 air = $263
            cost_expr.append(order_sup2_exp[t] * 263.0)
            # Production: $42/unit
            cost_expr.append(prod[t] * 42.0)
            # Shortage backlog penalty: $150 per unit-day
            cost_expr.append(backlog[t] * self.shortage_penalty)
            # Inventory holding: $2/unit-day
            cost_expr.append(inv[t] * 2.0)

        # Terminal backlog lost-sales / SLA breach penalty for unrecovered volume at horizon end
        cost_expr.append(backlog[self.horizon] * 350.0)

        solver.Minimize(solver.Sum(cost_expr))

        status = solver.Solve()
        is_feasible = status in [pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE]

        total_fulfilled = 0
        total_demand = self.daily_demand * self.horizon
        day_metrics = []

        for t in T:
            f_val = int(fulfilled[t].solution_value()) if is_feasible else 0
            b_val = int(backlog[t].solution_value()) if is_feasible else self.daily_demand
            inv_val = int(inv[t].solution_value()) if is_feasible else 0

            arr_sup1 = int(order_sup1[t - 3].solution_value()) if (t - 3 in T and is_feasible) else (200 if t <= 3 else 0)
            arr_sup2_n = int(order_sup2_norm[t - 5].solution_value()) if (t - 5 in T and is_feasible) else 0
            arr_sup2_e = int(order_sup2_exp[t - 2].solution_value()) if (t - 2 in T and is_feasible) else 0
            inbound_val = arr_sup1 + arr_sup2_n + arr_sup2_e

            total_fulfilled += f_val
            daily_cost = round(
                f_val * 42.0 + b_val * self.shortage_penalty + inbound_val * 170.0 + inv_val * 2.0, 2
            )

            day_metrics.append({
                "day": t,
                "demand": self.daily_demand,
                "fulfilled": f_val,
                "backlog": b_val,
                "plantRawStock": inv_val,
                "finishedStock": 0,
                "inboundUnits": inbound_val,
                "dailyCost": daily_cost,
            })

        fill_rate = round((total_fulfilled / total_demand) * 100, 1)
        total_backorders = max(0, total_demand - total_fulfilled)

        recovery_day = "NOT_RECOVERED_WITHIN_HORIZON"
        for t in range(self.disruption_start, self.horizon + 1):
            if day_metrics[t - 1]["backlog"] == 0 and day_metrics[t - 1]["fulfilled"] >= self.daily_demand:
                recovery_day = f"{t} Days"
                break

        total_cost = solver.Objective().Value() if is_feasible else 0

        return {
            "strategy": strategy,
            "solver_status": "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else ("FEASIBLE" if is_feasible else "INFEASIBLE"),
            "fill_rate_percent": fill_rate,
            "total_backorders": total_backorders,
            "total_landed_cost": round(total_cost, 2),
            "recovery_time_days": recovery_day,
            "hard_violations": 0 if is_feasible else 1,
            "day_by_day_metrics": day_metrics,
        }
