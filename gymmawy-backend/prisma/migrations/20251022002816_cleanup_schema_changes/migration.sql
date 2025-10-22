-- Migration: Cleanup Schema Changes
-- This migration applies all the schema improvements we made

-- Step 1: Add new fields to Subscription table
ALTER TABLE "Subscription" ADD COLUMN "totalPeriodDays" INTEGER;

-- Step 2: Migrate data from old fields to new field
UPDATE "Subscription" 
SET "totalPeriodDays" = COALESCE("subscriptionPeriodDays", 0) + COALESCE("giftPeriodDays", 0)
WHERE "subscriptionPeriodDays" IS NOT NULL OR "giftPeriodDays" IS NOT NULL;

-- Step 3: Add new price fields to SubscriptionPlan
ALTER TABLE "SubscriptionPlan" ADD COLUMN "priceAED" DECIMAL(10,2);
ALTER TABLE "SubscriptionPlan" ADD COLUMN "priceEGP" DECIMAL(10,2);
ALTER TABLE "SubscriptionPlan" ADD COLUMN "priceSAR" DECIMAL(10,2);
ALTER TABLE "SubscriptionPlan" ADD COLUMN "priceUSD" DECIMAL(10,2);
ALTER TABLE "SubscriptionPlan" ADD COLUMN "medicalPriceAED" DECIMAL(10,2);
ALTER TABLE "SubscriptionPlan" ADD COLUMN "medicalPriceEGP" DECIMAL(10,2);
ALTER TABLE "SubscriptionPlan" ADD COLUMN "medicalPriceSAR" DECIMAL(10,2);
ALTER TABLE "SubscriptionPlan" ADD COLUMN "medicalPriceUSD" DECIMAL(10,2);

-- Step 4: Migrate price data from Price table to SubscriptionPlan
UPDATE "SubscriptionPlan" 
SET 
  "priceAED" = (SELECT "amount" FROM "Price" WHERE "purchasableId" = "SubscriptionPlan"."id" AND "purchasableType" = 'SUBSCRIPTION' AND "currency" = 'AED' AND "id" LIKE '%-NORMAL'),
  "priceEGP" = (SELECT "amount" FROM "Price" WHERE "purchasableId" = "SubscriptionPlan"."id" AND "purchasableType" = 'SUBSCRIPTION' AND "currency" = 'EGP' AND "id" LIKE '%-NORMAL'),
  "priceSAR" = (SELECT "amount" FROM "Price" WHERE "purchasableId" = "SubscriptionPlan"."id" AND "purchasableType" = 'SUBSCRIPTION' AND "currency" = 'SAR' AND "id" LIKE '%-NORMAL'),
  "priceUSD" = (SELECT "amount" FROM "Price" WHERE "purchasableId" = "SubscriptionPlan"."id" AND "purchasableType" = 'SUBSCRIPTION' AND "currency" = 'USD' AND "id" LIKE '%-NORMAL'),
  "medicalPriceAED" = (SELECT "amount" FROM "Price" WHERE "purchasableId" = "SubscriptionPlan"."id" AND "purchasableType" = 'SUBSCRIPTION' AND "currency" = 'AED' AND "id" LIKE '%-MEDICAL'),
  "medicalPriceEGP" = (SELECT "amount" FROM "Price" WHERE "purchasableId" = "SubscriptionPlan"."id" AND "purchasableType" = 'SUBSCRIPTION' AND "currency" = 'EGP' AND "id" LIKE '%-MEDICAL'),
  "medicalPriceSAR" = (SELECT "amount" FROM "Price" WHERE "purchasableId" = "SubscriptionPlan"."id" AND "purchasableType" = 'SUBSCRIPTION' AND "currency" = 'SAR' AND "id" LIKE '%-MEDICAL'),
  "medicalPriceUSD" = (SELECT "amount" FROM "Price" WHERE "purchasableId" = "SubscriptionPlan"."id" AND "purchasableType" = 'SUBSCRIPTION' AND "currency" = 'USD' AND "id" LIKE '%-MEDICAL');

-- Step 5: Migrate loyalty transactions to Payment table
INSERT INTO "Payment" (
  "id", "amount", "status", "method", "createdAt", "updatedAt", 
  "userId", "currency", "paymentReference", "paymentableType", "metadata"
)
SELECT 
  gen_random_uuid(),
  "points",
  'SUCCESS',
  'GYMMAWY_COINS',
  "createdAt",
  "createdAt",
  "userId",
  'GYMMAWY_COINS',
  'LOYALTY-MIGRATED-' || "id",
  'SUBSCRIPTION',
  jsonb_build_object('type', 'LOYALTY_POINTS_MIGRATED', 'source', 'MIGRATION', 'sourceId', "id")
FROM "LoyaltyTransaction";

-- Step 6: Remove old fields and tables
ALTER TABLE "Subscription" DROP COLUMN "subscriptionPeriodDays";
ALTER TABLE "Subscription" DROP COLUMN "giftPeriodDays";

-- Step 7: Update enum values
-- First update existing data to match new enum values
UPDATE "Payment" SET "method" = 'INSTAPAY' WHERE "method" = 'INSTA_PAY';
UPDATE "Payment" SET "method" = 'VODAFONECASH' WHERE "method" = 'VODAFONE_CASH';

ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('INSTAPAY', 'VODAFONECASH', 'TABBY', 'TAMARA', 'PAYMOB', 'GYMMAWY_COINS');
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod" USING "method"::text::"PaymentMethod";
DROP TYPE "PaymentMethod_old";

-- Update PaymentStatus enum
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus" USING "status"::text::"PaymentStatus";
DROP TYPE "PaymentStatus_old";

-- Step 8: Remove unused tables
DROP TABLE "LoyaltyTransaction";
DROP TABLE "Price";

-- Step 9: Remove title fields
ALTER TABLE "Transformation" DROP COLUMN "title";
ALTER TABLE "Video" DROP COLUMN "title";

-- Step 10: Remove unused enum
DROP TYPE "PurchasableType";
