import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { HP_POLICE_SUBJECTS } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId');

  try {
    const subjects = await prisma.subject.findMany({
      where: examId ? { examId } : {},
      include: {
        topics: true,
        _count: { select: { questions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (subjects && subjects.length > 0) {
      return NextResponse.json({ subjects });
    }
  } catch (err) {
    console.warn('DB subjects query failed, using mock data:', err);
  }

  // Fallback subjects from mock data
  const fallbackSubjects = HP_POLICE_SUBJECTS.map((s, idx) => ({
    id: s.id,
    name: s.name,
    nameHi: s.nameHi,
    sortOrder: idx + 1,
    topics: s.topics.map((t) => ({ id: t.id, name: t.name, nameHi: t.nameHi })),
    _count: { questions: s.questionCount },
  }));

  return NextResponse.json({ subjects: fallbackSubjects });
}

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { name, nameHi, examId, topicNames = [] } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    let defaultExamId = examId;
    if (!defaultExamId) {
      const exam = await prisma.exam.findFirst();
      defaultExamId = exam?.id || 'exam-hp-police';
    }

    const newSubject = await prisma.subject.create({
      data: {
        name,
        nameHi,
        examId: defaultExamId,
        topics: {
          create: topicNames.map((tName: string) => ({
            name: tName,
          })),
        },
      },
      include: { topics: true },
    });

    return NextResponse.json({ success: true, subject: newSubject });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create subject' }, { status: 500 });
  }
}
