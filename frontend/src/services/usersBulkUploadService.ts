import api from './api';

export interface BulkUploadAssignment {
    subdireccion_id: string;
    area_id?: string;
    user_type_id: string;
}

export interface BulkPreviewRow {
    row: number;
    names: string;
    last_name: string;
    num_id: string;
    email: string;
    charge?: string;
    username: string;
    password: string;
    status: 'ok' | 'error';
    errors: string[];
}

export interface BulkPreviewResponse {
    subdireccion_id: string;
    area_id: string | null;
    user_type_id: string;
    total: number;
    valid: number;
    invalid: number;
    rows: BulkPreviewRow[];
}

export interface BulkConfirmRow {
    names: string;
    last_name: string;
    num_id: string;
    email: string;
    charge?: string;
    username: string;
    password: string;
}

export interface BulkConfirmResult {
    row: number;
    names: string;
    last_name: string;
    username: string;
    status: 'created' | 'error';
    message?: string;
    id?: string;
}

export interface BulkConfirmResponse {
    created: number;
    failed: number;
    results: BulkConfirmResult[];
}

export const usersBulkUploadService = {
    preview: async (file: File, assignment: BulkUploadAssignment): Promise<BulkPreviewResponse> => {
        const formData = new FormData();
        formData.append('subdireccion_id', assignment.subdireccion_id);
        if (assignment.area_id) formData.append('area_id', assignment.area_id);
        formData.append('user_type_id', assignment.user_type_id);
        formData.append('file', file);

        const response = await api.post<BulkPreviewResponse>('/users/bulk-upload/preview', formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    confirm: async (assignment: BulkUploadAssignment, users: BulkConfirmRow[]): Promise<BulkConfirmResponse> => {
        const response = await api.post<BulkConfirmResponse>('/users/bulk-upload/confirm', {
            ...assignment,
            users,
        });
        return response.data;
    },

    downloadTemplate: async (): Promise<void> => {
        const response = await api.get('/users/bulk-upload/template', {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'plantilla_carga_usuarios.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    },
};
