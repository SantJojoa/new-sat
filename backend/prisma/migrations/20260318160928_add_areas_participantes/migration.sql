/*
  Warnings:

  - You are about to drop the column `usersId` on the `solicitudes_union` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "solicitudes_union" DROP CONSTRAINT "solicitudes_union_usersId_fkey";

-- AlterTable
ALTER TABLE "solicitudes_union" DROP COLUMN "usersId";

-- CreateTable
CREATE TABLE "_SalidasAreasParticipantes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasAreasParticipantes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SalidasAreasParticipantes_B_index" ON "_SalidasAreasParticipantes"("B");

-- AddForeignKey
ALTER TABLE "_SalidasAreasParticipantes" ADD CONSTRAINT "_SalidasAreasParticipantes_A_fkey" FOREIGN KEY ("A") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasAreasParticipantes" ADD CONSTRAINT "_SalidasAreasParticipantes_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
