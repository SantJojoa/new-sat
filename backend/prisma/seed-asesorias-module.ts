import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
    const mod = await prisma.modules.upsert({
        where: { name: 'programar_asesoria' },
        update: { description: 'Programar Asesoría', icon: 'support_agent', path: '/programar-asesoria', order: 30, is_active: true },
        create: { name: 'programar_asesoria', description: 'Programar Asesoría', icon: 'support_agent', path: '/programar-asesoria', order: 30, is_active: true },
    });
    console.log('✅ Módulo creado:', mod.name);
    const userTypes = await prisma.user_types.findMany();
    for (const ut of userTypes) {
        const isAdmin = ut.name === 'superadmin';
        await prisma.permissions.upsert({
            where: { user_type_id_module_id: { user_type_id: ut.id, module_id: mod.id } },
            update: {},
            create: { user_type_id: ut.id, module_id: mod.id, can_view: true, can_create: true, can_edit: isAdmin, can_delete: isAdmin, can_approve: isAdmin },
        });
        console.log(`  ✅ Permisos asignados a: ${ut.name}`);
    }
    console.log('🎉 Listo!');
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); await pool.end(); });