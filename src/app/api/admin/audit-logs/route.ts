import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAuditLogs } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const logs = await getAuditLogs();
  return NextResponse.json({ logs });
}
