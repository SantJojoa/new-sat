/*
  Warnings:

  - Added the required column `firma_token` to the `asesoria_asistentes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "asesoria_asistentes" ADD COLUMN     "firma_token" TEXT NOT NULL;
