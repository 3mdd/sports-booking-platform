-- AlterTable
ALTER TABLE "TimeSlot" ADD COLUMN     "blockReason" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;
