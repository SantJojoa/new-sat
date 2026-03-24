import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { EstadisticasData, PdfReportOptions } from './salidas-pdf.report';

const ESTADO_COLORS: Record<string, string> = {
    aprobada: 'FF10B981',
    pendiente: 'FFF59E0B',
    rechazada: 'FFEF4444',
};

@Injectable()
export class SalidasExcelReport {

    private formatDate(date?: Date | null): string {
        if (!date) return 'N/A';
        const d = date instanceof Date ? date : new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    private toCsv(list?: { name: string }[]): string {
        if (!list || list.length === 0) return 'N/A';
        return list.map(i => i.name).join(', ');
    }

    private normalizeText(value?: string | null): string {
        if (!value) return 'N/A';
        return String(value).trim() || 'N/A';
    }

    async generate(data: EstadisticasData, options: PdfReportOptions): Promise<{ buffer: Buffer; filename: string }> {
        const { startDate, endDate, areaName, estado, jornada, authorName } = options;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = authorName;
        workbook.created = new Date();

        // ── Hoja 1: Resumen ────────────────────────────────────────────────────
        const resumenSheet = workbook.addWorksheet('Resumen');

        // Título principal
        resumenSheet.mergeCells('A1:D1');
        const titleCell = resumenSheet.getCell('A1');
        titleCell.value = 'Reporte de Programaciones de Salidas';
        titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        resumenSheet.getRow(1).height = 36;

        // Filtros aplicados
        resumenSheet.mergeCells('A2:D2');
        const filterParts: string[] = [];
        if (startDate && endDate) filterParts.push(`${startDate} a ${endDate}`);
        else if (startDate) filterParts.push(`Desde ${startDate}`);
        else if (endDate) filterParts.push(`Hasta ${endDate}`);
        else filterParts.push('Histórico completo');
        if (areaName) filterParts.push(`Área: ${areaName}`);
        if (estado) filterParts.push(`Estado: ${estado}`);
        if (jornada) filterParts.push(`Jornada: ${jornada}`);

        const filterCell = resumenSheet.getCell('A2');
        filterCell.value = `Filtros: ${filterParts.join('  ·  ')}`;
        filterCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
        filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        filterCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        resumenSheet.getRow(2).height = 20;

        // Generado por
        resumenSheet.mergeCells('A3:D3');
        const metaCell = resumenSheet.getCell('A3');
        metaCell.value = `Generado por: ${authorName}  |  Fecha: ${this.formatDate(new Date())}`;
        metaCell.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
        metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        metaCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        resumenSheet.getRow(3).height = 18;

        resumenSheet.addRow([]);

        // KPIs
        const kpiHeaderRow = resumenSheet.addRow(['KPI', 'Valor']);
        kpiHeaderRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FF0EA5E9' } } };
        });
        resumenSheet.getRow(kpiHeaderRow.number).height = 22;

        const aprobadas = data.estados.find(e => e.name === 'aprobada')?.count || 0;
        const pendientes = data.estados.find(e => e.name === 'pendiente')?.count || 0;
        const rechazadas = data.estados.find(e => e.name === 'rechazada')?.count || 0;

        const kpis = [
            ['Total Programaciones', data.total],
            ['Aprobadas', aprobadas],
            ['Pendientes', pendientes],
            ['Rechazadas', rechazadas],
        ];

        kpis.forEach(([label, value]) => {
            const row = resumenSheet.addRow([label, value]);
            row.getCell(1).font = { name: 'Calibri', size: 11 };
            row.getCell(2).font = { name: 'Calibri', size: 11, bold: true };
            row.getCell(2).alignment = { horizontal: 'center' };
            row.eachCell((cell) => {
                cell.border = {
                    bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
                };
            });
            resumenSheet.getRow(row.number).height = 20;
        });

        resumenSheet.addRow([]);

        // Distribución por Estado
        const estadoTitleRow = resumenSheet.addRow(['Distribución por Estado']);
        resumenSheet.mergeCells(`A${estadoTitleRow.number}:D${estadoTitleRow.number}`);
        estadoTitleRow.getCell(1).font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FF1E293B' } };
        estadoTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        resumenSheet.getRow(estadoTitleRow.number).height = 22;

        const estadoHeader = resumenSheet.addRow(['Estado', 'Cantidad']);
        estadoHeader.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        resumenSheet.getRow(estadoHeader.number).height = 20;

