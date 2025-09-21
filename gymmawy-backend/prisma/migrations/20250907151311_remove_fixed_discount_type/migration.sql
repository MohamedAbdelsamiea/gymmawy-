/*
  Warnings:

  - The values [FIXED] on the enum `CouponDiscountType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."CouponDiscountType_new" AS ENUM ('PERCENTAGE');
ALTER TABLE "public"."Coupon" ALTER COLUMN "discountType" TYPE "public"."CouponDiscountType_new" USING ("discountType"::text::"public"."CouponDiscountType_new");
ALTER TYPE "public"."CouponDiscountType" RENAME TO "CouponDiscountType_old";
ALTER TYPE "public"."CouponDiscountType_new" RENAME TO "CouponDiscountType";
DROP TYPE "public"."CouponDiscountType_old";
COMMIT;
