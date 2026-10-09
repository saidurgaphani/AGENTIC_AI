import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    const { entityType, entityId } = await params;
    const dependencies: any = {
      entityType,
      entityId,
      canDeleteSafely: true,
      warnings: [],
      references: {},
    };

    if (entityType === 'supplier') {
      const [scenarios, lanes, contracts] = await Promise.all([
        query('SELECT id, name FROM scenarios WHERE critical_supplier_id = $1', [entityId]),
        query('SELECT id, mode, origin_id, destination_id FROM transport_lanes WHERE origin_id = $1', [entityId]),
        query(
          `SELECT sp.*, p.sku as product_sku, p.name as product_name
           FROM supplier_products sp
           JOIN products p ON p.id = sp.product_id
           WHERE sp.supplier_id = $1`,
          [entityId]
        ),
      ]);

      dependencies.references.activeScenarios = scenarios;
      dependencies.references.transportLanes = lanes;
      dependencies.references.supplierContracts = contracts;

      if (scenarios.length > 0) {
        dependencies.canDeleteSafely = false;
        dependencies.warnings.push(
          `Referenced as critical supplier in ${scenarios.length} active disruption scenario(s).`
        );
      }
      if (contracts.length > 0) {
        dependencies.warnings.push(
          `Has ${contracts.length} active supply contract(s) providing components.`
        );
      }
      if (lanes.length > 0) {
        dependencies.warnings.push(
          `Connects to ${lanes.length} inbound transport lane(s).`
        );
      }
    } else if (entityType === 'product') {
      // Find SKU first
      const prods = await query('SELECT sku FROM products WHERE id = $1', [entityId]);
      const sku = prods[0]?.sku || entityId;

      const [parentBoms, componentBoms, contracts, inventory, demand] = await Promise.all([
        query('SELECT * FROM bill_of_materials WHERE parent_sku = $1', [sku]),
        query('SELECT * FROM bill_of_materials WHERE component_sku = $1', [sku]),
        query('SELECT * FROM supplier_products WHERE product_id = $1', [entityId]),
        query('SELECT * FROM inventory_records WHERE item_sku = $1', [sku]),
        query('SELECT * FROM demand_records WHERE product_sku = $1', [sku]),
      ]);

      dependencies.references.asParentInBoms = parentBoms;
      dependencies.references.asComponentInBoms = componentBoms;
      dependencies.references.supplierContracts = contracts;
      dependencies.references.inventoryRecords = inventory;
      dependencies.references.demandRecords = demand;

      if (componentBoms.length > 0 || parentBoms.length > 0) {
        dependencies.canDeleteSafely = false;
        dependencies.warnings.push('Part of active Bill-of-Materials hierarchy.');
      }
      if (demand.length > 0) {
        dependencies.warnings.push(`Has ${demand.length} downstream customer demand order(s).`);
      }
    } else if (entityType === 'facility') {
      const [lanes, inventory] = await Promise.all([
        query(
          'SELECT * FROM transport_lanes WHERE origin_id = $1 OR destination_id = $1',
          [entityId]
        ),
        query('SELECT * FROM inventory_records WHERE node_id = $1', [entityId]),
      ]);

      dependencies.references.transportLanes = lanes;
      dependencies.references.inventoryRecords = inventory;
      if (lanes.length > 0) {
        dependencies.warnings.push(`Linked to ${lanes.length} transport inbound/outbound lanes.`);
      }
    } else if (entityType === 'dc') {
      const [lanes, demand, inventory] = await Promise.all([
        query('SELECT * FROM transport_lanes WHERE destination_id = $1', [entityId]),
        query('SELECT * FROM demand_records WHERE destination_id = $1', [entityId]),
        query('SELECT * FROM inventory_records WHERE node_id = $1', [entityId]),
      ]);

      dependencies.references.inboundLanes = lanes;
      dependencies.references.demandRecords = demand;
      dependencies.references.inventoryRecords = inventory;
      if (demand.length > 0) {
        dependencies.canDeleteSafely = false;
        dependencies.warnings.push(`Has ${demand.length} customer order fulfillment allocations.`);
      }
    }

    return NextResponse.json(dependencies);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
