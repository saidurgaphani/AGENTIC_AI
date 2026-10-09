import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET() {
  try {
    const facilities = await query('SELECT * FROM production_resources ORDER BY id ASC');
    return NextResponse.json({ facilities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, location, produced_sku, daily_capacity = 300, daily_operating_cost = 12500 } = body;

    const id = `plant-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO production_resources (id, name, location, produced_sku, daily_capacity, daily_operating_cost, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
      [id, name, location, produced_sku, daily_capacity, daily_operating_cost]
    );

    await logAuditEvent({
      eventType: 'ENTITY_CREATE',
      targetEntity: 'production_resources',
      targetId: id,
      details: `Created production facility ${name} (${daily_capacity} units/day)`,
    });

    const created = await query('SELECT * FROM production_resources WHERE id = $1', [id]);
    return NextResponse.json({ facility: created[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
