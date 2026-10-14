/**
 * scripts/mark-existing-verified.js
 *
 * Sets emailVerified = new Date() for all existing users in the database,
 * ensuring existing accounts (especially admin@mockshikhar.com) are not locked out
 * by the verified email requirement.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Mark Existing Users Verified ---');
  const dbUrl = process.env.DATABASE_URL || '';
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  console.log(`Target Database Type: ${isLocal ? 'Localhost' : 'Remote / Production'}`);

  const unverifiedUsers = await prisma.user.findMany({
    where: { emailVerified: null },
    select: { id: true, email: true, role: true },
  });

  console.log(`Found ${unverifiedUsers.length} unverified user(s) to update:`);
  unverifiedUsers.forEach((u) => console.log(`- ${u.email} (${u.role})`));

  if (unverifiedUsers.length === 0) {
    console.log('No unverified users found. Nothing to update.');
    return;
  }

  const result = await prisma.user.updateMany({
    where: { emailVerified: null },
    data: { emailVerified: new Date() },
  });

  console.log(`Successfully verified ${result.count} existing user(s).`);
}

main()
  .catch((e) => {
    console.error('Error marking users verified:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
