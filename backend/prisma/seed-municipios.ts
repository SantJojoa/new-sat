import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1080691332sJ*@localhost:5432/new_sat_bd?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const municipiosData = [
    { code: '52001', name: 'PASTO' },
    { code: '52019', name: 'ALBAN' },
    { code: '52022', name: 'ALDANA' },
    { code: '52036', name: 'ANCUYA' },
    { code: '52051', name: 'ARBOLEDA' },
    { code: '52079', name: 'BARBACOAS' },
    { code: '52083', name: 'BELEN' },
    { code: '52110', name: 'BUESACO' },
    { code: '52203', name: 'COLON' },
    { code: '52207', name: 'CONSACA' },
    { code: '52210', name: 'CONTADERO' },
    { code: '52215', name: 'CORDOBA' },
    { code: '52224', name: 'CUASPUD' },
    { code: '52227', name: 'CUMBAL' },
    { code: '52233', name: 'CUMBITARA' },
    { code: '52240', name: 'CHACHAGUI' },
    { code: '52250', name: 'EL CHARCO' },
    { code: '52254', name: 'EL PEÑOL' },
    { code: '52256', name: 'EL ROSARIO' },
    { code: '52258', name: 'EL TABLON DE GOMEZ' },
    { code: '52260', name: 'EL TAMBO' },
    { code: '52287', name: 'FUNES' },
    { code: '52317', name: 'GUACHUCAL' },
    { code: '52320', name: 'GUAITARILLA' },
    { code: '52323', name: 'GUALMATAN' },
    { code: '52352', name: 'ILES' },
    { code: '52354', name: 'IMUES' },
    { code: '52356', name: 'IPIALES' },
    { code: '52378', name: 'LA CRUZ' },
    { code: '52381', name: 'LA FLORIDA' },
    { code: '52385', name: 'LA LLANADA' },
    { code: '52390', name: 'LA TOLA' },
    { code: '52399', name: 'LA UNION' },
    { code: '52405', name: 'LEIVA' },
    { code: '52411', name: 'LINARES' },
    { code: '52418', name: 'LOS ANDES' },
    { code: '52427', name: 'MAGUI' },
    { code: '52435', name: 'MALLAMA' },
    { code: '52473', name: 'MOSQUERA' },
    { code: '52480', name: 'NARIÑO' },
    { code: '52490', name: 'OLAYA HERRERA' },
    { code: '52506', name: 'OSPINA' },
    { code: '52520', name: 'FRANCISCO PIZARRO' },
    { code: '52540', name: 'POLICARPA' },
    { code: '52560', name: 'POTOSI' },
    { code: '52565', name: 'PROVIDENCIA' },
    { code: '52573', name: 'PUERRES' },
    { code: '52585', name: 'PUPIALES' },
    { code: '52612', name: 'RICAURTE' },
    { code: '52621', name: 'ROBERTO PAYAN' },
    { code: '52678', name: 'SAMANIEGO' },
    { code: '52683', name: 'SANDONA' },
    { code: '52685', name: 'SAN BERNARDO' },
    { code: '52687', name: 'SAN LORENZO' },
    { code: '52693', name: 'SAN PABLO' },
    { code: '52694', name: 'SAN PEDRO DE CARTAGO' },
    { code: '52696', name: 'SANTA BARBARA' },
    { code: '52699', name: 'SANTACRUZ' },
    { code: '52720', name: 'SAPUYES' },
    { code: '52786', name: 'TAMINANGO' },
    { code: '52788', name: 'TANGUA' },
    { code: '52835', name: 'TUMACO' },
    { code: '52838', name: 'TUQUERRES' },
    { code: '52885', name: 'YACUANQUER' }
];

async function main() {
    console.log('Iniciando migración de datos de MUNICIPIOS...');

    try {
        // Opción 1: Eliminar todos los datos de prueba anteriores si no tienen salidas ligadas
        console.log('Limpiando tabla municipios...');
        // await prisma.municipios.deleteMany(); // descomentar si estás seguro que no hay llaves foraneas que lo bloqueen
        // Para mayor seguridad de llave foranea en ambiente existente sin cascade, vamos a buscar e intentar borrar:
        // Pero intentemos borrar todos primero. 
        // Si hay error relacional, caerá al catch, por lo cual quizás sea mejor utilizar un upsert o ignore los en-uso.
        try {
            await prisma.municipios.deleteMany();
            console.log('Municipios anteriores eliminados.');
        } catch (e) {
            console.log('No se pudieron eliminar todos los municipios anteriores (probablemente por Foreign Keys).');
        }

        // Poblar nuevos datos
        console.log('Insertando municipios definitivos...');
        for (const data of municipiosData) {
            await prisma.municipios.upsert({
                where: { code: data.code },
                update: { name: data.name },
                create: { code: data.code, name: data.name }
            });
        }
        console.log(`Migrados ${municipiosData.length} municipios a la BD.`);

        console.log('Migración completada con éxito.');
    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
