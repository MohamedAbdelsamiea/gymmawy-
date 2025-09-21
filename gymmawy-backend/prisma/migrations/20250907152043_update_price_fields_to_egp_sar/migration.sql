/*
  Warnings:

  - You are about to drop the column `price` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - Added the required column `priceEGP` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSAR` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceEGP` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSAR` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceEGP` to the `Programme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSAR` to the `Programme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceEGP` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSAR` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "price",
ADD COLUMN     "priceEGP" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "priceSAR" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "price",
ADD COLUMN     "priceEGP" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "priceSAR" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."ProductVariant" DROP COLUMN "price",
ADD COLUMN     "priceEGP" DECIMAL(10,2),
ADD COLUMN     "priceSAR" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Programme" DROP COLUMN "price",
ADD COLUMN     "priceEGP" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "priceSAR" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" DROP COLUMN "price",
ADD COLUMN     "priceEGP" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "priceSAR" DECIMAL(10,2) NOT NULL;
