import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const runs = await query(
      `SELECT r.*, s.name as scenario_name, s.critical_supplier_id, s.disruption_duration_days,
              s.daily_demand_units, s.shortage_penalty_per_unit,
              sup.code as supplier_code, sup.name as supplier_name
       FROM planning_runs r
       LEFT JOIN scenarios s ON s.id = r.scenario_id
       LEFT JOIN suppliers sup ON sup.id = s.critical_supplier_id
       WHERE r.id = $1`,
      [id]
    );

    if (runs.length === 0) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }
    const run = runs[0];

    const [proposals, plans] = await Promise.all([
      query('SELECT * FROM agent_proposals WHERE run_id = $1 ORDER BY created_at ASC', [id]),
      query(
        `SELECT p.*, d.decision, d.rationale, d.authorized_budget_delta, d.user_id as decider, d.timestamp as decision_time
         FROM recovery_plans p
         LEFT JOIN planner_decisions d ON d.plan_id = p.id
         WHERE p.run_id = $1`,
        [id]
      ),
    ]);

    return NextResponse.json({
      run,
      proposals,
      plan: plans[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
