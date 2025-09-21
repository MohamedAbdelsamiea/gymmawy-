/*
  Warnings:

  - Made the column `mobileNumber` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "mobileNumber" SET NOT NULL;
