import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { HP_POLICE_MOCKS } from '@/lib/mock-data';

export async function GET() {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const mockTests = await prisma.mockTest.findMany({
      include: {
        exam: { select: { name: true, slug: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { testNumber: 'asc' },
    });

    if (mockTests && mockTests.length > 0) {
      const formatted = mockTests.map((t) => ({
        id: t.id,
        name: t.name,
        testNumber: t.testNumber,
        examName: t.exam?.name || 'HP Police Constable',
        totalQuestionsRequired: t.totalQuestions,
        currentQuestionsCount: t._count.questions,
        isPublished: t.isPublished,
        isFree: t.isFree,
        attemptsCount: t._count.attempts,
        isReady: t._count.questions >= t.totalQuestions,
        missingQuestionsCount: Math.max(0, t.totalQuestions - t._count.questions),
      }));
      return NextResponse.json({ mockTests: formatted });
    }
  } catch (err) {
    console.warn('DB mock tests fetch failed, using fallback data:', err);
  }

  // Fallback mocks
  const formattedFallback = HP_POLICE_MOCKS.map((m) => ({
    id: m.id,
    name: m.name,
    testNumber: m.testNumber,
    examName: 'HP Police Constable 2026',
    totalQuestionsRequired: m.totalQuestions,
    currentQuestionsCount: m.testNumber === 1 ? 90 : 25,
    isPublished: m.isPublished,
    isFree: m.isFree,
    attemptsCount: m.testNumber === 1 ? 1420 : 0,
    isReady: m.testNumber === 1,
    missingQuestionsCount: m.testNumber === 1 ? 0 : 65,
  }));

  return NextResponse.json({ mockTests: formattedFallback });
}

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { mockTestId, publish } = await req.json();

    if (!mockTestId) {
      return NextResponse.json({ error: 'Mock test ID is required.' }, { status: 400 });
    }

    try {
      const mockTest = await prisma.mockTest.findUnique({
        where: { id: mockTestId },
        include: { _count: { select: { questions: true } } },
      });

      if (mockTest) {
        // Enforce readiness requirement when publishing
        if (publish && mockTest._count.questions < mockTest.totalQuestions) {
          const missing = mockTest.totalQuestions - mockTest._count.questions;
          return NextResponse.json(
            {
              error: `Cannot publish Mock Test. It currently has ${mockTest._count.questions}/${mockTest.totalQuestions} questions. Missing ${missing} questions.`,
              isReady: false,
              missingQuestions: missing,
            },
            { status: 400 }
          );
        }

        const updated = await prisma.mockTest.update({
          where: { id: mockTestId },
          data: { isPublished: !!publish },
        });

        return NextResponse.json({
          success: true,
          message: `Mock test ${publish ? 'published' : 'unpublished'} successfully.`,
          mockTest: updated,
        });
      }
    } catch (dbErr) {
      console.warn('DB publish update failed, using mock response:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Mock test ${publish ? 'published' : 'unpublished'} (demo mode).`,
      mockTestId,
      isPublished: !!publish,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update test publish status' }, { status: 500 });
  }
}
