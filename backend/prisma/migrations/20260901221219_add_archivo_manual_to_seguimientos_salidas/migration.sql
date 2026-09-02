-- AlterTable
ALTER TABLE "seguimiento_articulacion_iv" ADD COLUMN     "archivo_manual" BYTEA,
ADD COLUMN     "archivo_manual_nombre" TEXT;

-- AlterTable
ALTER TABLE "seguimiento_capacitaciones" ADD COLUMN     "archivo_manual" BYTEA,
ADD COLUMN     "archivo_manual_nombre" TEXT;

-- AlterTable
ALTER TABLE "seguimiento_ivc" ADD COLUMN     "archivo_manual" BYTEA,
ADD COLUMN     "archivo_manual_nombre" TEXT;
