/*
  Warnings:

  - The values [INSTAPAY,VODAFONECASH,CASH] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `productVariantId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `LoyaltyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `LoyaltyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPointsAwarded` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPointsRedeemed` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `productVariantId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `proofFile` on the `Payment` table. All the data in the column will be lost.
  - The `paymentableType` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `categoryId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `altText` on the `ProductImage` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `ProductImage` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `priceEGP` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `priceSAR` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `ReferralReward` table. All the data in the column will be lost.
  - You are about to drop the column `orderType` on the `ReferralUsage` table. All the data in the column will be lost.
  - You are about to drop the column `referralableId` on the `ReferralUsage` table. All the data in the column will be lost.
  - You are about to drop the column `referralableType` on the `ReferralUsage` table. All the data in the column will be lost.
  - You are about to drop the column `medical` on the `Subscription` table. All the data in the column will be lost.
  - The `currency` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `medicalEGP` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `medicalSAR` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `priceEGP` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `priceSAR` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cartId,productId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `LoyaltyTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `LoyaltyTransaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `currency` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `productId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `currency` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `currency` on the `ProgrammePurchase` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('EGP', 'SAR', 'AED', 'USD');

-- CreateEnum
CREATE TYPE "public"."PurchasableType" AS ENUM ('PROGRAMME', 'MEDICAL_SUBSCRIPTION', 'SUBSCRIPTION', 'ORDER');

-- CreateEnum
CREATE TYPE "public"."LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."LoyaltyTransactionSource" AS ENUM ('ORDER_ITEM', 'PROGRAMME_PURCHASE', 'SUBSCRIPTION', 'REFERRAL');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentMethod_new" AS ENUM ('INSTA_PAY', 'VODAFONE_CASH', 'TABBY', 'TAMARA', 'CARD');
ALTER TABLE "public"."Subscription" ALTER COLUMN "paymentMethod" TYPE "public"."PaymentMethod_new" USING ("paymentMethod"::text::"public"."PaymentMethod_new");
ALTER TABLE "public"."Payment" ALTER COLUMN "method" TYPE "public"."PaymentMethod_new" USING ("method"::text::"public"."PaymentMethod_new");
ALTER TYPE "public"."PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "public"."PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PENDING_VERIFICATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."TokenType" ADD VALUE 'EMAIL_VERIFICATION';
ALTER TYPE "public"."TokenType" ADD VALUE 'EMAIL_CHANGE';

-- DropForeignKey
ALTER TABLE "public"."CartItem" DROP CONSTRAINT "CartItem_productVariantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_productVariantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Referral" DROP CONSTRAINT "Referral_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralReward" DROP CONSTRAINT "ReferralReward_referralId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralReward" DROP CONSTRAINT "ReferralReward_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralUsage" DROP CONSTRAINT "ReferralUsage_referralId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralUsage" DROP CONSTRAINT "ReferralUsage_referredUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Shipping" DROP CONSTRAINT "Shipping_orderId_fkey";

-- DropIndex
DROP INDEX "public"."AuditLog_actionType_createdAt_idx";

-- DropIndex
DROP INDEX "public"."CartItem_cartId_productVariantId_key";

-- DropIndex
DROP INDEX "public"."CartItem_productVariantId_idx";

-- DropIndex
DROP INDEX "public"."Coupon_isActive_expirationDate_idx";

-- DropIndex
DROP INDEX "public"."Order_status_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Order_userId_status_idx";

-- DropIndex
DROP INDEX "public"."OrderItem_productVariantId_idx";

-- DropIndex
DROP INDEX "public"."Payment_status_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Payment_userId_status_idx";

-- DropIndex
DROP INDEX "public"."Product_categoryId_idx";

-- DropIndex
DROP INDEX "public"."ProductImage_order_idx";

-- DropIndex
DROP INDEX "public"."ProgrammePurchase_status_purchasedAt_idx";

-- DropIndex
DROP INDEX "public"."ProgrammePurchase_userId_status_idx";

-- DropIndex
DROP INDEX "public"."Referral_code_idx";

-- DropIndex
DROP INDEX "public"."Referral_expiresAt_idx";

-- DropIndex
DROP INDEX "public"."Referral_isActive_expiresAt_idx";

-- DropIndex
DROP INDEX "public"."Referral_isActive_idx";

-- DropIndex
DROP INDEX "public"."Referral_userId_idx";

-- DropIndex
DROP INDEX "public"."ReferralReward_expiresAt_idx";

-- DropIndex
DROP INDEX "public"."ReferralReward_referralId_idx";

-- DropIndex
DROP INDEX "public"."ReferralReward_status_expiresAt_idx";

-- DropIndex
DROP INDEX "public"."ReferralReward_status_idx";

-- DropIndex
DROP INDEX "public"."ReferralReward_userId_idx";

-- DropIndex
DROP INDEX "public"."ReferralReward_userId_status_idx";

-- DropIndex
DROP INDEX "public"."ReferralUsage_isProcessed_idx";

-- DropIndex
DROP INDEX "public"."ReferralUsage_referralId_idx";

-- DropIndex
DROP INDEX "public"."ReferralUsage_referralId_isProcessed_idx";

-- DropIndex
DROP INDEX "public"."ReferralUsage_referralableId_idx";

-- DropIndex
DROP INDEX "public"."ReferralUsage_referralableType_idx";

-- DropIndex
DROP INDEX "public"."ReferralUsage_referredUserId_idx";

-- DropIndex
DROP INDEX "public"."ReferralUsage_usedAt_idx";

-- DropIndex
DROP INDEX "public"."Shipping_status_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Subscription_status_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Subscription_userId_status_idx";

-- DropIndex
DROP INDEX "public"."Subscription_userId_subscriptionPlanId_status_idx";

-- AlterTable
ALTER TABLE "public"."Benefit" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."CartItem" DROP COLUMN "productVariantId",
ADD COLUMN     "productId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."LoyaltyTransaction" DROP COLUMN "metadata",
DROP COLUMN "reason",
ADD COLUMN     "source" "public"."LoyaltyTransactionSource" NOT NULL,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "type" "public"."LoyaltyTransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "couponDiscount" DECIMAL(10,2),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "price" DECIMAL(10,2),
DROP COLUMN "currency",
ADD COLUMN     "currency" "public"."Currency" NOT NULL;

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "loyaltyPointsAwarded",
DROP COLUMN "loyaltyPointsRedeemed",
DROP COLUMN "price",
DROP COLUMN "productVariantId",
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "totalPrice" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "proofFile",
ADD COLUMN     "paymentProofUrl" TEXT,
DROP COLUMN "currency",
ADD COLUMN     "currency" "public"."Currency" NOT NULL,
DROP COLUMN "paymentableType",
ADD COLUMN     "paymentableType" "public"."PurchasableType";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "categoryId",
DROP COLUMN "description",
ADD COLUMN     "loyaltyPointsAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPointsRequired" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."ProductImage" DROP COLUMN "altText",
DROP COLUMN "order";

-- AlterTable
ALTER TABLE "public"."Programme" DROP COLUMN "description",
DROP COLUMN "priceEGP",
DROP COLUMN "priceSAR",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."ProgrammePurchase" ADD COLUMN     "couponDiscount" DECIMAL(10,2),
ADD COLUMN     "couponId" TEXT,
DROP COLUMN "currency",
ADD COLUMN     "currency" "public"."Currency" NOT NULL;

-- AlterTable
ALTER TABLE "public"."ReferralReward" DROP COLUMN "expiresAt",
ADD COLUMN     "points" INTEGER;

-- AlterTable
ALTER TABLE "public"."ReferralUsage" DROP COLUMN "orderType",
DROP COLUMN "referralableId",
DROP COLUMN "referralableType";

-- AlterTable
ALTER TABLE "public"."Subscription" DROP COLUMN "medical",
ADD COLUMN     "couponDiscount" DECIMAL(10,2),
ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "isMedical" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "currency",
ADD COLUMN     "currency" "public"."Currency";

-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" DROP COLUMN "medicalEGP",
DROP COLUMN "medicalSAR",
DROP COLUMN "priceEGP",
DROP COLUMN "priceSAR",
ADD COLUMN     "crown" JSONB;

-- AlterTable
ALTER TABLE "public"."Transformation" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."VerificationToken" ADD COLUMN     "newEmail" TEXT;

-- AlterTable
ALTER TABLE "public"."Video" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."Category";

-- DropTable
DROP TABLE "public"."ProductVariant";

-- CreateTable
CREATE TABLE "public"."Price" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "purchasableId" TEXT NOT NULL,
    "purchasableType" "public"."PurchasableType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Price_purchasableId_purchasableType_idx" ON "public"."Price"("purchasableId", "purchasableType");

-- CreateIndex
CREATE INDEX "Price_currency_idx" ON "public"."Price"("currency");

-- CreateIndex
CREATE INDEX "Benefit_deletedAt_idx" ON "public"."Benefit"("deletedAt");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "public"."CartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "public"."CartItem"("cartId", "productId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_type_idx" ON "public"."LoyaltyTransaction"("type");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_source_idx" ON "public"."LoyaltyTransaction"("source");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_sourceId_idx" ON "public"."LoyaltyTransaction"("sourceId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_userId_createdAt_idx" ON "public"."LoyaltyTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_deletedAt_idx" ON "public"."Order"("deletedAt");

-- CreateIndex
CREATE INDEX "Order_couponId_idx" ON "public"."Order"("couponId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "public"."OrderItem"("productId");

-- CreateIndex
CREATE INDEX "Payment_paymentableType_idx" ON "public"."Payment"("paymentableType");

-- CreateIndex
CREATE INDEX "Programme_deletedAt_idx" ON "public"."Programme"("deletedAt");

-- CreateIndex
CREATE INDEX "ProgrammePurchase_couponId_idx" ON "public"."ProgrammePurchase"("couponId");

-- CreateIndex
CREATE INDEX "Subscription_couponId_idx" ON "public"."Subscription"("couponId");

-- CreateIndex
CREATE INDEX "Transformation_deletedAt_idx" ON "public"."Transformation"("deletedAt");

-- CreateIndex
CREATE INDEX "Video_deletedAt_idx" ON "public"."Video"("deletedAt");

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammePurchase" ADD CONSTRAINT "ProgrammePurchase_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralUsage" ADD CONSTRAINT "ReferralUsage_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "public"."Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralUsage" ADD CONSTRAINT "ReferralUsage_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "public"."Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipping" ADD CONSTRAINT "Shipping_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
