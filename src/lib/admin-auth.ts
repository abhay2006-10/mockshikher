import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export interface AdminSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'ADMIN';
}

/**
 * Server-side authorization check for Admin API routes.
 * Strictly verifies that the authenticated user has role ADMIN in the PostgreSQL database.
 */
export async function requireAdmin(): Promise<{ user: AdminSessionUser } | NextResponse> {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  let dbUser = null;
  if (userId) {
    dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
  } else if (userEmail) {
    dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  if (!dbUser || dbUser.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden. Admin privileges required.' },
      { status: 403 }
    );
  }

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: 'ADMIN',
    },
  };
}
