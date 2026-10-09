import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { resolveOrCreateMockTest, recalculateMockStats } from '@/lib/mock-resolver';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { searchParams } = new URL(req.url);
  const examSlug = searchParams.get('exam') || '';
  const mockTestId = searchParams.get('mockTestId') || '';
  const subjectId = searchParams.get('subject') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const whereClause: any = {};

    if (mockTestId && mockTestId !== 'ALL') {
      whereClause.mockTestId = mockTestId;
    }

    if (subjectId && subjectId !== 'ALL') {
      whereClause.subject = {
        OR: [
          { id: subjectId },
          { name: { contains: subjectId, mode: 'insensitive' } },
        ],
      };
    }

    if (difficulty && difficulty !== 'ALL') {
      whereClause.difficulty = difficulty.toUpperCase();
    }

    if (search) {
      whereClause.OR = [
        { questionText: { contains: search, mode: 'insensitive' } },
        { questionTextHi: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [dbQuestions, total] = await Promise.all([
      prisma.question.findMany({
        where: whereClause,
        include: {
          options: {
            orderBy: { optionLabel: 'asc' },
          },
          subject: true,
          topic: true,
          mockTest: {
            include: { exam: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ mockTestId: 'asc' }, { questionNumber: 'asc' }],
      }),
      prisma.question.count({ where: whereClause }),
    ]);

    const formatted = dbQuestions.map((q) => ({
      id: q.id,
      mockTestId: q.mockTestId,
      subjectId: q.subjectId,
      subjectName: q.subject?.name || 'General Awareness',
      subjectNameHi: q.subject?.nameHi || q.subject?.name || 'सामान्य ज्ञान',
      topicId: q.topicId,
      topicName: q.topic?.name || 'General',
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionTextHi: q.questionTextHi || q.questionText,
      questionImage: q.questionImage || null,
      options: q.options.map((opt) => ({
        id: opt.id,
        label: opt.optionLabel,
        text: opt.optionText,
        textHi: opt.optionTextHi || opt.optionText,
      })),
      correctOption: q.correctOption,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      explanationHi: q.explanationHi || q.explanation || '',
      solutionImage: q.solutionImage || null,
    }));

    return NextResponse.json({
      questions: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    console.error('Error fetching questions from database:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch questions from database.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      mockTestId,
      examSlug,
      questionText,
      questionTextHi,
      options,
      correctOption,
      subjectName,
      subjectNameHi,
      topicName,
      topicNameHi,
      difficulty = 'MEDIUM',
      marks = 1.0,
      negativeMarks = 0.25,
      explanation,
      explanationHi,
      questionImage,
      solutionImage,
    } = body;

    if (!questionText && !questionTextHi) {
      return NextResponse.json(
        { error: 'Question text in English or Hindi is required.' },
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 4) {
      return NextResponse.json(
        { error: 'All 4 options (A, B, C, D) are required.' },
        { status: 400 }
      );
    }

    const normCorrect = correctOption?.toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(normCorrect)) {
      return NextResponse.json(
        { error: 'Correct option must be A, B, C, or D.' },
        { status: 400 }
      );
    }

    // 1. Resolve or create mock test in database
    const mockTest = await resolveOrCreateMockTest({
      mockTestId: mockTestId || 'hp-police-mock-1',
      examSlug: examSlug || 'hp-police-constable',
    });

    // 2. Resolve or create subject
    const finalSubjectName = subjectName?.trim() || 'General Awareness & HP GK';
    let subject = await prisma.subject.findFirst({
      where: { examId: mockTest.examId, name: finalSubjectName },
    });
    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          examId: mockTest.examId,
          name: finalSubjectName,
          nameHi: subjectNameHi?.trim() || finalSubjectName,
        },
      });
    }

    // 3. Resolve or create topic
    const finalTopicName = topicName?.trim() || 'General';
    let topic = await prisma.topic.findFirst({
      where: { subjectId: subject.id, name: finalTopicName },
    });
    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          subjectId: subject.id,
          name: finalTopicName,
          nameHi: topicNameHi?.trim() || finalTopicName,
        },
      });
    }

    // 4. Calculate question number for this mock test
    const currentQCount = await prisma.question.count({
      where: { mockTestId: mockTest.id },
    });
    const questionNumber = currentQCount + 1;

    // 5. Create Question and Options in database
    const createdQuestion = await prisma.question.create({
      data: {
        mockTestId: mockTest.id,
        subjectId: subject.id,
        topicId: topic.id,
        questionNumber,
        questionText: questionText || questionTextHi,
        questionTextHi: questionTextHi || questionText,
        questionImage: questionImage || null,
        correctOption: normCorrect as 'A' | 'B' | 'C' | 'D',
        marks: Number(marks) || 1.0,
        negativeMarks: Number(negativeMarks) || 0.25,
        difficulty: (difficulty.toUpperCase() as any) || 'MEDIUM',
        explanation: explanation || '',
        explanationHi: explanationHi || explanation || '',
        solutionImage: solutionImage || null,
        options: {
          create: options.map((opt: any, idx: number) => {
            const label = (opt.label || ['A', 'B', 'C', 'D'][idx]).toUpperCase();
            return {
              optionLabel: label as 'A' | 'B' | 'C' | 'D',
              optionText: opt.text || '',
              optionTextHi: opt.textHi || opt.text || '',
            };
          }),
        },
      },
      include: {
        options: { orderBy: { optionLabel: 'asc' } },
        subject: true,
        topic: true,
      },
    });

    // 6. Recalculate Mock Test stats (totalQuestions, totalMarks)
    await recalculateMockStats(mockTest.id);

    return NextResponse.json({
      success: true,
      message: 'Question created successfully in database.',
      question: {
        id: createdQuestion.id,
        mockTestId: createdQuestion.mockTestId,
        subjectId: createdQuestion.subjectId,
        subjectName: createdQuestion.subject?.name,
        subjectNameHi: createdQuestion.subject?.nameHi,
        topicId: createdQuestion.topicId,
        topicName: createdQuestion.topic?.name,
        questionNumber: createdQuestion.questionNumber,
        questionText: createdQuestion.questionText,
        questionTextHi: createdQuestion.questionTextHi,
        questionImage: createdQuestion.questionImage,
        options: createdQuestion.options.map((opt) => ({
          id: opt.id,
          label: opt.optionLabel,
          text: opt.optionText,
          textHi: opt.optionTextHi,
        })),
        correctOption: createdQuestion.correctOption,
        marks: createdQuestion.marks,
        negativeMarks: createdQuestion.negativeMarks,
        difficulty: createdQuestion.difficulty,
        explanation: createdQuestion.explanation,
        explanationHi: createdQuestion.explanationHi,
        solutionImage: createdQuestion.solutionImage,
      },
    });
  } catch (err: any) {
    console.error('Failed to create question:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create question.' },
      { status: 500 }
    );
  }
}
