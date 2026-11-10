-- User is the global login identity; school-specific access lives in memberships.
ALTER TABLE "users" DROP CONSTRAINT "users_schoolId_fkey";
DROP INDEX "users_schoolId_idx";

CREATE TABLE "school_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membership_periods" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "membership_periods_pkey" PRIMARY KEY ("id")
);

INSERT INTO "school_memberships" (
    "id",
    "userId",
    "schoolId",
    "role",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::TEXT,
    "id",
    "schoolId",
    "role",
    "status",
    "createdAt",
    "updatedAt"
FROM "users"
WHERE "schoolId" IS NOT NULL;

INSERT INTO "membership_periods" ("id", "membershipId", "startedAt", "createdAt")
SELECT
    gen_random_uuid()::TEXT,
    membership."id",
    membership."createdAt",
    membership."createdAt"
FROM "school_memberships" membership;

ALTER TABLE "users"
DROP COLUMN "role",
DROP COLUMN "schoolId",
DROP COLUMN "status",
ADD COLUMN "onboardingRole" "UserRole";

CREATE INDEX "school_memberships_schoolId_role_status_idx"
ON "school_memberships"("schoolId", "role", "status");
CREATE UNIQUE INDEX "school_memberships_userId_schoolId_key"
ON "school_memberships"("userId", "schoolId");
CREATE INDEX "membership_periods_membershipId_startedAt_idx"
ON "membership_periods"("membershipId", "startedAt");

ALTER TABLE "school_memberships"
ADD CONSTRAINT "school_memberships_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_memberships"
ADD CONSTRAINT "school_memberships_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "membership_periods"
ADD CONSTRAINT "membership_periods_membershipId_fkey"
FOREIGN KEY ("membershipId") REFERENCES "school_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
