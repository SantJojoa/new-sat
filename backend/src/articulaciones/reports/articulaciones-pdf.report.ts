import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type * as PDFKit from 'pdfkit';
import type { ArticulacionReportData, ArticulacionReportOptions } from './articulaciones-excel.report';

@Injectable()
export class ArticulacionesPdfReport {

    private formatDate(date?: Date | null): string {
        if (!date) return 'N/A';
        const d = date instanceof Date ? date : new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    private norm(value?: string | null): string {
        return String(value ?? '').trim() || 'N/A';
    }

    async generate(data: ArticulacionReportData, options: ArticulacionReportOptions): Promise<{ buffer: Buffer; filename: string }> {
        return new Promise((resolve, reject) => {
            const { startDate, endDate, areaName, authorName, reportTitle, filenamePrefix } = options;

            const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30, bufferPages: true });
            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => {
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                resolve({ buffer: Buffer.concat(chunks), filename: `${filenamePrefix}_${dateStr}.pdf` });
            });
            doc.on('error', reject);

            const pageW = doc.page.width;
            const marginL = 30;
            const contentW = pageW - marginL * 2;
            const PRIMARY = '#1E3A5F';
            const LIGHT = '#F1F5F9';

            // ── Header ───────────────────────────────────────────────────
            doc.rect(marginL, 20, contentW, 44).fill(PRIMARY);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16)
                .text(reportTitle, marginL + 12, 30, { width: contentW - 24, align: 'left' });

            const filterParts: string[] = [];
            if (startDate && endDate) filterParts.push(`${startDate} a ${endDate}`);
            else if (startDate) filterParts.push(`Desde ${startDate}`);
            else if (endDate) filterParts.push(`Hasta ${endDate}`);
            else filterParts.push('Histórico completo');
            if (areaName) filterParts.push(`Área: ${areaName}`);

            doc.rect(marginL, 64, contentW, 18).fill(LIGHT);
            doc.fillColor('#475569').font('Helvetica').fontSize(8)
                .text(`Filtros: ${filterParts.join('  ·  ')}   |   Generado por: ${authorName}   |   ${this.formatDate(new Date())}`,
                    marginL + 6, 68, { width: contentW - 12 });

            doc.moveDown(3.5);

            // ── Stats row ─────────────────────────────────────────────────
            const statBoxW = 120;
            const statBoxH = 36;
            const statY = 90;
            const stats = [
                { label: 'Total', value: String(data.total) },
                ...data.areas.slice(0, 4).map(a => ({ label: a.name, value: String(a.count) })),
            ];
            stats.forEach((s, i) => {
                const x = marginL + i * (statBoxW + 8);
                doc.rect(x, statY, statBoxW, statBoxH).fill('#EFF6FF').stroke('#BFDBFE');
                doc.fillColor('#1D4ED8').font('Helvetica-Bold').fontSize(16).text(s.value, x, statY + 4, { width: statBoxW, align: 'center' });
                doc.fillColor('#64748B').font('Helvetica').fontSize(7).text(s.label, x, statY + 22, { width: statBoxW, align: 'center' });
            });

            // ── Table ─────────────────────────────────────────────────────
            const tableTop = statY + statBoxH + 14;
            const cols = [
                { label: 'Código', w: 80 },
                { label: 'Tipo', w: 80 },
                { label: 'Tema', w: 170 },
                { label: 'F. Inicio', w: 58 },
                { label: 'F. Final', w: 58 },
                { label: 'Jornada', w: 55 },
                { label: 'Área', w: 90 },
                { label: 'Solicitante', w: 110 },
            ];

            // Header row
            let cx = marginL;
            doc.rect(marginL, tableTop, contentW, 16).fill(PRIMARY);
            cols.forEach(col => {
                doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5)
                    .text(col.label, cx + 3, tableTop + 4, { width: col.w - 6, lineBreak: false });
                cx += col.w;
            });

            let rowY = tableTop + 16;
            const rowH = 14;

            data.items.forEach((item, idx) => {
                if (rowY + rowH > doc.page.height - 30) {
                    doc.addPage();
                    rowY = 30;
                    cx = marginL;
                    doc.rect(marginL, rowY, contentW, 16).fill(PRIMARY);
                    cols.forEach(col => {
                        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5)
                            .text(col.label, cx + 3, rowY + 4, { width: col.w - 6, lineBreak: false });
                        cx += col.w;
                    });
                    rowY += 16;
                }

                const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                doc.rect(marginL, rowY, contentW, rowH).fill(bg);

                const cells = [
                    this.norm(item.codigo),
                    this.norm(item.tipo_programacion),
                    this.norm(item.tema).substring(0, 40),
                    this.formatDate(item.fecha_inicio),
                    this.formatDate(item.fecha_final),
                    this.norm(item.jornada),
                    this.norm(item.areas?.name),
                    `${this.norm(item.solicitante?.names)} ${this.norm(item.solicitante?.last_name ?? '')}`.trim().substring(0, 22),
                ];

                cx = marginL;
                cells.forEach((cell, ci) => {
                    doc.fillColor('#1E293B').font('Helvetica').fontSize(7)
                        .text(cell, cx + 3, rowY + 3, { width: cols[ci].w - 6, lineBreak: false, ellipsis: true });
                    cx += cols[ci].w;
                });

                rowY += rowH;
            });

            // ── Footer ────────────────────────────────────────────────────
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.rect(marginL, doc.page.height - 22, contentW, 14).fill(PRIMARY);
                doc.fillColor('#FFFFFF').font('Helvetica').fontSize(7)
                    .text(`SIVAT - IDSN  |  ${reportTitle}`, marginL + 6, doc.page.height - 18, { width: contentW / 2, lineBreak: false });
                doc.fillColor('#FFFFFF').font('Helvetica').fontSize(7)
                    .text(`Pág. ${i + 1} / ${range.count}`, marginL + contentW / 2, doc.page.height - 18, { width: contentW / 2, align: 'right', lineBreak: false });
            }

            doc.end();
        });
    }
}
