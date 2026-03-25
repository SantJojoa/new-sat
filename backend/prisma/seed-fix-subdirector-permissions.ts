import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixSubdirectorPermissions() {
    console.log('🔄 Actualizando permisos de subdirector en solicitar_salida...');

    const SUBDIRECTOR_USER_TYPE_ID = 'cml5m06e80001kon9y2rl44jf';

    const module = await prisma.modules.findUnique({ where: { name: 'solicitar_salida' } });

    if (!module) {
        console.error('❌ Módulo "solicitar_salida" no encontrado.');
        return;
    }

    const updated = await prisma.permissions.updateMany({
        where: {
            user_type_id: SUBDIRECTOR_USER_TYPE_ID,
            module_id: module.id,
        },
        data: {
            can_create: true,
        },
    });

    if (updated.count === 0) {
        console.warn('⚠️  No se encontró el permiso para actualizar. Verifica que exista la combinación user_type_id + module_id.');
    } else {
        console.log(`✅ Permiso can_create actualizado a TRUE para subdirector en "solicitar_salida". (${updated.count} registro(s) afectado(s))`);
    }

    console.log('\n🎉 Actualización completada!');
}

fixSubdirectorPermissions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
