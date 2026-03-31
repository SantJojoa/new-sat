-- CreateTable
CREATE TABLE "eapb_actores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eapb_actores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salida_eapb" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "eapb_id" TEXT NOT NULL,
    "actor_id" TEXT,

    CONSTRAINT "salida_eapb_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eapb_actores_name_key" ON "eapb_actores"("name");

-- CreateIndex
CREATE UNIQUE INDEX "salida_eapb_salida_id_eapb_id_key" ON "salida_eapb"("salida_id", "eapb_id");

-- AddForeignKey
ALTER TABLE "salida_eapb" ADD CONSTRAINT "salida_eapb_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_eapb" ADD CONSTRAINT "salida_eapb_eapb_id_fkey" FOREIGN KEY ("eapb_id") REFERENCES "eapb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_eapb" ADD CONSTRAINT "salida_eapb_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "eapb_actores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MigrateData: move existing implicit eapb<->salidas relations to new junction table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_SalidasEapb') THEN
        INSERT INTO "salida_eapb" ("id", "salida_id", "eapb_id")
        SELECT gen_random_uuid()::text, "B", "A"
        FROM "_SalidasEapb"
        ON CONFLICT ("salida_id", "eapb_id") DO NOTHING;

        DROP TABLE "_SalidasEapb";
    END IF;
END $$;
