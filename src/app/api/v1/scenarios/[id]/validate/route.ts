import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenarios = await query('SELECT * FROM scenarios WHERE id = $1', [id]);
    if (scenarios.length === 0) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }
    const scenario = scenarios[0];

    const validations: {
      check: string;
      status: 'PASS' | 'FAIL' | 'WARN';
      details: string;
    }[] = [];

    // 1. Supplier Exists & Active
    const suppliers = await query('SELECT * FROM suppliers WHERE id = $1', [
      scenario.critical_supplier_id,
    ]);
    if (suppliers.length === 0) {
      validations.push({
        check: 'Supplier Authoritative Existence',
        status: 'FAIL',
        details: `Supplier ID ${scenario.critical_supplier_id} does not exist in master records.`,
      });
    } else if (!suppliers[0].active) {
      validations.push({
        check: 'Supplier Active State',
        status: 'FAIL',
        details: `Supplier ${suppliers[0].code} (${suppliers[0].name}) is currently inactive.`,
      });
    } else {
      validations.push({
        check: 'Supplier Authoritative Existence & Active State',
        status: 'PASS',
        details: `Connected to active supplier ${suppliers[0].code} (${suppliers[0].name}).`,
      });
    }

    // 2. Component linkage in BOM
    const contracts = await query(
      `SELECT sp.*, p.sku as product_sku, p.name as product_name
       FROM supplier_products sp
       JOIN products p ON p.id = sp.product_id
       WHERE sp.supplier_id = $1`,
      [scenario.critical_supplier_id]
    );

    if (contracts.length === 0) {
      validations.push({
        check: 'Supplier-Product Contract Linkage',
        status: 'FAIL',
        details: 'Supplier does not have any qualified component supply contracts.',
      });
    } else {
      const skus = contracts.map((c: any) => c.product_sku).join(', ');
      validations.push({
        check: 'Supplier-Product Contract Linkage',
        status: 'PASS',
        details: `Qualified for component supply: ${skus}.`,
      });
    }

    // 3. Transport Lanes to Assembly Plant
    const lanes = await query(
      'SELECT * FROM transport_lanes WHERE origin_id = $1 AND active = true',
      [scenario.critical_supplier_id]
    );

    if (lanes.length === 0) {
      validations.push({
        check: 'Inbound Transport Route Viability',
        status: 'FAIL',
        details: 'No active transport lanes connect this supplier to assembly facilities.',
      });
    } else {
      validations.push({
        check: 'Inbound Transport Route Viability',
        status: 'PASS',
        details: `${lanes.length} active transportation lane(s) routed to plants.`,
      });
    }

    // 4. Seven-Day Disruption Duration Compliance
    if (scenario.disruption_duration_days === 7) {
      validations.push({
        check: 'POC 7-Day Outage Window Requirement',
        status: 'PASS',
        details: 'Disruption duration calibrated exactly to mandatory 7-day outage.',
      });
    } else {
      validations.push({
        check: 'POC 7-Day Outage Window Requirement',
        status: 'WARN',
        details: `Duration is set to ${scenario.disruption_duration_days} days (PRD canonical standard is 7 days).`,
      });
    }

    // 5. Horizon coverage
    if (scenario.evaluation_horizon_days >= scenario.disruption_start_day + scenario.disruption_duration_days) {
      validations.push({
        check: 'Simulation Evaluation Horizon Coverage',
        status: 'PASS',
        details: `14-day evaluation window sufficiently covers Day ${scenario.disruption_start_day} through Day ${
          scenario.disruption_start_day + scenario.disruption_duration_days - 1
        }.`,
      });
    } else {
      validations.push({
        check: 'Simulation Evaluation Horizon Coverage',
        status: 'FAIL',
        details: 'Planning horizon terminates before disruption recovery window finishes.',
      });
    }

    const isValid = validations.every((v) => v.status !== 'FAIL');

    return NextResponse.json({
      valid: isValid,
      scenarioId: id,
      supplier: suppliers[0] || null,
      validations,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
