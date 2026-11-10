ALTER TABLE "membership_periods" ADD COLUMN "role" "UserRole";

UPDATE "membership_periods" period
SET "role" = membership."role"
FROM "school_memberships" membership
WHERE period."membershipId" = membership."id";

ALTER TABLE "membership_periods" ALTER COLUMN "role" SET NOT NULL;
