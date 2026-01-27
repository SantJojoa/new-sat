import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Crear tipos de usuario
    const adminType = await prisma.user_types.upsert({
        where: { name: 'superadmin' },
        update: {},
        create: {
            name: 'superadmin',
            description: 'Superadministrador del sistema'
        }
    });

    const userType = await prisma.user_types.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
            description: 'Usuario regular'
        }
    });

    console.log('✅ User types created');

    // 2. Crear subdirección
    const subdireccion = await prisma.subdirecciones.upsert({
        where: { name: 'Dirección' },
        update: {},
        create: {
            name: 'Dirección',
            description: 'Dirección'
        }
    });

    // 3. Crear área
    const area = await prisma.areas.upsert({
        where: { name: 'TICS' },
        update: {},
        create: {
            name: 'TICS',
            subdireccion_id: subdireccion.id
        }
    });

    console.log('✅ Areas and subdirecciones created');

    // 4. Crear usuario admin
    const hashedPassword = await bcrypt.hash('superadmin123', 10);

    const adminUser = await prisma.users.upsert({
        where: { username: 'superadmin' },
        update: {},
        create: {
            username: 'superadmin',
            password: hashedPassword,
            user_type_id: adminType.id,
            names: 'Super',
            last_name: 'Administrador',
            num_id: '12345678',
            email: 'superadmin@sistema.com',
            area_id: area.id,
            charge: 'Super Administrador del Sistema'
        }
    });

    console.log('✅ Admin user created');
    console.log('📋 Credenciales:');
    console.log('  Usuario: superadmin');
    console.log('  Contraseña: superadmin123');

    // 5. Crear usuario regular
    const regularUser = await prisma.users.upsert({
        where: { username: 'usuario' },
        update: {},
        create: {
            username: 'usuario',
            password: await bcrypt.hash('user123', 10),
            user_type_id: userType.id,
            names: 'Juan',
            last_name: 'Pérez',
            num_id: '87654321',
            email: 'juan.perez@sistema.com',
            area_id: area.id,
            charge: 'Desarrollador'
        }
    });

    console.log('✅ Regular user created');
    console.log('📋 Credenciales:');
    console.log('  Usuario: usuario');
    console.log('  Contraseña: user123');

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