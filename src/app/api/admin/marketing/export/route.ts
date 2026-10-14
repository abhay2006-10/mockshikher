import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'opted_in'; // 'opted_in' or 'all'

    const whereClause: any = {
      role: 'USER',
      phone: { not: null },
    };

    if (filter === 'opted_in') {
      whereClause.whatsappConsent = true;
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappConsent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Helper to escape CSV values
    const escapeCsv = (val: string | null | undefined) => {
      if (!val) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = ['Student Name', 'Mobile Number', 'Email', 'WhatsApp Consent', 'Registration Date'].join(',');
    const rows = students.map((s) => {
      const dateStr = s.createdAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return [
        escapeCsv(s.name),
        escapeCsv(s.phone),
        escapeCsv(s.email),
        escapeCsv(s.whatsappConsent ? 'Consented (Opted-in)' : 'Opted-out'),
        escapeCsv(dateStr),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');

    await recordAuditLog(
      'EXPORT_WHATSAPP_NUMBERS',
      `Admin exported ${students.length} student mobile numbers (Filter: ${filter}) for course announcement broadcast`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    const dateSlug = new Date().toISOString().split('T')[0];
    const filename = `mockshikhar_whatsapp_${filter}_${dateSlug}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error exporting student numbers:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to export student numbers' },
      { status: 500 }
    );
  }
}
