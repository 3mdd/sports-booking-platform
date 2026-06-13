-- AlterTable
ALTER TABLE "FacilityImage" ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false;

-- Preserve the current first-photo behavior for existing facilities.
UPDATE "FacilityImage" AS image
SET "isMain" = true
WHERE image.id IN (
  SELECT DISTINCT ON ("facilityId") id
  FROM "FacilityImage"
  ORDER BY "facilityId", "createdAt" ASC, id ASC
);

-- CreateIndex
CREATE INDEX "FacilityImage_facilityId_isMain_idx" ON "FacilityImage"("facilityId", "isMain");
