const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Safety check: ensure we are NOT accidentally connected to production
const prisma = new PrismaClient();

async function runStagingSeed() {
  console.log('--- MockShikhar Staging Database Seed ---');

  // Verify DB connection
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('mockshikhar-prod') || (!dbUrl.includes('staging') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1'))) {
    console.warn('⚠️ Safety Notice: Please verify that you are running this against your staging Supabase database.');
  }

  // 1. Create or upsert 2 test users
  const passwordHash = await bcrypt.hash('Test@12345', 10);

  const testStudent = await prisma.user.upsert({
    where: { email: 'student@test.mockshikhar.com' },
    update: {
      passwordHash,
      role: 'USER',
      emailVerified: new Date(),
    },
    create: {
      email: 'student@test.mockshikhar.com',
      name: 'Abhay Student',
      passwordHash,
      role: 'USER',
      emailVerified: new Date(),
    },
  });
  console.log('✓ Test Student created:', testStudent.email);

  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@test.mockshikhar.com' },
    update: {
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
    create: {
      email: 'admin@test.mockshikhar.com',
      name: 'Abhay Admin',
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
  console.log('✓ Test Admin created:', testAdmin.email);

  // 2. Ensure base exams exist
  const exams = [
    {
      slug: 'hp-patwari',
      name: 'HP Patwari Exam 2026',
      nameHi: 'हिमाचल प्रदेश पटवारी परीक्षा 2026',
      category: 'patwari',
      price: 1,
      totalQuestions: 100,
      durationMinutes: 120,
      isPopular: true,
    },
    {
      slug: 'hp-police-constable',
      name: 'HP Police Constable 2026',
      nameHi: 'हिमाचल पुलिस कांस्टेबल परीक्षा 2026',
      category: 'police',
      price: 1,
      totalQuestions: 90,
      durationMinutes: 90,
      isPopular: true,
    },
    {
      slug: 'hp-high-court',
      name: 'HP High Court Clerk & Process Server',
      nameHi: 'हिमाचल उच्च न्यायालय क्लर्क व प्रोसेस सर्वर',
      category: 'court',
      price: 1,
      totalQuestions: 100,
      durationMinutes: 120,
      isPopular: false,
    },
    {
      slug: 'hp-tet-tgt-arts',
      name: 'HP TET TGT (Arts)',
      nameHi: 'हिमाचल टीईटी टीजीटी (आर्ट्स)',
      category: 'tet',
      price: 1,
      totalQuestions: 150,
      durationMinutes: 150,
      isPopular: false,
    },
  ];

  for (const ex of exams) {
    const exam = await prisma.exam.upsert({
      where: { slug: ex.slug },
      update: {
        name: ex.name,
        nameHi: ex.nameHi,
        category: ex.category,
        price: ex.price,
      },
      create: {
        slug: ex.slug,
        name: ex.name,
        nameHi: ex.nameHi,
        category: ex.category,
        price: ex.price,
        totalQuestions: ex.totalQuestions,
        durationMinutes: ex.durationMinutes,
        isPopular: ex.isPopular,
      },
    });

    // Create a free sample mock test for each
    await prisma.mockTest.upsert({
      where: {
        examId_testNumber: {
          examId: exam.id,
          testNumber: 1,
        },
      },
      update: {
        name: `${exam.name} · Mock 1 (Sample)`,
        isFree: true,
        isPublished: true,
        totalQuestions: 10,
        durationMinutes: 15,
      },
      create: {
        examId: exam.id,
        testNumber: 1,
        name: `${exam.name} · Mock 1 (Sample)`,
        isFree: true,
        isPublished: true,
        totalQuestions: 10,
        durationMinutes: 15,
        totalMarks: 10,
      },
    });

    console.log(`✓ Seeded exam & Mock 1 for: ${exam.name}`);
  }

  // 3. Create a sample announcement for the notice board
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.announcements (
        id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title text NOT NULL,
        body text NOT NULL,
        type text NOT NULL DEFAULT 'NEW_TEST',
        is_pinned boolean NOT NULL DEFAULT false,
        is_active boolean NOT NULL DEFAULT true,
        cta_label text,
        cta_url text,
        expires_at timestamp with time zone,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO public.announcements (title, body, type, is_pinned, is_active, cta_label, cta_url)
      VALUES (
        '🎯 HP Patwari & Police Constable 2026 Staging Tests Active!',
        'Staging environment is live for UI verification and test taking.',
        'NEW_TEST',
        true,
        true,
        'Explore Tests',
        '/exams'
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Staging notice board announcement created');
  } catch (err) {
    console.log('Notice board check skipped:', err.message);
  }

  console.log('\n✅ Staging database seeding complete!');
  console.log('Student Account: student@test.mockshikhar.com / Test@12345');
  console.log('Admin Account: admin@test.mockshikhar.com / Test@12345');
}

runStagingSeed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
