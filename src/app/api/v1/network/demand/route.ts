import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET() {
  try {
    const demand = await query(`
      SELECT d.*, p.name as product_name, dc.name as destination_name, dc.service_tier
      FROM demand_records d
      LEFT JOIN products p ON p.sku = d.product_sku
      LEFT JOIN distribution_centers dc ON dc.id = d.destination_id
      ORDER BY d.period_day ASC, d.destination_id ASC
    `);
    return NextResponse.json({ demand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_sku, destination_id, period_day = 1, quantity = 100, service_priority = 'NORMAL' } = body;

    const id = `dem-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO demand_records (id, product_sku, destination_id, period_day, quantity, service_priority)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, product_sku, destination_id, period_day, quantity, service_priority]
    );

    await logAuditEvent({
      eventType: 'ENTITY_CREATE',
      targetEntity: 'demand_records',
      targetId: id,
      details: `Added demand record for ${product_sku} at ${destination_id} (Day ${period_day}, Qty: ${quantity})`,
    });

    const created = await query('SELECT * FROM demand_records WHERE id = $1', [id]);
    return NextResponse.json({ demand: created[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
