import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type * as PDFKit from 'pdfkit';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const COLORS = {
    primary: '#1E3A5F',
    primaryLight: '#2563EB',
    accent: '#0EA5E9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    teal: '#14B8A6',
    orange: '#F97316',

    white: '#FFFFFF',
    gray50: '#F8FAFC',
    gray100: '#F1F5F9',
    gray200: '#E2E8F0',
    gray300: '#CBD5E1',
    gray400: '#94A3B8',
    gray600: '#475569',
    gray700: '#334155',
    gray800: '#1E293B',
    gray900: '#0F172A',
    text: '#1E293B',
    textMuted: '#64748B',
};

const CHART_PALETTE = [
    '#2563EB', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
    '#06B6D4', '#84CC16',
];

const ESTADO_COLORS: Record<string, string> = {
    aprobada: '#10B981',
    pendiente: '#F59E0B',
    rechazada: '#EF4444',
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EstadisticasData {
    estados: { name: string; count: number }[];
    topSolicitantes: { name: string; count: number }[];
    areas: { name: string; count: number }[];
    total: number;
    items: any[];
}

export interface PdfReportOptions {
    startDate?: string;
    endDate?: string;
    areaName?: string;
    estado?: string;
    jornada?: string;
    authorName: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SalidasPdfReport {

    // ── Formatting helpers ────────────────────────────────────────────────────

    private formatDate(date?: Date): string {
        if (!date) return 'N/A';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    }

    private formatDateTime(date?: Date): string {
        if (!date) return 'N/A';
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${this.formatDate(date)} ${hours}:${minutes}`;
    }

    private normalizeText(value?: string | null): string {
        if (!value) return 'N/A';
        return String(value).trim() || 'N/A';
    }

    private isEmptyValue(value: string): boolean {
        return !value || value === 'N/A';
    }

    private toCsv(list?: { name: string }[]): string {
        if (!list || list.length === 0) return 'N/A';
        return list.map(i => i.name).join(', ');
    }

    // ── Drawing Primitives ────────────────────────────────────────────────────

    private drawHRule(
        doc: PDFKit.PDFDocument,
        color: string = COLORS.gray200,
        thickness: number = 0.5,
        marginTop: number = 4,
        marginBottom: number = 4,
    ) {
        doc.moveDown(marginTop / 12);
        const x = doc.page.margins.left;
        const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        doc.save()
            .strokeColor(color)
            .lineWidth(thickness)
            .moveTo(x, doc.y)
            .lineTo(x + width, doc.y)
            .stroke()
            .restore();
        doc.moveDown(marginBottom / 12);
    }

    private drawBadge(
        doc: PDFKit.PDFDocument,
        text: string,
        x: number,
        y: number,
        bgColor: string,
        textColor: string = COLORS.white,
    ): number {
        const padding = { x: 7, y: 3 };
        const fontSize = 8;
        doc.font('Helvetica-Bold').fontSize(fontSize);
        const textWidth = doc.widthOfString(text);
        const bw = textWidth + padding.x * 2;
        const bh = fontSize + padding.y * 2;
        doc.save()
            .fillColor(bgColor)
            .roundedRect(x, y, bw, bh, 4)
            .fill()
            .restore();
        doc.fillColor(textColor).text(text, x + padding.x, y + padding.y, { lineBreak: false });
        return bw;
    }

    private drawPageHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
        const pageWidth = doc.page.width;
        const marginLeft = doc.page.margins.left;
        const contentWidth = pageWidth - marginLeft - doc.page.margins.right;

        doc.save().fillColor(COLORS.primary).rect(0, 0, pageWidth, 52).fill().restore();
        doc.save().fillColor(COLORS.accent).rect(0, 49, pageWidth, 3).fill().restore();

        doc.font('Helvetica-Bold').fontSize(15).fillColor(COLORS.white)
            .text(title, marginLeft, 15, { width: contentWidth - 140, lineBreak: false });

        if (subtitle) {
            doc.font('Helvetica').fontSize(8.5).fillColor('#93C5FD')
                .text(subtitle, marginLeft, 33, { width: contentWidth - 140, lineBreak: false });
        }

        doc.font('Helvetica').fontSize(8).fillColor('#93C5FD')
            .text(this.formatDateTime(new Date()), pageWidth - doc.page.margins.right - 130, 19,
                { width: 130, align: 'right', lineBreak: false });

        doc.y = 65;
        doc.x = marginLeft;
    }

    private drawPageFooter(doc: PDFKit.PDFDocument, pageNumber: number, generatedBy: string) {
        const pageWidth = doc.page.width;
        const marginLeft = doc.page.margins.left;
        const contentWidth = pageWidth - marginLeft - doc.page.margins.right;
        const footerY = doc.page.height - 28;

        const savedY = doc.y;
        const savedX = doc.x;

        doc.save()
            .fillColor(COLORS.gray100)
            .rect(0, footerY - 4, pageWidth, 32).fill()
            .strokeColor(COLORS.gray200).lineWidth(0.5)
            .moveTo(0, footerY - 4).lineTo(pageWidth, footerY - 4).stroke()
            .restore();

        doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.textMuted)
            .text(`Generado por: ${generatedBy}`, marginLeft, footerY + 2,
                { width: contentWidth / 2, lineBreak: false });

        doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.textMuted)
            .text(`Pagina ${pageNumber}`, marginLeft, footerY + 2,
                { width: contentWidth, align: 'right', lineBreak: false });

        doc.y = savedY;
        doc.x = savedX;
    }

    private drawSectionTitle(doc: PDFKit.PDFDocument, title: string, color: string = COLORS.primaryLight) {
        const marginLeft = doc.page.margins.left;
        const contentWidth = doc.page.width - marginLeft - doc.page.margins.right;

        doc.moveDown(0.6);
        const titleY = doc.y;
        doc.save().fillColor(color).rect(marginLeft, titleY, 4, 18).fill().restore();

        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.gray800)
            .text(title, marginLeft + 12, titleY + 2, { width: contentWidth - 12 });

        doc.moveDown(0.3);
        doc.x = marginLeft;
    }

    private drawKpiCard(
        doc: PDFKit.PDFDocument,
        x: number, y: number, w: number, h: number,
        value: string, label: string, color: string,
    ) {
        doc.save()
            .fillColor(COLORS.white).roundedRect(x, y, w, h, 6).fill()
            .strokeColor(COLORS.gray200).lineWidth(0.75).roundedRect(x, y, w, h, 6).stroke()
            .restore();

        doc.save()
            .fillColor(color).roundedRect(x, y, w, 5, 3).fill()
            .rect(x, y + 2, w, 3).fill()
            .restore();

        doc.font('Helvetica-Bold').fontSize(22).fillColor(color)
            .text(value, x + 10, y + 16, { width: w - 20, align: 'center', lineBreak: false });

        doc.font('Helvetica').fontSize(8).fillColor(COLORS.textMuted)
            .text(label, x + 6, y + 44, { width: w - 12, align: 'center', lineBreak: false });
    }

    private drawTable(
        doc: PDFKit.PDFDocument,
        headers: string[],
        rows: string[][],
        options: {
            columnWidths?: number[];
            headerBackground?: string;
            headerColor?: string;
            rowAltBackground?: string;
            borderColor?: string;
            tableWidth?: number;
            tableBackground?: string;
            cellPadding?: number;
            drawColumnLines?: boolean;
            rowGap?: number;
            badgeColumns?: number[];
        } = {},
    ) {
        const {
            columnWidths,
            headerBackground = COLORS.primary,
            headerColor = COLORS.white,
            rowAltBackground = COLORS.gray50,
            borderColor = COLORS.gray200,
            tableWidth,
            tableBackground,
            cellPadding = 5,
            rowGap = 6,
            badgeColumns = [],
        } = options;

        const startX = doc.x;
        const available = tableWidth || (doc.page.width - doc.page.margins.left - doc.page.margins.right);
        const widths = (columnWidths && columnWidths.length === headers.length)
            ? columnWidths
            : headers.map(() => available / headers.length);
        const totalW = widths.reduce((a, b) => a + b, 0);
        const headerH = 20;
        const bottomY = doc.page.height - doc.page.margins.bottom;

        doc.font('Helvetica').fontSize(8.5);
        const rowHeights = rows.map(row =>
            row.reduce((maxH, cell, i) => {
                const h = doc.heightOfString(String(cell), { width: widths[i] - cellPadding * 2 });
                return Math.max(maxH, h);
            }, 0),
        );

        const drawHeader = (y: number) => {
            doc.save().fillColor(headerBackground).roundedRect(startX, y, totalW, headerH, 4).fill().restore();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(headerColor);
            let hx = startX;
            headers.forEach((h, i) => {
                doc.text(h, hx + cellPadding, y + (headerH - 8.5) / 2,
                    { width: widths[i] - cellPadding * 2, lineBreak: false });
                hx += widths[i];
            });
        };

        if (doc.y + headerH + rowGap > bottomY) {
            doc.addPage();
            doc.x = doc.page.margins.left;
        }

        if (tableBackground) {
            const totalH = headerH + rowGap + rowHeights.reduce((acc, h) => acc + h + rowGap, 0);
            doc.save().fillColor(tableBackground)
                .roundedRect(startX, doc.y - 4, totalW, totalH + 8, 6).fill().restore();
        }

        drawHeader(doc.y);
        let cursorY = doc.y + headerH + rowGap;
        doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.text);

        rows.forEach((row, rowIndex) => {
            const rowH = rowHeights[rowIndex] || 12;

            if (cursorY + rowH > bottomY) {
                doc.addPage();
                doc.x = doc.page.margins.left;
                drawHeader(doc.y);
                cursorY = doc.y + headerH + rowGap;
            }

            if (rowIndex % 2 === 1) {
                doc.save().fillColor(rowAltBackground)
                    .rect(startX, cursorY - 2, totalW, rowH + 4).fill().restore();
            }

            let cx = startX;
            row.forEach((cell, colIndex) => {
                doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.text);
                if (badgeColumns.includes(colIndex)) {
                    const badgeColor = ESTADO_COLORS[cell?.toLowerCase()] || COLORS.gray400;
                    this.drawBadge(doc, cell, cx + cellPadding, cursorY + 1, badgeColor);
                } else {
                    doc.text(String(cell), cx + cellPadding, cursorY,
                        { width: widths[colIndex] - cellPadding * 2 });
                }
                cx += widths[colIndex];
            });

            doc.save().strokeColor(borderColor).lineWidth(0.4)
                .moveTo(startX, cursorY + rowH + 2)
                .lineTo(startX + totalW, cursorY + rowH + 2).stroke().restore();

            cursorY += rowH + rowGap;
        });

        doc.y = cursorY;
        doc.x = doc.page.margins.left;
    }

    private drawPieChart(
        doc: PDFKit.PDFDocument,
        title: string,
        x: number, y: number, radius: number,
        labels: string[], values: number[], colors: string[],
    ) {
        const savedY = doc.y;
        const savedX = doc.x;

        doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.gray800)
            .text(title, x - radius - 5, y - radius - 26,
                { width: (radius + 5) * 2, lineBreak: false });

        const total = values.reduce((a, b) => a + b, 0);
        if (total === 0) {
            doc.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted)
                .text('Sin datos', x - 30, y - 8, { lineBreak: false });
            doc.y = savedY; doc.x = savedX;
            return;
        }

        let angle = -Math.PI / 2;
        values.forEach((value, index) => {
            const slice = (value / total) * Math.PI * 2;
            const d = doc as any;
            d.save();
            d.moveTo(x, y);
            d.fillColor(colors[index % colors.length]);
            d.arc(x, y, radius, angle, angle + slice).lineTo(x, y).fill();
            d.restore();
            angle += slice;
        });

        doc.save().fillColor(COLORS.white).circle(x, y, radius * 0.42).fill().restore();

        doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.gray800)
            .text(String(total), x - 18, y - 9, { width: 36, align: 'center', lineBreak: false });
        doc.font('Helvetica').fontSize(7).fillColor(COLORS.textMuted)
            .text('total', x - 18, y + 5, { width: 36, align: 'center', lineBreak: false });

        // Leyenda debajo del círculo
        const legendStartY = y + radius + 12;
        const legendStartX = x - radius;
        const legendW = radius * 2;
        const itemH = 14;

        labels.forEach((label, index) => {
            const ly = legendStartY + index * itemH;
            doc.save().fillColor(colors[index % colors.length])
                .roundedRect(legendStartX, ly, 9, 9, 2).fill().restore();

            const pct = ((values[index] / total) * 100).toFixed(1);
            doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.text)
                .text(`${label}: ${values[index]} (${pct}%)`, legendStartX + 13, ly,
                    { width: legendW - 13, lineBreak: false });
        });

        doc.y = savedY;
        doc.x = savedX;
    }

    private drawHorizontalBarChart(
        doc: PDFKit.PDFDocument,
        title: string,
        x: number, y: number, w: number,
        labels: string[], values: number[], color: string,
    ) {
        const savedY = doc.y;
        const savedX = doc.x;

        doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.gray800)
            .text(title, x, y - 24, { width: w, lineBreak: false });

        const maxValue = Math.max(...values, 1);
        const barH = 14;
        const barGap = 6;
        const labelW = 110;
        const barAreaW = w - labelW - 40;

        values.forEach((val, i) => {
            const by = y + i * (barH + barGap);
            const filledW = (val / maxValue) * barAreaW;

            doc.save().fillColor(COLORS.gray100)
                .roundedRect(x + labelW, by, barAreaW, barH, 3).fill().restore();
            doc.save().fillColor(color)
                .roundedRect(x + labelW, by, Math.max(filledW, 4), barH, 3).fill().restore();

            const labelStr = labels[i].length > 16 ? `${labels[i].slice(0, 15)}…` : labels[i];
            doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.gray700)
                .text(labelStr, x, by + 2, { width: labelW - 6, lineBreak: false });
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.white)
                .text(String(val), x + labelW + Math.max(filledW - 20, 4), by + 2,
                    { width: 20, align: 'right', lineBreak: false });
        });

        doc.y = savedY;
        doc.x = savedX;
    }

    // ── Main generate method ──────────────────────────────────────────────────

    async generate(data: EstadisticasData, options: PdfReportOptions): Promise<{ buffer: Buffer; filename: string }> {
        const { startDate, endDate, areaName, estado, jornada, authorName } = options;

        // Armar filtros
        const filterParts: string[] = [];
        if (startDate && endDate) filterParts.push(`${startDate} a ${endDate}`);
        else if (startDate) filterParts.push(`Desde ${startDate}`);
        else if (endDate) filterParts.push(`Hasta ${endDate}`);
        else filterParts.push('Historico completo');
        if (areaName) filterParts.push(`Area: ${areaName}`);
        if (estado) filterParts.push(`Estado: ${estado}`);
        if (jornada) filterParts.push(`Jornada: ${jornada}`);

        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 65, bottom: 30, left: 40, right: 40 },
            bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk as Buffer));

        const pageW = doc.page.width;
        const marginL = doc.page.margins.left;
        const contentW = pageW - marginL - doc.page.margins.right;

        // Contexto de página para el evento pageAdded
        const pageCtx = {
            title: 'Reporte de Salidas',
            subtitle: filterParts.join('  ·  '),
        };

        doc.on('pageAdded', () => {
            this.drawPageHeader(doc, pageCtx.title, pageCtx.subtitle);
            doc.x = marginL;
        });

        const addPage = (title: string, subtitle?: string) => {
            pageCtx.title = title;
            pageCtx.subtitle = subtitle ?? filterParts.join('  ·  ');
            doc.addPage();
        };

        const ensureSpace = (h: number, title?: string) => {
            if (doc.y + h > doc.page.height - doc.page.margins.bottom - 40) {
                addPage(title ?? pageCtx.title, pageCtx.subtitle);
            }
        };

        // ── PÁGINA 1: Resumen ───────────────────────────────────────────────
        this.drawPageHeader(doc, pageCtx.title, pageCtx.subtitle);
        doc.x = marginL;

        // Chips de filtros
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.textMuted)
            .text('Filtros aplicados:', marginL, doc.y, { lineBreak: false });
        let chipX = marginL + doc.widthOfString('Filtros aplicados:') + 8;
        const chipColors = [COLORS.primaryLight, COLORS.success, COLORS.warning, COLORS.purple];
        filterParts.forEach((f, i) => {
            this.drawBadge(doc, f, chipX, doc.y - 1, chipColors[i % chipColors.length]);
            chipX += doc.widthOfString(f) + 30;
        });
        doc.moveDown(1.5);
        doc.x = marginL;

        // KPIs
        const kpiData = [
            { label: 'Total Salidas', value: String(data.total), color: COLORS.primaryLight },
            { label: 'Aprobadas', value: String(data.estados.find(e => e.name === 'aprobada')?.count || 0), color: COLORS.success },
            { label: 'Pendientes', value: String(data.estados.find(e => e.name === 'pendiente')?.count || 0), color: COLORS.warning },
            { label: 'Rechazadas', value: String(data.estados.find(e => e.name === 'rechazada')?.count || 0), color: COLORS.danger },
        ];
        const kpiW = (contentW - 18) / 4;
        const kpiH = 65;
        const kpiTop = doc.y;
        kpiData.forEach((k, i) => {
            this.drawKpiCard(doc, marginL + i * (kpiW + 6), kpiTop, kpiW, kpiH, k.value, k.label, k.color);
        });
        doc.y = kpiTop + kpiH + 18;
        doc.x = marginL;

        // Tablas lado a lado
        this.drawSectionTitle(doc, 'Distribucion de Salidas');
        const halfW = (contentW - 16) / 2;
        const tableStartY = doc.y;

        const estadoRows = data.estados.map(e => [e.name, String(e.count)]);
        let yAfterLeft = tableStartY;
        if (estadoRows.length > 0) {
            doc.x = marginL; doc.y = tableStartY;
            this.drawTable(doc, ['Estado', 'Cantidad'], estadoRows, {
                columnWidths: [halfW - 60, 60], tableWidth: halfW,
                headerBackground: COLORS.primary, rowAltBackground: COLORS.gray100,
                borderColor: COLORS.gray200, cellPadding: 7, rowGap: 5, badgeColumns: [0],
            });
            yAfterLeft = doc.y;
        }

        const solRows = data.topSolicitantes.map(s => [s.name, String(s.count)]);
        let yAfterRight = tableStartY;
        if (solRows.length > 0) {
            doc.x = marginL + halfW + 16; doc.y = tableStartY;
            this.drawTable(doc, ['Solicitante', 'Salidas'], solRows, {
                columnWidths: [halfW - 60, 60], tableWidth: halfW,
                headerBackground: COLORS.primary, rowAltBackground: COLORS.gray100,
                borderColor: COLORS.gray200, cellPadding: 7, rowGap: 5,
            });
            yAfterRight = doc.y;
        }

        doc.y = Math.max(yAfterLeft, yAfterRight) + 6;
        doc.x = marginL;

        ensureSpace(60);
        const areaRows = data.areas.map(a => [a.name, String(a.count)]);
        if (areaRows.length > 0) {
            this.drawSectionTitle(doc, 'Salidas por Area');
            this.drawTable(doc, ['Area', 'Cantidad'], areaRows, {
                columnWidths: [contentW - 80, 80],
                headerBackground: COLORS.primary, rowAltBackground: COLORS.gray100,
                borderColor: COLORS.gray200, cellPadding: 7, rowGap: 5,
            });
        }

        // ── PÁGINA 2: Gráficos ──────────────────────────────────────────────
        addPage('Graficos Estadisticos');
        doc.x = marginL;

        const chartsY = doc.y + 8;
        const pieRadius = 72;
        const pieCenterX = marginL + pieRadius + 10;
        const pieCenterY = chartsY + pieRadius + 30;

        const estadoLabels = data.estados.map(e => e.name);
        const estadoCounts = data.estados.map(e => e.count);
        const areaLabels = data.areas.map(a => a.name);
        const areaCounts = data.areas.map(a => a.count);
        const topLabels = data.topSolicitantes.map(s => s.name);
        const topCounts = data.topSolicitantes.map(s => s.count);
        const estadoPalette = estadoLabels.map(l => ESTADO_COLORS[l] || CHART_PALETTE[0]);

        this.drawPieChart(doc, 'Distribucion por Estado', pieCenterX, pieCenterY, pieRadius,
            estadoLabels, estadoCounts, estadoPalette);

        const barChartX = marginL + pieRadius * 2 + 60;
        const barChartW = contentW - (pieRadius * 2 + 70);
        if (topLabels.length > 0) {
            this.drawHorizontalBarChart(doc, 'Top Solicitantes', barChartX, chartsY + 30,
                barChartW, topLabels, topCounts, COLORS.success);
        }

        const legendTotalH = estadoLabels.length * 14;
        const nextChartY = pieCenterY + pieRadius + 12 + legendTotalH + 24;
        if (areaLabels.length > 0) {
            this.drawHorizontalBarChart(doc, 'Salidas por Area', marginL, nextChartY,
                contentW, areaLabels, areaCounts, COLORS.primaryLight);
        }

        // ── PÁGINA 3+: Detalle ──────────────────────────────────────────────
        addPage('Detalle de Salidas', `${data.items.length} registros`);
        doc.x = marginL;

        if (data.items.length === 0) {
            doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
                .text('Sin registros para los filtros seleccionados.', { width: contentW });
        } else {
            data.items.forEach((item, index) => {
                ensureSpace(55, 'Detalle de Salidas');
                doc.x = marginL;
                doc.moveDown(0.5);

                const headerY = doc.y;
                doc.save().fillColor(COLORS.gray800)
                    .roundedRect(marginL, headerY, contentW, 22, 4).fill().restore();

                doc.save().fillColor(COLORS.accent)
                    .roundedRect(marginL, headerY, 28, 22, 4).fill()
                    .rect(marginL + 14, headerY, 14, 22).fill().restore();

                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.white)
                    .text(String(index + 1), marginL + 4, headerY + 6,
                        { width: 20, align: 'center', lineBreak: false });

                doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white)
                    .text(item.codigo, marginL + 34, headerY + 6, { lineBreak: false });

                const estadoColor = ESTADO_COLORS[item.estado] || COLORS.gray400;
                const codigoW = doc.widthOfString(item.codigo);
                this.drawBadge(doc, item.estado.toUpperCase(),
                    marginL + 34 + codigoW + 12, headerY + 7, estadoColor);

                doc.font('Helvetica').fontSize(8.5).fillColor('#93C5FD')
                    .text(`${this.formatDate(item.fecha_inicio)} — ${this.formatDate(item.fecha_final)}`,
                        marginL, headerY + 7, { width: contentW - 10, align: 'right', lineBreak: false });

                doc.y = headerY + 26;
                doc.x = marginL;

                const detailRows: string[][] = [];
                const push = (label: string, value: string) => {
                    if (!this.isEmptyValue(value)) detailRows.push([label, value]);
                };

                push('Tipo / Subtipo', [this.normalizeText(item.tipo_salida), this.normalizeText(item.subtipo_salida)].filter(v => v !== 'N/A').join(' / '));
                push('Tema', this.normalizeText(item.tema));
                push('Descripcion', this.normalizeText(item.descripcion));
                push('Jornada', this.normalizeText(item.jornada));
                push('Area', this.normalizeText(item.areas?.name));
                push('Solicitante', item.solicitante ? `${item.solicitante.names} ${item.solicitante.last_name}  <${item.solicitante.email}>` : 'N/A');
                push('Aprobador', item.aprobador ? `${item.aprobador.names} ${item.aprobador.last_name}` : 'N/A');
                push('Lugar / Destino', item.lugar_evento?.name || this.toCsv(item.municipios));
                push('Municipios convocados', this.normalizeText(item.municipios_convocados));
                push('IPS', this.toCsv(item.ips));
                push('Entidades', this.toCsv(item.entidades));
                push('EAPB', this.toCsv(item.eapb));
                push('Organizaciones', this.toCsv(item.organizaciones));
                push('IDSN', this.toCsv(item.idsn));
                push('Instituciones convocadas', item.instituciones_convocadas ? String(item.instituciones_convocadas) : 'N/A');
                push('Transporte (medio)', this.normalizeText(item.transporte_medio));
                push('Transporte (responsables)', this.normalizeText(item.transporte_responsables));
                push('Observaciones', this.normalizeText(item.observaciones));

                if (detailRows.length === 0) {
                    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.textMuted).text('Sin datos.');
                } else {
                    this.drawTable(doc, ['Campo', 'Detalle'], detailRows, {
                        columnWidths: [160, contentW - 160],
                        headerBackground: COLORS.gray700, rowAltBackground: COLORS.gray50,
                        borderColor: COLORS.gray200, cellPadding: 6, rowGap: 4,
                    });
                }

                doc.moveDown(0.3);
                this.drawHRule(doc, COLORS.gray300, 0.5, 2, 2);
            });
        }

        // ── Footers en todas las páginas ────────────────────────────────────
        doc.removeAllListeners('pageAdded');

        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(range.start + i);
            const origBottom = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;
            doc.y = doc.page.margins.top;
            this.drawPageFooter(doc, i + 1, authorName);
            doc.page.margins.bottom = origBottom;
        }

        const bufferPromise = new Promise<Buffer>((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
        doc.end();

        const buffer = await bufferPromise;
        const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        return { buffer, filename: `Reporte_Salidas_${fileDate}.pdf` };
    }
}
