/*
  Warnings:

  - You are about to alter the column `couponDiscount` on the `Subscription` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."Subscription" ALTER COLUMN "couponDiscount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."SubscriptionPlan" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "public"."SubscriptionPlan"("isActive");

-- AddForeignKey
ALTER TABLE "public"."Price" ADD CONSTRAINT "Price_subscriptionPlanId_fkey" FOREIGN KEY ("purchasableId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
