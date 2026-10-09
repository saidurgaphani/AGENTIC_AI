import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET() {
  try {
    const lanes = await query('SELECT * FROM transport_lanes ORDER BY id ASC');
    return NextResponse.json({ transportLanes: lanes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      origin_id,
      destination_id,
      mode = 'STANDARD_TRUCKLOAD',
      transit_days = 3,
      cost_per_unit = 15,
      expedited_transit_days,
      expedited_cost_per_unit,
    } = body;

    const id = `lane-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO transport_lanes (id, origin_id, destination_id, mode, transit_days, cost_per_unit, expedited_transit_days, expedited_cost_per_unit, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
      [
        id,
        origin_id,
        destination_id,
        mode,
        transit_days,
        cost_per_unit,
        expedited_transit_days,
        expedited_cost_per_unit,
      ]
    );

    await logAuditEvent({
      eventType: 'ENTITY_CREATE',
      targetEntity: 'transport_lanes',
      targetId: id,
      details: `Created transport lane ${origin_id} -> ${destination_id} (${mode})`,
    });

    const created = await query('SELECT * FROM transport_lanes WHERE id = $1', [id]);
    return NextResponse.json({ transportLane: created[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
