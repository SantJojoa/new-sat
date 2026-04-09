import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ArticulacionReportData {
    total: number;
    topSolicitantes: { name: string; count: number }[];
    areas: { name: string; count: number }[];
    items: any[];
}

export interface ArticulacionReportOptions {
    startDate?: string;
    endDate?: string;
    areaName?: string;
    estado?: string;
    authorName: string;
    reportTitle: string;
    filenamePrefix: string;
}

@Injectable()
export class ArticulacionesExcelReport {

    private formatDate(date?: Date | null): string {
        if (!date) return 'N/A';
        const d = date instanceof Date ? date : new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    private norm(value?: string | null): string {
        return String(value ?? '').trim() || 'N/A';
    }

    async generate(data: ArticulacionReportData, options: ArticulacionReportOptions): Promise<{ buffer: Buffer; filename: string }> {
        const { startDate, endDate, areaName, authorName, reportTitle, filenamePrefix } = options;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = authorName;
        workbook.created = new Date();

        // ── Hoja 1: Resumen ──────────────────────────────────────────────
        const resumen = workbook.addWorksheet('Resumen');

        resumen.mergeCells('A1:D1');
        const title = resumen.getCell('A1');
        title.value = reportTitle;
        title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        title.alignment = { horizontal: 'center', vertical: 'middle' };
        resumen.getRow(1).height = 36;

        const filterParts: string[] = [];
        if (startDate && endDate) filterParts.push(`${startDate} a ${endDate}`);
        else if (startDate) filterParts.push(`Desde ${startDate}`);
        else if (endDate) filterParts.push(`Hasta ${endDate}`);
        else filterParts.push('Histórico completo');
        if (areaName) filterParts.push(`Área: ${areaName}`);

        resumen.mergeCells('A2:D2');
        const filterCell = resumen.getCell('A2');
        filterCell.value = `Filtros: ${filterParts.join('  ·  ')}`;
        filterCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
        filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        filterCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        resumen.getRow(2).height = 20;

        resumen.mergeCells('A3:D3');
        const meta = resumen.getCell('A3');
        meta.value = `Generado por: ${authorName}  |  Fecha: ${this.formatDate(new Date())}`;
        meta.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
        meta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        meta.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        resumen.getRow(3).height = 18;

        resumen.addRow([]);

        // KPI
        const kpiHeader = resumen.addRow(['Indicador', 'Valor']);
        kpiHeader.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        });
        resumen.addRow(['Total registros', data.total]);
        resumen.addRow([]);

        // Top solicitantes
        resumen.addRow(['Top Solicitantes', 'Registros']).eachCell(c => {
            c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        });
        data.topSolicitantes.forEach(s => resumen.addRow([s.name, s.count]));
        resumen.addRow([]);

        // Áreas
        resumen.addRow(['Área', 'Registros']).eachCell(c => {
            c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        });
        data.areas.forEach(a => resumen.addRow([a.name, a.count]));

        resumen.columns = [{ width: 40 }, { width: 15 }, { width: 15 }, { width: 20 }];

        // ── Hoja 2: Registros ────────────────────────────────────────────
        const sheet = workbook.addWorksheet('Registros');
        const headers = ['Código', 'Tipo', 'Tema', 'Fecha Inicio', 'Fecha Final', 'Jornada', 'Área', 'Solicitante', 'Responsable', 'Inst. Convocadas'];
        const headerRow = sheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
        sheet.getRow(1).height = 28;

        data.items.forEach((item, i) => {
            const row = sheet.addRow([
                this.norm(item.codigo),
                this.norm(item.tipo_programacion),
                this.norm(item.tema),
                this.formatDate(item.fecha_inicio),
                this.formatDate(item.fecha_final),
                this.norm(item.jornada),
                this.norm(item.areas?.name),
                `${this.norm(item.solicitante?.names)} ${this.norm(item.solicitante?.last_name ?? '')}`.trim(),
                this.norm(item.responsable_articulacion),
                item.instituciones_convocadas ?? 'N/A',
            ]);
            if (i % 2 === 1) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                });
            }
        });

        sheet.columns = [
            { width: 22 }, { width: 20 }, { width: 35 }, { width: 14 }, { width: 14 },
            { width: 14 }, { width: 22 }, { width: 28 }, { width: 28 }, { width: 14 },
        ];

        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return { buffer, filename: `${filenamePrefix}_${dateStr}.xlsx` };
    }
}
