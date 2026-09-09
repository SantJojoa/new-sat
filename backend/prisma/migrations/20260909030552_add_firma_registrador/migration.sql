-- AlterTable: agregar como opcional primero (tabla ya tiene filas en producción)
ALTER TABLE "asesorias" ADD COLUMN     "firma_registrador_token" TEXT,
ADD COLUMN     "firma_registrador_data" TEXT,
ADD COLUMN     "firma_registrador_ip" TEXT,
ADD COLUMN     "firmado_registrador_at" TIMESTAMP(3);

-- Rellenar un token único por cada asesoría existente
UPDATE "asesorias"
SET "firma_registrador_token" = md5(id || clock_timestamp()::text || random()::text)
WHERE "firma_registrador_token" IS NULL;

-- Ahora sí, hacerla obligatoria
ALTER TABLE "asesorias" ALTER COLUMN "firma_registrador_token" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "asesorias_firma_registrador_token_key" ON "asesorias"("firma_registrador_token");
