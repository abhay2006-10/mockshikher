import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const mockTests = await prisma.mockTest.findMany({
      include: {
        exam: { select: { id: true, name: true, slug: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: [{ examId: 'asc' }, { testNumber: 'asc' }],
    });

    // Check invalid questions per mock test
    const formatted = await Promise.all(
      mockTests.map(async (t) => {
        const questionCount = t._count.questions;
        const invalidCount =
          questionCount > 0
            ? await prisma.question.count({
                where: {
                  mockTestId: t.id,
                  OR: [
                    { correctOption: { notIn: ['A', 'B', 'C', 'D'] } },
                    { questionText: '' },
                  ],
                },
              })
            : 0;

        const isReady = questionCount >= 1 && invalidCount === 0;

        return {
          id: t.id,
          name: t.name,
          testNumber: t.testNumber,
          examName: t.exam?.name || 'HP Competitive Exam',
          examSlug: t.exam?.slug,
          currentQuestionsCount: questionCount,
          invalidQuestionsCount: invalidCount,
          isPublished: t.isPublished,
          isFree: t.isFree,
          attemptsCount: t._count.attempts,
          isReady,
        };
      })
    );

    return NextResponse.json({ mockTests: formatted });
  } catch (err: any) {
    console.error('Error fetching mock tests for publishing:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch mock tests from database.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { mockTestId, publish } = body;

    if (!mockTestId) {
      return NextResponse.json({ error: 'mockTestId is required.' }, { status: 400 });
    }

    const mockTest = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        exam: true,
        _count: { select: { questions: true } },
      },
    });

    if (!mockTest) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

    const questionCount = mockTest._count.questions;

    // Enforce publication checks when publishing
    if (publish) {
      if (questionCount === 0) {
        return NextResponse.json(
          {
            error: `Cannot publish mock test "${mockTest.name}". It currently has 0 questions. Please add questions before publishing.`,
            questionCount: 0,
            isReady: false,
          },
          { status: 400 }
        );
      }

      // Check if any question lacks a valid correct answer or question text
      const invalidCount = await prisma.question.count({
        where: {
          mockTestId,
          OR: [
            { correctOption: { notIn: ['A', 'B', 'C', 'D'] } },
            { questionText: '' },
          ],
        },
      });

      if (invalidCount > 0) {
        return NextResponse.json(
          {
            error: `Cannot publish mock test "${mockTest.name}". ${invalidCount} question(s) lack a valid correct answer (A-D) or question text.`,
            questionCount,
            invalidCount,
            isReady: false,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.mockTest.update({
      where: { id: mockTestId },
      data: { isPublished: Boolean(publish) },
    });

    await recordAuditLog(
      publish ? 'MOCK_TEST_PUBLISH' : 'MOCK_TEST_UNPUBLISH',
      `${publish ? 'Published' : 'Unpublished'} mock test "${mockTest.name}" (${questionCount} questions) in exam "${mockTest.exam.name}"`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      message: `Mock test "${mockTest.name}" ${publish ? 'published' : 'unpublished'} successfully (${questionCount} questions).`,
      mockTest: updated,
      questionCount,
      isPublished: Boolean(publish),
    });
  } catch (err: any) {
    console.error('Failed to update mock test publish status:', err);
    return NextResponse.json(
      { error: err.message || 'Database error updating mock test publish status.' },
      { status: 500 }
    );
  }
}
