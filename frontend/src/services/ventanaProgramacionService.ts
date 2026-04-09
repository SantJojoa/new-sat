import { api } from '../api/client';

export interface VentanaProgramacion {
    id: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
    created_at: string;
    updated_at: string;
}

export interface VentanaStatus {
    ventana: VentanaProgramacion | null;
    abierta: boolean;
}

export const ventanaProgramacionService = {
    get: async (): Promise<VentanaStatus> => {
        const res = await api.get('/ventana-programacion');
        return res.data;
    },

    set: async (fecha_inicio: string, fecha_fin: string): Promise<VentanaProgramacion> => {
        const res = await api.put('/ventana-programacion', { fecha_inicio, fecha_fin });
        return res.data;
    },

    deactivate: async (): Promise<void> => {
        await api.delete('/ventana-programacion');
    },
};
