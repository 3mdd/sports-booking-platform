-- CreateEnum
CREATE TYPE "BookingReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "BookingReportReason" AS ENUM ('PAYMENT_NO_RESPONSE', 'VALID_PAYMENT_REJECTED', 'FACILITY_UNAVAILABLE_AFTER_PAYMENT', 'MISLEADING_INFORMATION', 'UNEXPECTED_EXTRA_PAYMENT', 'FACILITY_NOT_FOUND', 'SAFETY_OR_SERIOUS_SERVICE_ISSUE', 'OTHER');

-- CreateTable
CREATE TABLE "BookingReport" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "customerProfileId" INTEGER NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "merchantProfileId" INTEGER NOT NULL,
    "reason" "BookingReportReason" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "BookingReportStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingReport_bookingId_key" ON "BookingReport"("bookingId");

-- CreateIndex
CREATE INDEX "BookingReport_customerProfileId_idx" ON "BookingReport"("customerProfileId");

-- CreateIndex
CREATE INDEX "BookingReport_facilityId_idx" ON "BookingReport"("facilityId");

-- CreateIndex
CREATE INDEX "BookingReport_merchantProfileId_idx" ON "BookingReport"("merchantProfileId");

-- CreateIndex
CREATE INDEX "BookingReport_status_idx" ON "BookingReport"("status");

-- AddForeignKey
ALTER TABLE "BookingReport" ADD CONSTRAINT "BookingReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingReport" ADD CONSTRAINT "BookingReport_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingReport" ADD CONSTRAINT "BookingReport_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingReport" ADD CONSTRAINT "BookingReport_merchantProfileId_fkey" FOREIGN KEY ("merchantProfileId") REFERENCES "MerchantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingReport" ADD CONSTRAINT "BookingReport_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
