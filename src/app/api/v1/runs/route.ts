import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const strategy = searchParams.get('strategy') || '';
    const status = searchParams.get('status') || '';

    let sqlText = `
      SELECT r.*, s.name as scenario_name, s.critical_supplier_id,
             p.status as plan_status, p.id as plan_id,
             d.decision as planner_decision, d.rationale as planner_rationale
      FROM planning_runs r
      LEFT JOIN scenarios s ON s.id = r.scenario_id
      LEFT JOIN recovery_plans p ON p.run_id = r.id
      LEFT JOIN planner_decisions d ON d.plan_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (strategy) {
      params.push(strategy);
      sqlText += ` AND r.strategy = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sqlText += ` AND r.status = $${params.length}`;
    }

    sqlText += ' ORDER BY r.created_at DESC';

    const runs = await query(sqlText, params);

    // Aggregate statistics
    const totalRuns = runs.length;
    const completedRuns = runs.filter((r: any) => r.status === 'COMPLETED').length;
    const infeasibleRuns = runs.filter((r: any) => r.solver_status === 'INFEASIBLE').length;

    return NextResponse.json({
      totalRuns,
      completedRuns,
      infeasibleRuns,
      runs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
