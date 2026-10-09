import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { value, hard_constraint, description, reason } = body;

    const existing = await query('SELECT * FROM constraint_configurations WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Constraint not found' }, { status: 404 });
    }
    const beforeState = existing[0];

    // Validation checks
    const numVal = parseFloat(value);
    if (isNaN(numVal)) {
      return NextResponse.json({ error: 'Value must be a valid number' }, { status: 400 });
    }

    if (beforeState.unit.includes('%') && (numVal < 0 || numVal > 100)) {
      return NextResponse.json(
        { error: 'Percentage constraints must be bounded between 0% and 100%' },
        { status: 400 }
      );
    }

    if (numVal < 0 && beforeState.category !== 'OBJECTIVE_DELTA') {
      return NextResponse.json(
        { error: 'Capacity, inventory balance, and cost constraints cannot be negative' },
        { status: 400 }
      );
    }

    // Changing a hard constraint to soft requires justification
    if (beforeState.hard_constraint === true && hard_constraint === false) {
      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          {
            error:
              'Downgrading a hard physical constraint to an optional preference requires an explicit administrative justification (minimum 10 characters).',
          },
          { status: 400 }
        );
      }
    }

    await query(
      `UPDATE constraint_configurations
       SET value = COALESCE($1, value),
           hard_constraint = COALESCE($2, hard_constraint),
           description = COALESCE($3, description),
           updated_at = NOW()
       WHERE id = $4`,
      [numVal, hard_constraint, description, id]
    );

    const updated = await query('SELECT * FROM constraint_configurations WHERE id = $1', [id]);

    await logAuditEvent({
      eventType: 'CONSTRAINT_CONFIG',
      targetEntity: 'constraint_configurations',
      targetId: id,
      details: `Modified constraint "${beforeState.name}" from ${beforeState.value} ${beforeState.unit} to ${numVal} ${beforeState.unit}. Hard: ${hard_constraint}. Reason: ${reason || 'Operational parameter adjustment'}`,
      beforeState,
      afterState: updated[0],
    });

    return NextResponse.json({ constraint: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
