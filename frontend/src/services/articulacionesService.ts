import api from './api';
import type { ArticulacionRecord, ArticulacionCatalogosResponse, CreateArticulacionPayload } from '../types/articulaciones';

export const articulacionesService = {
    getCatalogos: async (): Promise<ArticulacionCatalogosResponse> => {
        const response = await api.get<ArticulacionCatalogosResponse>('/articulaciones/catalogos');
        return response.data;
    },

    create: async (data: CreateArticulacionPayload): Promise<ArticulacionRecord> => {
        const response = await api.post<ArticulacionRecord>('/articulaciones', data);
        return response.data;
    },

    getAll: async (viewAll: boolean = false): Promise<ArticulacionRecord[]> => {
        const response = await api.get<ArticulacionRecord[]>('/articulaciones', { params: { viewAll } });
        return response.data;
    },

    getById: async (id: string): Promise<ArticulacionRecord> => {
        const response = await api.get<ArticulacionRecord>(`/articulaciones/${id}`);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateArticulacionPayload>): Promise<ArticulacionRecord> => {
        const response = await api.patch<ArticulacionRecord>(`/articulaciones/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/articulaciones/${id}`);
    },

    downloadExcel: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        const response = await api.get('/articulaciones/estadisticas/excel', { params, responseType: 'blob' });
        const cd = response.headers['content-disposition'] as string | undefined;
        const match = cd && /filename="([^"]+)"/i.exec(cd);
        return { blob: response.data as Blob, filename: match?.[1] ?? 'Reporte_Articulaciones.xlsx' };
    },

    downloadPdf: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        const response = await api.get('/articulaciones/estadisticas/pdf', { params, responseType: 'blob' });
        const cd = response.headers['content-disposition'] as string | undefined;
        const match = cd && /filename="([^"]+)"/i.exec(cd);
        return { blob: response.data as Blob, filename: match?.[1] ?? 'Reporte_Articulaciones.pdf' };
    },

    getEstadisticas: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        const response = await api.get('/articulaciones/estadisticas', { params });
        return response.data as { total: number; estados: { name: string; count: number }[]; topSolicitantes: { name: string; count: number }[]; areas: { name: string; count: number }[]; porSubdireccion?: { name: string; count: number }[] };
    },

    setSeguimientoArticulacion: async (id: string, data: {
        se_programo: boolean;
        se_realizo: boolean;
        nombre_reunion?: string;
        fecha_reunion?: string;
        hora_inicial?: string;
        hora_final?: string;
        acta_numero?: string;
        institucion?: string;
        municipio?: string;
        lugar?: string;
        material_entregado?: string;
        asistentes?: any[];
        orden_del_dia?: any[];
        desarrollo?: string;
        conclusiones?: string;
        compromisos?: any[];
        proxima_lugar?: string;
        proxima_fecha?: string;
        proxima_hora?: string;
    }) => {
        const response = await api.patch(`/articulaciones/${id}/seguimiento-articulacion`, data);
        return response.data;
    },

    downloadCertificadoArticulacion: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/articulaciones/${id}/certificado-articulacion`, {
            responseType: 'blob',
        });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `certificado-articulacion-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `certificado-articulacion-${codigo ?? id}`;
        const popup = window.open(url, windowName, 'width=900,height=700,menubar=no,toolbar=yes,scrollbars=yes,resizable=yes');
        if (!popup) {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    },

    uploadActaArticulacion: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/articulaciones/${id}/seguimiento-articulacion/archivo`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    downloadActaArchivoArticulacion: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/articulaciones/${id}/seguimiento-articulacion/archivo`, {
            responseType: 'blob',
        });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `acta-articulacion-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `acta-articulacion-${codigo ?? id}`;
        const popup = window.open(url, windowName, 'width=900,height=700,menubar=no,toolbar=yes,scrollbars=yes,resizable=yes');
        if (!popup) {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    },
};
