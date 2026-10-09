import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenarios = await query(
      `SELECT s.*, sup.name as supplier_name, sup.code as supplier_code, sup.location as supplier_location
       FROM scenarios s
       LEFT JOIN suppliers sup ON sup.id = s.critical_supplier_id
       WHERE s.id = $1`,
      [id]
    );

    if (scenarios.length === 0) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json({ scenario: scenarios[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      critical_supplier_id,
      disruption_start_day,
      disruption_duration_days,
      daily_demand_units,
      safety_stock_days,
      shortage_penalty_per_unit,
    } = body;

    const existing = await query('SELECT * FROM scenarios WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }
    const beforeState = existing[0];

    await query(
      `UPDATE scenarios
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           critical_supplier_id = COALESCE($3, critical_supplier_id),
           disruption_start_day = COALESCE($4, disruption_start_day),
           disruption_duration_days = COALESCE($5, disruption_duration_days),
           daily_demand_units = COALESCE($6, daily_demand_units),
           safety_stock_days = COALESCE($7, safety_stock_days),
           shortage_penalty_per_unit = COALESCE($8, shortage_penalty_per_unit),
           updated_at = NOW()
       WHERE id = $9`,
      [
        name,
        description,
        critical_supplier_id,
        disruption_start_day,
        disruption_duration_days,
        daily_demand_units,
        safety_stock_days,
        shortage_penalty_per_unit,
        id,
      ]
    );

    // Synchronize disrupted flags on suppliers
    if (critical_supplier_id) {
      await query('UPDATE suppliers SET disrupted = (id = $1)', [critical_supplier_id]);
    }

    const updated = await query('SELECT * FROM scenarios WHERE id = $1', [id]);

    await logAuditEvent({
      eventType: 'DISRUPTION_CONFIG',
      targetEntity: 'scenarios',
      targetId: id,
      details: `Updated disruption scenario configuration "${updated[0].name}"`,
      beforeState,
      afterState: updated[0],
    });

    return NextResponse.json({ scenario: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
