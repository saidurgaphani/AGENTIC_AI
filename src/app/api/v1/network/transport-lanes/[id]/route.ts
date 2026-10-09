import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      mode,
      transit_days,
      cost_per_unit,
      expedited_transit_days,
      expedited_cost_per_unit,
      active,
    } = body;

    const existing = await query('SELECT * FROM transport_lanes WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Lane not found' }, { status: 404 });
    }

    await query(
      `UPDATE transport_lanes
       SET mode = COALESCE($1, mode),
           transit_days = COALESCE($2, transit_days),
           cost_per_unit = COALESCE($3, cost_per_unit),
           expedited_transit_days = COALESCE($4, expedited_transit_days),
           expedited_cost_per_unit = COALESCE($5, expedited_cost_per_unit),
           active = COALESCE($6, active)
       WHERE id = $7`,
      [
        mode,
        transit_days,
        cost_per_unit,
        expedited_transit_days,
        expedited_cost_per_unit,
        active,
        id,
      ]
    );

    const updated = await query('SELECT * FROM transport_lanes WHERE id = $1', [id]);
    await logAuditEvent({
      eventType: 'ENTITY_UPDATE',
      targetEntity: 'transport_lanes',
      targetId: id,
      details: `Updated transport lane ${id}`,
      beforeState: existing[0],
      afterState: updated[0],
    });

    return NextResponse.json({ transportLane: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query('UPDATE transport_lanes SET active = false WHERE id = $1', [id]);
    await logAuditEvent({
      eventType: 'ENTITY_DEACTIVATE',
      targetEntity: 'transport_lanes',
      targetId: id,
      details: `Deactivated transport lane ${id}`,
    });
    return NextResponse.json({ message: 'Transport lane deactivated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
