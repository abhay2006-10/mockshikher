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

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        topics: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { questions: true } },
          },
        },
        _count: { select: { questions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Return strictly real database subjects, never fallback mock data
    return NextResponse.json({ subjects: subjects || [] });
  } catch (err: any) {
    console.error('Error fetching subjects from database:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch subjects from database.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { action } = body;

    // Action 1: Add Topic to an existing Subject
    if (action === 'add-topic') {
      const { subjectId, name, nameHi } = body;
      const cleanName = name?.trim();
      if (!subjectId || !cleanName) {
        return NextResponse.json(
          { error: 'subjectId and a valid topic name are required.' },
          { status: 400 }
        );
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: { exam: true },
      });
      if (!subject) {
        return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
      }

      const existingTopic = await prisma.topic.findFirst({
        where: { subjectId, name: { equals: cleanName, mode: 'insensitive' } },
      });
      if (existingTopic) {
        return NextResponse.json(
          { error: `Topic "${cleanName}" already exists under subject "${subject.name}".` },
          { status: 400 }
        );
      }

      const newTopic = await prisma.topic.create({
        data: {
          subjectId,
          name: cleanName,
          nameHi: nameHi?.trim() || null,
        },
      });

      await recordAuditLog(
        'TOPIC_CREATE',
        `Created topic "${cleanName}" under subject "${subject.name}" (${subject.exam.slug})`,
        authRes.user.email || 'Admin',
        'SUCCESS'
      );

      return NextResponse.json({ success: true, topic: newTopic }, { status: 201 });
    }

    // Action 2: Add Subject to an Exam
    const { name, nameHi, examId, examSlug, topicNames = [] } = body;
    const cleanSubjectName = name?.trim();

    if (!cleanSubjectName) {
      return NextResponse.json({ error: 'Subject name is required.' }, { status: 400 });
    }

    let targetExamId = examId;
    if (!targetExamId && examSlug) {
      const exam = await prisma.exam.findUnique({ where: { slug: examSlug } });
      targetExamId = exam?.id;
    }

    if (!targetExamId) {
      return NextResponse.json(
        { error: 'A valid examId or examSlug is required to create a subject.' },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({ where: { id: targetExamId } });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found.' }, { status: 404 });
    }

    // Check uniqueness within this exam
    const existingSubject = await prisma.subject.findFirst({
      where: {
        examId: targetExamId,
        name: { equals: cleanSubjectName, mode: 'insensitive' },
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        { error: `Subject "${cleanSubjectName}" already exists for exam "${exam.name}".` },
        { status: 400 }
      );
    }

    const cleanTopics = Array.isArray(topicNames)
      ? topicNames.map((t: string) => String(t).trim()).filter((t: string) => t.length > 0)
      : [];

    const newSubject = await prisma.subject.create({
      data: {
        examId: targetExamId,
        name: cleanSubjectName,
        nameHi: nameHi?.trim() || null,
        topics: {
          create: cleanTopics.map((tName: string) => ({
            name: tName,
          })),
        },
      },
      include: {
        topics: true,
        _count: { select: { questions: true } },
      },
    });

    await recordAuditLog(
      'SUBJECT_CREATE',
      `Created subject "${cleanSubjectName}" with ${cleanTopics.length} topics in exam "${exam.name}" (${exam.slug})`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ success: true, subject: newSubject }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating subject/topic:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create subject.' },
      { status: 500 }
    );
  }
}
