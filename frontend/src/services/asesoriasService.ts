import api from './api';
import type { CreateAsesoriaPayload, AsesoriaRecord, AsesoriasCatalogosResponse } from '../types/asesorias';

export const asesoriasService = {
    getCatalogos: async (): Promise<AsesoriasCatalogosResponse> => {
        const response = await api.get<AsesoriasCatalogosResponse>('/asesorias/catalogos');
        return response.data;
    },

    createAsesoria: async (data: CreateAsesoriaPayload): Promise<AsesoriaRecord> => {
        const response = await api.post<AsesoriaRecord>('/asesorias', data);
        return response.data;
    },

    getAsesorias: async (viewAll = false): Promise<AsesoriaRecord[]> => {
        const response = await api.get<AsesoriaRecord[]>('/asesorias', { params: { viewAll } });
        return response.data;
    },
    getAsesoriaById: async (id: string): Promise<AsesoriaRecord> => {
        const response = await api.get<AsesoriaRecord>(`/asesorias/${id}`);
        return response.data;
    },
    updateAsesoria: async (id: string, data: Partial<CreateAsesoriaPayload>): Promise<AsesoriaRecord> => {
        const response = await api.patch<AsesoriaRecord>(`/asesorias/${id}`, data);
        return response.data;
    },
    deleteAsesoria: async (id: string): Promise<void> => {
        await api.delete(`/asesorias/${id}`);
    },

    // Si se pasa `existingPopup` (y sigue abierta), recarga esa misma ventana con el PDF
    // fresco en vez de abrir una nueva — así se puede refrescar automáticamente cuando
    // alguien firma sin que el usuario tenga que cerrar y volver a generar el certificado.
    generateCertificado: async (id: string, codigo: string, existingPopup?: Window | null): Promise<Window | null> => {
        const response = await api.get(`/asesorias/${id}/certificado`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));

        let popup: Window | null = existingPopup && !existingPopup.closed ? existingPopup : null;
        if (popup) {
            popup.location.href = url;
        } else {
            popup = window.open(url, `certificado-${codigo}`, 'width=900,height=700,menubar=no,toolbar=yes,scrollbars=yes,resizable=yes');
        }

        if (!popup) {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificado-${codigo}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        return popup;
    },
};
