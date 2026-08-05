export interface AcompanamientoNoRegistrado {
    id: string;
    codigo: string;
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
    area_id: string;
    registrador_id: string;
    areas?: { id: string; name: string; subdirecciones?: { id: string; name: string } };
    registrador?: { id: string; names: string; email: string };
    created_at: string;
    updated_at: string;
}

export interface CreateAcompanamientoNoRegistradoPayload {
    nombre_reunion: string;
    fecha_reunion: string;
    hora_inicial: string;
    hora_final: string;
    acta_numero?: string;
    institucion: string;
    municipio: string;
    lugar: string;
    material_entregado?: string;
    asistentes?: any[];
    orden_del_dia?: any[];
    desarrollo?: string;
    conclusiones?: string;
    compromisos?: any[];
    proxima_lugar?: string;
    proxima_fecha?: string;
    proxima_hora?: string;
    area_id?: string;
    registrador_id?: string;
}

export interface UploadActaAcompanamientoNoRegistradoPayload {
    nombre_reunion: string;
    fecha_reunion: string;
    institucion: string;
    municipio: string;
    lugar: string;
    area_id?: string;
    registrador_id?: string;
}
