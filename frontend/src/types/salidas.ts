import type { AppModule } from './auth';

export interface CatalogoItem {
    id: string;
    name: string;
    area_id?: string;
}

export interface CatalogosResponse {
    municipios: CatalogoItem[];
    ips: CatalogoItem[];
    entidades: CatalogoItem[];
    eapb: CatalogoItem[];
    organizaciones: CatalogoItem[];
    idsn: CatalogoItem[];
    areas: CatalogoItem[];
    lideres?: CatalogoItem[];
}

export interface RelatedName {
    id?: string;
    name: string;
}

export interface SalidaArea {
    id?: string;
    name: string;
    subdirecciones?: RelatedName;
}

export interface SalidaRecord {
    id: string;
    codigo: string;
    tipo_salida: string;
    subtipo_salida: string;
    fecha_inicio: string;
    fecha_final: string;
    jornada: string;
    estado: string;
    tema: string;
    descripcion: string;
    transporte_medio?: string;
    transporte_responsables?: string;
    instituciones_convocadas?: number;
    municipios_convocados?: string;
    lugar_evento_id?: string;
    lugar_evento?: RelatedName;
    solicitante_id?: string;
    solicitante: {
        names: string;
        email: string;
    };
    area_id?: string;
    areas: SalidaArea;
    municipios: CatalogoItem[];
    ips: CatalogoItem[];
    entidades: CatalogoItem[];
    eapb: CatalogoItem[];
    organizaciones: CatalogoItem[];
    idsn: CatalogoItem[];
    aprobador?: {
        names: string;
        email: string;
    };
    observaciones_aprobacion?: string;
    motivo_rechazo?: string;
}

export interface CreateSalidaPayload {
    codigo?: string;
    tipo_salida: string;
    subtipo_salida?: string;
    tema: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_final: string;
    jornada: string;
    municipios_ids?: string[];
    ips_ids?: string[];
    entidades_ids?: string[];
    eapb_ids?: string[];
    organizaciones_ids?: string[];
    idsn_ids?: string[];
    transporte_medio?: string;
    transporte_responsables?: string;
    instituciones_convocadas?: number;
    lugar_evento_id?: string;
    area_id?: string;
    solicitante_id?: string;
}

export interface EstadisticasData {
    estados: { name: string; count: number }[];
    topSolicitantes: { name: string; count: number }[];
    areas: { name: string; count: number }[];
    total: number;
    items?: SalidaRecord[];
}

export interface BulkActionResult {
    aprobadas?: string[];
    rechazadas?: string[];
    errores?: string[];
}

export interface DashboardModulePermission {
    id: string;
    can_view: boolean;
    modules: AppModule;
}
