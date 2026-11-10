BEGIN;

ALTER TABLE "guardians" ADD COLUMN "schoolId" TEXT;
ALTER TABLE "pickers" ADD COLUMN "schoolId" TEXT;

CREATE TEMP TABLE "_guardian_school_map" (
    "sourceId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "position" BIGINT NOT NULL,
    "schoolCount" BIGINT NOT NULL,
    PRIMARY KEY ("sourceId", "schoolId")
) ON COMMIT DROP;

INSERT INTO "_guardian_school_map" ("sourceId", "schoolId", "targetId", "position", "schoolCount")
WITH guardian_schools AS (
    SELECT sg."guardianId" AS "sourceId", c."schoolId"
    FROM "student_guardians" sg
    JOIN "students" s ON s."id" = sg."studentId"
    JOIN "classrooms" c ON c."id" = s."classroomId"
    UNION
    SELECT a."guardianId", c."schoolId"
    FROM "authorizations" a
    JOIN "students" s ON s."id" = a."studentId"
    JOIN "classrooms" c ON c."id" = s."classroomId"
    UNION
    SELECT dp."guardianId", dp."schoolId"
    FROM "daily_passes" dp
),
numbered AS (
    SELECT
        "sourceId",
        "schoolId",
        ROW_NUMBER() OVER (PARTITION BY "sourceId" ORDER BY "schoolId") AS position,
        COUNT(*) OVER (PARTITION BY "sourceId") AS school_count
    FROM guardian_schools
)
SELECT
    "sourceId",
    "schoolId",
    CASE WHEN position = 1 THEN "sourceId" ELSE gen_random_uuid()::TEXT END,
    position,
    school_count
FROM numbered;

CREATE TEMP TABLE "_picker_school_map" (
    "sourceId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "position" BIGINT NOT NULL,
    "schoolCount" BIGINT NOT NULL,
    PRIMARY KEY ("sourceId", "schoolId")
) ON COMMIT DROP;

INSERT INTO "_picker_school_map" ("sourceId", "schoolId", "targetId", "position", "schoolCount")
WITH picker_schools AS (
    SELECT a."pickerId" AS "sourceId", c."schoolId"
    FROM "authorizations" a
    JOIN "students" s ON s."id" = a."studentId"
    JOIN "classrooms" c ON c."id" = s."classroomId"
    UNION
    SELECT pe."pickerId", c."schoolId"
    FROM "pickup_events" pe
    JOIN "students" s ON s."id" = pe."studentId"
    JOIN "classrooms" c ON c."id" = s."classroomId"
    WHERE pe."pickerId" IS NOT NULL
),
numbered AS (
    SELECT
        "sourceId",
        "schoolId",
        ROW_NUMBER() OVER (PARTITION BY "sourceId" ORDER BY "schoolId") AS position,
        COUNT(*) OVER (PARTITION BY "sourceId") AS school_count
    FROM picker_schools
)
SELECT
    "sourceId",
    "schoolId",
    CASE WHEN position = 1 THEN "sourceId" ELSE gen_random_uuid()::TEXT END,
    position,
    school_count
FROM numbered;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "guardians" g
        WHERE NOT EXISTS (
            SELECT 1 FROM "_guardian_school_map" m WHERE m."sourceId" = g."id"
        )
    ) THEN
        RAISE EXCEPTION 'Cannot scope guardians: orphan guardian records need manual school assignment.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM "pickers" p
        WHERE NOT EXISTS (
            SELECT 1 FROM "_picker_school_map" m WHERE m."sourceId" = p."id"
        )
    ) THEN
        RAISE EXCEPTION 'Cannot scope pickers: orphan picker records need manual school assignment.';
    END IF;
END $$;

DROP INDEX "guardians_whatsappNumber_key";
DROP INDEX "pickers_whatsappNumber_key";

INSERT INTO "guardians" ("id", "whatsappNumber", "fullName", "idDocumentHash", "familyToken", "createdAt", "schoolId")
SELECT
    m."targetId",
    g."whatsappNumber",
    CASE WHEN m."schoolCount" > 1 THEN 'Por verificar' ELSE g."fullName" END,
    CASE WHEN m."schoolCount" > 1 THEN NULL ELSE g."idDocumentHash" END,
    CASE WHEN m."schoolCount" > 1 THEN NULL ELSE g."familyToken" END,
    g."createdAt",
    m."schoolId"
