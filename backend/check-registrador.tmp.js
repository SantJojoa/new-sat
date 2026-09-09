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
            codigo: 'TEST-REGISTRADOR-' + Date.now(),
            fecha: new Date(), hora: '09:00', hora_fin: '10:00',
            medio: 'Presencial', institucion: 'Institucion de Prueba',
            temas_tratados: 'Prueba QR registrador', material_entregado: 'Ninguno',
            duracion_minutos: 60, estado: 'registrada',
            registrador_id: user.id, area_id: area.id,
            asistentes: {
                create: [
                    { nombre: 'Juan', apellido: 'Perez', cargo: 'Enfermero', identificacion: '1', email: 'a@test.com', movil: '3' },
                ],
            },
        },
        include: { asistentes: true },
    });

    console.log('Token del registrador generado automáticamente:', asesoria.firma_registrador_token);

    const full = await prisma.asesorias.findUnique({
        where: { id: asesoria.id },
        include: { registrador: true, areas: true, municipio_procedencia: true, asistentes: true },
    });

    process.env.FRONTEND_URL = 'https://sivat.idsn.gov.co';
    const { AsesoriasCertificateReport } = require('./dist/asesorias/reports/asesorias-certificate.report');
    const { PuppeteerBrowserService } = require('./dist/common/services/puppeteer-browser.service');
    const report = new AsesoriasCertificateReport(new PuppeteerBrowserService());
    const buffer = await report.generate(full);
    fs.writeFileSync('/tmp/certificado-registrador.pdf', buffer);
    console.log('PDF generado:', buffer.length, 'bytes');

    await prisma.asesorias.delete({ where: { id: asesoria.id } });
    console.log('🧹 Datos de prueba eliminados.');
    await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
