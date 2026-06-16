export interface CreateIvcPayload {
    tema: string;
    fecha_inicio: string;
    fecha_final: string;
    jornada: string;
    instituciones_convocadas?: string;
    transporte_medio?: string;
    transporte_num_instituciones?: number;
    lugar_evento_id?: string;
    responsable_articulacion?: string;
    area_id?: string;
    solicitante_id?: string;
}

export interface IvcRecord {
    id: string;
    codigo: string;
    tipo_programacion: string;
    tema: string;
    fecha_inicio: string;
    fecha_final: string;
    jornada: string;
    instituciones_convocadas?: string;
    transporte_medio?: string;
    transporte_num_instituciones?: number;
    lugar_evento_id?: string;
    lugar_evento?: { id: string; name: string };
    responsable_articulacion?: string;
    estado: string;
    observaciones?: string;
    fecha_solicitud: string;
    solicitante_id: string;
    area_id: string;
    solicitante: { id: string; names: string; email: string };
    areas: { id: string; name: string; subdirecciones?: { id: string; name: string } };
    created_at: string;
    updated_at: string;
}
