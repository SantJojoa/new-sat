import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const idsToRemove = {
    organizaciones: ["cml5m075l0015kon9x1zle449", "cml5m075l0016kon9ycw54n7j", "cml5m075l0017kon9wntgc9it"],
    ips: ["cml5m074t000xkon93y4i30vu", "cml5m074t000ykon98akmujcq", "cml5m074t000zkon9n90mbaio", "cml5m074t0010kon9jme9umlt"],
    entidades: ["cml5m074c000tkon9tu15l227", "cml5m074c000ukon9n31l1gho", "cml5m074c000vkon94vwf37a5", "cml5m074c000wkon98leylj3t"],
    eapb: ["cml5m07580011kon921irxvva", "cml5m07590012kon9mysxc61t", "cml5m07590013kon9j676bl2v", "cml5m07590014kon9ly64uh86"],
};

async function main() {
    console.log('Iniciando eliminación de datos de prueba...');

    try {
        const deletedOrganizaciones = await prisma.organizaciones.deleteMany({
            where: {
                id: { in: idsToRemove.organizaciones }
            }
        });
        console.log(`Organizaciones eliminadas: ${deletedOrganizaciones.count}`);

        const deletedIps = await prisma.ips.deleteMany({
            where: {
                id: { in: idsToRemove.ips }
            }
        });
        console.log(`IPS eliminadas: ${deletedIps.count}`);

        const deletedEntidades = await prisma.entidades.deleteMany({
            where: {
                id: { in: idsToRemove.entidades }
            }
        });
        console.log(`Entidades eliminadas: ${deletedEntidades.count}`);

        const deletedEapb = await prisma.eapb.deleteMany({
            where: {
                id: { in: idsToRemove.eapb }
            }
        });
        console.log(`EAPB eliminadas: ${deletedEapb.count}`);

        console.log('Eliminación completada con éxito.');
    } catch (error) {
        console.error('Error durante la eliminación:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
