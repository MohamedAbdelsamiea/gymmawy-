/*
  Warnings:

  - You are about to drop the column `priceEGP` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `priceSAR` on the `ProductVariant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ProductVariant" DROP COLUMN "priceEGP",
DROP COLUMN "priceSAR";

-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" ADD COLUMN     "medicalLoyaltyAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "medicalLoyaltyRequired" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "medicalPriceEGP" DECIMAL(10,2),
ADD COLUMN     "medicalPriceSAR" DECIMAL(10,2);
