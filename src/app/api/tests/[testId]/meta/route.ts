import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveOrCreateMockTest } from '@/lib/mock-resolver';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await context.params;
    const mockTest = await resolveOrCreateMockTest({ mockTestId: testId });

    if (!mockTest) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

    const questionCount = await prisma.question.count({
      where: { mockTestId: mockTest.id },
    });

    const response = NextResponse.json({
      test: {
        id: mockTest.id,
        name: mockTest.name,
        testNumber: mockTest.testNumber,
        isFree: mockTest.isFree,
        totalQuestions: questionCount,
        durationMinutes: mockTest.durationMinutes || 60,
        totalMarks: mockTest.totalMarks || questionCount,
        negativeMarksPerQuestion: mockTest.negativeMarksPerQuestion || 0.25,
        marksPerQuestion: mockTest.marksPerQuestion || 1.0,
        isPublished: mockTest.isPublished,
      },
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch test metadata.' },
      { status: 500 }
    );
  }
}
