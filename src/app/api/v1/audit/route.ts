import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType') || '';
    const targetEntity = searchParams.get('targetEntity') || '';
    const actor = searchParams.get('actor') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let sqlText = 'SELECT * FROM audit_events WHERE 1=1';
    const params: any[] = [];

    if (eventType) {
      params.push(eventType);
      sqlText += ` AND event_type = $${params.length}`;
    }

    if (targetEntity) {
      params.push(targetEntity);
      sqlText += ` AND target_entity = $${params.length}`;
    }

    if (actor) {
      params.push(`%${actor}%`);
      sqlText += ` AND actor ILIKE $${params.length}`;
    }

    params.push(limit);
    sqlText += ` ORDER BY timestamp DESC LIMIT $${params.length}`;

    const events = await query(sqlText, params);

    return NextResponse.json({
      count: events.length,
      events,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
