import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testDates() {
    const salidas = await prisma.salidas.findMany({ select: { id: true, codigo: true, fecha_inicio: true, fecha_final: true } });
    console.log("Existing dates:", salidas);

    const start = new Date("2026-03-02");
    const end = new Date("2026-03-03");

    console.log("Checking overlap with start:", start, "end:", end);
    const conflicts = await prisma.salidas.findMany({
        where: {
            fecha_inicio: { lte: end },
            fecha_final: { gte: start },
        }
    });

    console.log("Conflicts found:", conflicts.map(c => c.codigo));
    process.exit(0);
}
testDates();
