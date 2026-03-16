-- Add subdireccion relation to users
ALTER TABLE "users" ADD COLUMN "subdireccion_id" TEXT;

ALTER TABLE "users"
ADD CONSTRAINT "users_subdireccion_id_fkey"
FOREIGN KEY ("subdireccion_id") REFERENCES "subdirecciones"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
