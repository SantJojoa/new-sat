/**
 * Seed idempotente para despliegue en producción.
 *
 * Garantiza, en cada arranque del backend, que existan:
 *  - Los 4 tipos de usuario (user_types)
 *  - Los módulos del sistema (modules) y sus permisos por rol (permissions)
 *  - El usuario superadmin (vía variables de entorno)
 *  - Los catálogos de referencia: subdirecciones, areas, municipios, entidades,
 *    ips, ips_actores, eapb, eapb_actores, organizaciones, idsn
 *
 * Solo usa upsert/find-or-create: nunca borra ni sobreescribe datos que el
 * usuario haya creado o modificado desde la UI en producción (excepto los
 * campos propios de catálogo en los upserts de módulos/tipos de usuario).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
    SUBDIRECCIONES_SEED,
    AREAS_SEED,
    MUNICIPIOS_SEED,
    ENTIDADES_SEED,
    IPS_TIPOS_SEED,
    IPS_ACTORES_SEED,
    EAPB_SEED,
    EAPB_ACTORES_SEED,
    ORGANIZACIONES_SEED,
    IDSN_SEED,
} from './seed-deploy-data';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedUserTypes() {
    const data = [
        { name: 'superadmin', description: 'Super Administrador - Acceso completo', level: 0 },
        { name: 'admin_subdireccion', description: 'Administrador de Subdirección - Aprueba salidas', level: 1 },
        { name: 'lider', description: 'Líder - Crea y modifica salidas', level: 2 },
        { name: 'usuario', description: 'Usuario Normal - Funciones básicas', level: 3 },
    ];

    const userTypes: Record<string, { id: string; name: string }> = {};
    for (const ut of data) {
        const row = await prisma.user_types.upsert({
            where: { name: ut.name },
            update: { level: ut.level },
            create: ut,
        });
        userTypes[ut.name] = row;
    }
    console.log('✅ Tipos de usuario verificados');
    return userTypes;
}

async function seedModulesAndPermissions(userTypes: Record<string, { id: string; name: string }>) {
    const coreModules = [
        { name: 'dashboard', description: 'Panel Principal', icon: 'dashboard', path: '/dashboard', order: 1 },
        { name: 'solicitar_salida', description: 'Solicitar Programación', icon: 'add_box', path: '/solicitar-salida', order: 2 },
        { name: 'gestionar_salida', description: 'Gestionar Programación', icon: 'data_table', path: '/gestionar-salida', order: 3 },
        { name: 'subdirecciones', description: 'Gestión de Subdirecciones', icon: 'domain', path: '/subdirecciones', order: 4 },
        { name: 'areas', description: 'Gestión de Áreas', icon: 'layers', path: '/areas', order: 5 },
        { name: 'calendario_salidas', description: 'Calendario de Programaciones', icon: 'calendar_month', path: '/calendario-salidas', order: 5 },
        { name: 'usuarios', description: 'Gestión de Usuarios', icon: 'person_add', path: '/users', order: 6 },
        { name: 'solicitar_articulacion', description: 'Articulación', icon: 'hub', path: '/solicitar-articulacion', order: 7 },
        { name: 'solicitar_ivc', description: 'IVC', icon: 'verified_user', path: '/solicitar-ivc', order: 8 },
        { name: 'gestionar_articulacion', description: 'Gestionar Articulaciones', icon: 'table_view', path: '/gestionar-articulacion', order: 9 },
        { name: 'calendario_articulaciones', description: 'Calendario Articulaciones', icon: 'event', path: '/calendario-articulaciones', order: 10 },
        { name: 'gestionar_ivc', description: 'Gestionar IVC', icon: 'table_view', path: '/gestionar-ivc', order: 11 },
        { name: 'calendario_ivc', description: 'Calendario IVC', icon: 'event', path: '/calendario-ivc', order: 12 },
        { name: 'programar_asesoria', description: 'Datos Asesoria', icon: 'support_agent', path: '/programar-asesoria', order: 30 },
    ];

    const modules: Record<string, { id: string; name: string }> = {};
    for (const m of coreModules) {
        const row = await prisma.modules.upsert({
            where: { name: m.name },
            update: { icon: m.icon, order: m.order, path: m.path, is_active: true },
            create: { ...m, is_active: true },
        });
        modules[m.name] = row;
    }
    console.log('✅ Módulos verificados:', Object.keys(modules).length);

    const restrictedToSuperadmin = ['usuarios', 'subdirecciones', 'areas'];
    const onlyView = ['calendario_salidas'];

    for (const m of Object.values(modules)) {
        for (const ut of Object.values(userTypes)) {
            const isSuperadmin = ut.name === 'superadmin';
            const isAdminSub = ut.name === 'admin_subdireccion';
            const isLider = ut.name === 'lider';
            const isUsuario = ut.name === 'usuario';

            let perm = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true };

            if (isSuperadmin) {
                perm = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true };
            } else if (restrictedToSuperadmin.includes(m.name)) {
                perm = { can_view: false, can_create: false, can_edit: false, can_delete: false, can_approve: false };
            } else if (onlyView.includes(m.name)) {
                perm = { can_view: true, can_create: false, can_edit: false, can_delete: false, can_approve: false };
            } else if (m.name === 'programar_asesoria') {
                perm = { can_view: true, can_create: true, can_edit: false, can_delete: false, can_approve: false };
            } else if (m.name === 'solicitar_salida' || m.name === 'gestionar_salida') {
                if (isAdminSub) perm = { can_view: true, can_create: m.name === 'solicitar_salida', can_edit: false, can_delete: false, can_approve: true };
                else if (isLider) perm = { can_view: true, can_create: true, can_edit: true, can_delete: m.name !== 'gestionar_salida', can_approve: false };
                else if (isUsuario) perm = { can_view: m.name === 'solicitar_salida', can_create: false, can_edit: false, can_delete: false, can_approve: false };
            } else if (['solicitar_articulacion', 'gestionar_articulacion', 'calendario_articulaciones', 'solicitar_ivc', 'gestionar_ivc', 'calendario_ivc'].includes(m.name)) {
                if (isAdminSub) perm = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true };
                else if (isLider) perm = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: false };
                else if (isUsuario) perm = { can_view: false, can_create: false, can_edit: false, can_delete: false, can_approve: false };
            } else if (m.name === 'dashboard') {
                perm = { can_view: true, can_create: false, can_edit: false, can_delete: false, can_approve: false };
            } else if (isAdminSub) {
                perm = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true };
            } else if (isLider || isUsuario) {
                perm = { can_view: false, can_create: false, can_edit: false, can_delete: false, can_approve: false };
            }

            await prisma.permissions.upsert({
                where: { user_type_id_module_id: { user_type_id: ut.id, module_id: m.id } },
                update: {},
                create: { user_type_id: ut.id, module_id: m.id, ...perm },
            });
        }
    }
    console.log('✅ Permisos verificados');
    return modules;
}

async function seedSuperadmin(userTypes: Record<string, { id: string; name: string }>) {
    const username = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const password = process.env.SUPERADMIN_PASSWORD || 'super123';
    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@idsn.gov.co';
    const numId = process.env.SUPERADMIN_NUM_ID || '10000001';
    const names = process.env.SUPERADMIN_NAMES || 'Super';
    const lastName = process.env.SUPERADMIN_LAST_NAME || 'Administrador';

    if (!process.env.SUPERADMIN_PASSWORD) {
        console.warn('⚠️  SUPERADMIN_PASSWORD no está definida en el entorno: se usará una contraseña de desarrollo insegura. Defínela en producción.');
    }

    const existing = await prisma.users.findUnique({ where: { username } });
    if (existing) {
        console.log('✅ Usuario superadmin ya existe, no se modifica');
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.create({
        data: {
            username,
            password: hashedPassword,
            user_type_id: userTypes['superadmin'].id,
            names,
            last_name: lastName,
            num_id: numId,
            email,
            charge: 'Super Administrador del Sistema',
        },
    });
    console.log(`✅ Usuario superadmin creado: ${username}`);
}

async function seedSubdireccionesYAreas() {
    const subdireccionIds: Record<string, string> = {};
    for (const s of SUBDIRECCIONES_SEED) {
        const row = await prisma.subdirecciones.upsert({
            where: { name: s.name },
            update: {},
            create: { name: s.name, description: s.description || null },
        });
        subdireccionIds[s.name] = row.id;
    }
    console.log('✅ Subdirecciones verificadas:', SUBDIRECCIONES_SEED.length);

    for (const a of AREAS_SEED) {
        const subdireccionId = subdireccionIds[a.subdireccionName];
        if (!subdireccionId) {
            console.warn(`⚠️  Área "${a.name}" referencia subdirección desconocida "${a.subdireccionName}", se omite`);
            continue;
        }
        await prisma.areas.upsert({
            where: { name: a.name },
            update: { subdireccion_id: subdireccionId },
            create: { name: a.name, subdireccion_id: subdireccionId },
        });
    }
    console.log('✅ Áreas verificadas:', AREAS_SEED.length);
}

async function seedCatalogosSimples() {
    for (const m of MUNICIPIOS_SEED) {
        if (m.code) {
            await prisma.municipios.upsert({
                where: { code: m.code },
                update: { name: m.name },
                create: { name: m.name, code: m.code },
            });
        } else {
            const exists = await prisma.municipios.findFirst({ where: { name: m.name } });
            if (!exists) await prisma.municipios.create({ data: { name: m.name } });
        }
    }
    console.log('✅ Municipios verificados:', MUNICIPIOS_SEED.length);

    for (const name of ENTIDADES_SEED) {
        const exists = await prisma.entidades.findFirst({ where: { name } });
        if (!exists) await prisma.entidades.create({ data: { name } });
    }
    console.log('✅ Entidades verificadas:', ENTIDADES_SEED.length);

    for (const type of IPS_TIPOS_SEED) {
        await prisma.ips.upsert({ where: { type }, update: {}, create: { type } });
    }
    console.log('✅ Tipos de IPS verificados:', IPS_TIPOS_SEED.length);

    for (const name of IPS_ACTORES_SEED) {
        await prisma.ips_actores.upsert({ where: { name }, update: {}, create: { name } });
    }
    console.log('✅ Actores IPS verificados:', IPS_ACTORES_SEED.length);

    for (const name of EAPB_SEED) {
        const exists = await prisma.eapb.findFirst({ where: { name } });
        if (!exists) await prisma.eapb.create({ data: { name } });
    }
    console.log('✅ EAPB verificadas:', EAPB_SEED.length);

    for (const name of EAPB_ACTORES_SEED) {
        await prisma.eapb_actores.upsert({ where: { name }, update: {}, create: { name } });
    }
    console.log('✅ Actores EAPB verificados:', EAPB_ACTORES_SEED.length);

    for (const name of ORGANIZACIONES_SEED) {
        const exists = await prisma.organizaciones.findFirst({ where: { name } });
        if (!exists) await prisma.organizaciones.create({ data: { name } });
    }
    console.log('✅ Organizaciones verificadas:', ORGANIZACIONES_SEED.length);

    for (const name of IDSN_SEED) {
        const exists = await prisma.idsn.findFirst({ where: { name } });
        if (!exists) await prisma.idsn.create({ data: { name } });
    }
    console.log('✅ IDSN verificado:', IDSN_SEED.length);
}

async function main() {
    console.log('🌱 Iniciando seed de despliegue (idempotente)...');
    const userTypes = await seedUserTypes();
    await seedModulesAndPermissions(userTypes);
    await seedSuperadmin(userTypes);
    await seedSubdireccionesYAreas();
    await seedCatalogosSimples();
    console.log('🎉 Seed de despliegue completado con éxito.');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed de despliegue:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
