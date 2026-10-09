import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [products, suppliers, facilities, dcs, lanes, boms, inventory, demand] =
      await Promise.all([
        query('SELECT * FROM products ORDER BY sku ASC'),
        query('SELECT * FROM suppliers ORDER BY code ASC'),
        query('SELECT * FROM production_resources ORDER BY id ASC'),
        query('SELECT * FROM distribution_centers ORDER BY code ASC'),
        query('SELECT * FROM transport_lanes ORDER BY id ASC'),
        query('SELECT * FROM bill_of_materials ORDER BY parent_sku ASC'),
        query('SELECT * FROM inventory_records ORDER BY item_sku ASC'),
        query('SELECT * FROM demand_records ORDER BY period_day ASC'),
      ]);

    return NextResponse.json({
      summary: {
        productsCount: products.length,
        suppliersCount: suppliers.length,
        facilitiesCount: facilities.length,
        distributionCentersCount: dcs.length,
        transportLanesCount: lanes.length,
        bomEntriesCount: boms.length,
        inventoryRecordsCount: inventory.length,
        demandRecordsCount: demand.length,
      },
      products,
      suppliers,
      facilities,
      distributionCenters: dcs,
      transportLanes: lanes,
      billOfMaterials: boms,
      inventory,
      demand,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch network summary', details: error.message },
      { status: 500 }
    );
  }
}
