import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function seedRolesAndPermissions() {
    console.log('🌱 Seeding roles and permissions...');

    // 1. Crear tipos de usuario con niveles jerárquicos
    const userTypes = await Promise.all([
        // Superadmin - Nivel 0
        prisma.user_types.upsert({
            where: { name: 'superadmin' },
            update: { level: 0 },
            create: {
                name: 'superadmin',
                description: 'Super Administrador - Acceso completo',
                level: 0,
            },
        }),
        // Administrador de subdirección - Nivel 1
        prisma.user_types.upsert({
            where: { name: 'admin_subdireccion' },
            update: { level: 1 },
            create: {
                name: 'admin_subdireccion',
                description: 'Administrador de Subdirección - Aprueba salidas',
                level: 1,
            },
        }),
        // Líder - Nivel 2
        prisma.user_types.upsert({
            where: { name: 'lider' },
            update: { level: 2 },
            create: {
                name: 'lider',
                description: 'Líder - Crea y modifica salidas',
                level: 2,
            },
        }),
        // Usuario normal - Nivel 3
        prisma.user_types.upsert({
            where: { name: 'usuario' },
            update: { level: 3 },
            create: {
                name: 'usuario',
                description: 'Usuario Normal - Funciones básicas',
                level: 3,
            },
        }),
    ]);

    console.log('✅ Tipos de usuario creados:', userTypes.length);

    // 2. Crear módulos del sistema
    const modules = await Promise.all([
        prisma.modules.upsert({
            where: { name: 'dashboard' },
            update: {},
            create: {
                name: 'dashboard',
                description: 'Panel Principal',
                icon: 'LayoutDashboard',
                path: '/dashboard',
                order: 1,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'usuarios' },
            update: {},
            create: {
                name: 'usuarios',
                description: 'Gestión de Usuarios',
                icon: 'Users',
                path: '/users',
                order: 2,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'salidas' },
            update: {},
            create: {
                name: 'salidas',
                description: 'Gestión de Salidas',
                icon: 'Package',
                path: '/salidas',
                order: 3,
            },
        }),
    ]);

    console.log('✅ Módulos creados:', modules.length);

    // 3. Configurar permisos según jerarquía

    // Permisos para SUPERADMIN (todo + usuarios)
    for (const module of modules) {
        await prisma.permissions.upsert({
            where: {
                user_type_id_module_id: {
                    user_type_id: userTypes[0].id, // superadmin
                    module_id: module.id,
                },
            },
            update: {},
            create: {
                user_type_id: userTypes[0].id,
                module_id: module.id,
                can_view: true,
                can_create: module.name === 'usuarios' || module.name !== 'usuarios',
                can_edit: true,
                can_delete: true,
                can_approve: true,
            },
        });
    }

    // Permisos para ADMIN_SUBDIRECCION (todo - usuarios + aprobar salidas)
    for (const module of modules) {
        if (module.name === 'usuarios') {
            // Solo vista para usuarios, no puede crear/editar/eliminar
            await prisma.permissions.upsert({
                where: {
                    user_type_id_module_id: {
                        user_type_id: userTypes[1].id, // admin_subdireccion
                        module_id: module.id,
                    },
                },
                update: {},
                create: {
                    user_type_id: userTypes[1].id,
                    module_id: module.id,
                    can_view: true,
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                    can_approve: false,
                },
            });
        } else {
            await prisma.permissions.upsert({
                where: {
                    user_type_id_module_id: {
                        user_type_id: userTypes[1].id,
                        module_id: module.id,
                    },
                },
                update: {},
                create: {
                    user_type_id: userTypes[1].id,
                    module_id: module.id,
                    can_view: true,
                    can_create: true,
                    can_edit: true,
                    can_delete: true,
                    can_approve: module.name === 'salidas', // Puede aprobar solo en salidas
                },
            });
        }
    }

    // Permisos para LÍDER (todo - usuarios + crear/modificar salidas)
    for (const module of modules) {
        if (module.name === 'usuarios') {
            // Solo vista para usuarios
            await prisma.permissions.upsert({
                where: {
                    user_type_id_module_id: {
                        user_type_id: userTypes[2].id, // lider
                        module_id: module.id,
                    },
                },
                update: {},
                create: {
                    user_type_id: userTypes[2].id,
                    module_id: module.id,
                    can_view: true,
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                    can_approve: false,
                },
            });
        } else {
            await prisma.permissions.upsert({
                where: {
                    user_type_id_module_id: {
                        user_type_id: userTypes[2].id,
                        module_id: module.id,
                    },
                },
                update: {},
                create: {
                    user_type_id: userTypes[2].id,
                    module_id: module.id,
                    can_view: true,
                    can_create: module.name === 'salidas', // Puede crear solo en salidas
                    can_edit: module.name === 'salidas', // Puede editar solo en salidas
                    can_delete: module.name === 'salidas', // Puede eliminar solo en salidas
                    can_approve: false, // No puede aprobar
                },
            });
        }
    }

    // Permisos para USUARIO NORMAL (vista básica, sin crear/gestionar)
    const userModules = ['dashboard', 'salidas', 'reportes'];

    for (const module of modules) {
        if (userModules.includes(module.name)) {
            await prisma.permissions.upsert({
                where: {
                    user_type_id_module_id: {
                        user_type_id: userTypes[3].id, // usuario
                        module_id: module.id,
                    },
                },
                update: {},
                create: {
                    user_type_id: userTypes[3].id,
                    module_id: module.id,
                    can_view: true,
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                    can_approve: false,
                },
            });
        }
    }

    console.log('✅ Permisos configurados');

    // 4. Crear usuarios de ejemplo para cada rol
    const subdireccion = await prisma.subdirecciones.upsert({
        where: { name: 'Subdirección TI' },
        update: {},
        create: {
            name: 'Subdirección TI',
            description: 'Subdirección de Tecnologías de la Información',
        },
    });

    const area = await prisma.areas.upsert({
        where: { name: 'Desarrollo' },
        update: {},
        create: {
            name: 'Desarrollo',
            subdireccion_id: subdireccion.id,
        },
    });

    const exampleUsers = [
        {
            username: 'superadmin',
            password: 'super123',
            user_type: 'superadmin',
            names: 'Super',
            last_name: 'Administrador',
            num_id: '10000001',
            email: 'superadmin@idsn.gov.co',
            area_id: area.id,
            charge: 'Super Administrador del Sistema',
        },
        {
            username: 'adminsub',
            password: 'admin123',
            user_type: 'admin_subdireccion',
            names: 'Ana',
            last_name: 'Gómez',
            num_id: '10000002',
            email: 'ana.gomez@idsn.gov.co',
            area_id: area.id,
            charge: 'Administradora de Subdirección',
        },
        {
            username: 'lider',
            password: 'lider123',
            user_type: 'lider',
            names: 'Carlos',
            last_name: 'Rodríguez',
            num_id: '10000003',
            email: 'carlos.rodriguez@idsn.gov.co',
            area_id: area.id,
            charge: 'Líder',
        },
        {
            username: 'usuario1',
            password: 'user123',
            user_type: 'usuario',
            names: 'María',
            last_name: 'López',
            num_id: '10000004',
            email: 'maria.lopez@idsn.gov.co',
            area_id: area.id,
            charge: 'Analista',
        },
    ];

    for (const userData of exampleUsers) {
        const userType = userTypes.find(ut => ut.name === userData.user_type);
        if (!userType) continue;

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        await prisma.users.upsert({
            where: { username: userData.username },
            update: {},
            create: {
                username: userData.username,
                password: hashedPassword,
                user_type_id: userType.id,
                names: userData.names,
                last_name: userData.last_name,
                num_id: userData.num_id,
                email: userData.email,
                area_id: userData.area_id,
                charge: userData.charge,
            },
        });
    }

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n📋 Credenciales de prueba:');
    console.log('┌──────────────────────┬─────────────┬─────────────────────────────┐');
    console.log('│ Usuario              │ Contraseña  │ Rol                         │');
    console.log('├──────────────────────┼─────────────┼─────────────────────────────┤');
    console.log('│ superadmin           │ super123    │ Super Administrador         │');
    console.log('│ adminsub             │ admin123    │ Admin Subdirección          │');
    console.log('│ liderpro             │ lider123    │ Líder                       │');
    console.log('│ usuario1             │ user123     │ Usuario Normal              │');
    console.log('└──────────────────────┴─────────────┴─────────────────────────────┘');

    console.log('\n🔐 Resumen de permisos por rol:');
    console.log('┌──────────────────────┬─────────────────────────────────────────────────────────────┐');
    console.log('│ Rol                  │ Permisos                                                    │');
    console.log('├──────────────────────┼─────────────────────────────────────────────────────────────┤');
    console.log('│ Super Administrador  │ ✅ Todo + Crear/Gestionar usuarios                          │');
    console.log('│ Admin Subdirección   │ ✅ Todo (menos usuarios) + Aprobar salidas                  │');
    console.log('│ Líder                │ ✅ Todo (menos usuarios) + Crear/Modificar salidas         │');
    console.log('│ Usuario Normal       │ 👁️ Vista: Dashboard, Salidas, Reportes                     │');
    console.log('└──────────────────────┴─────────────────────────────────────────────────────────────┘');
}

seedRolesAndPermissions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());