import api from './api';

export interface CatalogoItem {
    id: string;
    name: string;
}

export interface CatalogosResponse {
    municipios: CatalogoItem[];
    ips: CatalogoItem[];
    entidades: CatalogoItem[];
    eapb: CatalogoItem[];
    organizaciones: CatalogoItem[];
}

export interface CreateSalidaPayload {
    codigo: string;
    tipo_salida: string;
    subtipo_salida?: string;
    tema: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_final: string;
    jornada: string;
    municipios_ids?: string[];
    ips_ids?: string[];
    entidades_ids?: string[];
    eapb_ids?: string[];
    organizaciones_ids?: string[];
    transporte_medio?: string;
    transporte_responsables?: string;
    instituciones_convocadas?: number;
    lugar_evento_id?: string;
}

export const salidasService = {
    getCatalogos: async (): Promise<CatalogosResponse> => {
        const response = await api.get<CatalogosResponse>('/salidas/catalogos');
        return response.data;
    },

    createSalida: async (data: CreateSalidaPayload) => {
        const response = await api.post('/salidas', data);
        return response.data;
    },

    getSalidas: async (viewAll: boolean = false) => {
        const response = await api.get('/salidas', { params: { viewAll } });
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

    getSalidaById: async (id: string) => {
        const response = await api.get(`/salidas/${id}`);
        return response.data;
    },

    updateSalida: async (id: string, data: Partial<CreateSalidaPayload>) => {
        const response = await api.patch(`/salidas/${id}`, data);
        return response.data;
    },

    deleteSalida: async (id: string) => {
        const response = await api.delete(`/salidas/${id}`);
        return response.data;
    }
};
