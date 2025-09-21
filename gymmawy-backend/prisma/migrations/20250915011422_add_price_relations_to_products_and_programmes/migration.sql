/*
  Warnings:

  - The values [ORDER,PROGRAMME_PURCHASE] on the enum `PurchasableType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PurchasableType_new" AS ENUM ('PRODUCT', 'PROGRAMME', 'MEDICAL_SUBSCRIPTION', 'SUBSCRIPTION');
ALTER TABLE "public"."Price" ALTER COLUMN "purchasableType" TYPE "public"."PurchasableType_new" USING ("purchasableType"::text::"public"."PurchasableType_new");
ALTER TABLE "public"."Payment" ALTER COLUMN "paymentableType" TYPE "public"."PurchasableType_new" USING ("paymentableType"::text::"public"."PurchasableType_new");
ALTER TYPE "public"."PurchasableType" RENAME TO "PurchasableType_old";
ALTER TYPE "public"."PurchasableType_new" RENAME TO "PurchasableType";
DROP TYPE "public"."PurchasableType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Programme" ADD COLUMN     "priceAED" DECIMAL(10,2),
ADD COLUMN     "priceEGP" DECIMAL(10,2),
ADD COLUMN     "priceSAR" DECIMAL(10,2),
ADD COLUMN     "priceUSD" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Price_purchasableType_idx" ON "public"."Price"("purchasableType");

-- AddForeignKey
ALTER TABLE "public"."Price" ADD CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("purchasableId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Price" ADD CONSTRAINT "Price_programmeId_fkey" FOREIGN KEY ("purchasableId") REFERENCES "public"."Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
