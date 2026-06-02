-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "sentimentAnalyzedAt" TIMESTAMP(3),
ADD COLUMN     "sentimentProvider" TEXT,
ADD COLUMN     "sentimentScore" DOUBLE PRECISION;
