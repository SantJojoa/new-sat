-- CreateTable
CREATE TABLE "idsn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idsn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SalidasIdsn" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasIdsn_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SalidasIdsn_B_index" ON "_SalidasIdsn"("B");

-- AddForeignKey
ALTER TABLE "_SalidasIdsn" ADD CONSTRAINT "_SalidasIdsn_A_fkey" FOREIGN KEY ("A") REFERENCES "idsn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasIdsn" ADD CONSTRAINT "_SalidasIdsn_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
