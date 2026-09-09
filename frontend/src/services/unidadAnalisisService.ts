import api from './api';
import type {
    CatalogosResponse,
    CreateSalidaPayload,
    SalidaRecord,
} from '../types/salidas';

export type { CatalogoItem } from '../types/salidas';

export type CreateUnidadAnalisisPayload = Omit<CreateSalidaPayload, 'subtipo_salida'>;

export const unidadAnalisisService = {
    getCatalogos: async (): Promise<CatalogosResponse> => {
        const response = await api.get<CatalogosResponse>('/unidad-analisis/catalogos');
        return response.data;
    },

    create: async (data: CreateUnidadAnalisisPayload) => {
        const response = await api.post('/unidad-analisis', data);
        return response.data;
    },

    getAll: async (viewAll: boolean = false): Promise<SalidaRecord[]> => {
        const response = await api.get<SalidaRecord[]>('/unidad-analisis', { params: { viewAll } });
        return response.data;
    },

    getById: async (id: string): Promise<SalidaRecord> => {
        const response = await api.get<SalidaRecord>(`/unidad-analisis/${id}`);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateUnidadAnalisisPayload>) => {
        const response = await api.patch(`/unidad-analisis/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/unidad-analisis/${id}`);
        return response.data;
    },

    setSeguimiento: async (id: string, data: { se_realizo_vsp: boolean; observaciones?: string }) => {
        const response = await api.patch(`/unidad-analisis/${id}/seguimiento-articulacion-iv`, data);
        return response.data;
    },

    uploadActaSeguimiento: async (id: string, file: File, seRealizo: boolean) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('se_realizo', String(seRealizo));
        const response = await api.post(`/unidad-analisis/${id}/seguimiento-articulacion-iv/archivo`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    downloadActaArchivoSeguimiento: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/unidad-analisis/${id}/seguimiento-articulacion-iv/archivo`, { responseType: 'blob' });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `acta-unidad-analisis-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `acta-unidad-analisis-${codigo ?? id}`;
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
