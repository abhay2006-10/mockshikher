const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Load environment variables from .env file if not set in process.env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
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

loadEnv();

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your environment or .env file.');
    console.error('Example:');
    console.error('  ADMIN_EMAIL="admin@mockshikhar.com"');
    console.error('  ADMIN_PASSWORD="YourStrongPassword123"');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  console.log(`🔑 Generating secure password hash for admin (${email})...`);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        passwordHash,
        emailVerified: existingUser.emailVerified || new Date(),
      },
    });
    console.log(`✅ Success: User "${email}" promoted to ADMIN role.`);
    console.log(`   User ID: ${updated.id}`);
    console.log(`   Role: ${updated.role}`);
  } else {
    const created = await prisma.user.create({
      data: {
        name: 'Administrator',
        email,
        passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Success: Created new ADMIN user "${email}".`);
    console.log(`   User ID: ${created.id}`);
    console.log(`   Role: ${created.role}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Failed to create or promote admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
