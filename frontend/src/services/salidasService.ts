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

    getEstadisticas: async (month?: number, areaId?: string): Promise<EstadisticasData> => {
        const params: Record<string, number | string> = {};
        if (month) params.month = month;
        if (areaId) params.area_id = areaId;

        const response = await api.get<EstadisticasData>('/salidas/estadisticas', { params });
        return response.data;
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
