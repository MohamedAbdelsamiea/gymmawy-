-- AddForeignKey
ALTER TABLE "public"."Price" ADD CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("purchasableId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Price" ADD CONSTRAINT "Price_programmeId_fkey" FOREIGN KEY ("purchasableId") REFERENCES "public"."Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
