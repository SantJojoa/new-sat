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
    "usersId" TEXT,

    CONSTRAINT "solicitudes_union_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "solicitudes_union" ADD CONSTRAINT "solicitudes_union_salida_id_fkey" FOREIGN KEY ("salida_id") REFERENCES "salidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_union" ADD CONSTRAINT "solicitudes_union_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_union" ADD CONSTRAINT "solicitudes_union_area_solicitante_id_fkey" FOREIGN KEY ("area_solicitante_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_union" ADD CONSTRAINT "solicitudes_union_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
