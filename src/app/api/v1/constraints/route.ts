import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET() {
  try {
    const constraints = await query(
      'SELECT * FROM constraint_configurations ORDER BY hard_constraint DESC, category ASC'
    );
    return NextResponse.json({ constraints });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, hard_constraint = true, value, unit, description } = body;

    if (!name || value === undefined || !unit) {
      return NextResponse.json(
        { error: 'Name, value, and unit are required' },
        { status: 400 }
      );
    }

    const id = `c-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO constraint_configurations (id, name, category, hard_constraint, value, unit, description, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, name, category, hard_constraint, value, unit, description]
    );

    await logAuditEvent({
      eventType: 'CONSTRAINT_CONFIG',
      targetEntity: 'constraint_configurations',
      targetId: id,
      details: `Added new ${hard_constraint ? 'HARD' : 'SOFT'} constraint rule "${name}" (${value} ${unit})`,
    });

    const created = await query('SELECT * FROM constraint_configurations WHERE id = $1', [id]);
    return NextResponse.json({ constraint: created[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
