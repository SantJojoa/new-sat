import api from './api';
import type { DocumentoAdicional } from '../types/documentosAdicionales';

const buildUrl = (basePath: string, suffix = '') => `${basePath}/documentos${suffix}`;

export const documentosAdicionalesService = {
    list: async (basePath: string): Promise<DocumentoAdicional[]> => {
        const response = await api.get<DocumentoAdicional[]>(buildUrl(basePath));
        return response.data;
    },

    upload: async (basePath: string, files: File[]): Promise<DocumentoAdicional[]> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await api.post<DocumentoAdicional[]>(buildUrl(basePath), formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    download: async (basePath: string, docId: string, nombre: string): Promise<void> => {
        const response = await api.get(buildUrl(basePath, `/${docId}`), { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nombre);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    },

    remove: async (basePath: string, docId: string): Promise<void> => {
        await api.delete(buildUrl(basePath, `/${docId}`));
    },
};
