import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId');
  const examSlug = searchParams.get('examSlug');

  try {
    const whereClause: any = {};
    if (examId) {
      whereClause.examId = examId;
    } else if (examSlug) {
      whereClause.exam = { slug: examSlug };
    }

    const mockTests = await prisma.mockTest.findMany({
      where: whereClause,
      include: {
        exam: {
          select: { id: true, name: true, slug: true, durationMinutes: true, marksPerQuestion: true, negativeMarking: true },
        },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: [{ examId: 'asc' }, { testNumber: 'asc' }],
    });

    return NextResponse.json({ mockTests });
  } catch (error: any) {
    console.error('Error fetching mock tests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mock tests.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();

    // ==========================================
    // ACTION 1: "Create Mocks 1-10" Shortcut
    // ==========================================
    if (body.action === 'create-1-to-10') {
      const { examId } = body;
      if (!examId) {
        return NextResponse.json({ error: 'examId is required for shortcut.' }, { status: 400 });
      }

      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { mockTests: { select: { testNumber: true } } },
      });

      if (!exam) {
        return NextResponse.json({ error: 'Exam not found.' }, { status: 404 });
      }

      const existingNumbers = new Set(exam.mockTests.map((t) => t.testNumber));
      const createdTests = [];

      for (let num = 1; num <= 10; num++) {
        if (!existingNumbers.has(num)) {
          const newTest = await prisma.mockTest.create({
            data: {
              examId: exam.id,
              testNumber: num,
              name: `${exam.name} Mock ${num}`,
              isFree: num === 1,
              isPublished: false,
              totalQuestions: 0,
              durationMinutes: exam.durationMinutes,
              totalMarks: 0,
              marksPerQuestion: exam.marksPerQuestion,
              negativeMarksPerQuestion: exam.negativeMarking,
            },
          });
          createdTests.push(newTest);
        }
      }

      await recordAuditLog(
        'MOCK_TESTS_BULK_CREATE',
        `Generated ${createdTests.length} mock tests (1-10 shortcut) for exam "${exam.name}" (${exam.slug})`,
        authRes.user.email || 'Admin',
        'SUCCESS'
      );

      return NextResponse.json({
        success: true,
        message: `Successfully created ${createdTests.length} mock tests for "${exam.name}".`,
        createdCount: createdTests.length,
      });
    }

    // ==========================================
    // ACTION 2: Add Single Mock Test
    // ==========================================
    const {
      examId,
      testNumber,
      name,
      isFree = false,
      isPublished = false,
      durationOverride,
      negativeMarksOverride,
      marksOverride,
    } = body;

    if (!examId) {
      return NextResponse.json({ error: 'examId is required.' }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found.' }, { status: 404 });
    }

    const tNum = Number(testNumber);
    if (isNaN(tNum) || tNum < 1) {
      return NextResponse.json(
        { error: 'testNumber must be a positive integer (e.g. 1, 2, 3).' },
        { status: 400 }
      );
    }

    // Check unique test number per exam
    const existing = await prisma.mockTest.findUnique({
      where: {
        examId_testNumber: {
          examId,
          testNumber: tNum,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Mock Test #${tNum} already exists for this exam series.` },
        { status: 400 }
      );
    }

    const title = name?.trim() || `${exam.name} Mock ${tNum}`;

    let durOverride: number | null = null;
    let durEffective = exam.durationMinutes;
    if (durationOverride !== null && durationOverride !== undefined && durationOverride !== '') {
      const d = Number(durationOverride);
      if (isNaN(d) || d < 1 || d > 300) {
        return NextResponse.json(
          { error: 'durationOverride must be between 1 and 300 minutes.' },
          { status: 400 }
        );
      }
      durOverride = d;
      durEffective = d;
    }

    let nmOverride: number | null = null;
    let nmEffective = exam.negativeMarking;
    if (negativeMarksOverride !== null && negativeMarksOverride !== undefined && negativeMarksOverride !== '') {
      const nm = Number(negativeMarksOverride);
      if (isNaN(nm) || nm < 0 || nm > 5) {
        return NextResponse.json(
          { error: 'negativeMarksOverride must be between 0 and 5.' },
          { status: 400 }
        );
      }
      nmOverride = nm;
      nmEffective = nm;
    }

    let mOverride: number | null = null;
    let mEffective = exam.marksPerQuestion;
    if (marksOverride !== null && marksOverride !== undefined && marksOverride !== '') {
      const mpq = Number(marksOverride);
      if (isNaN(mpq) || mpq <= 0) {
        return NextResponse.json(
          { error: 'marksOverride must be greater than 0.' },
          { status: 400 }
        );
      }
      mOverride = mpq;
      mEffective = mpq;
    }

    const newMockTest = await prisma.mockTest.create({
      data: {
        examId: exam.id,
        testNumber: tNum,
        name: title,
        isFree: Boolean(isFree),
        isPublished: Boolean(isPublished),
        totalQuestions: 0,
        durationMinutes: durEffective,
        totalMarks: 0,
        marksPerQuestion: mEffective,
        negativeMarksPerQuestion: nmEffective,
        durationOverride: durOverride,
        negativeMarksOverride: nmOverride,
        marksOverride: mOverride,
      },
      include: {
        exam: true,
        _count: { select: { questions: true } },
      },
    });

    await recordAuditLog(
      'MOCK_TEST_CREATE',
      `Created Mock Test #${tNum} "${newMockTest.name}" in exam "${exam.name}"`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ success: true, mockTest: newMockTest }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mock test:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create mock test.' },
      { status: 500 }
    );
  }
}
