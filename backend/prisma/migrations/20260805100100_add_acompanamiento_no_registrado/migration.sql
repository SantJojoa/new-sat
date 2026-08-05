-- CreateTable
CREATE TABLE "acompanamientos_no_registrados" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre_reunion" TEXT,
    "fecha_reunion" TIMESTAMP(3),
    "hora_inicial" TEXT,
    "hora_final" TEXT,
    "acta_numero" TEXT,
    "institucion" TEXT,
    "municipio" TEXT,
    "lugar" TEXT,
    "material_entregado" TEXT,
    "asistentes" JSONB,
    "orden_del_dia" JSONB,
    "desarrollo" TEXT,
    "conclusiones" TEXT,
    "compromisos" JSONB,
    "proxima_lugar" TEXT,
    "proxima_fecha" TIMESTAMP(3),
    "proxima_hora" TEXT,
    "archivo_manual" BYTEA,
    "archivo_manual_nombre" TEXT,
    "area_id" TEXT NOT NULL,
    "registrador_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acompanamientos_no_registrados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "acompanamientos_no_registrados_codigo_key" ON "acompanamientos_no_registrados"("codigo");

-- AddForeignKey
ALTER TABLE "acompanamientos_no_registrados" ADD CONSTRAINT "acompanamientos_no_registrados_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanamientos_no_registrados" ADD CONSTRAINT "acompanamientos_no_registrados_registrador_id_fkey" FOREIGN KEY ("registrador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
