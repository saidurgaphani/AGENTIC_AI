import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const users = await query<any>('SELECT * FROM app_users WHERE email = $1 LIMIT 1', [
      'admin@sc-resilience.io',
    ]);
    if (users.length > 0) {
      return NextResponse.json({
        user: users[0],
        permissions: {
          canManageDataset: users[0].role === 'ADMIN',
          canConfigureDisruption: users[0].role === 'ADMIN' || users[0].role === 'PLANNER',
          canModifyConstraints: users[0].role === 'ADMIN',
          canManageAgents: users[0].role === 'ADMIN',
          canManageUsers: users[0].role === 'ADMIN',
          canApprovePlans: users[0].role === 'ADMIN' || users[0].role === 'PLANNER',
        },
      });
    }

    return NextResponse.json({
      user: {
        id: 'usr-01',
        email: 'admin@sc-resilience.io',
        name: 'Chief Supply Chain Administrator',
        role: 'ADMIN',
        active: true,
      },
      permissions: {
        canManageDataset: true,
        canConfigureDisruption: true,
        canModifyConstraints: true,
        canManageAgents: true,
        canManageUsers: true,
        canApprovePlans: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch user identity', details: error.message },
      { status: 500 }
    );
  }
}
