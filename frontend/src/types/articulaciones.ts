export interface CreateArticulacionPayload {
    tipo_programacion: string;
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

export interface SeguimientoArticulacion {
    id?: string;
    se_programo: boolean;
    se_realizo: boolean;
    nombre_reunion?: string | null;
    fecha_reunion?: string | null;
    hora_inicial?: string | null;
    hora_final?: string | null;
    acta_numero?: string | null;
    institucion?: string | null;
    municipio?: string | null;
    lugar?: string | null;
    material_entregado?: string | null;
    asistentes?: any[] | null;
    orden_del_dia?: any[] | null;
    desarrollo?: string | null;
    conclusiones?: string | null;
    compromisos?: any[] | null;
    proxima_lugar?: string | null;
    proxima_fecha?: string | null;
    proxima_hora?: string | null;
    archivo_manual_nombre?: string | null;
}

export interface ArticulacionRecord {
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
    seguimiento_articulacion?: SeguimientoArticulacion | null;
    created_at: string;
    updated_at: string;
}

export interface ArticulacionCatalogosResponse {
    municipios: { id: string; name: string }[];
    areas: { id: string; name: string; subdireccion_id?: string; subdirecciones?: { id: string; name: string } }[];
    lideres: { id: string; name: string; area_id?: string }[];
    subdirecciones?: { id: string; name: string }[];
}
