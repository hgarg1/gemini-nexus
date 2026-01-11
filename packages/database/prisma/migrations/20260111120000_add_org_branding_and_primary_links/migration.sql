-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "banner" TEXT;
ALTER TABLE "Organization" ADD COLUMN "pointOfContactName" TEXT;
ALTER TABLE "Organization" ADD COLUMN "pointOfContactEmail" TEXT;
ALTER TABLE "Organization" ADD COLUMN "pointOfContactPhone" TEXT;
ALTER TABLE "Organization" ADD COLUMN "onboardingProfile" JSONB;

-- AlterTable
ALTER TABLE "OrganizationLink" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
