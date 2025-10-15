-- Add reward redemption support to Order and OrderItem models

-- Add fields to Order model
ALTER TABLE "Order" ADD COLUMN "totalAmount" DECIMAL(10,2);
ALTER TABLE "Order" ADD COLUMN "paymentReference" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingAddress" JSONB;
ALTER TABLE "Order" ADD COLUMN "language" TEXT DEFAULT 'en';

-- Add fields to OrderItem model for reward redemptions
ALTER TABLE "OrderItem" ADD COLUMN "rewardId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "category" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "name" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "price" DECIMAL(10,2);
ALTER TABLE "OrderItem" ADD COLUMN "loyaltyPointsUsed" INT;

-- Add indexes for better performance
CREATE INDEX "Order_paymentReference_idx" ON "Order"("paymentReference");
CREATE INDEX "OrderItem_rewardId_idx" ON "OrderItem"("rewardId");
CREATE INDEX "OrderItem_category_idx" ON "OrderItem"("category");
