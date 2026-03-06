import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const idsnData = [
    "Auxiliar en salud"
];

async function main() {
    console.log('Iniciando migración de datos IDSN...');

    try {
        for (const name of idsnData) {
            const exists = await prisma.idsn.findFirst({ where: { name } });
            if (!exists) {
                await prisma.idsn.create({ data: { name } });
            }
        }
        console.log(`Migrados datos a tabla IDSN`);

        console.log('Migración completada con éxito.');
    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
