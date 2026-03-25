import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

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
            update: {
                icon: 'dashboard',
            },
            create: {
                name: 'dashboard',
                description: 'Panel Principal',
                icon: 'dashboard',
                path: '/dashboard',
                order: 1,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'usuarios' },
            update: {
                icon: 'person_add',
                order: 6,
            },
            create: {
                name: 'usuarios',
                description: 'Gestión de Usuarios',
                icon: 'person_add',
                path: '/users',
                order: 6,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'subdirecciones' },
            update: {
                icon: 'domain',
                order: 4,
            },
            create: {
                name: 'subdirecciones',
                description: 'Gestión de Subdirecciones',
                icon: 'domain',
                path: '/subdirecciones',
                order: 4,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'areas' },
            update: {
                icon: 'layers',
                order: 5,
            },
            create: {
                name: 'areas',
                description: 'Gestión de Áreas',
                icon: 'layers',
                path: '/areas',
                order: 5,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'solicitar_salida' },
            update: {
                icon: 'add_box',
                order: 2,
                description: 'Solicitar Programación',
            },
            create: {
                name: 'solicitar_salida',
                description: 'Solicitar Programación',
                icon: 'add_box',
                path: '/solicitar-salida',
                order: 2,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'gestionar_salida' },
            update: {
                order: 3,
                icon: 'data_table',
                description: 'Gestionar Programación',
            },
            create: {
                name: 'gestionar_salida',
                description: 'Gestionar Programación',
                icon: 'data_table',
                path: '/gestionar-salida',
                order: 3,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'solicitar_articulacion' },
            update: {
                icon: 'hub',
                order: 7,
                description: 'Articulación',
            },
            create: {
                name: 'solicitar_articulacion',
                description: 'Articulación',
                icon: 'hub',
                path: '/solicitar-articulacion',
                order: 7,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'solicitar_ivc' },
            update: {
                icon: 'verified_user',
                order: 8,
                description: 'IVC',
            },
            create: {
                name: 'solicitar_ivc',
                description: 'IVC',
                icon: 'verified_user',
                path: '/solicitar-ivc',
                order: 8,
            },
        }),
        prisma.modules.upsert({
            where: { name: 'gestionar_articulacion' },
            update: { icon: 'table_view', order: 9, description: 'Gestionar Articulaciones' },
            create: { name: 'gestionar_articulacion', description: 'Gestionar Articulaciones', icon: 'table_view', path: '/gestionar-articulacion', order: 9 },
        }),
        prisma.modules.upsert({
            where: { name: 'calendario_articulaciones' },
            update: { icon: 'event', order: 10, description: 'Calendario Articulaciones' },
            create: { name: 'calendario_articulaciones', description: 'Calendario Articulaciones', icon: 'event', path: '/calendario-articulaciones', order: 10 },
        }),
        prisma.modules.upsert({
            where: { name: 'gestionar_ivc' },
            update: { icon: 'table_view', order: 11, description: 'Gestionar IVC' },
            create: { name: 'gestionar_ivc', description: 'Gestionar IVC', icon: 'table_view', path: '/gestionar-ivc', order: 11 },
        }),
        prisma.modules.upsert({
            where: { name: 'calendario_ivc' },
            update: { icon: 'event', order: 12, description: 'Calendario IVC' },
            create: { name: 'calendario_ivc', description: 'Calendario IVC', icon: 'event', path: '/calendario-ivc', order: 12 },
        }),
    ]);

    // Eliminar el modulo 'salidas' antiguo si existe y 'modificar_salida'
    try {
        const modulesToDelete = ['salidas', 'modificar_salida'];
        for (const modName of modulesToDelete) {
            const mod = await prisma.modules.findUnique({ where: { name: modName } });
            if (mod) {
                await prisma.permissions.deleteMany({ where: { module_id: mod.id } });
                await prisma.modules.delete({ where: { id: mod.id } });
                console.log(`🗑️ Módulo antiguo "${modName}" eliminado`);
            }
        }
    } catch (e) {
        console.log('Nom se pudo eliminar el módulo antiguo o no existía:', e);
    }


    console.log('✅ Módulos creados:', modules.length);

    // 3. Configurar permisos según jerarquía

    // Permisos para SUPERADMIN (todo)
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
                can_create: true,
                can_edit: true,
                can_delete: true,
                can_approve: true,
            },
        });
    }

    // Permisos para ADMIN_SUBDIRECCION (usuarios solo ver, lo demas depende)
    // Asumiremos que admin subdireccion no crea salidas solicitadas, solo aprueba (pero aprobación va en otra tabla probablemente, aquí es acceso al modulo)
    // Por ahora le damos vista a todo menos usuarios (solo vista) y sin crear en solicitar salida
    for (const module of modules) {
        if (module.name === 'usuarios' || module.name === 'subdirecciones' || module.name === 'areas') {
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
                    can_view: false, // Changed to false: Only superadmin
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                    can_approve: false,
                },
            });
        } else if (module.name === 'solicitar_salida' || module.name === 'gestionar_salida') {
            // Admin subdireccion no solicita ni modifica salidas de otros por esta vía estándar (quizas aprobar)
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
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                    can_approve: true, // Puede aprobar
                },
            });
        }
        else {
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
                    can_approve: true,
                },
            });
        }
    }

    // Permisos para LÍDER (usuarios vista, solicitar y modificar ACTIVOS)
    for (const module of modules) {
        if (module.name === 'usuarios' || module.name === 'subdirecciones' || module.name === 'areas') {
            await prisma.permissions.upsert({
                where: {
                    user_type_id_module_id: {
                        user_type_id: userTypes[2].id, // lider
                        module_id: module.id,
                    },
                },
                update: {
                    can_view: false, // Quitar acceso
                },
                create: {
                    user_type_id: userTypes[2].id,
                    module_id: module.id,
                    can_view: false, // Quitar acceso
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                    can_approve: false,
                },
            });
        } else if (['solicitar_salida', 'gestionar_salida', 'solicitar_articulacion', 'gestionar_articulacion', 'calendario_articulaciones', 'solicitar_ivc', 'gestionar_ivc', 'calendario_ivc'].includes(module.name)) {
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
                    can_create: true,
                    can_edit: true,
                    can_delete: module.name !== 'gestionar_salida',
                    can_approve: false,
                },
            });
        } else {
            // Otros modulos (dashboard)
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
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                    can_approve: false,
                },
            });
        }
    }

    // Permisos para USUARIO NORMAL
    const userModules = ['dashboard']; // Solo dashboard por ahora, no solicitar?

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

    console.log('✅ Usuarios de ejemplo creados');

    // 6. Seed Catálogos (Solo si están vacíos)
    console.log('🌱 Seeding catalogs...');

    // Municipios
    const municipiosCount = await prisma.municipios.count();
    if (municipiosCount === 0) {
        await prisma.municipios.createMany({
            data: [
                { name: 'Pasto', code: '52001' },
                { name: 'Tumaco', code: '52835' },
                { name: 'Ipiales', code: '52356' },
                { name: 'Túquerres', code: '52838' },
                { name: 'La Unión', code: '52399' }
            ]
        });
        console.log('Created Municipios');
    }

    // Entidades
    const entidadesCount = await prisma.entidades.count();
    if (entidadesCount === 0) {
        await prisma.entidades.createMany({
            data: [
                { name: 'Alcaldía Municipal' },
                { name: 'Secretaría de Salud Departamental' },
                { name: 'Instituto Departamental de Salud' },
                { name: 'Gobernación de Nariño' }
            ]
        });
        console.log('Created Entidades');
    }

    // IPS
    const ipsCount = await prisma.ips.count();
    if (ipsCount === 0) {
        await prisma.ips.createMany({
            data: [
                { name: 'Hospital Universitario Departamental de Nariño', nit: '800000000' },
                { name: 'Clínica Hispanoamérica', nit: '900000000' },
                { name: 'Hospital Civil de Ipiales', nit: '891200000' },
                { name: 'Hospital San Andrés de Tumaco', nit: '892000000' }
            ]
        });
        console.log('Created IPS');
    }

    // EAPB
    const eapbCount = await prisma.eapb.count();
    if (eapbCount === 0) {
        await prisma.eapb.createMany({
            data: [
                { name: 'Emssanar' },
                { name: 'Asmet Salud' },
                { name: 'Sanitas' },
                { name: 'Nueva EPS' }
            ]
        });
        console.log('Created EAPB');
    }

    // Organizaciones
    const orgCount = await prisma.organizaciones.count();
    if (orgCount === 0) {
        await prisma.organizaciones.createMany({
            data: [
                { name: 'Organización Panamericana de la Salud' },
                { name: 'UNICEF' },
                { name: 'Cruz Roja' }
            ]
        });
        console.log('Created Organizaciones');
    }

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end(); // También cierra el pool
    });