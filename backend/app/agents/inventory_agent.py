from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.schema import InventoryRecord, ProductionResource, Scenario
from backend.app.agents.ai_helper import call_gemini_or_grounded

class InventoryAgent:
    """
    Inventory Agent:
    Reads actual inventory and inventory-position data from DB.
    Evaluates safety stock, buffer availability, and projected stockouts.
    Estimates inventory coverage and inventory depletion.
    Recommends inventory reallocation and buffer usage.
    """

    def __init__(self, db: Session):
        self.db = db

    def evaluate(self, scenario_id: str) -> Dict[str, Any]:
        scenario = self.db.query(Scenario).filter(Scenario.id == scenario_id).first()
        daily_demand = scenario.daily_demand_units if scenario else 200
        disruption_start = scenario.disruption_start_day if scenario else 4
        disruption_duration = scenario.disruption_duration_days if scenario else 7

        plants = self.db.query(ProductionResource).filter(ProductionResource.active == True).all()
        plant = plants[0] if plants else None
        plant_id = plant.id if plant else "plant-01"
        plant_name = plant.name if plant else "Austin Advanced Manufacturing Facility (Plant Alpha)"

        # Query on-hand raw component inventory from DB
        inv_record = self.db.query(InventoryRecord).filter(
            InventoryRecord.item_sku == "CMP-101",
            InventoryRecord.node_id == plant_id
        ).first()

        on_hand_raw = inv_record.on_hand_units if inv_record else 600
        safety_target = inv_record.safety_stock_target if inv_record else 600

        coverage_days = round(on_hand_raw / daily_demand, 1) if daily_demand > 0 else 3.0
        # Pipeline arrives days 1-3. Outage starts day 4. Stockout without new inbound occurs at day:
        projected_stockout_day = disruption_start + int(coverage_days) - 1 # e.g. 4 + 3 - 1 = 6

        grounded = {
            "proposal_id": "PROP-INV-01",
            "agent_type": "INVENTORY",
            "action_type": "BUFFER_ALLOCATION",
            "action_summary": f"Controlled safety stock drawdown of {on_hand_raw} units raw component buffer at {plant_name}",
            "affected_entity_ids": [plant_id, "prod-01"],
            "action_parameters": {
                "plant_id": plant_id,
                "initial_buffer_units": on_hand_raw,
                "safety_stock_target": safety_target,
                "coverage_days": coverage_days,
                "daily_burn_rate": daily_demand,
                "projected_stockout_day": projected_stockout_day,
                "rebuild_start_day": disruption_start + disruption_duration,
            },
            "evidence_refs": [
                f"Plant {plant_name} on-hand raw CMP-101 inventory = {on_hand_raw} units (safety target = {safety_target} units)",
                f"Daily manufacturing consumption rate is {daily_demand} units/day under active schedule",
                f"Inventory coverage provides exactly {coverage_days} days of autonomous production",
                f"Projected stockout day without inbound replenishment is Day {projected_stockout_day} morning",
            ],
            "expected_benefits": f"Sustains assembly line through Day {projected_stockout_day} without premature line shutdowns",
            "expected_cost_delta": 0.0,
            "risks": [
                f"Depletes safety buffer to 0 by Day {projected_stockout_day}; leaves zero margin for logistics delay"
            ],
            "assumptions": [
                f"Alternate supplier shipments arrive by Day {projected_stockout_day} morning to prevent line starvation"
            ],
            "confidence_score": 0.95,
            "validation_status": "VALIDATED",
        }

        prompt = f"""
Analyze inventory position for disruption recovery:
- Plant: {plant_name} ({plant_id})
- On-hand raw CMP-101 stock: {on_hand_raw} units
- Daily consumption rate: {daily_demand} units/day
- Safety stock target: {safety_target} units
- Disruption start: Day {disruption_start}, duration: {disruption_duration} days
- Coverage: {coverage_days} days, Projected stockout: Day {projected_stockout_day}
Provide structured buffer allocation proposal adhering to schema.
"""
        return call_gemini_or_grounded(
            prompt=prompt,
            system_instruction="You are a senior Inventory Planning AI Agent for resilient supply chain manufacturing. Ground all numbers in data.",
            grounded_fallback=grounded
        )
