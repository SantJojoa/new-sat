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

    getEstadisticas: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string, subdireccionId?: string, tipo?: string, subtipo?: string): Promise<EstadisticasData> => {
        const params: Record<string, number | string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (jornada) params.jornada = jornada;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        if (tipo) params.tipo = tipo;
        if (subtipo) params.subtipo = subtipo;

        const response = await api.get<EstadisticasData>('/salidas/estadisticas', { params });
        return response.data;
    },

    downloadEstadisticasPdf: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string, subdireccionId?: string, tipo?: string, subtipo?: string) => {
        const params: Record<string, number | string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (jornada) params.jornada = jornada;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        if (tipo) params.tipo = tipo;
        if (subtipo) params.subtipo = subtipo;

        const response = await api.get('/salidas/estadisticas/pdf', {
            params,
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = 'Reporte_Salidas.pdf';
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }

        return { blob: response.data as Blob, filename };
    },

    downloadEstadisticasExcel: async (startDate?: string, endDate?: string, areaId?: string, estado?: string, jornada?: string, subdireccionId?: string, tipo?: string, subtipo?: string) => {
        const params: Record<string, number | string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (areaId) params.area_id = areaId;
        if (estado) params.estado = estado;
        if (jornada) params.jornada = jornada;
        if (subdireccionId) params.subdireccion_id = subdireccionId;
        if (tipo) params.tipo = tipo;
        if (subtipo) params.subtipo = subtipo;

        const response = await api.get('/salidas/estadisticas/excel', {
            params,
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = 'Reporte_Salidas.xlsx';
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }

        return { blob: response.data as Blob, filename };
    },

    bulkApproveSalidas: async (ids: string[], observaciones: string): Promise<BulkActionResult> => {
        const response = await api.post<BulkActionResult>('/salidas/bulk-approve', { ids, observaciones });
        return response.data;
    },

    bulkRejectSalidas: async (ids: string[], motivo: string): Promise<BulkActionResult> => {
        const response = await api.post<BulkActionResult>('/salidas/bulk-reject', { ids, motivo });
        return response.data;
    },

    setSeguimiento: async (id: string, data: {
        se_realizo: boolean;
        num_instituciones_asistieron?: number;
        num_total_asistentes?: number;
        evaluacion_satisfaccion?: number;
        observaciones?: string;
    }) => {
        const response = await api.patch(`/salidas/${id}/seguimiento`, data);
        return response.data;
    },

    setSeguimientoIvc: async (id: string, data: {
        se_realizo: boolean;
        num_autocomisorio?: number;
        fecha_autocomisorio?: string;
        observaciones?: string;
    }) => {
        const response = await api.patch(`/salidas/${id}/seguimiento-ivc`, data);
        return response.data;
    },

    setSeguimientoArticulacionIv: async (id: string, data: {
        se_realizo_vsp: boolean;
        observaciones?: string;
    }) => {
        const response = await api.patch(`/salidas/${id}/seguimiento-articulacion-iv`, data);
        return response.data;
    },

    setSeguimientoAcompanamiento: async (id: string, data: {
        se_programo: boolean;
        se_realizo: boolean;
        nombre_reunion?: string;
        fecha_reunion?: string;
        hora_inicial?: string;
        hora_final?: string;
        acta_numero?: string;
        institucion?: string;
        municipio?: string;
        lugar?: string;
        material_entregado?: string;
        asistentes?: any[];
        orden_del_dia?: any[];
        desarrollo?: string;
        conclusiones?: string;
        compromisos?: any[];
        proxima_lugar?: string;
        proxima_fecha?: string;
        proxima_hora?: string;
    }) => {
        const response = await api.patch(`/salidas/${id}/seguimiento-acompanamiento`, data);
        return response.data;
    },

    downloadCertificadoAcompanamiento: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/salidas/${id}/certificado-acompanamiento`, {
            responseType: 'blob',
        });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `certificado-acompanamiento-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `certificado-acompanamiento-${codigo ?? id}`;
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

    uploadActaAcompanamiento: async (id: string, file: File, seRealizo: boolean) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('se_realizo', String(seRealizo));
        const response = await api.post(`/salidas/${id}/seguimiento-acompanamiento/archivo`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    downloadActaArchivoAcompanamiento: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/salidas/${id}/seguimiento-acompanamiento/archivo`, {
            responseType: 'blob',
        });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `acta-acompanamiento-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `acta-acompanamiento-${codigo ?? id}`;
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

    uploadActaCapacitacion: async (id: string, file: File, seRealizo: boolean) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('se_realizo', String(seRealizo));
        const response = await api.post(`/salidas/${id}/seguimiento/archivo`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    downloadActaArchivoCapacitacion: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/salidas/${id}/seguimiento/archivo`, { responseType: 'blob' });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `acta-capacitacion-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `acta-capacitacion-${codigo ?? id}`;
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

    uploadActaIvc: async (id: string, file: File, seRealizo: boolean) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('se_realizo', String(seRealizo));
        const response = await api.post(`/salidas/${id}/seguimiento-ivc/archivo`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    downloadActaArchivoIvc: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/salidas/${id}/seguimiento-ivc/archivo`, { responseType: 'blob' });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `acta-ivc-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `acta-ivc-${codigo ?? id}`;
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

    uploadActaArticulacionIv: async (id: string, file: File, seRealizo: boolean) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('se_realizo', String(seRealizo));
        const response = await api.post(`/salidas/${id}/seguimiento-articulacion-iv/archivo`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    downloadActaArchivoArticulacionIv: async (id: string, codigo?: string): Promise<void> => {
        const response = await api.get(`/salidas/${id}/seguimiento-articulacion-iv/archivo`, { responseType: 'blob' });
        const contentDisposition = response.headers['content-disposition'] as string | undefined;
        let filename = `acta-articulacion-iv-${id}.pdf`;
        if (contentDisposition) {
            const match = /filename="([^"]+)"/i.exec(contentDisposition);
            if (match?.[1]) filename = match[1];
        }
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
        const windowName = `acta-articulacion-iv-${codigo ?? id}`;
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
}
