import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

if (typeof process.loadEnvFile === "function") {
  for (const envFile of [".env.local", ".env"]) {
    if (existsSync(envFile)) process.loadEnvFile(envFile);
  }
}

const target =
  process.env.VERCEL === "1"
    ? "remote"
    : process.env.PICKME_DATABASE_TARGET ?? "local";
if (target !== "local" && target !== "remote") {
  throw new Error("PICKME_DATABASE_TARGET must be 'local' or 'remote'.");
}

const databaseUrl =
  target === "remote"
    ? process.env.DATABASE_URL
    : process.env.LOCAL_DATABASE_URL ??
      "postgresql://pickme_user:pickme_password@localhost:5432/pickme_db?schema=public";

if (!databaseUrl) {
  throw new Error(
    target === "remote"
      ? "DATABASE_URL is required for remote Prisma operations."
      : "LOCAL_DATABASE_URL is required for local Prisma operations."
  );
}

export default defineConfig({
  migrations: {
    seed: "node prisma/dist/prisma/seed.js",
  },
  datasource: {
    url: databaseUrl,
  },
});
