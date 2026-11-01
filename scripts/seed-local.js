const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load .env or .env.local if not already in process.env
function loadLocalEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  const fallbackEnv = path.resolve(__dirname, '../.env');
  const target = fs.existsSync(envPath) ? envPath : fs.existsSync(fallbackEnv) ? fallbackEnv : null;
  if (target) {
    const lines = fs.readFileSync(target, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadLocalEnv();

const dbUrl = process.env.DATABASE_URL || '';

// HARD SAFETY CHECK: Refuse to run unless host is strictly localhost or 127.0.0.1
try {
  const parsed = new URL(dbUrl);
  const host = parsed.hostname.toLowerCase();
  const allowed = ['localhost', '127.0.0.1', '::1'];

  if (!allowed.includes(host)) {
    console.error('\n❌ FATAL SAFETY ERROR: seed-local.js CANNOT run on non-local database!');
    console.error(`Detected host: "${host}". Only [localhost, 127.0.0.1] are permitted.`);
    console.error('Execution aborted to protect cloud/remote databases.\n');
    process.exit(1);
  }
} catch (e) {
  console.error('\n❌ FATAL: Invalid DATABASE_URL provided. Aborting.', e.message);
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runLocalSeed() {
  console.log('--- MockShikhar Local Database Seed ---');
  console.log('Connecting to verified local Postgres instance...');

  const rawPassword = process.env.TEST_USER_PASSWORD || 'Test@12345';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 1. Create or upsert 2 test users
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
        description: `Mock Test Series for ${ex.name}`,
        category: ex.category,
        price: ex.price,
        totalQuestions: ex.totalQuestions,
        durationMinutes: ex.durationMinutes,
        difficulty: 'MEDIUM',
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
        name: `${exam.name} · Mock 1 (Free Sample)`,
        isFree: true,
        isPublished: true,
        totalQuestions: 10,
        durationMinutes: 15,
      },
      create: {
        examId: exam.id,
        testNumber: 1,
        name: `${exam.name} · Mock 1 (Free Sample)`,
        isFree: true,
        isPublished: true,
        totalQuestions: 10,
        durationMinutes: 15,
        totalMarks: 10,
      },
    });

    console.log(`✓ Seeded exam & Mock 1 for: ${exam.name}`);
  }

  // 3. Create a local notice board announcement
  try {
    const { ensureAnnouncementsTable } = require('../src/lib/announcement-db.ts');
  } catch {}

  try {
    const id = 'seed-announcement-1';
    await prisma.$executeRawUnsafe(`
      INSERT INTO "announcements" ("id", "title", "body", "type", "isPinned", "isActive", "ctaLabel", "ctaUrl", "updatedAt")
      VALUES (
        '${id}',
        '🎯 HP Patwari & Police Constable 2026 Test Series Live!',
        'Prepare with updated syllabus, bilingual questions, and instant scorecards.',
        'NEW_TEST'::"AnnouncementType",
        true,
        true,
        'Explore Tests',
        '/exams',
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("id") DO NOTHING;
    `);
    console.log('✓ Notice board announcement created');
  } catch (err) {
    console.log('Notice board creation note:', err.message);
  }

  console.log('\n✅ Local database seeding complete!');
  console.log('Student Account: student@test.mockshikhar.com / (configured password)');
  console.log('Admin Account: admin@test.mockshikhar.com / (configured password)');
}

runLocalSeed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
