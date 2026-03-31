import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const eapbFinal = [
    'Asmet Salud',
    'Comfamiliar de Nariño',
    'Emmsanar',
    'Nueva EPS',
    'Sanias',
];

const eapbRenames: Record<string, string> = {
    'Emssanar': 'Emmsanar',
};

const eapbToDelete = ['AIC', 'Sanitas', 'Gerente o Delegado', 'Gestor Municipal', 'Coordinador de Vigilancia SP'];

const actoresData = [
    'Gerente o Delegado',
    'Gestor Municipal',
    'Coordinador de Vigilancia SP',
];

async function main() {
    console.log('Iniciando actualización de datos EAPB...');

    // 1. Rename entries
    for (const [oldName, newName] of Object.entries(eapbRenames)) {
        const existing = await prisma.eapb.findFirst({ where: { name: oldName } });
        if (existing) {
            await prisma.eapb.update({ where: { id: existing.id }, data: { name: newName } });
            console.log(`  ✏️  Renombrado: "${oldName}" → "${newName}"`);
        }
    }

    // 2. Delete unwanted entries (only if no salidas reference them)
    for (const name of eapbToDelete) {
        const existing = await prisma.eapb.findFirst({ where: { name } });
        if (existing) {
            const inUse = await prisma.salida_eapb.count({ where: { eapb_id: existing.id } });
            if (inUse === 0) {
                await prisma.eapb.delete({ where: { id: existing.id } });
                console.log(`  🗑️  Eliminado: "${name}"`);
            } else {
                console.log(`  ⚠️  No se puede eliminar "${name}" porque tiene ${inUse} salida(s) asociada(s)`);
            }
        } else {
            console.log(`  ℹ️  No existe: "${name}"`);
        }
    }

    // 3. Ensure final EAPB list exists
    for (const name of eapbFinal) {
        const exists = await prisma.eapb.findFirst({ where: { name } });
        if (!exists) {
            await prisma.eapb.create({ data: { name } });
            console.log(`  ✅ Creado: "${name}"`);
        } else {
            console.log(`  ⏭️  Ya existe: "${name}"`);
        }
    }

    // 4. Seed eapb_actores
    console.log('\nIniciando seed de actores EAPB...');
    for (const name of actoresData) {
        const exists = await prisma.eapb_actores.findFirst({ where: { name } });
        if (!exists) {
            await prisma.eapb_actores.create({ data: { name } });
            console.log(`  ✅ Actor creado: "${name}"`);
        } else {
            console.log(`  ⏭️  Actor ya existe: "${name}"`);
        }
    }

    console.log('\n🎉 Actualización EAPB completada con éxito.');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
