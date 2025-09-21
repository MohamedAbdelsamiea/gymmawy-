/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentNumber]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionNumber]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderNumber` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentNumber` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionNumber` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "orderNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "paymentNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "subscriptionNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "public"."Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "public"."Payment"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriptionNumber_key" ON "public"."Subscription"("subscriptionNumber");
