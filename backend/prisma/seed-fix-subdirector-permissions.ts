import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixSubdirectorPermissions() {
    console.log('🔄 Actualizando permisos de subdirector en solicitar_salida...');

    const userType = await prisma.user_types.findUnique({ where: { name: 'admin_subdireccion' } });
    const module = await prisma.modules.findUnique({ where: { name: 'solicitar_salida' } });

    if (!userType) {
        console.error('❌ Rol "admin_subdireccion" no encontrado.');
        return;
    }

    if (!module) {
        console.error('❌ Módulo "solicitar_salida" no encontrado.');
        return;
    }

    await prisma.permissions.upsert({
        where: {
            user_type_id_module_id: {
                user_type_id: userType.id,
                module_id: module.id,
            },
        },
        update: {
            can_view: true,
            can_create: true,
        },
        create: {
            user_type_id: userType.id,
            module_id: module.id,
            can_view: true,
            can_create: true,
            can_edit: false,
            can_delete: false,
            can_approve: true,
        },
    });

    console.log('✅ Permiso can_create actualizado a TRUE para admin_subdireccion en "solicitar_salida".');

    console.log('\n🎉 Actualización completada!');
}

fixSubdirectorPermissions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
