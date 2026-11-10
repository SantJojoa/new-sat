import { Controller, Get, Query, Request, Res, StreamableFile, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportesService, TODAS_SECCIONES, type Seccion } from './reportes.service';
import { buildExcel, buildPdf } from './reportes-export';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
    constructor(private readonly service: ReportesService) { }

    @Get('resumen')
    getResumen(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('subdireccion_id') subdireccionId?: string,
        @Query('area_id') areaId?: string,
    ) {
        return this.service.getResumen(req.user, { startDate, endDate, subdireccionId, areaId });
    }

    private parseSecciones(raw?: string): Seccion[] {
        const list = (raw || '').split(',').map(s => s.trim()).filter((s): s is Seccion => (TODAS_SECCIONES as string[]).includes(s));
        return list.length ? list : TODAS_SECCIONES;
    }

    private async exportar(kind: 'excel' | 'pdf', req: any, res: Response, q: Record<string, string | undefined>) {
        const secciones = this.parseSecciones(q.secciones);
        const filtros = { startDate: q.startDate, endDate: q.endDate, subdireccionId: q.subdireccion_id, areaId: q.area_id };
        const { resumen, hojas } = await this.service.getReporteCompleto(req.user, filtros, secciones);
        const partes = [
            q.startDate || q.endDate ? `${q.startDate || '...'} a ${q.endDate || '...'}` : 'Histórico completo',
            q.subdireccion_id ? 'subdirección filtrada' : '', q.area_id ? 'área filtrada' : '',
        ].filter(Boolean);
        const meta = { autor: `${req.user.names} ${req.user.last_name}`, filtros: partes.join(' · '), secciones };
        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        if (kind === 'excel') {
            res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="Reporte_General_${stamp}.xlsx"` });
            return new StreamableFile(await buildExcel(resumen, hojas, meta));
        }
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="Reporte_General_${stamp}.pdf"` });
        return new StreamableFile(await buildPdf(resumen, hojas, meta));
    }

    @Get('excel')
    excel(@Request() req, @Res({ passthrough: true }) res: Response, @Query() q: Record<string, string>) {
        return this.exportar('excel', req, res, q);
    }

    @Get('pdf')
    pdf(@Request() req, @Res({ passthrough: true }) res: Response, @Query() q: Record<string, string>) {
        return this.exportar('pdf', req, res, q);
    }
}
