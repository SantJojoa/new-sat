-- CreateTable
CREATE TABLE "seguimiento_articulacion" (
    "id" TEXT NOT NULL,
    "articulacion_id" TEXT NOT NULL,
    "se_programo" BOOLEAN NOT NULL DEFAULT false,
    "se_realizo" BOOLEAN NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimiento_articulacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_articulacion_articulacion_id_key" ON "seguimiento_articulacion"("articulacion_id");

-- AddForeignKey
ALTER TABLE "seguimiento_articulacion" ADD CONSTRAINT "seguimiento_articulacion_articulacion_id_fkey" FOREIGN KEY ("articulacion_id") REFERENCES "articulaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
