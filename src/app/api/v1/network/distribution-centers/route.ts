import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function GET() {
  try {
    const distributionCenters = await query('SELECT * FROM distribution_centers ORDER BY code ASC');
    return NextResponse.json({ distributionCenters });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, location, service_tier = 'TIER_1_CRITICAL', target_sla_percent = 95 } = body;

    const id = `dc-${Date.now().toString(36)}`;
    await query(
      `INSERT INTO distribution_centers (id, code, name, location, service_tier, target_sla_percent, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
      [id, code.toUpperCase(), name, location, service_tier, target_sla_percent]
    );

    await logAuditEvent({
      eventType: 'ENTITY_CREATE',
      targetEntity: 'distribution_centers',
      targetId: id,
      details: `Created distribution center ${code} (${name}) with SLA ${target_sla_percent}%`,
    });

    const created = await query('SELECT * FROM distribution_centers WHERE id = $1', [id]);
    return NextResponse.json({ distributionCenter: created[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
