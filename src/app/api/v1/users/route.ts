import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET() {
  try {
    const users = await query('SELECT * FROM app_users ORDER BY created_at ASC');
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, role = 'PLANNER' } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const existing = await query('SELECT id FROM app_users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `User with email "${email}" already exists` },
        { status: 409 }
      );
    }

    const id = `usr-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO app_users (id, email, name, role, active, created_at, last_active_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
      [id, email, name, role]
    );

    await logAuditEvent({
      eventType: 'USER_ROLE_ASSIGNMENT',
      targetEntity: 'app_users',
      targetId: id,
      details: `Created new user ${name} (${email}) with role ${role}`,
      afterState: { id, email, name, role },
    });

    const created = await query('SELECT * FROM app_users WHERE id = $1', [id]);
    return NextResponse.json({ user: created[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
