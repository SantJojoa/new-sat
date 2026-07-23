import api from './api';
import type { IvcRecord, CreateIvcPayload, IvcCatalogosResponse } from '../types/ivc';

export const ivcService = {
    getCatalogos: async (): Promise<IvcCatalogosResponse> => {
        const response = await api.get<IvcCatalogosResponse>('/ivc/catalogos');
        return response.data;
    },

    create: async (data: CreateIvcPayload): Promise<IvcRecord> => {
        const response = await api.post<IvcRecord>('/ivc', data);
        return response.data;
    },

    getAll: async (viewAll: boolean = false): Promise<IvcRecord[]> => {
        const response = await api.get<IvcRecord[]>('/ivc', { params: { viewAll } });
        return response.data;
    },

    getById: async (id: string): Promise<IvcRecord> => {
        const response = await api.get<IvcRecord>(`/ivc/${id}`);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateIvcPayload>): Promise<IvcRecord> => {
        const response = await api.patch<IvcRecord>(`/ivc/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/ivc/${id}`);
    },

    downloadExcel: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        const response = await api.get('/ivc/estadisticas/excel', { params, responseType: 'blob' });
        const cd = response.headers['content-disposition'] as string | undefined;
        const match = cd && /filename="([^"]+)"/i.exec(cd);
        return { blob: response.data as Blob, filename: match?.[1] ?? 'Reporte_IVC.xlsx' };
    },

    downloadPdf: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        const response = await api.get('/ivc/estadisticas/pdf', { params, responseType: 'blob' });
        const cd = response.headers['content-disposition'] as string | undefined;
        const match = cd && /filename="([^"]+)"/i.exec(cd);
        return { blob: response.data as Blob, filename: match?.[1] ?? 'Reporte_IVC.pdf' };
    },

    getEstadisticas: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, subdireccionId?: string) => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        const response = await api.get('/ivc/estadisticas', { params });
        return response.data as { total: number; estados: { name: string; count: number }[]; topSolicitantes: { name: string; count: number }[]; areas: { name: string; count: number }[]; porSubdireccion?: { name: string; count: number }[] };
    },
};
