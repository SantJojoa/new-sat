import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addCalendarioModule() {
    console.log('📅 Agregando módulo Calendario de Programaciones...');

    // 1. Crear el módulo
    const calendarioModule = await prisma.modules.upsert({
        where: { name: 'calendario_salidas' },
        update: {
            description: 'Calendario de Programaciones',
            icon: 'calendar_month',
            path: '/calendario-salidas',
            order: 5,
            is_active: true,
        },
        create: {
            name: 'calendario_salidas',
            description: 'Calendario de Programaciones',
            icon: 'calendar_month',
            path: '/calendario-salidas',
            order: 5,
            is_active: true,
        },
    });

    console.log('✅ Módulo creado:', calendarioModule.name, '(id:', calendarioModule.id, ')');

    // 2. Obtener todos los user_types
    const userTypes = await prisma.user_types.findMany();

    // 3. Asignar permiso can_view a todos los roles
    for (const ut of userTypes) {
        await prisma.permissions.upsert({
            where: {
                user_type_id_module_id: {
                    user_type_id: ut.id,
                    module_id: calendarioModule.id,
                },
            },
            update: {},
            create: {
                user_type_id: ut.id,
                module_id: calendarioModule.id,
                can_view: true,
                can_create: false,
                can_edit: false,
                can_delete: false,
                can_approve: false,
            },
        });
        console.log(`  ✅ Permiso can_view asignado a: ${ut.name}`);
    }

    console.log('\n🎉 Módulo calendario_salidas (Calendario de Programaciones) agregado exitosamente!');
    console.log('   Ruta: /calendario-salidas');
    console.log('   Icono: calendar_month');
}

addCalendarioModule()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
