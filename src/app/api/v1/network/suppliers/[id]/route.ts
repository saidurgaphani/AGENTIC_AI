import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suppliers = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (suppliers.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const contracts = await query(
      `SELECT sp.*, p.sku as product_sku, p.name as product_name
       FROM supplier_products sp
       JOIN products p ON p.id = sp.product_id
       WHERE sp.supplier_id = $1`,
      [id]
    );

    const lanes = await query(
      `SELECT * FROM transport_lanes WHERE origin_id = $1`,
      [id]
    );

    return NextResponse.json({
      supplier: suppliers[0],
      contracts,
      transportLanes: lanes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch supplier', details: error.message },
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
    const { name, location, criticality, active, disrupted } = body;

    const existing = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    const beforeState = existing[0];

    await query(
      `UPDATE suppliers
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           criticality = COALESCE($3, criticality),
           active = COALESCE($4, active),
           disrupted = COALESCE($5, disrupted),
           updated_at = NOW()
       WHERE id = $6`,
      [name, location, criticality, active, disrupted, id]
    );

    const updated = await query('SELECT * FROM suppliers WHERE id = $1', [id]);

    await logAuditEvent({
      eventType: 'ENTITY_UPDATE',
      targetEntity: 'suppliers',
      targetId: id,
      details: `Updated supplier ${beforeState.code} (${beforeState.name})`,
      beforeState,
      afterState: updated[0],
    });

    return NextResponse.json({ supplier: updated[0] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update supplier', details: error.message },
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
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    const existing = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    const supplier = existing[0];

    // Check active dependencies
    const [scenarios, lanes, contracts] = await Promise.all([
      query('SELECT id, name FROM scenarios WHERE critical_supplier_id = $1', [id]),
      query('SELECT id FROM transport_lanes WHERE origin_id = $1', [id]),
      query('SELECT id FROM supplier_products WHERE supplier_id = $1', [id]),
    ]);

    const dependencies = {
      activeScenarios: scenarios,
      transportLanes: lanes,
      supplierContracts: contracts,
    };

    if (scenarios.length > 0 && !force) {
      return NextResponse.json(
        {
          error: `Cannot hard delete supplier ${supplier.code}: Referenced by ${scenarios.length} disruption scenario(s).`,
          recommendation: 'Perform safe deactivation instead to preserve historical reproducibility.',
          dependencies,
          canSafeDeactivate: true,
        },
        { status: 409 }
      );
    }

    // Safe deactivation is preferred to preserve historical simulation integrity
    await query(
      'UPDATE suppliers SET active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );

    await logAuditEvent({
      eventType: 'ENTITY_DEACTIVATE',
      targetEntity: 'suppliers',
      targetId: id,
      details: `Safely deactivated supplier ${supplier.code} (${supplier.name}) to protect historical runs`,
      beforeState: supplier,
      afterState: { ...supplier, active: false },
    });

    return NextResponse.json({
      message: `Supplier ${supplier.code} safely deactivated. Historical scenario references preserved.`,
      deactivatedId: id,
      dependencies,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to deactivate supplier', details: error.message },
      { status: 500 }
    );
  }
}
