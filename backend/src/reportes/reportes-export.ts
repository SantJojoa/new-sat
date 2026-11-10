import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { Hoja, ReportesResumen, Seccion } from './reportes.service';

export interface ExportMeta {
    autor: string;
    filtros: string;
    secciones: Seccion[];
}

type Tabla = { titulo: string; columnas: string[]; filas: (string | number)[][] };

const ETIQUETAS: Record<Seccion, string> = {
    programaciones: 'Programaciones', asesorias: 'Asesorías', articulaciones: 'Articulaciones',
    ivc: 'IVC', iv: 'Inspección y Vigilancia (IV)', acompanamientos: 'Acompañamientos',
};

const conteo = (titulo: string, c: { name: string; count: number }[]): Tabla =>
    ({ titulo, columnas: ['Nombre', 'Cantidad'], filas: c.map(x => [x.name, x.count]) });

/** Tablas de estadísticas (resumen, seguimiento y desgloses) respetando las secciones elegidas. */
export function tablasResumen(r: ReportesResumen, secciones: Seccion[]): Tabla[] {
    const has = (s: Seccion) => secciones.includes(s);
    const t: Tabla[] = [];
    const tot: (string | number)[][] = [];
    if (has('programaciones')) tot.push(['Programaciones', r.programaciones.total]);
    if (has('asesorias')) tot.push(['Asesorías', r.asesorias.total], ['Minutos de asesoría', r.asesorias.minutos]);
    if (has('articulaciones')) tot.push(['Articulaciones', r.articulaciones.total]);
    if (has('ivc')) tot.push(['IVC', r.ivc.total]);
    if (has('iv')) tot.push(['Inspección y Vigilancia (IV)', r.iv.total]);
    if (has('acompanamientos')) tot.push(['Acompañamientos (total)', r.acompanamientos.total], ['Acompañamientos programados', r.acompanamientos.programados.actividades], ['Acompañamientos no programados', r.acompanamientos.noProgramados]);
    t.push({ titulo: 'Totales', columnas: ['Concepto', 'Cantidad'], filas: tot });

    const seg: (string | number)[][] = [];
    const row = (n: string, s: ReportesResumen['seguimientos']['ivc']) => seg.push([n, s.actividades, s.conSeguimiento, s.sinSeguimiento, s.realizadas]);
    if (has('programaciones')) row('Desarrollo de Capacidades', r.seguimientos.capacitaciones);
    if (has('ivc')) row('IVC', r.seguimientos.ivc);
    if (has('iv')) row('Inspección y Vigilancia (IV)', r.seguimientos.inspeccionVigilancia);
    if (has('articulaciones')) row('Articulaciones', r.seguimientos.articulaciones);
    if (has('acompanamientos')) row('Acompañamiento programado', r.acompanamientos.programados);
    t.push({ titulo: 'Seguimiento a actividades', columnas: ['Tipo', 'Actividades', 'Con seguimiento', 'Sin seguimiento', 'Realizadas'], filas: seg });

    if (has('programaciones')) t.push(
        conteo('Programaciones por Tipo', r.programaciones.porTipo), conteo('Programaciones por Subtipo', r.programaciones.porSubtipo),
        conteo('Programaciones por Estado', r.programaciones.porEstado), conteo('Programaciones por Subdirección', r.programaciones.porSubdireccion),
        conteo('Programaciones por Área', r.programaciones.porArea));
    if (has('asesorias')) t.push(conteo('Asesorías por Medio', r.asesorias.porMedio), conteo('Asesorías por Subdirección', r.asesorias.porSubdireccion), conteo('Asesorías por Área', r.asesorias.porArea));
    if (has('articulaciones')) t.push(conteo('Articulaciones por Estado', r.articulaciones.porEstado), conteo('Articulaciones por Subdirección', r.articulaciones.porSubdireccion), conteo('Articulaciones por Área', r.articulaciones.porArea));
    if (has('ivc')) t.push(conteo('IVC por Estado', r.ivc.porEstado), conteo('IVC por Subdirección', r.ivc.porSubdireccion), conteo('IVC por Área', r.ivc.porArea));
    if (has('iv')) t.push(conteo('IV por Subdirección', r.iv.porSubdireccion), conteo('IV por Área', r.iv.porArea));
    if (has('acompanamientos')) t.push(conteo('Acompañamientos por Subdirección', r.acompanamientos.porSubdireccion), conteo('Acompañamientos por Área', r.acompanamientos.porArea));
    return t;
}

