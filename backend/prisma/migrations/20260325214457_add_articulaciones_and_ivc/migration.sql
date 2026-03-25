-- CreateTable
CREATE TABLE "ivc" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo_programacion" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_final" TIMESTAMP(3) NOT NULL,
    "jornada" TEXT NOT NULL,
    "instituciones_convocadas" TEXT,
    "transporte_medio" TEXT,
    "transporte_num_instituciones" INTEGER,
    "lugar_evento_id" TEXT,
    "responsable_articulacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "observaciones" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solicitante_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ivc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ivc_codigo_key" ON "ivc"("codigo");

-- AddForeignKey
ALTER TABLE "ivc" ADD CONSTRAINT "ivc_lugar_evento_id_fkey" FOREIGN KEY ("lugar_evento_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ivc" ADD CONSTRAINT "ivc_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ivc" ADD CONSTRAINT "ivc_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
