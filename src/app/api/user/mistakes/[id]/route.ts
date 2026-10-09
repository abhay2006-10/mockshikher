import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const mistake = await prisma.mistakeBook.findUnique({
      where: { id },
    });

    if (!mistake || mistake.userId !== session.user.id) {
      return NextResponse.json({ error: 'Mistake record not found or access denied' }, { status: 404 });
    }

    const updated = await prisma.mistakeBook.update({
      where: { id },
      data: {
        isMastered: body.isMastered !== undefined ? body.isMastered : !mistake.isMastered,
      },
    });

    return NextResponse.json({ success: true, mistake: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update mistake' }, { status: 500 });
  }
}
