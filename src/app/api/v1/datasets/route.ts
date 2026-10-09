import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const versions = await query(
      'SELECT * FROM dataset_versions ORDER BY imported_at DESC'
    );
    const activeVersion = versions.find((v: any) => v.status === 'ACTIVE') || versions[0] || null;

    return NextResponse.json({
      activeVersion,
      versions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
