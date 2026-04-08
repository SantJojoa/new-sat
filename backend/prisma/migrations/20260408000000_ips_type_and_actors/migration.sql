-- Drop implicit M2M join table between salidas and ips (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_SalidasIps') THEN
        DROP TABLE "_SalidasIps";
    END IF;
END $$;

-- Clear existing IPS data (old model with name/nit/municipio_id is being replaced)
DELETE FROM "ips";

-- AlterTable: remove old columns, add new `type` column
ALTER TABLE "ips" DROP COLUMN IF EXISTS "name";
ALTER TABLE "ips" DROP COLUMN IF EXISTS "nit";
ALTER TABLE "ips" DROP COLUMN IF EXISTS "municipio_id";
ALTER TABLE "ips" ADD COLUMN "type" TEXT NOT NULL DEFAULT '';

-- Remove the temporary default
ALTER TABLE "ips" ALTER COLUMN "type" DROP DEFAULT;

-- CreateUniqueIndex on ips.type
CREATE UNIQUE INDEX "ips_type_key" ON "ips"("type");

-- CreateTable: ips_actores
CREATE TABLE "ips_actores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ips_actores_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex on ips_actores.name
CREATE UNIQUE INDEX "ips_actores_name_key" ON "ips_actores"("name");

-- CreateTable: salida_ips
CREATE TABLE "salida_ips" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "ips_id" TEXT NOT NULL,
    "actor_id" TEXT,

    CONSTRAINT "salida_ips_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex on salida_ips
CREATE UNIQUE INDEX "salida_ips_salida_id_ips_id_key" ON "salida_ips"("salida_id", "ips_id");

-- AddForeignKey
ALTER TABLE "salida_ips" ADD CONSTRAINT "salida_ips_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_ips" ADD CONSTRAINT "salida_ips_ips_id_fkey" FOREIGN KEY ("ips_id") REFERENCES "ips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_ips" ADD CONSTRAINT "salida_ips_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "ips_actores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
