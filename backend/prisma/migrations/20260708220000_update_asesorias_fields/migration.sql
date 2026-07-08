-- DropForeignKey
ALTER TABLE "asesoria_compromisos" DROP CONSTRAINT IF EXISTS "asesoria_compromisos_asesoria_id_fkey";

-- AlterTable
ALTER TABLE "asesoria_asistentes" ALTER COLUMN "identificacion" DROP NOT NULL,
ALTER COLUMN "cargo" SET NOT NULL;

-- AlterTable
ALTER TABLE "asesorias" DROP COLUMN "lugar",
ADD COLUMN     "hora_fin" TEXT;

-- Backfill hora_fin for existing rows using hora + duracion_minutos
UPDATE "asesorias"
SET "hora_fin" = to_char(("hora"::time + ("duracion_minutos" || ' minutes')::interval)::time, 'HH24:MI')
WHERE "hora_fin" IS NULL;

ALTER TABLE "asesorias" ALTER COLUMN "hora_fin" SET NOT NULL;

-- DropTable
DROP TABLE "asesoria_compromisos";
