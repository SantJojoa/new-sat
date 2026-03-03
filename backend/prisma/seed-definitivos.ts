import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ipsData = [
    "Gerente o delegado", "Medico", "Enfermero", "Psicologo", "Odonologo",
    "Bacteriologo", "Coordinador PYP", "Coordinador SP", "Tecnico Sivigila",
    "Responsable PAI", "Regente Farmacia", "Quimico Farmaceutico",
    "Coordinador/Lider SGSST", "Ref. Afiliacion", "Coordinador Cartera",
    "Coordinador Facturacion", "Coordinador de Atencion al Usuario",
    "Ref. PIC", "Coordinador Seg. Paciente"
];

const entidadesData = [
    "DLS/Secretario de Salud", "Coordinador de Salud Publica",
    "Coordinador de Aseguramiento", "Tecnico de Saneamiento", "Financiero",
    "Coordinador de Gestion del Riesgo", "Alcalde", "Referente PIC"
];

const eapbData = [
    "Gerente o delegado", "Gestor Municipal", "Coordinador de Vigilancia SP"
];

const organizacionesData = [
    "Etnicas", "Academia", "Estable. Farmaceuticos", "Sociales Y Comunitarias",
    "Laboratorio Clinico Privados", "Registraduria-Notarias", "Personeria",
    "Comites", "ARl", "Estable. Objeto de Vigilancia"
];

async function main() {
    console.log('🔄 Iniciando migración de datos definitivos...');

    try {
        // Para IPS
        for (const name of ipsData) {
            const exists = await prisma.ips.findFirst({ where: { name } });
            if (!exists) {
                await prisma.ips.create({ data: { name } });
            }
        }
        console.log(`✅ Migrados datos a tabla IPS`);

        // Para Entidades
        for (const name of entidadesData) {
            const exists = await prisma.entidades.findFirst({ where: { name } });
            if (!exists) {
                await prisma.entidades.create({ data: { name } });
            }
        }
        console.log(`✅ Migrados datos a tabla Entidades`);

        // Para EAPB
        for (const name of eapbData) {
            const exists = await prisma.eapb.findFirst({ where: { name } });
            if (!exists) {
                await prisma.eapb.create({ data: { name } });
            }
        }
        console.log(`✅ Migrados datos a tabla EAPB`);

        // Para Organizaciones
        for (const name of organizacionesData) {
            const exists = await prisma.organizaciones.findFirst({ where: { name } });
            if (!exists) {
                await prisma.organizaciones.create({ data: { name } });
            }
        }
        console.log(`✅ Migrados datos a tabla Organizaciones`);

        console.log('🎉 Migración completada con éxito!');
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
