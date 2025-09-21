-- CreateEnum
CREATE TYPE "public"."ProgrammePurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Programme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgrammePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "status" "public"."ProgrammePurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "purchaseNumber" TEXT NOT NULL,
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammePurchase_purchaseNumber_key" ON "public"."ProgrammePurchase"("purchaseNumber");

-- AddForeignKey
ALTER TABLE "public"."ProgrammePurchase" ADD CONSTRAINT "ProgrammePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammePurchase" ADD CONSTRAINT "ProgrammePurchase_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "public"."Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
