import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        question: {
          include: {
            options: {
              orderBy: { optionLabel: 'asc' },
            },
            subject: true,
            topic: true,
            mockTest: {
              select: { name: true, testNumber: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = bookmarks.map((b) => {
      const q = b.question;
      return {
        id: b.id,
        questionId: q.id,
        testName: q.mockTest?.name || 'Full Mock Test',
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionTextHi: q.questionTextHi || q.questionText,
        subjectName: q.subject?.name || 'General Awareness',
        topicName: q.topic?.name || 'General',
        options: q.options.map((opt) => ({
          id: opt.id,
          label: opt.optionLabel,
          text: opt.optionText,
          textHi: opt.optionTextHi || opt.optionText,
        })),
        correctOption: q.correctOption,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        explanation: q.explanation || '',
        explanationHi: q.explanationHi || '',
        createdAt: b.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ bookmarks: formatted });
  } catch (err: any) {
    console.error('Error fetching bookmarks:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
      create: {
        userId,
        questionId,
      },
      update: {},
    });

    return NextResponse.json({ success: true, bookmark });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save bookmark' }, { status: 500 });
  }
}
