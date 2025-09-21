/*
  Warnings:

  - You are about to alter the column `discountValue` on the `Coupon` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `token` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `VerificationToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenHash]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `isActive` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Payment_gatewayId_key";

-- DropIndex
DROP INDEX "public"."RefreshToken_token_key";

-- DropIndex
DROP INDEX "public"."VerificationToken_token_key";

-- AlterTable
ALTER TABLE "public"."Coupon" ADD COLUMN     "isActive" BOOLEAN NOT NULL,
ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "public"."ProductVariant" ADD COLUMN     "price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."RefreshToken" DROP COLUMN "token",
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."VerificationToken" DROP COLUMN "token",
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Payment_gatewayId_idx" ON "public"."Payment"("gatewayId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "public"."RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "public"."VerificationToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
