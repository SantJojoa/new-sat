/*
  Warnings:

  - The `instituciones_convocadas` column on the `salidas` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "salidas" DROP COLUMN "instituciones_convocadas",
ADD COLUMN     "instituciones_convocadas" INTEGER DEFAULT 0;
