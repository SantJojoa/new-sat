-- AlterTable
ALTER TABLE "salidas" ADD COLUMN     "instituciones_convocadas" INTEGER DEFAULT 0,
ADD COLUMN     "lugar_evento_id" TEXT,
ADD COLUMN     "transporte_medio" TEXT,
ADD COLUMN     "transporte_responsables" TEXT;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_lugar_evento_id_fkey" FOREIGN KEY ("lugar_evento_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
