/*
  Warnings:

  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - Added the required column `description_en` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description_th` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_en` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_th` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_brandId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "description_en" TEXT NOT NULL,
ADD COLUMN     "description_th" TEXT NOT NULL,
ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name_en" TEXT NOT NULL,
ADD COLUMN     "name_th" TEXT NOT NULL,
ADD COLUMN     "specs_en" TEXT[],
ADD COLUMN     "specs_th" TEXT[];

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
