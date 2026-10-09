import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';

    let sqlText = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sqlText += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
    }

    if (type) {
      params.push(type);
      sqlText += ` AND type = $${params.length}`;
    }

    sqlText += ' ORDER BY sku ASC';

    const products = await query(sqlText, params);

    // Also fetch BOM references
    const boms = await query('SELECT * FROM bill_of_materials');

    const enriched = products.map((p: any) => ({
      ...p,
      asParentBom: boms.filter((b: any) => b.parent_sku === p.sku),
      asComponentBom: boms.filter((b: any) => b.component_sku === p.sku),
    }));

    return NextResponse.json({ products: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, name, type, uom = 'units', standard_cost = 0, active = true } = body;

    if (!sku || !name || !type) {
      return NextResponse.json(
        { error: 'SKU, name, and type (COMPONENT or FINISHED_GOOD) are required' },
        { status: 400 }
      );
    }

    const existing = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Product SKU "${sku}" already exists` },
        { status: 409 }
      );
    }

    const id = `prod-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO products (id, sku, name, type, uom, standard_cost, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [id, sku.toUpperCase(), name, type, uom, standard_cost, active]
    );

    await logAuditEvent({
      eventType: 'ENTITY_CREATE',
      targetEntity: 'products',
      targetId: id,
      details: `Created product SKU ${sku} (${name}) as ${type}`,
      afterState: { id, sku, name, type, uom, standard_cost, active },
    });

    const created = await query('SELECT * FROM products WHERE id = $1', [id]);
    return NextResponse.json({ product: created[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create product', details: error.message },
      { status: 500 }
    );
  }
}
