import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const criticality = searchParams.get('criticality') || '';
    const active = searchParams.get('active');

    let sqlText = 'SELECT * FROM suppliers WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sqlText += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR location ILIKE $${params.length})`;
    }

    if (criticality) {
      params.push(criticality);
      sqlText += ` AND criticality = $${params.length}`;
    }

    if (active !== null && active !== undefined && active !== '') {
      params.push(active === 'true');
      sqlText += ` AND active = $${params.length}`;
    }

    sqlText += ' ORDER BY code ASC';

    const suppliers = await query(sqlText, params);

    // Also fetch associated supplier_products for enriched views
    const supplierProducts = await query(
      `SELECT sp.*, p.sku as product_sku, p.name as product_name
       FROM supplier_products sp
       JOIN products p ON p.id = sp.product_id`
    );

    const enriched = suppliers.map((s: any) => ({
      ...s,
      products: supplierProducts.filter((sp: any) => sp.supplier_id === s.id),
    }));

    return NextResponse.json({ suppliers: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch suppliers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, location, criticality = 'SECONDARY', active = true, disrupted = false } = body;

    if (!code || !name || !location) {
      return NextResponse.json(
        { error: 'Code, name, and location are required fields' },
        { status: 400 }
      );
    }

    // Check duplicate code
    const existing = await query('SELECT id FROM suppliers WHERE code = $1', [code]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Supplier with code "${code}" already exists` },
        { status: 409 }
      );
    }

    const id = `sup-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO suppliers (id, code, name, location, criticality, active, disrupted, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [id, code.toUpperCase(), name, location, criticality, active, disrupted]
    );

    await logAuditEvent({
      eventType: 'ENTITY_CREATE',
      targetEntity: 'suppliers',
      targetId: id,
      details: `Created supplier ${code} (${name}) with criticality ${criticality}`,
      afterState: { id, code, name, location, criticality, active, disrupted },
    });

    const created = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
    return NextResponse.json({ supplier: created[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create supplier', details: error.message },
      { status: 500 }
    );
  }
}
