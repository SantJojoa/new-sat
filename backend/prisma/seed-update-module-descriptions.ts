import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateModuleDescriptions() {
    console.log('🔄 Actualizando descripciones de módulos...');

    const updates = [
        { name: 'solicitar_salida', description: 'Solicitar Programación' },
        { name: 'gestionar_salida', description: 'Gestionar Programación' },
        { name: 'calendario_salidas', description: 'Calendario de Programaciones' },
    ];

    for (const update of updates) {
        const module = await prisma.modules.findUnique({ where: { name: update.name } });
        if (module) {
            await prisma.modules.update({
                where: { name: update.name },
                data: { description: update.description },
            });
            console.log(`  ✅ "${update.name}" → "${update.description}"`);
        } else {
            console.log(`  ⚠️  Módulo "${update.name}" no encontrado, omitiendo.`);
        }
    }

    console.log('\n🎉 Descripciones actualizadas exitosamente!');
}

updateModuleDescriptions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
