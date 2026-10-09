import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET() {
  try {
    const scenarios = await query(`
      SELECT s.*, sup.name as supplier_name, sup.code as supplier_code, sup.location as supplier_location
      FROM scenarios s
      LEFT JOIN suppliers sup ON sup.id = s.critical_supplier_id
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json(scenarios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
    } = body;
    const critical_supplier_id = body.critical_supplier_id || body.criticalSupplierId;
    const disruption_start_day = body.disruption_start_day ?? body.disruptionStartDay ?? 4;
    const disruption_duration_days = body.disruption_duration_days ?? body.disruptionDurationDays ?? 7;
    const evaluation_horizon_days = body.evaluation_horizon_days ?? body.evaluationHorizonDays ?? 14;
    const safety_stock_days = body.safety_stock_days ?? body.safetyStockDays ?? 3;
    const daily_demand_units = body.daily_demand_units ?? body.dailyDemandUnits ?? 200;
    const shortage_penalty_per_unit = body.shortage_penalty_per_unit ?? body.shortagePenaltyPerUnit ?? 150;

    if (!name || !critical_supplier_id) {
      return NextResponse.json(
        { error: 'name and critical_supplier_id (or criticalSupplierId) are required' },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const sup = await query('SELECT * FROM suppliers WHERE id = $1', [critical_supplier_id]);
    if (sup.length === 0) {
      return NextResponse.json({ error: 'Selected supplier not found in network' }, { status: 404 });
    }

    const id = `SCN-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO scenarios (
        id, name, description, dataset_version, random_seed, critical_supplier_id,
        disruption_start_day, disruption_duration_days, evaluation_horizon_days,
        safety_stock_days, daily_demand_units, shortage_penalty_per_unit, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, '1.0.0-canonical', $4, $5,
        $6, $7, $8,
        $9, $10, $11, 'ACTIVE',
        NOW(), NOW()
      )`,
      [
        id,
        name,
        description,
        `SEED_${Date.now()}`,
        critical_supplier_id,
        disruption_start_day,
        disruption_duration_days,
        evaluation_horizon_days,
        safety_stock_days,
        daily_demand_units,
        shortage_penalty_per_unit,
      ]
    );

    // Update supplier disrupted flag
    await query('UPDATE suppliers SET disrupted = true, updated_at = NOW() WHERE id = $1', [
      critical_supplier_id,
    ]);

    await logAuditEvent({
      eventType: 'DISRUPTION_CONFIG',
      targetEntity: 'scenarios',
      targetId: id,
      details: `Created scenario "${name}" targeting supplier ${sup[0].code} with ${disruption_duration_days}-day outage`,
      afterState: { id, critical_supplier_id, disruption_start_day, disruption_duration_days },
    });

    const created = await query('SELECT * FROM scenarios WHERE id = $1', [id]);
    return NextResponse.json(
      {
        ...created[0],
        scenario: created[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
