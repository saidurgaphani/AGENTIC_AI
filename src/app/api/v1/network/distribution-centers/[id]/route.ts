import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, location, service_tier, target_sla_percent, active } = body;

    const existing = await query('SELECT * FROM distribution_centers WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'DC not found' }, { status: 404 });
    }

    await query(
      `UPDATE distribution_centers
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           service_tier = COALESCE($3, service_tier),
           target_sla_percent = COALESCE($4, target_sla_percent),
           active = COALESCE($5, active),
           updated_at = NOW()
       WHERE id = $6`,
      [name, location, service_tier, target_sla_percent, active, id]
    );

    const updated = await query('SELECT * FROM distribution_centers WHERE id = $1', [id]);
    await logAuditEvent({
      eventType: 'ENTITY_UPDATE',
      targetEntity: 'distribution_centers',
      targetId: id,
      details: `Updated distribution center ${updated[0].code}`,
      beforeState: existing[0],
      afterState: updated[0],
    });

    return NextResponse.json({ distributionCenter: updated[0] });
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
    await query('UPDATE distribution_centers SET active = false, updated_at = NOW() WHERE id = $1', [id]);
    await logAuditEvent({
      eventType: 'ENTITY_DEACTIVATE',
      targetEntity: 'distribution_centers',
      targetId: id,
      details: `Deactivated distribution center ${id}`,
    });
    return NextResponse.json({ message: 'DC deactivated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
