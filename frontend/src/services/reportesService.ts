import api from './api';

export type ConteoItem = { name: string; count: number };
export type SeguimientoStat = { actividades: number; conSeguimiento: number; sinSeguimiento: number; realizadas: number };

type PorUbicacion = { porSubdireccion: ConteoItem[]; porArea: ConteoItem[] };

export interface ReportesResumen {
    programaciones: {
        total: number;
        porEstado: ConteoItem[];
        porTipo: ConteoItem[];
        porSubtipo: ConteoItem[];
        porSubdireccion: ConteoItem[];
        porArea: ConteoItem[];
    };
    asesorias: { total: number; minutos: number; porMedio: ConteoItem[] } & PorUbicacion;
    ivc: { total: number; porEstado: ConteoItem[] } & PorUbicacion;
    articulaciones: { total: number; porEstado: ConteoItem[] } & PorUbicacion;
    iv: { total: number } & PorUbicacion;
    seguimientos: {
        capacitaciones: SeguimientoStat;
        ivc: SeguimientoStat;
        inspeccionVigilancia: SeguimientoStat;
        articulaciones: SeguimientoStat;
    };
    acompanamientos: { programados: SeguimientoStat; noProgramados: number; total: number } & PorUbicacion;
}

export interface ReportesFiltros {
    startDate?: string;
    endDate?: string;
    subdireccionId?: string;
    areaId?: string;
}

export const reportesService = {
    getResumen: async (f: ReportesFiltros = {}): Promise<ReportesResumen> => {
        const params: Record<string, string> = {};
        if (f.startDate) params.startDate = f.startDate;
        if (f.endDate) params.endDate = f.endDate;
        if (f.subdireccionId) params.subdireccion_id = f.subdireccionId;
        if (f.areaId) params.area_id = f.areaId;
        const res = await api.get<ReportesResumen>('/reportes/resumen', { params });
        return res.data;
    },

    exportar: async (kind: 'excel' | 'pdf', f: ReportesFiltros, secciones: string[]): Promise<{ blob: Blob; filename: string }> => {
        const params: Record<string, string> = { secciones: secciones.join(',') };
        if (f.startDate) params.startDate = f.startDate;
        if (f.endDate) params.endDate = f.endDate;
        if (f.subdireccionId) params.subdireccion_id = f.subdireccionId;
        if (f.areaId) params.area_id = f.areaId;
        const res = await api.get(`/reportes/${kind}`, { params, responseType: 'blob' });
        const cd = res.headers['content-disposition'] as string | undefined;
        const filename = (cd && /filename="([^"]+)"/i.exec(cd)?.[1]) || `Reporte_General.${kind === 'excel' ? 'xlsx' : 'pdf'}`;
        return { blob: res.data as Blob, filename };
    },
};