export async function buildExcel(r: ReportesResumen, hojas: Hoja[], meta: ExportMeta): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = meta.autor;
    wb.created = new Date();

    const header = (ws: ExcelJS.Worksheet, rowNum: number, ncols: number) => {
        const row = ws.getRow(rowNum);
        for (let c = 1; c <= ncols; c++) {
            const cell = row.getCell(c);
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            cell.alignment = { vertical: 'middle', wrapText: true };
        }
    };

    const ws = wb.addWorksheet('Resumen');
    ws.getCell('A1').value = 'Reportes y Estadísticas';
    ws.getCell('A1').font = { size: 16, bold: true };
    ws.getCell('A2').value = `Filtros: ${meta.filtros}`;
    ws.getCell('A3').value = `Secciones: ${meta.secciones.map(s => ETIQUETAS[s]).join(', ')}`;
    ws.getCell('A4').value = `Generado por ${meta.autor} el ${new Date().toISOString().slice(0, 10)}`;
    let rowN = 6;
    for (const t of tablasResumen(r, meta.secciones)) {
        ws.getCell(rowN, 1).value = t.titulo;
        ws.getCell(rowN, 1).font = { bold: true, size: 12 };
        rowN++;
        t.columnas.forEach((c, i) => { ws.getCell(rowN, i + 1).value = c; });
        header(ws, rowN, t.columnas.length);
        rowN++;
        for (const f of t.filas) { f.forEach((v, i) => { ws.getCell(rowN, i + 1).value = v; }); rowN++; }
        rowN++;
    }
    ws.getColumn(1).width = 42;
    for (let c = 2; c <= 5; c++) ws.getColumn(c).width = 18;

    for (const h of hojas) {
        const sh = wb.addWorksheet(h.nombre.substring(0, 31));
        sh.addRow(h.columnas);
        header(sh, 1, h.columnas.length);
        h.filas.forEach(f => sh.addRow(f));
        sh.views = [{ state: 'frozen', ySplit: 1 }];
        sh.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: h.columnas.length } };
        h.columnas.forEach((c, i) => {
            const max = Math.max(c.length, ...h.filas.slice(0, 200).map(f => String(f[i] ?? '').length));
            sh.getColumn(i + 1).width = Math.min(Math.max(max + 2, 10), 45);
        });
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
}

export function buildPdf(r: ReportesResumen, hojas: Hoja[], meta: ExportMeta): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30, bufferPages: true });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const L = 30;
        const W = doc.page.width - L * 2;
        const bottom = () => doc.page.height - 40;

        const tabla = (titulo: string, columnas: string[], filas: (string | number)[][], pesos?: number[]) => {
            const peso = pesos ?? columnas.map(() => 1);
            const sum = peso.reduce((a, b) => a + b, 0);
            const widths = peso.map(p => (p / sum) * W);
            const fontSize = columnas.length > 8 ? 6 : 7.5;
            const drawHeader = () => {
                const y = doc.y;
                doc.rect(L, y, W, 16).fill('#1E3A5F');
                doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(fontSize);
                let x = L;
                columnas.forEach((c, i) => { doc.text(c, x + 3, y + 4, { width: widths[i] - 6, height: 10, ellipsis: true, lineBreak: false }); x += widths[i]; });
                doc.y = y + 16;
            };
            if (doc.y + 60 > bottom()) doc.addPage();
            doc.fillColor('#1E3A5F').font('Helvetica-Bold').fontSize(11).text(titulo, L, doc.y);
            doc.moveDown(0.3);
            drawHeader();
            if (!filas.length) {
                doc.fillColor('#94A3B8').font('Helvetica-Oblique').fontSize(8).text('Sin datos', L + 3, doc.y + 3);
                doc.y += 16;
            }
            filas.forEach((f, idx) => {
                if (doc.y + 14 > bottom()) { doc.addPage(); drawHeader(); }
                const y = doc.y;
                if (idx % 2 === 0) doc.rect(L, y, W, 14).fill('#F1F5F9');
                doc.fillColor('#0F172A').font('Helvetica').fontSize(fontSize);
                let x = L;
                f.forEach((v, i) => { doc.text(String(v ?? ''), x + 3, y + 3, { width: widths[i] - 6, height: 10, ellipsis: true, lineBreak: false }); x += widths[i]; });
                doc.y = y + 14;
            });
            doc.moveDown(0.8);
        };

        doc.rect(L, 20, W, 40).fill('#1E3A5F');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('Reportes y Estadísticas', L + 12, 32, { width: W - 24 });
        doc.rect(L, 60, W, 28).fill('#F1F5F9');
        doc.fillColor('#475569').font('Helvetica').fontSize(8)
            .text(`Filtros: ${meta.filtros}  |  Secciones: ${meta.secciones.map(s => ETIQUETAS[s]).join(', ')}`, L + 6, 64, { width: W - 12 })
            .text(`Generado por: ${meta.autor}  |  ${new Date().toISOString().slice(0, 10)}`, L + 6, 76, { width: W - 12 });
        doc.y = 100;

        for (const t of tablasResumen(r, meta.secciones)) tabla(t.titulo, t.columnas, t.filas, t.columnas.length === 2 ? [4, 1] : undefined);

        for (const h of hojas) {
            doc.addPage();
            doc.y = 30;
            tabla(`Detalle — ${h.nombre} (${h.filas.length})`, h.columnas, h.filas);
        }

        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            doc.fillColor('#94A3B8').font('Helvetica').fontSize(7).text(`Página ${i + 1} de ${range.count}`, L, doc.page.height - 22, { width: W, align: 'right', lineBreak: false });
        }
        doc.end();
    });
}
