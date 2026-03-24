import api from './api';
import type {
    BulkActionResult,
    CatalogosResponse,
    CreateSalidaPayload,
    EstadisticasData,
    SalidaRecord,
} from '../types/salidas';

export type { CatalogoItem } from '../types/salidas';

export const salidasService = {
    getCatalogos: async (): Promise<CatalogosResponse> => {
        const response = await api.get<CatalogosResponse>('/salidas/catalogos');
        return response.data;
    },

    createSalida: async (data: CreateSalidaPayload) => {
        const response = await api.post('/salidas', data);
        return response.data;
    },

    getSalidas: async (viewAll: boolean = false): Promise<SalidaRecord[]> => {
        const response = await api.get<SalidaRecord[]>('/salidas', { params: { viewAll } });
        return response.data;
    },

    approveSalida: async (id: string, observaciones: string) => {
        const response = await api.post(`/salidas/${id}/approve`, { observaciones });
        return response.data;
    },

    rejectSalida: async (id: string, motivo: string) => {
        const response = await api.post(`/salidas/${id}/reject`, { motivo });
        return response.data;
    },

    getSalidaById: async (id: string): Promise<SalidaRecord> => {
        const response = await api.get<SalidaRecord>(`/salidas/${id}`);
        return response.data;
    },

    updateSalida: async (id: string, data: Partial<CreateSalidaPayload>) => {
        const response = await api.patch(`/salidas/${id}`, data);
        return response.data;
    },

    deleteSalida: async (id: string) => {
        const response = await api.delete(`/salidas/${id}`);
        return response.data;
    },

    getEstadisticas: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string): Promise<EstadisticasData> => {
        const params: Record<string, number | string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (jornada) params.jornada = jornada;

        const response = await api.get<EstadisticasData>('/salidas/estadisticas', { params });
        return response.data;
    },

    downloadEstadisticasPdf: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string) => {
        const params: Record<string, number | string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (jornada) params.jornada = jornada;

        const response = await api.get('/salidas/estadisticas/pdf', {
            params,
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = 'Reporte_Salidas.pdf';
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }

        return { blob: response.data as Blob, filename };
    },

    downloadEstadisticasExcel: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string) => {
        const params: Record<string, number | string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (jornada) params.jornada = jornada;

        const response = await api.get('/salidas/estadisticas/excel', {
            params,
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = 'Reporte_Salidas.xlsx';
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }

        return { blob: response.data as Blob, filename };
    },

    bulkApproveSalidas: async (ids: string[], observaciones: string): Promise<BulkActionResult> => {
        const response = await api.post<BulkActionResult>('/salidas/bulk-approve', { ids, observaciones });
        return response.data;
    },

    bulkRejectSalidas: async (ids: string[], motivo: string): Promise<BulkActionResult> => {
        const response = await api.post<BulkActionResult>('/salidas/bulk-reject', { ids, motivo });
        return response.data;
    }
};
