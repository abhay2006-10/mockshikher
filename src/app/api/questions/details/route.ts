import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids') || '';
    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    const dbQuestions = await prisma.question.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        options: {
          orderBy: { optionLabel: 'asc' },
        },
        subject: true,
        topic: true,
      },
      orderBy: { questionNumber: 'asc' },
    });

    const formatted = dbQuestions.map((q) => ({
      id: q.id,
      mockTestId: q.mockTestId,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionTextHi: q.questionTextHi || q.questionText,
      questionImage: q.questionImage || null,
      correctOption: q.correctOption,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      explanationHi: q.explanationHi || '',
      solutionImage: q.solutionImage || null,
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

    const response = NextResponse.json({ questions: formatted });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (err: any) {
    console.error('Error fetching question details:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch question details from database.' },
      { status: 500 }
    );
  }
}
