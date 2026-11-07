import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://pickme_user:pickme_password@localhost:5432/pickme_db?schema=public';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === 'production' ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // 20s para tolerar cold-starts del serverless pooler de Neon
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
