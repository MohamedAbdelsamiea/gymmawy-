/*
  Warnings:

  - You are about to drop the column `discountType` on the `Coupon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Coupon" DROP COLUMN "discountType";

-- DropEnum
DROP TYPE "public"."CouponDiscountType";
