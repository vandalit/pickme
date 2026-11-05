-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'SCHOOL_ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "AuthorizationType" AS ENUM ('PERMANENT', 'SINGLE_DAY', 'DATE_RANGE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "AuthorizationStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CustodyStatus" AS ENUM ('WAITING', 'IN_PROCESS', 'HANDOVER', 'IN_TRANSIT', 'ARRIVED', 'ALERT');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "emergencyPhone" TEXT,
    "qrRefreshSecs" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "avatarConfig" JSONB,
    "homeAddress" TEXT,
    "homeLatitude" DOUBLE PRECISION,
    "homeLongitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idDocumentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("studentId","guardianId")
);

-- CreateTable
CREATE TABLE "pickers" (
    "id" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "idDocumentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "type" "AuthorizationType" NOT NULL DEFAULT 'PERMANENT',
    "status" "AuthorizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "legalProof" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_sessions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionCode" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "pickerId" TEXT,
    "staffId" TEXT,
    "status" "CustodyStatus" NOT NULL DEFAULT 'WAITING',
    "handoverCode" TEXT,
    "handoverExpiry" TIMESTAMP(3),
    "pickerScannedAt" TIMESTAMP(3),
    "staffConfirmedAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "alertTriggeredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_schoolId_idx" ON "users"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_schoolId_grade_section_key" ON "classrooms"("schoolId", "grade", "section");

-- CreateIndex
CREATE INDEX "students_classroomId_idx" ON "students"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "students_classroomId_animalId_colorId_key" ON "students"("classroomId", "animalId", "colorId");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_whatsappNumber_key" ON "guardians"("whatsappNumber");

-- CreateIndex
CREATE UNIQUE INDEX "pickers_whatsappNumber_key" ON "pickers"("whatsappNumber");

-- CreateIndex
CREATE INDEX "authorizations_studentId_pickerId_status_idx" ON "authorizations"("studentId", "pickerId", "status");

-- CreateIndex
CREATE INDEX "pickup_sessions_schoolId_status_idx" ON "pickup_sessions"("schoolId", "status");

-- CreateIndex
CREATE INDEX "pickup_events_sessionId_status_idx" ON "pickup_events"("sessionId", "status");

-- CreateIndex
CREATE INDEX "pickup_events_studentId_idx" ON "pickup_events"("studentId");

-- CreateIndex
CREATE INDEX "incidents_eventId_idx" ON "incidents"("eventId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "pickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_sessions" ADD CONSTRAINT "pickup_sessions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_events" ADD CONSTRAINT "pickup_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "pickup_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_events" ADD CONSTRAINT "pickup_events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_events" ADD CONSTRAINT "pickup_events_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "pickers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_events" ADD CONSTRAINT "pickup_events_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "pickup_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
