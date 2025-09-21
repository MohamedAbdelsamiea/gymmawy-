/*
  Warnings:

  - You are about to drop the column `orderNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `priceEGP` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `priceSAR` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `paymentNumber` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `priceEGP` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `priceSAR` on the `Product` table. All the data in the column will be lost.
  - The `description` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `image` on the `Programme` table. All the data in the column will be lost.
  - The `description` column on the `Programme` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `ProgrammePurchase` table. All the data in the column will be lost.
  - You are about to drop the column `paymentReference` on the `ProgrammePurchase` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseNumber` on the `ProgrammePurchase` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ProgrammePurchase` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ProgrammePurchase` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionNumber` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - The `description` column on the `SubscriptionPlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mobileNumber]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `description` on the `Benefit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `Category` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `name` on table `Lead` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `price` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `Programme` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `price` to the `ProgrammePurchase` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `SubscriptionPlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `firstName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mobileNumber` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."Country" AS ENUM ('EGYPT', 'SAUDI');

-- CreateEnum
CREATE TYPE "public"."ReferralRewardType" AS ENUM ('LOYALTY_POINTS', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "public"."ReferralRewardStatus" AS ENUM ('PENDING', 'APPROVED', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELLED', 'COUPON_REDEEMED', 'PROFILE_UPDATED', 'PASSWORD_CHANGED');

-- CreateEnum
CREATE TYPE "public"."ShippingStatus" AS ENUM ('PENDING', 'LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED');

-- AlterEnum
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'CARD';

-- DropForeignKey
ALTER TABLE "public"."Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CartItem" DROP CONSTRAINT "CartItem_productVariantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubscriptionPlanBenefit" DROP CONSTRAINT "SubscriptionPlanBenefit_benefitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubscriptionPlanBenefit" DROP CONSTRAINT "SubscriptionPlanBenefit_subscriptionPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VerificationToken" DROP CONSTRAINT "VerificationToken_userId_fkey";

-- DropIndex
DROP INDEX "public"."AuditLog_userId_idx";

-- DropIndex
DROP INDEX "public"."CartItem_cartId_productVariantId_key";

-- DropIndex
DROP INDEX "public"."Category_name_key";

-- DropIndex
DROP INDEX "public"."LoyaltyTransaction_userId_idx";

-- DropIndex
DROP INDEX "public"."Order_orderNumber_key";

-- DropIndex
DROP INDEX "public"."Payment_gatewayId_idx";

-- DropIndex
DROP INDEX "public"."Payment_paymentNumber_key";

-- DropIndex
DROP INDEX "public"."ProductVariant_productId_color_size_key";

-- DropIndex
DROP INDEX "public"."ProgrammePurchase_purchaseNumber_key";

-- DropIndex
DROP INDEX "public"."RefreshToken_userId_idx";

-- DropIndex
DROP INDEX "public"."Subscription_subscriptionNumber_key";

-- DropIndex
DROP INDEX "public"."UserCouponRedemption_userId_couponId_key";

-- DropIndex
DROP INDEX "public"."VerificationToken_userId_idx";

-- AlterTable
ALTER TABLE "public"."AuditLog" DROP COLUMN "action",
ADD COLUMN     "action" "public"."AuditAction" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Benefit" DROP COLUMN "description",
ADD COLUMN     "description" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "public"."CartItem" ALTER COLUMN "quantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Category" DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "public"."Coupon" ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Lead" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "orderNumber";

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "priceEGP",
DROP COLUMN "priceSAR",
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "paymentNumber",
ADD COLUMN     "customerInfo" JSONB,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "proofFile" TEXT,
ADD COLUMN     "transactionId" TEXT,
ALTER COLUMN "currency" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "image",
DROP COLUMN "priceEGP",
DROP COLUMN "priceSAR",
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "public"."ProductVariant" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "public"."Programme" DROP COLUMN "image",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "downloads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "medicalPriceEGP" DECIMAL(10,2),
ADD COLUMN     "medicalPriceSAR" DECIMAL(10,2),
ADD COLUMN     "tags" TEXT[],
DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "public"."ProgrammePurchase" DROP COLUMN "createdAt",
DROP COLUMN "paymentReference",
DROP COLUMN "purchaseNumber",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Subscription" DROP COLUMN "subscriptionNumber",
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT,
DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "mobileNumber" SET NOT NULL;

-- DropEnum
DROP TYPE "public"."ProgrammePurchaseStatus";

-- CreateTable
CREATE TABLE "public"."Price" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "country" "public"."Country" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "medicalAmount" DECIMAL(10,2),

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transformation" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Video" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "totalRewards" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralUsage" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "orderId" TEXT,
    "orderType" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReferralUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralReward" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "public"."ReferralRewardType" NOT NULL,
    "status" "public"."ReferralRewardStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shipping" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "status" "public"."ShippingStatus" NOT NULL DEFAULT 'PENDING',
    "senderInfo" JSONB,
    "recipientInfo" JSONB,
    "items" JSONB,
    "labelUrl" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "public"."Referral"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Shipping_orderId_key" ON "public"."Shipping"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipping_trackingNumber_key" ON "public"."Shipping"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "public"."Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_mobileNumber_key" ON "public"."Lead"("mobileNumber");

-- AddForeignKey
ALTER TABLE "public"."VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Price" ADD CONSTRAINT "Price_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPlanBenefit" ADD CONSTRAINT "SubscriptionPlanBenefit_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionPlanBenefit" ADD CONSTRAINT "SubscriptionPlanBenefit_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "public"."Benefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
