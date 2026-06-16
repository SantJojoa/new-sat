-- Rename "Programar Asesoría" / "Registrar Asesoría" module label to "Datos Asesoria"
UPDATE "modules"
SET "description" = 'Datos Asesoria'
WHERE "name" = 'programar_asesoria';
