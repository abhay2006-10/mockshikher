import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const session = await auth();
    // @ts-expect-error user role in token
    let isAdmin = session?.user?.role === 'ADMIN';

    if (!isAdmin && session?.user) {
      const email = session.user.email?.toLowerCase().trim();
      const id = session.user.id;
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(id ? [{ id }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
        select: { role: true },
      });
      if (dbUser?.role === 'ADMIN') {
        isAdmin = true;
      }
    }

    const exam = await prisma.exam.findUnique({
      where: { slug },
      include: {
        subjects: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            nameHi: true,
            _count: { select: { questions: true } },
          },
        },
      },
    });

    if (!exam || (exam.isArchived && !isAdmin)) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Query tests for this exam from PostgreSQL
    // Unpublished tests are hidden from students (Requirement 3)
    const mockTests = await prisma.mockTest.findMany({
      where: {
        examId: exam.id,
        ...(isAdmin ? {} : { isPublished: true }),
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { testNumber: 'asc' },
    });

    // Check user's previous attempts and verified purchases if logged in
    const userAttemptsMap = new Map<string, any>();
    let isPurchased = false;

    if (session?.user) {
      const sessionUserId = session.user.id;
      const sessionEmail = session.user.email ? session.user.email.toLowerCase().trim() : null;

      const sessionRole = (session.user as any)?.role;

      let dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(sessionUserId ? [{ id: sessionUserId }] : []),
            ...(sessionEmail ? [{ email: sessionEmail }] : []),
          ],
        },
        select: { id: true, role: true },
      });

      if (!dbUser && sessionRole === 'ADMIN') {
        dbUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          select: { id: true, role: true },
        });
      }

      const effectiveUserId = dbUser?.id || sessionUserId;

      if (effectiveUserId) {
        const [attempts, purchaseRecord] = await Promise.all([
          prisma.testAttempt.findMany({
            where: {
              userId: effectiveUserId,
              mockTestId: { in: mockTests.map((t) => t.id) },
              status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
            },
            orderBy: { submittedAt: 'desc' },
          }),
          prisma.purchase.findUnique({
            where: {
              userId_examId: {
                userId: effectiveUserId,
                examId: exam.id,
              },
            },
          }),
        ]);

        attempts.forEach((att) => {
          if (!userAttemptsMap.has(att.mockTestId)) {
            userAttemptsMap.set(att.mockTestId, att);
          }
        });

        if (purchaseRecord) {
          isPurchased = true;
        }
      }
    }

    if (isAdmin) {
      isPurchased = true;
    }

    const formattedTests = mockTests.map((test) => {
      const qCount = test._count.questions;
      const lastAttempt = userAttemptsMap.get(test.id);
      const isTestUnlocked = test.isFree || isPurchased;

      return {
        id: test.id,
        examId: test.examId,
        name: test.name,
        testNumber: test.testNumber,
        isFree: test.isFree,
        isUnlocked: isTestUnlocked,
        isPublished: test.isPublished,
        totalQuestions: qCount, // Real question count from database
        durationMinutes: test.durationMinutes || exam.durationMinutes || 60,
        totalMarks: test.totalMarks || (qCount > 0 ? qCount * test.marksPerQuestion : exam.totalQuestions),
        marksPerQuestion: test.marksPerQuestion || 1.0,
        negativeMarksPerQuestion:
          exam.slug.includes('patwari') ||
          exam.slug.includes('clerk') ||
          exam.slug.includes('process-server') ||
          exam.negativeMarking === 0 ||
          test.negativeMarksPerQuestion === 0
            ? 0
            : (test.negativeMarksPerQuestion ?? exam.negativeMarking ?? 0),
        hasAttempted: !!lastAttempt,
        lastScore: lastAttempt?.score,
        lastPercentage: lastAttempt?.percentage,
        lastAttemptId: lastAttempt?.id,
      };
    });

    const response = NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.name,
        slug: exam.slug,
        description: exam.description,
        category: exam.category,
        price: exam.price,
        durationMinutes: exam.durationMinutes,
        totalQuestions: exam.totalQuestions,
        negativeMarking: exam.negativeMarking,
        totalMocks: mockTests.length,
        isPurchased,
        subjects: exam.subjects.map((s) => ({
          id: s.id,
          name: s.name,
          nameHi: s.nameHi,
          questionCount: s._count.questions,
        })),
      },
      tests: formattedTests,
      isPurchased,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: any) {
    console.error('Error fetching exam tests:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch exam tests' },
      { status: 500 }
    );
  }
}
