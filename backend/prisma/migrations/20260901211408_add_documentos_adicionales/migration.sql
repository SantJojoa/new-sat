-- CreateTable
CREATE TABLE "documentos_adicionales" (
    "id" TEXT NOT NULL,
    "seguimiento_type" TEXT NOT NULL,
    "seguimiento_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "archivo" BYTEA NOT NULL,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_adicionales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentos_adicionales_seguimiento_type_seguimiento_id_idx" ON "documentos_adicionales"("seguimiento_type", "seguimiento_id");

-- AddForeignKey
ALTER TABLE "documentos_adicionales" ADD CONSTRAINT "documentos_adicionales_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
