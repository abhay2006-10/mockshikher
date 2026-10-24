import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { resolveOrCreateMockTest } from '@/lib/mock-resolver';

export const dynamic = 'force-dynamic';

interface CachedQuestionsEntry {
  data: {
    test: Record<string, unknown>;
    questions: unknown[];
    count: number;
  };
  cachedAt: number;
}

const globalForQuestions = globalThis as unknown as {
  _mockQuestionsCache?: Map<string, CachedQuestionsEntry>;
};
if (!globalForQuestions._mockQuestionsCache) {
  globalForQuestions._mockQuestionsCache = new Map();
}
const questionsCache = globalForQuestions._mockQuestionsCache;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache in RAM

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const reqStart = performance.now();
    const correlationId = crypto.randomUUID();

    const { testId } = await context.params;

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
    }

    // 0. Super-fast path: Instant RAM cache by requested testId parameter
    const directCached = questionsCache.get(testId);
    if (directCached && Date.now() - directCached.cachedAt < CACHE_TTL_MS) {
      const isFree = (directCached.data.test as { isFree?: boolean })?.isFree;
      if (isFree) {
        const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));
        console.log(
          JSON.stringify({
            level: 'info',
            type: 'QUESTIONS_DIRECT_CACHE_HIT',
            correlationId,
            testId,
            totalMs: totalElapsedMs,
            count: directCached.data.count,
          })
        );
        const res = NextResponse.json(directCached.data);
        res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return res;
      }
    }

    // Resolve or find the MockTest using shared resolver
    const tMockStart = performance.now();
    const mockTest = await resolveOrCreateMockTest({ mockTestId: testId });

    if (!mockTest) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 });
    }
    const tMockMs = parseFloat((performance.now() - tMockStart).toFixed(2));

    // Access Control: Enforce verified purchase for non-free mock tests
    const tAuthStart = performance.now();
    const session = await auth();
    // @ts-expect-error user role in token
    let isAdmin = session?.user?.role === 'ADMIN';
    let isPurchased = mockTest.isFree || isAdmin;

    if (session?.user?.id && !isPurchased) {
      const [dbUser, purchase] = await Promise.all([
        !isAdmin
          ? prisma.user.findFirst({
              where: {
                OR: [
                  ...(session.user.id ? [{ id: session.user.id }] : []),
                  ...(session.user.email ? [{ email: session.user.email.toLowerCase().trim() }] : []),
                ],
              },
              select: { role: true },
            })
          : null,
        prisma.purchase.findUnique({
          where: {
            userId_examId: {
              userId: session.user.id,
              examId: mockTest.examId,
            },
          },
          select: { id: true },
        }),
      ]);

      if (dbUser?.role === 'ADMIN') {
        isAdmin = true;
      }
      if (purchase || isAdmin) {
        isPurchased = true;
      }
    }

    if (isAdmin) {
      isPurchased = true;
    }
    const tAuthMs = parseFloat((performance.now() - tAuthStart).toFixed(2));

    if (!mockTest.isPublished && !isAdmin) {
      return NextResponse.json(
        { error: 'This mock test is not published yet.' },
        { status: 403 }
      );
    }

    if (!mockTest.isFree && !isPurchased) {
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            error: 'Please log in to access this premium mock test.',
            requiresAuth: true,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: 'This mock test is locked. Please purchase the test series to unlock access.',
          requiresPurchase: true,
          examId: mockTest.examId,
        },
        { status: 403 }
      );
    }

    // 3. Fast-path: Check in-memory server cache (100x speedup for active tests)
    const cachedEntry = questionsCache.get(mockTest.id);
    if (cachedEntry && Date.now() - cachedEntry.cachedAt < CACHE_TTL_MS) {
      const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));
      console.log(
        JSON.stringify({
          level: 'info',
          type: 'QUESTIONS_CACHE_HIT',
          correlationId,
          testId: mockTest.id,
          totalMs: totalElapsedMs,
          count: cachedEntry.data.count,
        })
      );
      const res = NextResponse.json(cachedEntry.data);
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res;
    }

    // Fetch questions strictly belonging to this mock test ID from PostgreSQL
    const tQueryStart = performance.now();
    const dbQuestions = await prisma.question.findMany({
      where: { mockTestId: mockTest.id },
      select: {
        id: true,
        mockTestId: true,
        questionNumber: true,
        questionText: true,
        questionTextHi: true,
        questionImage: true,
        marks: true,
        negativeMarks: true,
        difficulty: true,
        subjectId: true,
        topicId: true,
        options: {
          orderBy: { optionLabel: 'asc' },
          select: {
            id: true,
            optionLabel: true,
            optionText: true,
            optionTextHi: true,
          },
        },
        subject: {
          select: { id: true, name: true, nameHi: true },
        },
        topic: {
          select: { id: true, name: true, nameHi: true },
        },
      },
      orderBy: { questionNumber: 'asc' },
    });
    const tQueryMs = parseFloat((performance.now() - tQueryStart).toFixed(2));

    // Format safe student questions: STRICTLY EXCLUDE correctOption, explanation, solutionImage
    const studentQuestions = dbQuestions.map((q) => ({
      id: q.id,
      mockTestId: q.mockTestId,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionTextHi: q.questionTextHi || q.questionText,
      questionImage: q.questionImage || null,
      marks: q.marks,
      negativeMarks: Number(mockTest.negativeMarksPerQuestion) === 0 ? 0 : q.negativeMarks,
      difficulty: q.difficulty,
      subjectId: q.subjectId,
      subjectName: q.subject?.name || 'General Awareness',
      subjectNameHi: q.subject?.nameHi || q.subject?.name || 'सामान्य ज्ञान',
      topicId: q.topicId,
      topicName: q.topic?.name || 'General',
      topicNameHi: q.topic?.nameHi || q.topic?.name || 'सामान्य',
      options: q.options.map((opt) => ({
        id: opt.id,
        label: opt.optionLabel,
        text: opt.optionText,
        textHi: opt.optionTextHi || opt.optionText,
      })),
    }));

    const totalElapsedMs = parseFloat((performance.now() - reqStart).toFixed(2));

    console.log(
      JSON.stringify({
        level: 'info',
        type: 'QUESTIONS_LOAD_PERF',
        correlationId,
        testId: mockTest.id,
        timings: {
          mockResolveMs: tMockMs,
          authMs: tAuthMs,
          queryMs: tQueryMs,
          totalMs: totalElapsedMs,
        },
        count: studentQuestions.length,
      })
    );

    const responseData = {
      test: {
        id: mockTest.id,
        name: mockTest.name,
        testNumber: mockTest.testNumber,
        isFree: mockTest.isFree,
        examSlug: mockTest.exam?.slug || '',
        examName: mockTest.exam?.name || '',
        examPrice: (mockTest.exam?.price === 199 || mockTest.exam?.price === 149 || !mockTest.exam?.price) ? 1 : mockTest.exam?.price,
        totalQuestions: studentQuestions.length,
        durationMinutes: mockTest.durationMinutes || 60,
        totalMarks: mockTest.totalMarks || studentQuestions.reduce((sum, q) => sum + q.marks, 0),
        negativeMarksPerQuestion:
          mockTest.name?.toLowerCase().includes('patwari') ||
          mockTest.name?.toLowerCase().includes('clerk') ||
          mockTest.name?.toLowerCase().includes('process-server') ||
          mockTest.exam?.slug?.includes('patwari') ||
          mockTest.exam?.slug?.includes('clerk') ||
          mockTest.exam?.slug?.includes('process-server') ||
          mockTest.negativeMarksPerQuestion === 0 ||
          mockTest.exam?.negativeMarking === 0
            ? 0
            : (mockTest.negativeMarksPerQuestion ?? mockTest.exam?.negativeMarking ?? 0.25),
        marksPerQuestion: mockTest.marksPerQuestion || 1.0,
      },
      questions: studentQuestions,
      count: studentQuestions.length,
    };

    // Cache in RAM for 10 minutes under all variations (ID, slug, requested param)
    const cacheEntry = {
      data: responseData,
      cachedAt: Date.now(),
    };
    questionsCache.set(mockTest.id, cacheEntry);
    if (testId && testId !== mockTest.id) {
      questionsCache.set(testId, cacheEntry);
    }
    if (mockTest.exam?.slug) {
      questionsCache.set(`${mockTest.exam.slug}-mock-${mockTest.testNumber}`, cacheEntry);
    }

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch test questions from database.';
    console.error('Error in student questions endpoint:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
