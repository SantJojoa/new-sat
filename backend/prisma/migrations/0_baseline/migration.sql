-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdireccion_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdirecciones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subdirecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_type_id" TEXT NOT NULL,
    "names" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "num_id" TEXT NOT NULL,
    "area_id" TEXT,
    "subdireccion_id" TEXT,
    "charge" TEXT,
    "email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "path" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "user_type_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_approve" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ips" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ips_actores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ips_actores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salida_ips" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "ips_id" TEXT NOT NULL,
    "actor_id" TEXT,

    CONSTRAINT "salida_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entidades" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eapb" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eapb_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "organizaciones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idsn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idsn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salidas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo_salida" TEXT NOT NULL,
    "subtipo_salida" TEXT,
    "tema" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_final" TIMESTAMP(3) NOT NULL,
    "jornada" TEXT NOT NULL,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_aprobacion" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "observaciones" TEXT,
    "transporte_medio" TEXT,
    "transporte_responsables" TEXT,
    "instituciones_convocadas" INTEGER DEFAULT 0,
    "municipios_convocados" TEXT,
    "lugar_evento_id" TEXT,
    "solicitante_id" TEXT NOT NULL,
    "aprobador_id" TEXT,
    "area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "seguimiento_capacitacionesId" TEXT,

    CONSTRAINT "salidas_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "articulaciones" (
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

    CONSTRAINT "articulaciones_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "ventana_programacion" (
    "id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventana_programacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_union" (
    "id" TEXT NOT NULL,
    "salida_id" TEXT NOT NULL,
    "solicitante_id" TEXT NOT NULL,
    "area_solicitante_id" TEXT NOT NULL,
    "mensaje" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "respuesta" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_union_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "_SalidasAreasParticipantes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasAreasParticipantes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalidasMunicipios" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasMunicipios_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalidasEntidades" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasEntidades_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalidasOrganizaciones" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasOrganizaciones_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalidasIdsn" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasIdsn_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_name_key" ON "areas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subdirecciones_name_key" ON "subdirecciones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_types_name_key" ON "user_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_num_id_key" ON "users"("num_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_user_type_id_module_id_key" ON "permissions"("user_type_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_code_key" ON "municipios"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ips_type_key" ON "ips"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ips_actores_name_key" ON "ips_actores"("name");

-- CreateIndex
CREATE UNIQUE INDEX "salida_ips_salida_id_ips_id_actor_id_key" ON "salida_ips"("salida_id", "ips_id", "actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "eapb_actores_name_key" ON "eapb_actores"("name");

-- CreateIndex
CREATE UNIQUE INDEX "salida_eapb_salida_id_eapb_id_actor_id_key" ON "salida_eapb"("salida_id", "eapb_id", "actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "salidas_codigo_key" ON "salidas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_articulacion_iv_salida_id_key" ON "seguimiento_articulacion_iv"("salida_id");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_ivc_salida_id_key" ON "seguimiento_ivc"("salida_id");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_capacitaciones_salida_id_key" ON "seguimiento_capacitaciones"("salida_id");

-- CreateIndex
CREATE UNIQUE INDEX "articulaciones_codigo_key" ON "articulaciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ivc_codigo_key" ON "ivc"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "asesorias_codigo_key" ON "asesorias"("codigo");

-- CreateIndex
CREATE INDEX "_SalidasAreasParticipantes_B_index" ON "_SalidasAreasParticipantes"("B");

-- CreateIndex
CREATE INDEX "_SalidasMunicipios_B_index" ON "_SalidasMunicipios"("B");

-- CreateIndex
CREATE INDEX "_SalidasEntidades_B_index" ON "_SalidasEntidades"("B");

-- CreateIndex
CREATE INDEX "_SalidasOrganizaciones_B_index" ON "_SalidasOrganizaciones"("B");

-- CreateIndex
CREATE INDEX "_SalidasIdsn_B_index" ON "_SalidasIdsn"("B");

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_subdireccion_id_fkey" FOREIGN KEY ("subdireccion_id") REFERENCES "subdirecciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_subdireccion_id_fkey" FOREIGN KEY ("subdireccion_id") REFERENCES "subdirecciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_user_type_id_fkey" FOREIGN KEY ("user_type_id") REFERENCES "user_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_type_id_fkey" FOREIGN KEY ("user_type_id") REFERENCES "user_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_ips" ADD CONSTRAINT "salida_ips_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_ips" ADD CONSTRAINT "salida_ips_ips_id_fkey" FOREIGN KEY ("ips_id") REFERENCES "ips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_ips" ADD CONSTRAINT "salida_ips_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "ips_actores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_eapb" ADD CONSTRAINT "salida_eapb_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_eapb" ADD CONSTRAINT "salida_eapb_eapb_id_fkey" FOREIGN KEY ("eapb_id") REFERENCES "eapb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salida_eapb" ADD CONSTRAINT "salida_eapb_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "eapb_actores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_lugar_evento_id_fkey" FOREIGN KEY ("lugar_evento_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_aprobador_id_fkey" FOREIGN KEY ("aprobador_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_articulacion_iv" ADD CONSTRAINT "seguimiento_articulacion_iv_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_ivc" ADD CONSTRAINT "seguimiento_ivc_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_capacitaciones" ADD CONSTRAINT "seguimiento_capacitaciones_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulaciones" ADD CONSTRAINT "articulaciones_lugar_evento_id_fkey" FOREIGN KEY ("lugar_evento_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulaciones" ADD CONSTRAINT "articulaciones_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulaciones" ADD CONSTRAINT "articulaciones_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ivc" ADD CONSTRAINT "ivc_lugar_evento_id_fkey" FOREIGN KEY ("lugar_evento_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ivc" ADD CONSTRAINT "ivc_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ivc" ADD CONSTRAINT "ivc_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_union" ADD CONSTRAINT "solicitudes_union_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_union" ADD CONSTRAINT "solicitudes_union_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_union" ADD CONSTRAINT "solicitudes_union_area_solicitante_id_fkey" FOREIGN KEY ("area_solicitante_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "_SalidasAreasParticipantes" ADD CONSTRAINT "_SalidasAreasParticipantes_A_fkey" FOREIGN KEY ("A") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasAreasParticipantes" ADD CONSTRAINT "_SalidasAreasParticipantes_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasMunicipios" ADD CONSTRAINT "_SalidasMunicipios_A_fkey" FOREIGN KEY ("A") REFERENCES "municipios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasMunicipios" ADD CONSTRAINT "_SalidasMunicipios_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasEntidades" ADD CONSTRAINT "_SalidasEntidades_A_fkey" FOREIGN KEY ("A") REFERENCES "entidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasEntidades" ADD CONSTRAINT "_SalidasEntidades_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasOrganizaciones" ADD CONSTRAINT "_SalidasOrganizaciones_A_fkey" FOREIGN KEY ("A") REFERENCES "organizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasOrganizaciones" ADD CONSTRAINT "_SalidasOrganizaciones_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasIdsn" ADD CONSTRAINT "_SalidasIdsn_A_fkey" FOREIGN KEY ("A") REFERENCES "idsn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasIdsn" ADD CONSTRAINT "_SalidasIdsn_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

