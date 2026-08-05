import api from './api';
import type { AcompanamientoNoRegistrado, CreateAcompanamientoNoRegistradoPayload, UploadActaAcompanamientoNoRegistradoPayload } from '../types/acompanamientoNoRegistrado';

export const acompanamientosNoRegistradosService = {
    create: async (data: CreateAcompanamientoNoRegistradoPayload): Promise<AcompanamientoNoRegistrado> => {
        const response = await api.post<AcompanamientoNoRegistrado>('/acompanamientos-no-registrados', data);
        return response.data;
    },

    uploadArchivo: async (data: UploadActaAcompanamientoNoRegistradoPayload, file: File): Promise<AcompanamientoNoRegistrado> => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) formData.append(key, value);
        });
        formData.append('file', file);
        const response = await api.post<AcompanamientoNoRegistrado>('/acompanamientos-no-registrados/archivo', formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    getAll: async (viewAll: boolean = false): Promise<AcompanamientoNoRegistrado[]> => {
        const response = await api.get<AcompanamientoNoRegistrado[]>('/acompanamientos-no-registrados', { params: { viewAll } });
        return response.data;
    },

    getById: async (id: string): Promise<AcompanamientoNoRegistrado> => {
        const response = await api.get<AcompanamientoNoRegistrado>(`/acompanamientos-no-registrados/${id}`);
        return response.data;
    },

    downloadCertificado: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/acompanamientos-no-registrados/${id}/certificado`, {
            responseType: 'blob',
        });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `certificado-acompanamiento-no-registrado-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `certificado-acompanamiento-no-registrado-${codigo ?? id}`;
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

    downloadArchivo: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/acompanamientos-no-registrados/${id}/archivo`, {
            responseType: 'blob',
        });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `acta-acompanamiento-no-registrado-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `acta-acompanamiento-no-registrado-${codigo ?? id}`;
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
