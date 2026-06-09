-- AlterTable
ALTER TABLE "MerchantProfile" ADD COLUMN     "paymentAccountName" TEXT,
ADD COLUMN     "paymentAccountNumber" TEXT,
ADD COLUMN     "paymentBankName" TEXT,
ADD COLUMN     "paymentInstructions" TEXT,
ADD COLUMN     "paymentQrImageUrl" TEXT;
