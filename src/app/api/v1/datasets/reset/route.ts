import { NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function POST() {
  try {
    // Reset products, suppliers, inventory to canonical
    await query(`
      UPDATE suppliers SET active = true, disrupted = (code = 'SUP-01');
      UPDATE products SET active = true;
      UPDATE production_resources SET active = true, daily_capacity = 300;
      UPDATE distribution_centers SET active = true;
      UPDATE transport_lanes SET active = true;
      UPDATE inventory_records SET on_hand_units = 600 WHERE item_sku = 'CMP-101' AND node_id = 'plant-01';
      UPDATE scenarios 
      SET disruption_start_day = 4, 
          disruption_duration_days = 7, 
          critical_supplier_id = 'sup-01',
          daily_demand_units = 200,
          updated_at = NOW()
      WHERE id = 'SCN-2026-SHUTDOWN-07D';
    `);

    await logAuditEvent({
      eventType: 'DATASET_IMPORT',
      targetEntity: 'dataset_versions',
      targetId: 'ver-canonical-01',
      details: 'Reset system state to SEED_2026_SCM_V1 canonical baseline parameters.',
    });

    return NextResponse.json({
      success: true,
      message: 'Dataset and operational state restored to SEED_2026_SCM_V1 canonical baseline.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
