import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET() {
  try {
    const inventory = await query(`
      SELECT i.*, p.name as item_name, p.type as item_type, p.uom,
             COALESCE(pr.name, dc.name) as node_name
      FROM inventory_records i
      LEFT JOIN products p ON p.sku = i.item_sku
      LEFT JOIN production_resources pr ON pr.id = i.node_id
      LEFT JOIN distribution_centers dc ON dc.id = i.node_id
      ORDER BY i.item_sku ASC
    `);
    return NextResponse.json({ inventory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, on_hand_units, reserved_units, safety_stock_target } = body;

    const existing = await query('SELECT * FROM inventory_records WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }

    if (on_hand_units < 0) {
      return NextResponse.json(
        { error: 'Physical inventory cannot be negative (Hard Conservation Constraint)' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE inventory_records
       SET on_hand_units = COALESCE($1, on_hand_units),
           reserved_units = COALESCE($2, reserved_units),
           safety_stock_target = COALESCE($3, safety_stock_target)
       WHERE id = $4`,
      [on_hand_units, reserved_units, safety_stock_target, id]
    );

    const updated = await query('SELECT * FROM inventory_records WHERE id = $1', [id]);
    await logAuditEvent({
      eventType: 'ENTITY_UPDATE',
      targetEntity: 'inventory_records',
      targetId: id,
      details: `Adjusted inventory on SKU ${existing[0].item_sku} at node ${existing[0].node_id} to ${on_hand_units} units`,
      beforeState: existing[0],
      afterState: updated[0],
    });

    return NextResponse.json({ record: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
