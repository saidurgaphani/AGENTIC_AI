import { neon } from '@neondatabase/serverless';

function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_vtEwXLAKx38T@ep-ancient-recipe-b4j9aoij-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require'
  );
}

export function getDb() {
  const connectionString = getDatabaseUrl();
  return neon(connectionString);
}

export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const sql = getDb();
  return (sql as any).query(queryText, params);
}

export async function logAuditEvent({
  actor = 'admin@sc-resilience.io',
  role = 'ADMIN',
  eventType,
  targetEntity,
  targetId,
  details,
  beforeState = null,
  afterState = null,
}: {
  actor?: string;
  role?: string;
  eventType: string;
  targetEntity: string;
  targetId: string;
  details: string;
  beforeState?: any;
  afterState?: any;
}) {
  try {
    const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await query(
      `INSERT INTO audit_events (id, actor, role, event_type, target_entity, target_id, details, before_state, after_state, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        id,
        actor,
        role,
        eventType,
        targetEntity,
        targetId,
        details,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
      ]
    );
    return id;
  } catch (err) {
    console.error('Failed to log audit event:', err);
    return null;
  }
}
