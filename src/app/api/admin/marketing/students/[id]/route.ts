import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { whatsappConsent } = body;

    if (typeof whatsappConsent !== 'boolean') {
      return NextResponse.json({ error: 'whatsappConsent must be a boolean' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { whatsappConsent },
      select: { id: true, name: true, email: true, phone: true, whatsappConsent: true },
    });

    await recordAuditLog(
      'UPDATE_WHATSAPP_CONSENT',
      `Admin updated WhatsApp consent for student ${updated.email} (${updated.phone || 'no phone'}) to ${whatsappConsent ? 'OPTED_IN' : 'OPTED_OUT'}`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      message: `WhatsApp consent updated to ${whatsappConsent ? 'Opted In' : 'Opted Out'}`,
      user: updated,
    });
  } catch (err: any) {
    console.error('Error updating student consent:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
