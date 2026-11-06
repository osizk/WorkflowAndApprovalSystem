import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const accounts = [
  ['requester1', 'REQUESTER', 'SEED_REQUESTER1_PASSWORD'],
  ['requester2', 'REQUESTER', 'SEED_REQUESTER2_PASSWORD'],
  ['reviewer1', 'REVIEWER', 'SEED_REVIEWER1_PASSWORD'],
  ['reviewer2', 'REVIEWER', 'SEED_REVIEWER2_PASSWORD'],
];

const database = new PrismaClient();
try {
  for (const [, , key] of accounts) {
    if (!process.env[key] || process.env[key].length < 12) throw new Error(`${key} must be set to at least 12 characters`);
  }
  await database.$transaction(async (tx) => {
    const ids = {};
    for (const [login, role, key] of accounts) {
      const salt = randomBytes(16);
      const hash = scryptSync(process.env[key], salt, 64);
      const user = await tx.user.upsert({
        where: { login },
        update: {},
        create: { login, role, passwordHash: `scrypt:${salt.toString('hex')}:${hash.toString('hex')}` },
      });
      if (user.role !== role) throw new Error(`${login} has the wrong role; seed left existing data unchanged`);
      ids[login] = user.id;
    }
    for (const [requester, reviewer] of [['requester1', 'reviewer1'], ['requester2', 'reviewer2']]) {
      await tx.reviewerAssignment.upsert({
        where: { requesterId: ids[requester] },
        update: {},
        create: { requesterId: ids[requester], reviewerId: ids[reviewer] },
      });
    }
  });
  console.log('Synthetic accounts and preset assignments are ready. Existing accounts and assignments were preserved.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await database.$disconnect();
}
