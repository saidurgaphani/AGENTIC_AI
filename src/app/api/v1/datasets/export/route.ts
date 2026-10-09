import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [products, suppliers, facilities, dcs, lanes, boms, inventory, demand, versions] =
      await Promise.all([
        query('SELECT * FROM products ORDER BY sku ASC'),
        query('SELECT * FROM suppliers ORDER BY code ASC'),
        query('SELECT * FROM production_resources ORDER BY id ASC'),
        query('SELECT * FROM distribution_centers ORDER BY code ASC'),
        query('SELECT * FROM transport_lanes ORDER BY id ASC'),
        query('SELECT * FROM bill_of_materials ORDER BY parent_sku ASC'),
        query('SELECT * FROM inventory_records ORDER BY item_sku ASC'),
        query('SELECT * FROM demand_records ORDER BY period_day ASC'),
        query('SELECT * FROM dataset_versions ORDER BY imported_at DESC LIMIT 1'),
      ]);

    const exportPayload = {
      manifest: {
        exportedAt: new Date().toISOString(),
        version: versions[0]?.version || '1.0.0-canonical',
        seed: versions[0]?.seed || 'SEED_2026_SCM_V1',
        system: 'AI Agents for Resilient Supply Chain Manufacturing',
      },
      data: {
        products,
        suppliers,
        productionResources: facilities,
        distributionCenters: dcs,
        transportLanes: lanes,
        billOfMaterials: boms,
        inventoryRecords: inventory,
        demandRecords: demand,
      },
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="supply-chain-canonical-export.json"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
