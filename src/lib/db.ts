import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const useRemoteDatabase =
  process.env.VERCEL === '1' || process.env.PICKME_DATABASE_TARGET === 'remote';
if (
  process.env.PICKME_DATABASE_TARGET &&
  process.env.PICKME_DATABASE_TARGET !== 'local' &&
  process.env.PICKME_DATABASE_TARGET !== 'remote'
) {
  throw new Error("PICKME_DATABASE_TARGET must be 'local' or 'remote'.");
}
const connectionString = useRemoteDatabase
  ? process.env.DATABASE_URL
  : process.env.LOCAL_DATABASE_URL ??
    'postgresql://pickme_user:pickme_password@localhost:5432/pickme_db?schema=public';

if (!connectionString) {
  throw new Error(
    useRemoteDatabase
      ? 'DATABASE_URL is required for the Vercel/remote database.'
      : 'LOCAL_DATABASE_URL is required for local development.'
  );
}

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