        data.estados.forEach((e) => {
            const row = resumenSheet.addRow([e.name, e.count]);
            const badgeColor = ESTADO_COLORS[e.name] || 'FF94A3B8';
            row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: badgeColor } };
            row.getCell(1).alignment = { horizontal: 'center' };
            row.getCell(2).alignment = { horizontal: 'center' };
            resumenSheet.getRow(row.number).height = 18;
        });

        resumenSheet.addRow([]);

        // Top Solicitantes
        const solTitleRow = resumenSheet.addRow(['Top Solicitantes']);
        resumenSheet.mergeCells(`A${solTitleRow.number}:D${solTitleRow.number}`);
        solTitleRow.getCell(1).font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FF1E293B' } };
        solTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        resumenSheet.getRow(solTitleRow.number).height = 22;

        const solHeader = resumenSheet.addRow(['Solicitante', 'Programaciones']);
        solHeader.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        resumenSheet.getRow(solHeader.number).height = 20;

        data.topSolicitantes.forEach((s, i) => {
            const row = resumenSheet.addRow([s.name, s.count]);
            row.getCell(2).alignment = { horizontal: 'center' };
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' } };
            });
            resumenSheet.getRow(row.number).height = 18;
        });

        resumenSheet.addRow([]);

        // Salidas por Área
        const areaTitleRow = resumenSheet.addRow(['Programaciones por Área']);
        resumenSheet.mergeCells(`A${areaTitleRow.number}:D${areaTitleRow.number}`);
        areaTitleRow.getCell(1).font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FF1E293B' } };
        areaTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        resumenSheet.getRow(areaTitleRow.number).height = 22;

        const areaHeader = resumenSheet.addRow(['Área', 'Programaciones']);
        areaHeader.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        resumenSheet.getRow(areaHeader.number).height = 20;

        data.areas.forEach((a, i) => {
            const row = resumenSheet.addRow([a.name, a.count]);
            row.getCell(2).alignment = { horizontal: 'center' };
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' } };
            });
            resumenSheet.getRow(row.number).height = 18;
        });

        resumenSheet.getColumn('A').width = 35;
        resumenSheet.getColumn('B').width = 20;
        resumenSheet.getColumn('C').width = 20;
        resumenSheet.getColumn('D').width = 20;

        // ── Hoja 2: Detalle ────────────────────────────────────────────────────
        const detalleSheet = workbook.addWorksheet('Detalle de Programaciones');

        const headers = [
            'Código', 'Estado', 'Tipo', 'Subtipo', 'Tema', 'Descripción',
            'Fecha Inicio', 'Fecha Final', 'Jornada', 'Área',
            'Solicitante', 'Email Solicitante', 'Aprobador',
            'Municipios', 'IPS', 'Entidades', 'EAPB', 'Organizaciones', 'IDSN',
            'Lugar/Destino', 'Mun. Convocados', 'Instituciones Convocadas',
            'Transporte Medio', 'Transporte Responsables', 'Observaciones',
            'Fecha Aprobación'
        ];

        // Header row
        const headerRow = detalleSheet.addRow(headers);
        headerRow.height = 24;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                bottom: { style: 'medium', color: { argb: 'FF0EA5E9' } },
                right: { style: 'hair', color: { argb: 'FF475569' } },
            };
        });

        // Freeze header row
        detalleSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }];

        // Data rows
        data.items.forEach((item, index) => {
            const row = detalleSheet.addRow([
                item.codigo,
                item.estado,
                this.normalizeText(item.tipo_salida),
                this.normalizeText(item.subtipo_salida),
                this.normalizeText(item.tema),
                this.normalizeText(item.descripcion),
                this.formatDate(item.fecha_inicio),
                this.formatDate(item.fecha_final),
                this.normalizeText(item.jornada),
                item.areas?.name || 'N/A',
                item.solicitante ? `${item.solicitante.names} ${item.solicitante.last_name}` : 'N/A',
                item.solicitante?.email || 'N/A',
                item.aprobador ? `${item.aprobador.names} ${item.aprobador.last_name}` : 'N/A',
                this.toCsv(item.municipios),
                this.toCsv(item.ips),
                this.toCsv(item.entidades),
                this.toCsv(item.eapb),
                this.toCsv(item.organizaciones),
                this.toCsv(item.idsn),
                item.lugar_evento?.name || this.toCsv(item.municipios),
                this.normalizeText(item.municipios_convocados),
                item.instituciones_convocadas != null ? String(item.instituciones_convocadas) : 'N/A',
                this.normalizeText(item.transporte_medio),
                this.normalizeText(item.transporte_responsables),
                this.normalizeText(item.observaciones),
                this.formatDate(item.fecha_aprobacion),
            ]);

            row.height = 18;

            // Estado badge color
            const estadoColor = ESTADO_COLORS[item.estado] || 'FF94A3B8';
            row.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 9 };
            row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estadoColor } };
            row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

            // Alternate row background
            const bg = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
            row.eachCell((cell, colNumber) => {
                if (colNumber !== 2) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                }
                cell.font = cell.font ?? { name: 'Calibri', size: 9 };
                cell.alignment = cell.alignment ?? { vertical: 'middle', wrapText: false };
                cell.border = {
                    bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
                };
            });
        });

        // Column widths for detail sheet
        const colWidths = [14, 12, 14, 14, 35, 35, 13, 13, 11, 22, 25, 28, 25, 30, 30, 30, 30, 30, 30, 22, 25, 18, 20, 25, 35, 16];
        colWidths.forEach((w, i) => {
            detalleSheet.getColumn(i + 1).width = w;
        });

        // Auto filter on detail sheet
        detalleSheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: headers.length },
        };

        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        return { buffer, filename: `Reporte_Salidas_${fileDate}.xlsx` };
    }
}
