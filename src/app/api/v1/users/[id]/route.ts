import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { role, active } = body;

    const existing = await query('SELECT * FROM app_users WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const beforeState = existing[0];

    if (role && !['ADMIN', 'PLANNER', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be ADMIN, PLANNER, or VIEWER' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE app_users
       SET role = COALESCE($1, role),
           active = COALESCE($2, active),
           last_active_at = NOW()
       WHERE id = $3`,
      [role, active, id]
    );

    const updated = await query('SELECT * FROM app_users WHERE id = $1', [id]);

    await logAuditEvent({
      eventType: 'USER_ROLE_ASSIGNMENT',
      targetEntity: 'app_users',
      targetId: id,
      details: `Modified access permissions for ${beforeState.name} (${beforeState.email}): role set to ${updated[0].role}, active: ${updated[0].active}`,
      beforeState,
      afterState: updated[0],
    });

    return NextResponse.json({ user: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
