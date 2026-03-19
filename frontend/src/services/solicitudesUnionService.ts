import api from './api';

export interface SolicitudUnion {
    id: string;
    salida_id: string;
    solicitante_id: string;
    area_solicitante_id: string;
    mensaje?: string;
    estado: 'pendiente' | 'aceptada' | 'rechazada';
    respuesta?: string;
    created_at: string;
    updated_at: string;
    salida: {
        id: string;
        codigo: string;
        tema: string;
        tipo_salida: string;
        fecha_inicio: string;
        fecha_final: string;
        jornada: string;
        areas: {
            id: string;
            name: string;
            subdirecciones?: { id: string; name: string };
        };
    };
    solicitante: {
        id: string;
        names: string;
        last_name: string;
        email: string;
    };
    area_solicitante: {
        id: string;
        name: string;
    };
}

export interface CreateSolicitudUnionPayload {
    salida_id: string;
    mensaje?: string;
}

export const solicitudesUnionService = {
    create: async (data: CreateSolicitudUnionPayload): Promise<SolicitudUnion> => {
        const response = await api.post<SolicitudUnion>('/solicitudes-union', data);
        return response.data;
    },

    getAll: async (): Promise<SolicitudUnion[]> => {
        const response = await api.get<SolicitudUnion[]>('/solicitudes-union');
        return response.data;
    },

    getPendingCount: async (): Promise<number> => {
        const response = await api.get<number>('/solicitudes-union/pending-count');
        return response.data;
    },

    accept: async (id: string, respuesta?: string): Promise<SolicitudUnion> => {
        const response = await api.post<SolicitudUnion>(`/solicitudes-union/${id}/accept`, { respuesta });
        return response.data;
    },

    reject: async (id: string, respuesta?: string): Promise<SolicitudUnion> => {
        const response = await api.post<SolicitudUnion>(`/solicitudes-union/${id}/reject`, { respuesta });
        return response.data;
    },
};
