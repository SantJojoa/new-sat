import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const eapbData = [
    'Asmet Salud',
    'Comfamiliar de Nariño',
    'Emmsanar',
    'Nueva EPS',
    'Sanias',
];

const actoresData = [
    'Gerente o Delegado',
    'Gestor Municipal',
    'Coordinador de Vigilancia SP',
];

async function main() {
    console.log('Iniciando seed de datos EAPB...');

    try {
        for (const name of eapbData) {
            const exists = await prisma.eapb.findFirst({ where: { name } });
            if (!exists) {
                await prisma.eapb.create({ data: { name } });
                console.log(`  ✅ EAPB creada: ${name}`);
            } else {
                console.log(`  ⏭️  EAPB ya existe: ${name}`);
            }
        }

        for (const name of actoresData) {
            const exists = await prisma.eapb_actores.findFirst({ where: { name } });
            if (!exists) {
                await prisma.eapb_actores.create({ data: { name } });
                console.log(`  ✅ Actor creado: ${name}`);
            } else {
                console.log(`  ⏭️  Actor ya existe: ${name}`);
            }
        }

        console.log('\n🎉 Seed EAPB completado con éxito.');
    } catch (error) {
        console.error('Error durante el seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
