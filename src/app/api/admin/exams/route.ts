import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    await prisma.exam.updateMany({
      where: { price: { in: [149, 199] } },
      data: { price: 1 },
    }).catch(() => {});

    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            mockTests: true,
          },
        },
        mockTests: {
          select: {
            id: true,
            name: true,
            testNumber: true,
            isFree: true,
            isPublished: true,
            durationMinutes: true,
            marksPerQuestion: true,
            negativeMarksPerQuestion: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
          orderBy: { testNumber: 'asc' },
        },
      },
    });

    const normalizedExams = exams.map((exam) => ({
      ...exam,
      price: (exam.price === 199 || exam.price === 149 || !exam.price) ? 1 : exam.price,
    }));

    return NextResponse.json({ exams: normalizedExams });
  } catch (error: any) {
    console.error('Error fetching admin exams:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exams.' },
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
      name,
      category = 'HP Exams',
      description = '',
      totalQuestions = 90,
      durationMinutes = 60,
      price = 1,
      negativeMarking = 0.25,
      marksPerQuestion = 1.0,
      difficulty = 'MEDIUM',
    } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Exam name must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    const duration = Number(durationMinutes);
    if (isNaN(duration) || duration < 1 || duration > 300) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 300 minutes.' },
        { status: 400 }
      );
    }

    const negMark = Number(negativeMarking);
    if (isNaN(negMark) || negMark < 0 || negMark > 5) {
      return NextResponse.json(
        { error: 'Negative marking must be between 0 and 5.' },
        { status: 400 }
      );
    }

    const marks = Number(marksPerQuestion);
    if (isNaN(marks) || marks <= 0) {
      return NextResponse.json(
        { error: 'Marks per question must be greater than 0.' },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Price must be 0 or greater.' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!baseSlug) baseSlug = `exam-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.exam.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newExam = await prisma.exam.create({
      data: {
        name: name.trim(),
        slug,
        category: category.trim(),
        description: description.trim() || `Comprehensive mock series for ${name.trim()}.`,
        totalQuestions: Number(totalQuestions) || 90,
        durationMinutes: duration,
        price: parsedPrice,
        negativeMarking: negMark,
        marksPerQuestion: marks,
        difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM',
        isPopular: false,
        isArchived: false,
      },
    });

    await recordAuditLog(
      'EXAM_CREATE',
      `Created new exam series "${newExam.name}" (${newExam.slug}) with price ₹${newExam.price}`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({ exam: newExam }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating admin exam:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create exam.' },
      { status: 500 }
    );
  }
}
