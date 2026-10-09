import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

// In-memory audit log events
const AUDIT_LOGS = [
  {
    id: 'log-1',
    action: 'QUESTION_IMPORT',
    details: 'Bulk imported 25 questions into HP Police Constable Mock 1',
    author: 'Admin (admin@mockshikhar.com)',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'SUCCESS',
  },
  {
    id: 'log-2',
    action: 'MOCK_TEST_STATUS',
    details: 'Published HP Police Constable Mock 1 (90/90 Questions ready)',
    author: 'Admin (admin@mockshikhar.com)',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'SUCCESS',
  },
  {
    id: 'log-3',
    action: 'QUESTION_CREATE',
    details: 'Added bilingual question "Which is the highest peak in HP?" with 4 options',
    author: 'Admin (admin@mockshikhar.com)',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    status: 'SUCCESS',
  },
];

export async function GET() {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  return NextResponse.json({ logs: AUDIT_LOGS });
}
