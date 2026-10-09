import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const products = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const product = products[0];

    const [boms, suppliers, inventory] = await Promise.all([
      query(
        'SELECT * FROM bill_of_materials WHERE parent_sku = $1 OR component_sku = $1',
        [product.sku]
      ),
      query(
        `SELECT sp.*, s.name as supplier_name, s.code as supplier_code
         FROM supplier_products sp
         JOIN suppliers s ON s.id = sp.supplier_id
         WHERE sp.product_id = $1`,
        [id]
      ),
      query('SELECT * FROM inventory_records WHERE item_sku = $1', [product.sku]),
    ]);

    return NextResponse.json({
      product,
      boms,
      qualifiedSuppliers: suppliers,
      inventoryRecords: inventory,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, standard_cost, active, uom } = body;

    const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const beforeState = existing[0];

    await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           standard_cost = COALESCE($2, standard_cost),
           active = COALESCE($3, active),
           uom = COALESCE($4, uom),
           updated_at = NOW()
       WHERE id = $5`,
      [name, standard_cost, active, uom, id]
    );

    const updated = await query('SELECT * FROM products WHERE id = $1', [id]);

    await logAuditEvent({
      eventType: 'ENTITY_UPDATE',
      targetEntity: 'products',
      targetId: id,
      details: `Updated product SKU ${beforeState.sku} (${beforeState.name})`,
      beforeState,
      afterState: updated[0],
    });

    return NextResponse.json({ product: updated[0] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const product = existing[0];

    const [boms, demand] = await Promise.all([
      query(
        'SELECT * FROM bill_of_materials WHERE parent_sku = $1 OR component_sku = $1',
        [product.sku]
      ),
      query('SELECT * FROM demand_records WHERE product_sku = $1', [product.sku]),
    ]);

    if (boms.length > 0 || demand.length > 0) {
      // Safe deactivation
      await query('UPDATE products SET active = false, updated_at = NOW() WHERE id = $1', [id]);
      await logAuditEvent({
        eventType: 'ENTITY_DEACTIVATE',
        targetEntity: 'products',
        targetId: id,
        details: `Safely deactivated product SKU ${product.sku} (retained for BOM/demand references)`,
        beforeState: product,
        afterState: { ...product, active: false },
      });

      return NextResponse.json({
        message: `Product ${product.sku} safely deactivated. BOM/demand records preserved.`,
        deactivatedId: id,
        dependencies: { boms, demand },
      });
    }

    await query('UPDATE products SET active = false, updated_at = NOW() WHERE id = $1', [id]);
    return NextResponse.json({ message: `Product ${product.sku} deactivated.` });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to deactivate product', details: error.message },
      { status: 500 }
    );
  }
}
