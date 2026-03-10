import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Iniciando la creación de 7 salidas de diferentes áreas...');

    // Asegurar que exista una subdirección para crear áreas
    let subdireccion = await prisma.subdirecciones.findFirst();
    if (!subdireccion) {
        subdireccion = await prisma.subdirecciones.create({
            data: {
                name: 'Subdirección de Prueba ' + Date.now(),
                description: 'Subdirección generada para pruebas',
            }
        });
    }

    // Buscamos áreas existentes
    let areas = await prisma.areas.findMany({ take: 7 });

    // Si no hay 7 áreas, creamos las que faltan
    if (areas.length < 7) {
        const faltantes = 7 - areas.length;
        for (let i = 0; i < faltantes; i++) {
            const nuevaArea = await prisma.areas.create({
                data: {
                    name: `Área de Prueba ${Date.now()} - ${i}`,
                    subdireccion_id: subdireccion.id,
                }
            });
            areas.push(nuevaArea);
        }
    }

    // Asegurarse de tener un userType
    let userType = await prisma.user_types.findFirst({ where: { level: 2 } });
    if (!userType) {
        userType = await prisma.user_types.create({
            data: {
                name: 'lider_test_' + Date.now(),
                description: 'Lider Test',
                level: 2
            }
        });
    }

    // Buscamos un usuario para asignarlo como solicitante
    let usuario = await prisma.users.findFirst();
    if (!usuario) {
        usuario = await prisma.users.create({
            data: {
                username: `test_user_${Date.now()}`,
                password: 'password_generico',
                user_type_id: userType.id,
                names: 'Usuario',
                last_name: 'Prueba',
                num_id: `ID_${Date.now()}`,
                email: `test_${Date.now()}@idsn.gov.co`,
                area_id: areas[0].id,
                charge: 'Profesional',
            }
        });
    }

    // Nombres de temas y tipos para variar
    const tipos = ['Capacitacion Presencial', 'Capacitacion Virtual', 'Inspeccion', 'Vigilancia'];
    const jornadas = ['Manana', 'Tarde', 'Completa'];

    const salidasGeneradas: any[] = [];

    // Crear 7 salidas
    for (let i = 0; i < 7; i++) {
        const areaId = areas[i].id;
        const indexTipo = i % tipos.length;
        const indexJornada = i % jornadas.length;

        const codigo = `TEST-${Date.now()}-${i}`;
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() + i); // días sucesivos

        const fechaFinal = new Date(fechaInicio);
        fechaFinal.setHours(fechaFinal.getHours() + 4);

        const salida = await prisma.salidas.create({
            data: {
                codigo,
                tipo_salida: tipos[indexTipo],
                subtipo_salida: 'Actividad rutinaria',
                tema: `Tema de Salida ${i + 1} en ${areas[i].name}`,
                descripcion: `Descripción automática para la salida ${i + 1}.`,
                fecha_inicio: fechaInicio,
                fecha_final: fechaFinal,
                jornada: jornadas[indexJornada],
                estado: 'aprobada', // Estado para que sea visible
                fecha_aprobacion: new Date(),
                transporte_medio: 'Institucional',
                solicitante_id: usuario.id,
                area_id: areaId,
                observaciones: 'Generado automáticamente por seed-test-salidas.ts'
            }
        });

        salidasGeneradas.push(salida);
        console.log(`✅ Salida creada: ${salida.codigo} (Área: ${areas[i].name})`);
    }

    console.log(`🎉 Se crearon ${salidasGeneradas.length} salidas exitosamente!`);
}

main()
    .catch((e) => {
        console.error('❌ Error ejecutando seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
