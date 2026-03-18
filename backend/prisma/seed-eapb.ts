import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const eapbData = [
    'Comfamiliar de Nariño',
    'Nueva EPS',
    'Asmet Salud',
    'Emssanar',
    'Sanitas',
    'AIC',
];

async function main() {
    console.log('Iniciando migración de datos EAPB...');

    try {
        for (const name of eapbData) {
            const exists = await prisma.eapb.findFirst({ where: { name } });
            if (!exists) {
                await prisma.eapb.create({ data: { name } });
                console.log(`  ✅ Creado: ${name}`);
            } else {
                console.log(`  ⏭️  Ya existe: ${name}`);
            }
        }
        console.log('\n🎉 Migración EAPB completada con éxito.');
    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
