import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ agentType: string }> }
) {
  try {
    const { agentType } = await params;
    const body = await req.json();
    const { model, temperature, max_retries, timeout_seconds, parameters, enabled } = body;

    const existing = await query(
      'SELECT * FROM agent_configurations WHERE agent_type = $1',
      [agentType.toUpperCase()]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const beforeState = existing[0];

    // Validate temperature range
    if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
      return NextResponse.json(
        { error: 'Temperature must be between 0.0 and 1.0' },
        { status: 400 }
      );
    }

    // Validate timeout range
    if (timeout_seconds !== undefined && (timeout_seconds < 5 || timeout_seconds > 180)) {
      return NextResponse.json(
        { error: 'Timeout must be between 5 and 180 seconds' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE agent_configurations
       SET model = COALESCE($1, model),
           temperature = COALESCE($2, temperature),
           max_retries = COALESCE($3, max_retries),
           timeout_seconds = COALESCE($4, timeout_seconds),
           parameters = COALESCE($5, parameters),
           enabled = COALESCE($6, enabled),
           updated_at = NOW()
       WHERE agent_type = $7`,
      [
        model,
        temperature,
        max_retries,
        timeout_seconds,
        parameters ? JSON.stringify(parameters) : null,
        enabled,
        agentType.toUpperCase(),
      ]
    );

    const updated = await query(
      'SELECT * FROM agent_configurations WHERE agent_type = $1',
      [agentType.toUpperCase()]
    );

    await logAuditEvent({
      eventType: 'AGENT_UPDATE',
      targetEntity: 'agent_configurations',
      targetId: agentType.toUpperCase(),
      details: `Updated configuration for ${agentType} agent (model: ${updated[0].model}, enabled: ${updated[0].enabled})`,
      beforeState,
      afterState: updated[0],
    });

    return NextResponse.json({ agent: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
