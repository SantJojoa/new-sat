    -- DropIndex
DROP INDEX "salida_eapb_salida_id_eapb_id_key";

-- DropIndex
DROP INDEX "salida_ips_salida_id_ips_id_key";

-- AlterTable
ALTER TABLE "salidas" ADD COLUMN     "seguimiento_capacitacionesId" TEXT;

-- CreateTable
CREATE TABLE "seguimiento_articulacion_iv" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "se_realizo_vsp" BOOLEAN NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimiento_articulacion_iv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimiento_ivc" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "se_realizo" BOOLEAN NOT NULL,
    "num_autocomisorio" INTEGER,
    "fecha_autocomisorio" TIMESTAMP(3),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimiento_ivc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimiento_capacitaciones" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "se_realizo" BOOLEAN NOT NULL,
    "num_instituciones_asistieron" INTEGER,
    "num_total_asistentes" INTEGER,
    "evaluacion_satisfaccion" DOUBLE PRECISION,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimiento_capacitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimiento_acompanamiento" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimiento_acompanamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asesorias" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "medio" TEXT NOT NULL,
    "institucion" TEXT NOT NULL,
    "municipio_procedencia_id" TEXT,
    "municipio_otro" TEXT,
    "lugar" TEXT NOT NULL,
    "temas_tratados" TEXT NOT NULL,
    "material_entregado" TEXT NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'registrada',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrador_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asesorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asesoria_asistentes" (
    "id" TEXT NOT NULL,
    "asesoria_id" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "movil" TEXT,

    CONSTRAINT "asesoria_asistentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asesoria_compromisos" (
    "id" TEXT NOT NULL,
    "asesoria_id" TEXT NOT NULL,
    "compromiso" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "fecha" TIMESTAMP(3),
    "observaciones" TEXT,

    CONSTRAINT "asesoria_compromisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_articulacion_iv_salida_id_key" ON "seguimiento_articulacion_iv"("salida_id");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_ivc_salida_id_key" ON "seguimiento_ivc"("salida_id");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_capacitaciones_salida_id_key" ON "seguimiento_capacitaciones"("salida_id");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_acompanamiento_salida_id_key" ON "seguimiento_acompanamiento"("salida_id");

-- CreateIndex
CREATE UNIQUE INDEX "asesorias_codigo_key" ON "asesorias"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "salida_eapb_salida_id_eapb_id_actor_id_key" ON "salida_eapb"("salida_id", "eapb_id", "actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "salida_ips_salida_id_ips_id_actor_id_key" ON "salida_ips"("salida_id", "ips_id", "actor_id");

-- AddForeignKey
ALTER TABLE "seguimiento_articulacion_iv" ADD CONSTRAINT "seguimiento_articulacion_iv_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_ivc" ADD CONSTRAINT "seguimiento_ivc_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_capacitaciones" ADD CONSTRAINT "seguimiento_capacitaciones_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_acompanamiento" ADD CONSTRAINT "seguimiento_acompanamiento_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesorias" ADD CONSTRAINT "asesorias_registrador_id_fkey" FOREIGN KEY ("registrador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesorias" ADD CONSTRAINT "asesorias_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesorias" ADD CONSTRAINT "asesorias_municipio_procedencia_id_fkey" FOREIGN KEY ("municipio_procedencia_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesoria_asistentes" ADD CONSTRAINT "asesoria_asistentes_asesoria_id_fkey" FOREIGN KEY ("asesoria_id") REFERENCES "asesorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesoria_compromisos" ADD CONSTRAINT "asesoria_compromisos_asesoria_id_fkey" FOREIGN KEY ("asesoria_id") REFERENCES "asesorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
