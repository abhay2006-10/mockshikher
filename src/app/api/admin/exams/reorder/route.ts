import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getCustomExamOrder, saveCustomExamOrder } from '@/lib/exam-order';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const orderedSlugs = await getCustomExamOrder();
    return NextResponse.json({ success: true, orderedSlugs });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get exam order' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;
  const adminEmail = authRes.user.email || 'Admin';

  try {
    const body = await req.json().catch(() => ({}));
    const { orderedSlugs } = body;

    if (!Array.isArray(orderedSlugs) || orderedSlugs.length === 0) {
      return NextResponse.json(
        { error: 'orderedSlugs must be a non-empty array of exam slugs' },
        { status: 400 }
      );
    }

    await saveCustomExamOrder(orderedSlugs, adminEmail);

    return NextResponse.json({
      success: true,
      message: 'Exam bundle display order updated successfully',
      orderedSlugs,
    });
  } catch (error: any) {
    console.error('Error updating exam order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save exam order' },
      { status: 500 }
    );
  }
}