FROM "guardians" g
JOIN "_guardian_school_map" m ON m."sourceId" = g."id"
WHERE m."position" > 1;

INSERT INTO "pickers" ("id", "whatsappNumber", "fullName", "relationship", "idDocumentHash", "createdAt", "schoolId")
SELECT
    m."targetId",
    p."whatsappNumber",
    CASE WHEN m."schoolCount" > 1 THEN 'Por verificar' ELSE p."fullName" END,
    CASE WHEN m."schoolCount" > 1 THEN 'Por verificar' ELSE p."relationship" END,
    CASE WHEN m."schoolCount" > 1 THEN NULL ELSE p."idDocumentHash" END,
    p."createdAt",
    m."schoolId"
FROM "pickers" p
JOIN "_picker_school_map" m ON m."sourceId" = p."id"
WHERE m."position" > 1;

UPDATE "guardians" g
SET "schoolId" = m."schoolId",
    "fullName" = CASE WHEN m."schoolCount" > 1 THEN 'Por verificar' ELSE g."fullName" END,
    "idDocumentHash" = CASE WHEN m."schoolCount" > 1 THEN NULL ELSE g."idDocumentHash" END,
    "familyToken" = CASE WHEN m."schoolCount" > 1 THEN NULL ELSE g."familyToken" END
FROM "_guardian_school_map" m
WHERE m."sourceId" = g."id" AND m."position" = 1;

UPDATE "pickers" p
SET "schoolId" = m."schoolId",
    "fullName" = CASE WHEN m."schoolCount" > 1 THEN 'Por verificar' ELSE p."fullName" END,
    "relationship" = CASE WHEN m."schoolCount" > 1 THEN 'Por verificar' ELSE p."relationship" END,
    "idDocumentHash" = CASE WHEN m."schoolCount" > 1 THEN NULL ELSE p."idDocumentHash" END
FROM "_picker_school_map" m
WHERE m."sourceId" = p."id" AND m."position" = 1;

UPDATE "student_guardians" sg
SET "guardianId" = m."targetId"
FROM "_guardian_school_map" m, "students" s, "classrooms" c
WHERE sg."guardianId" = m."sourceId"
  AND sg."studentId" = s."id"
  AND s."classroomId" = c."id"
  AND c."schoolId" = m."schoolId";

UPDATE "authorizations" a
SET "guardianId" = gm."targetId",
    "pickerId" = pm."targetId"
FROM "students" s, "classrooms" c, "_guardian_school_map" gm, "_picker_school_map" pm
WHERE a."studentId" = s."id"
  AND s."classroomId" = c."id"
  AND gm."sourceId" = a."guardianId"
  AND gm."schoolId" = c."schoolId"
  AND pm."sourceId" = a."pickerId"
  AND pm."schoolId" = c."schoolId";

UPDATE "daily_passes" dp
SET "guardianId" = m."targetId"
FROM "_guardian_school_map" m
WHERE dp."guardianId" = m."sourceId" AND dp."schoolId" = m."schoolId";

UPDATE "pickup_events" pe
SET "pickerId" = m."targetId"
FROM "_picker_school_map" m, "students" s, "classrooms" c
WHERE pe."pickerId" = m."sourceId"
  AND pe."studentId" = s."id"
  AND s."classroomId" = c."id"
  AND m."schoolId" = c."schoolId";

ALTER TABLE "guardians" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "pickers" ALTER COLUMN "schoolId" SET NOT NULL;

ALTER TABLE "guardians"
    ADD CONSTRAINT "guardians_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pickers"
    ADD CONSTRAINT "pickers_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "guardians_schoolId_whatsappNumber_key" ON "guardians"("schoolId", "whatsappNumber");
CREATE INDEX "guardians_schoolId_idx" ON "guardians"("schoolId");
CREATE UNIQUE INDEX "pickers_schoolId_whatsappNumber_key" ON "pickers"("schoolId", "whatsappNumber");
CREATE INDEX "pickers_schoolId_idx" ON "pickers"("schoolId");

COMMIT;
