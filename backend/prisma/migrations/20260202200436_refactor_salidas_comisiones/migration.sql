-- AlterTable
ALTER TABLE "user_types" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0;

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
    "name" TEXT NOT NULL,
    "nit" TEXT,
    "municipio_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ips_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "organizaciones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizaciones_pkey" PRIMARY KEY ("id")
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
    "solicitante_id" TEXT NOT NULL,
    "aprobador_id" TEXT,
    "area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SalidasMunicipios" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasMunicipios_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalidasIps" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasIps_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalidasEntidades" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasEntidades_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalidasEapb" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasEapb_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalidasOrganizaciones" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalidasOrganizaciones_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_user_type_id_module_id_key" ON "permissions"("user_type_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_code_key" ON "municipios"("code");

-- CreateIndex
CREATE UNIQUE INDEX "salidas_codigo_key" ON "salidas"("codigo");

-- CreateIndex
CREATE INDEX "_SalidasMunicipios_B_index" ON "_SalidasMunicipios"("B");

-- CreateIndex
CREATE INDEX "_SalidasIps_B_index" ON "_SalidasIps"("B");

-- CreateIndex
CREATE INDEX "_SalidasEntidades_B_index" ON "_SalidasEntidades"("B");

-- CreateIndex
CREATE INDEX "_SalidasEapb_B_index" ON "_SalidasEapb"("B");

-- CreateIndex
CREATE INDEX "_SalidasOrganizaciones_B_index" ON "_SalidasOrganizaciones"("B");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_type_id_fkey" FOREIGN KEY ("user_type_id") REFERENCES "user_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ips" ADD CONSTRAINT "ips_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_aprobador_id_fkey" FOREIGN KEY ("aprobador_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasMunicipios" ADD CONSTRAINT "_SalidasMunicipios_A_fkey" FOREIGN KEY ("A") REFERENCES "municipios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasMunicipios" ADD CONSTRAINT "_SalidasMunicipios_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasIps" ADD CONSTRAINT "_SalidasIps_A_fkey" FOREIGN KEY ("A") REFERENCES "ips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasIps" ADD CONSTRAINT "_SalidasIps_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasEntidades" ADD CONSTRAINT "_SalidasEntidades_A_fkey" FOREIGN KEY ("A") REFERENCES "entidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasEntidades" ADD CONSTRAINT "_SalidasEntidades_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasEapb" ADD CONSTRAINT "_SalidasEapb_A_fkey" FOREIGN KEY ("A") REFERENCES "eapb"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasEapb" ADD CONSTRAINT "_SalidasEapb_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasOrganizaciones" ADD CONSTRAINT "_SalidasOrganizaciones_A_fkey" FOREIGN KEY ("A") REFERENCES "organizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalidasOrganizaciones" ADD CONSTRAINT "_SalidasOrganizaciones_B_fkey" FOREIGN KEY ("B") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
