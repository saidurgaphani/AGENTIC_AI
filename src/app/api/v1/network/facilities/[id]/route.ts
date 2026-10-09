import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, location, daily_capacity, daily_operating_cost, active } = body;

    const existing = await query('SELECT * FROM production_resources WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }

    await query(
      `UPDATE production_resources
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           daily_capacity = COALESCE($3, daily_capacity),
           daily_operating_cost = COALESCE($4, daily_operating_cost),
           active = COALESCE($5, active),
           updated_at = NOW()
       WHERE id = $6`,
      [name, location, daily_capacity, daily_operating_cost, active, id]
    );

    const updated = await query('SELECT * FROM production_resources WHERE id = $1', [id]);
    await logAuditEvent({
      eventType: 'ENTITY_UPDATE',
      targetEntity: 'production_resources',
      targetId: id,
      details: `Updated facility ${updated[0].name}`,
      beforeState: existing[0],
      afterState: updated[0],
    });

    return NextResponse.json({ facility: updated[0] });
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
    await query('UPDATE production_resources SET active = false, updated_at = NOW() WHERE id = $1', [id]);
    await logAuditEvent({
      eventType: 'ENTITY_DEACTIVATE',
      targetEntity: 'production_resources',
      targetId: id,
      details: `Deactivated facility ${id}`,
    });
    return NextResponse.json({ message: 'Facility deactivated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
