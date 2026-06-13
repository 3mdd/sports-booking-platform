-- CreateEnum
CREATE TYPE "MerchantApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "MerchantProfile" ADD COLUMN     "approvalNote" TEXT,
ADD COLUMN     "approvalStatus" "MerchantApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- Preserve access for merchant profiles that existed before approval workflow.
UPDATE "MerchantProfile"
SET "approvalStatus" = 'APPROVED',
    "approvedAt" = "createdAt";
