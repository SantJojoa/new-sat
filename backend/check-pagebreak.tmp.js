const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

(async () => {
    const area = await prisma.areas.findFirst();
    const user = await prisma.users.findFirst();

    const asesoria = await prisma.asesorias.create({
        data: {
            codigo: 'TEST-PAGEBREAK-' + Date.now(),
            fecha: new Date(), hora: '09:00', hora_fin: '10:00',
            medio: 'Presencial', institucion: 'Institucion de Prueba con nombre largo para probar',
            temas_tratados: 'Prueba de salto de pagina con varios asistentes para forzar que la seccion de firmas no quepa en la primera hoja del certificado',
            material_entregado: 'Cartillas, folletos y material educativo variado',
            duracion_minutos: 60, estado: 'registrada',
            registrador_id: user.id, area_id: area.id,
            asistentes: {
                create: [
                    { nombre: 'Jimena', apellido: 'Insusasty', cargo: 'Coordinadora de Salud Infantil', identificacion: '1001', email: 'jimena@test.com', movil: '3001111111' },
                    { nombre: 'Juan', apellido: 'Perez', cargo: 'Enfermero', identificacion: '1002', email: 'juan@test.com', movil: '3002222222' },
                    { nombre: 'Maria', apellido: 'Gomez', cargo: 'Coordinadora', identificacion: '1003', email: 'maria@test.com', movil: '3003333333' },
                    { nombre: 'Carlos', apellido: 'Ruiz', cargo: 'Medico General', identificacion: '1004', email: 'carlos@test.com', movil: '3004444444' },
                ],
            },
        },
        include: { asistentes: true },
    });

    const full = await prisma.asesorias.findUnique({
        where: { id: asesoria.id },
        include: { registrador: true, areas: true, municipio_procedencia: true, asistentes: true },
    });

    process.env.FRONTEND_URL = 'https://sivat.idsn.gov.co';
    const { AsesoriasCertificateReport } = require('./dist/asesorias/reports/asesorias-certificate.report');
    const { PuppeteerBrowserService } = require('./dist/common/services/puppeteer-browser.service');
    const report = new AsesoriasCertificateReport(new PuppeteerBrowserService());
    const buffer = await report.generate(full);
    fs.writeFileSync('/tmp/certificado-pagebreak.pdf', buffer);
    console.log('PDF generado:', buffer.length, 'bytes');

    await prisma.asesorias.delete({ where: { id: asesoria.id } });
    console.log('🧹 Datos de prueba eliminados.');
    await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
