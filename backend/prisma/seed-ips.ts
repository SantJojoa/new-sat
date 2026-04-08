import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ipsTypes = [
    'Publicas',
    'Privadas',
    'Indigenas',
    'Regimen Excepcion',
    'Regimen Especial',
];

const ipsActores = [
    'Gerente o delegado',
    'Médico',
    'Enfermero',
    'Psicologo',
    'Odontologo',
    'Bacteriologo',
    'Coord. PYP',
    'Coord. SP',
    'Tecnico Sivigila',
    'Responsable PAI',
    'Regente Farmacia',
    'Quim. Farmaceutico',
    'Coord./lider SGSST',
    'Ref. Afiliación',
    'Coord. Cartera',
    'Coord. Facturación',
    'Coord. Aten. Usuario',
    'Ref. PIC',
    'Cor. Seg Paciente',
];

async function main() {
    console.log('Iniciando seed de IPS...');

    try {
        console.log('Limpiando datos anteriores de IPS...');
        await prisma.salida_ips.deleteMany();
        await prisma.ips_actores.deleteMany();
        await prisma.ips.deleteMany();

        console.log('Insertando tipos de IPS...');
        for (const type of ipsTypes) {
            await prisma.ips.create({ data: { type } });
            console.log(`  ✅ Tipo IPS creado: ${type}`);
        }

        console.log('Insertando actores de IPS...');
        for (const name of ipsActores) {
            await prisma.ips_actores.create({ data: { name } });
            console.log(`  ✅ Actor IPS creado: ${name}`);
        }

        console.log('\n🎉 Seed IPS completado con éxito.');
    } catch (error) {
        console.error('Error durante el seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
