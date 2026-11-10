-- Catch up schema changes that were previously applied outside versioned migrations.
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'ABSENT', 'WITHDRAWN');

ALTER TABLE "guardians" ADD COLUMN "familyToken" TEXT;

ALTER TABLE "schools"
ADD COLUMN "defaultExitTime" TEXT,
ADD COLUMN "pinLength" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Santiago';

ALTER TABLE "students"
ADD COLUMN "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "transportId" TEXT;

ALTER TABLE "users"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "schoolId" DROP NOT NULL;

CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_services" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plateNumber" TEXT,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "weeklyToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "tempDriverName" TEXT,
    "tempDriverPhone" TEXT,
    "tempDriverToken" TEXT,
    "tempDriverExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_passes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "pickerName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "passToken" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "validForDate" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_passes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");
CREATE INDEX "invitations_email_idx" ON "invitations"("email");
CREATE INDEX "invitations_schoolId_idx" ON "invitations"("schoolId");
CREATE INDEX "invitations_token_idx" ON "invitations"("token");
CREATE UNIQUE INDEX "transport_services_weeklyToken_key" ON "transport_services"("weeklyToken");
CREATE UNIQUE INDEX "transport_services_tempDriverToken_key" ON "transport_services"("tempDriverToken");
CREATE INDEX "transport_services_schoolId_idx" ON "transport_services"("schoolId");
CREATE UNIQUE INDEX "daily_passes_passToken_key" ON "daily_passes"("passToken");
CREATE INDEX "daily_passes_schoolId_idx" ON "daily_passes"("schoolId");
CREATE INDEX "daily_passes_studentId_idx" ON "daily_passes"("studentId");
CREATE INDEX "daily_passes_passToken_idx" ON "daily_passes"("passToken");
CREATE INDEX "guardians_familyToken_idx" ON "guardians"("familyToken");

ALTER TABLE "invitations"
ADD CONSTRAINT "invitations_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "students"
ADD CONSTRAINT "students_transportId_fkey"
FOREIGN KEY ("transportId") REFERENCES "transport_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transport_services"
ADD CONSTRAINT "transport_services_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_passes"
ADD CONSTRAINT "daily_passes_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_passes"
ADD CONSTRAINT "daily_passes_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_passes"
ADD CONSTRAINT "daily_passes_guardianId_fkey"
FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;
