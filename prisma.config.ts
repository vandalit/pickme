import { defineConfig } from "prisma/config";

// Cargar .env si existe en el entorno
try {
  // @ts-ignore Node 20+ feature
  if (typeof process.loadEnvFile === "function") {
    // @ts-ignore
    process.loadEnvFile(".env");
  }
} catch {
  // Ignorar si no existe o ya está cargado
}

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://pickme_user:pickme_password@localhost:5432/pickme_db?schema=public";

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
