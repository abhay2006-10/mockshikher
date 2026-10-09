import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export interface AdminSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'ADMIN' | 'USER';
}

/**
 * Server-side authorization check for Admin API routes
 * Returns the authenticated admin user or throws/returns a 401/403 response.
 */
export async function requireAdmin(): Promise<{ user: AdminSessionUser } | NextResponse> {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }

  // @ts-expect-error role is on session.user
  const role = session.user.role || (session.user.email?.includes('admin') ? 'ADMIN' : 'USER');

  if (role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden. Admin privileges required.' },
      { status: 403 }
    );
  }

  return {
    user: {
      id: session.user.id || 'admin-user',
      name: session.user.name,
      email: session.user.email,
      role: 'ADMIN',
    },
  };
}
