import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { generateTemplateCsv } from '@/lib/question-importer';

export async function GET() {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const csvContent = generateTemplateCsv();

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mockshikhar_questions_template.csv"',
    },
  });
}
