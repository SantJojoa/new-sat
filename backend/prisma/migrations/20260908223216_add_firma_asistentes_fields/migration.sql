/*
  Warnings:

  - A unique constraint covering the columns `[firma_token]` on the table `asesoria_asistentes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "asesoria_asistentes" ADD COLUMN     "firma_data" TEXT,
ADD COLUMN     "firmado_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "asesoria_asistentes_firma_token_key" ON "asesoria_asistentes"("firma_token");
