/*
  Warnings:

  - The values [REFUNDED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [EMAIL_VERIFICATION] on the enum `TokenType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `action` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `discountValue` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `maxRedemptions` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `redemptions` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPointsAwarded` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPointsRequired` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `downloads` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `medicalPriceEGP` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `medicalPriceSAR` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `ProgrammePurchase` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `ReferralUsage` table. All the data in the column will be lost.
  - You are about to drop the column `items` on the `Shipping` table. All the data in the column will be lost.
  - You are about to drop the column `medicalLoyaltyAwarded` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `medicalLoyaltyRequired` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `medicalPriceEGP` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `medicalPriceSAR` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Transformation` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the `Price` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cartId,productVariantId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentReference]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,size,color]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[purchaseNumber]` on the table `ProgrammePurchase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionNumber]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,couponId]` on the table `UserCouponRedemption` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,type]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `actionType` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountPercentage` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderNumber` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentReference` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceEGP` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSAR` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `ProgrammePurchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseNumber` to the `ProgrammePurchase` table without a default value. This is not possible if the table is not empty.
  - Made the column `expiresAt` on table `Referral` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxUses` on table `Referral` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expiresAt` on table `ReferralReward` required. This step will fail if there are existing NULL values in that column.
  - Made the column `senderInfo` on table `Shipping` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recipientInfo` on table `Shipping` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `subscriptionNumber` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ProgrammePurchaseStatus" AS ENUM ('PENDING', 'COMPLETE');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Order" ALTER COLUMN "status" TYPE "public"."OrderStatus_new" USING ("status"::text::"public"."OrderStatus_new");
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "public"."Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TokenType_new" AS ENUM ('PASSWORD_RESET');
ALTER TABLE "public"."VerificationToken" ALTER COLUMN "type" TYPE "public"."TokenType_new" USING ("type"::text::"public"."TokenType_new");
ALTER TYPE "public"."TokenType" RENAME TO "TokenType_old";
ALTER TYPE "public"."TokenType_new" RENAME TO "TokenType";
DROP TYPE "public"."TokenType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."LoyaltyTransaction" DROP CONSTRAINT "LoyaltyTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Price" DROP CONSTRAINT "Price_productVariantId_fkey";

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

-- DropForeignKey
ALTER TABLE "public"."UserCouponRedemption" DROP CONSTRAINT "UserCouponRedemption_couponId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserCouponRedemption" DROP CONSTRAINT "UserCouponRedemption_userId_fkey";

-- DropIndex
DROP INDEX "public"."Lead_email_key";

-- DropIndex
DROP INDEX "public"."Lead_mobileNumber_key";

-- DropIndex
DROP INDEX "public"."Shipping_orderId_key";

-- AlterTable
ALTER TABLE "public"."AuditLog" DROP COLUMN "action",
ADD COLUMN     "actionType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."CartItem" ALTER COLUMN "quantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."Coupon" DROP COLUMN "discountValue",
DROP COLUMN "maxRedemptions",
DROP COLUMN "redemptions",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "discountPercentage" INTEGER NOT NULL,
ADD COLUMN     "maxRedemptionsPerUser" INTEGER,
ADD COLUMN     "totalRedemptions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Lead" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "mobileNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "orderNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "discount",
ADD COLUMN     "discountPercentage" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "orderId",
DROP COLUMN "subscriptionId",
ADD COLUMN     "paymentReference" TEXT NOT NULL,
ADD COLUMN     "paymentableId" TEXT,
ADD COLUMN     "paymentableType" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "discount",
DROP COLUMN "loyaltyPointsAwarded",
DROP COLUMN "loyaltyPointsRequired",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "discountPercentage" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."ProductVariant" DROP COLUMN "image",
DROP COLUMN "name",
ADD COLUMN     "loyaltyPointsAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPointsRequired" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "priceEGP" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "priceSAR" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "public"."Programme" DROP COLUMN "category",
DROP COLUMN "discount",
DROP COLUMN "downloads",
DROP COLUMN "duration",
DROP COLUMN "isActive",
DROP COLUMN "level",
DROP COLUMN "medicalPriceEGP",
DROP COLUMN "medicalPriceSAR",
DROP COLUMN "tags",
ADD COLUMN     "discountPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPointsAwarded" INTEGER,
ADD COLUMN     "loyaltyPointsRequired" INTEGER;

-- AlterTable
ALTER TABLE "public"."ProgrammePurchase" DROP COLUMN "discount",
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "discountPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "purchaseNumber" TEXT NOT NULL,
ADD COLUMN     "status" "public"."ProgrammePurchaseStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."Referral" ALTER COLUMN "expiresAt" SET NOT NULL,
ALTER COLUMN "maxUses" SET NOT NULL,
ALTER COLUMN "maxUses" SET DEFAULT 1000;

-- AlterTable
ALTER TABLE "public"."ReferralReward" ALTER COLUMN "expiresAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."ReferralUsage" DROP COLUMN "orderId",
ADD COLUMN     "referralableId" TEXT,
ADD COLUMN     "referralableType" TEXT,
ALTER COLUMN "discountAmount" SET DEFAULT 0.00;

-- AlterTable
ALTER TABLE "public"."Shipping" DROP COLUMN "items",
ALTER COLUMN "senderInfo" SET NOT NULL,
ALTER COLUMN "recipientInfo" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "discountPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "medical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "public"."PaymentMethod",
ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "subscriptionNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" DROP COLUMN "medicalLoyaltyAwarded",
DROP COLUMN "medicalLoyaltyRequired",
DROP COLUMN "medicalPriceEGP",
DROP COLUMN "medicalPriceSAR",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "medicalEGP" DECIMAL(10,2),
ADD COLUMN     "medicalLoyaltyPointsAwarded" INTEGER DEFAULT 0,
ADD COLUMN     "medicalLoyaltyPointsRequired" INTEGER,
ADD COLUMN     "medicalSAR" DECIMAL(10,2),
ALTER COLUMN "loyaltyPointsAwarded" DROP NOT NULL,
ALTER COLUMN "loyaltyPointsRequired" DROP NOT NULL,
ALTER COLUMN "loyaltyPointsRequired" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Transformation" DROP COLUMN "isActive",
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "emailVerified",
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "mobileNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Video" DROP COLUMN "isActive",
DROP COLUMN "thumbnailUrl",
ADD COLUMN     "thumbnailAr" TEXT,
ADD COLUMN     "thumbnailEn" TEXT;

-- DropTable
DROP TABLE "public"."Price";

-- DropEnum
DROP TYPE "public"."AuditAction";

-- DropEnum
DROP TYPE "public"."Country";

-- CreateTable
CREATE TABLE "public"."PendingUserVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "mobileNumber" TEXT,
    "birthDate" TIMESTAMP(3),
    "building" TEXT,
    "street" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "verificationToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingUserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShippingItem" (
    "id" TEXT NOT NULL,
    "shippingId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ShippingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingUserVerification_email_key" ON "public"."PendingUserVerification"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingUserVerification_verificationToken_key" ON "public"."PendingUserVerification"("verificationToken");

-- CreateIndex
CREATE INDEX "PendingUserVerification_email_idx" ON "public"."PendingUserVerification"("email");

-- CreateIndex
CREATE INDEX "PendingUserVerification_verificationToken_idx" ON "public"."PendingUserVerification"("verificationToken");

-- CreateIndex
CREATE INDEX "PendingUserVerification_expiresAt_idx" ON "public"."PendingUserVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "public"."ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_isPrimary_idx" ON "public"."ProductImage"("isPrimary");

-- CreateIndex
CREATE INDEX "ProductImage_order_idx" ON "public"."ProductImage"("order");

-- CreateIndex
CREATE INDEX "ShippingItem_shippingId_idx" ON "public"."ShippingItem"("shippingId");

-- CreateIndex
CREATE INDEX "ShippingItem_orderItemId_idx" ON "public"."ShippingItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingItem_shippingId_orderItemId_key" ON "public"."ShippingItem"("shippingId", "orderItemId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "public"."AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_createdAt_idx" ON "public"."AuditLog"("actionType", "createdAt");

-- CreateIndex
CREATE INDEX "Benefit_createdAt_idx" ON "public"."Benefit"("createdAt");

-- CreateIndex
CREATE INDEX "Cart_createdAt_idx" ON "public"."Cart"("createdAt");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "public"."CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productVariantId_idx" ON "public"."CartItem"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productVariantId_key" ON "public"."CartItem"("cartId", "productVariantId");

-- CreateIndex
CREATE INDEX "Category_createdAt_idx" ON "public"."Category"("createdAt");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "public"."Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_isActive_idx" ON "public"."Coupon"("isActive");

-- CreateIndex
CREATE INDEX "Coupon_expirationDate_idx" ON "public"."Coupon"("expirationDate");

-- CreateIndex
CREATE INDEX "Coupon_isActive_expirationDate_idx" ON "public"."Coupon"("isActive", "expirationDate");

-- CreateIndex
CREATE INDEX "Coupon_deletedAt_idx" ON "public"."Coupon"("deletedAt");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "public"."Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "public"."Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "public"."Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "public"."Lead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_userId_idx" ON "public"."LoyaltyTransaction"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_createdAt_idx" ON "public"."LoyaltyTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_points_idx" ON "public"."LoyaltyTransaction"("points");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "public"."Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "public"."Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "public"."Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_trackingNumber_idx" ON "public"."Order"("trackingNumber");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "public"."Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "public"."Order"("userId", "status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productVariantId_idx" ON "public"."OrderItem"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentReference_key" ON "public"."Payment"("paymentReference");

-- CreateIndex
CREATE INDEX "Payment_gatewayId_idx" ON "public"."Payment"("gatewayId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_method_idx" ON "public"."Payment"("method");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "public"."Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_paymentableId_idx" ON "public"."Payment"("paymentableId");

-- CreateIndex
CREATE INDEX "Payment_paymentableType_idx" ON "public"."Payment"("paymentableType");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "public"."Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "public"."Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "public"."Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "public"."Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_discountPercentage_idx" ON "public"."Product"("discountPercentage");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "public"."Product"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "public"."ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_stock_idx" ON "public"."ProductVariant"("stock");

-- CreateIndex
CREATE INDEX "ProductVariant_priceEGP_idx" ON "public"."ProductVariant"("priceEGP");

-- CreateIndex
CREATE INDEX "ProductVariant_priceSAR_idx" ON "public"."ProductVariant"("priceSAR");

-- CreateIndex
CREATE INDEX "ProductVariant_color_size_idx" ON "public"."ProductVariant"("color", "size");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_color_key" ON "public"."ProductVariant"("productId", "size", "color");

-- CreateIndex
CREATE INDEX "Programme_createdAt_idx" ON "public"."Programme"("createdAt");

-- CreateIndex
CREATE INDEX "Programme_discountPercentage_idx" ON "public"."Programme"("discountPercentage");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammePurchase_purchaseNumber_key" ON "public"."ProgrammePurchase"("purchaseNumber");

-- CreateIndex
CREATE INDEX "ProgrammePurchase_userId_idx" ON "public"."ProgrammePurchase"("userId");

-- CreateIndex
CREATE INDEX "ProgrammePurchase_status_idx" ON "public"."ProgrammePurchase"("status");

-- CreateIndex
CREATE INDEX "ProgrammePurchase_purchasedAt_idx" ON "public"."ProgrammePurchase"("purchasedAt");

-- CreateIndex
CREATE INDEX "ProgrammePurchase_status_purchasedAt_idx" ON "public"."ProgrammePurchase"("status", "purchasedAt");

-- CreateIndex
CREATE INDEX "ProgrammePurchase_userId_status_idx" ON "public"."ProgrammePurchase"("userId", "status");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "public"."Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_userId_idx" ON "public"."Referral"("userId");

-- CreateIndex
CREATE INDEX "Referral_expiresAt_idx" ON "public"."Referral"("expiresAt");

-- CreateIndex
CREATE INDEX "Referral_isActive_idx" ON "public"."Referral"("isActive");

-- CreateIndex
CREATE INDEX "Referral_isActive_expiresAt_idx" ON "public"."Referral"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "ReferralReward_referralId_idx" ON "public"."ReferralReward"("referralId");

-- CreateIndex
CREATE INDEX "ReferralReward_userId_idx" ON "public"."ReferralReward"("userId");

-- CreateIndex
CREATE INDEX "ReferralReward_status_idx" ON "public"."ReferralReward"("status");

-- CreateIndex
CREATE INDEX "ReferralReward_expiresAt_idx" ON "public"."ReferralReward"("expiresAt");

-- CreateIndex
CREATE INDEX "ReferralReward_status_expiresAt_idx" ON "public"."ReferralReward"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "ReferralReward_userId_status_idx" ON "public"."ReferralReward"("userId", "status");

-- CreateIndex
CREATE INDEX "ReferralUsage_referralId_idx" ON "public"."ReferralUsage"("referralId");

-- CreateIndex
CREATE INDEX "ReferralUsage_referredUserId_idx" ON "public"."ReferralUsage"("referredUserId");

-- CreateIndex
CREATE INDEX "ReferralUsage_usedAt_idx" ON "public"."ReferralUsage"("usedAt");

-- CreateIndex
CREATE INDEX "ReferralUsage_isProcessed_idx" ON "public"."ReferralUsage"("isProcessed");

-- CreateIndex
CREATE INDEX "ReferralUsage_referralId_isProcessed_idx" ON "public"."ReferralUsage"("referralId", "isProcessed");

-- CreateIndex
CREATE INDEX "ReferralUsage_referralableId_idx" ON "public"."ReferralUsage"("referralableId");

-- CreateIndex
CREATE INDEX "ReferralUsage_referralableType_idx" ON "public"."ReferralUsage"("referralableType");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "public"."RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_revoked_idx" ON "public"."RefreshToken"("revoked");

-- CreateIndex
CREATE INDEX "Shipping_orderId_idx" ON "public"."Shipping"("orderId");

-- CreateIndex
CREATE INDEX "Shipping_trackingNumber_idx" ON "public"."Shipping"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipping_status_idx" ON "public"."Shipping"("status");

-- CreateIndex
CREATE INDEX "Shipping_createdAt_idx" ON "public"."Shipping"("createdAt");

-- CreateIndex
CREATE INDEX "Shipping_status_createdAt_idx" ON "public"."Shipping"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriptionNumber_key" ON "public"."Subscription"("subscriptionNumber");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_createdAt_idx" ON "public"."Subscription"("createdAt");

-- CreateIndex
CREATE INDEX "Subscription_status_createdAt_idx" ON "public"."Subscription"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "public"."Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_userId_subscriptionPlanId_status_idx" ON "public"."Subscription"("userId", "subscriptionPlanId", "status");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_createdAt_idx" ON "public"."SubscriptionPlan"("createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_discountPercentage_idx" ON "public"."SubscriptionPlan"("discountPercentage");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_deletedAt_idx" ON "public"."SubscriptionPlan"("deletedAt");

-- CreateIndex
CREATE INDEX "Transformation_createdAt_idx" ON "public"."Transformation"("createdAt");

-- CreateIndex
CREATE INDEX "Transformation_order_idx" ON "public"."Transformation"("order");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "public"."User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "public"."User"("deletedAt");

-- CreateIndex
CREATE INDEX "UserCouponRedemption_userId_idx" ON "public"."UserCouponRedemption"("userId");

-- CreateIndex
CREATE INDEX "UserCouponRedemption_couponId_idx" ON "public"."UserCouponRedemption"("couponId");

-- CreateIndex
CREATE INDEX "UserCouponRedemption_redeemedAt_idx" ON "public"."UserCouponRedemption"("redeemedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserCouponRedemption_userId_couponId_key" ON "public"."UserCouponRedemption"("userId", "couponId");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_idx" ON "public"."VerificationToken"("userId");

-- CreateIndex
CREATE INDEX "VerificationToken_expiresAt_idx" ON "public"."VerificationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "VerificationToken_type_idx" ON "public"."VerificationToken"("type");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_userId_type_key" ON "public"."VerificationToken"("userId", "type");

-- CreateIndex
CREATE INDEX "Video_createdAt_idx" ON "public"."Video"("createdAt");

-- CreateIndex
CREATE INDEX "Video_order_idx" ON "public"."Video"("order");

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCouponRedemption" ADD CONSTRAINT "UserCouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCouponRedemption" ADD CONSTRAINT "UserCouponRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralUsage" ADD CONSTRAINT "ReferralUsage_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "public"."Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralUsage" ADD CONSTRAINT "ReferralUsage_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "public"."Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipping" ADD CONSTRAINT "Shipping_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShippingItem" ADD CONSTRAINT "ShippingItem_shippingId_fkey" FOREIGN KEY ("shippingId") REFERENCES "public"."Shipping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShippingItem" ADD CONSTRAINT "ShippingItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
