import type { AppModule } from './auth';

export interface CatalogoItem {
    id: string;
    name: string;
    area_id?: string;
}

export interface IpsCatalogoItem {
    id: string;
    type: string;
}

export interface CatalogosResponse {
    municipios: CatalogoItem[];
    ips: IpsCatalogoItem[];
    ipsActores: CatalogoItem[];
    entidades: CatalogoItem[];
    eapb: CatalogoItem[];
    eapbActores: CatalogoItem[];
    organizaciones: CatalogoItem[];
    idsn: CatalogoItem[];
    areas: CatalogoItem[];
    lideres?: CatalogoItem[];
}

export interface EapbActorItem {
    eapb_id: string;
    actor_id?: string;
}

export interface EapbSelection {
    eapb: CatalogoItem;
    actor: CatalogoItem | null;
}

export interface SalidaEapbRecord {
    id: string;
    eapb_id: string;
    actor_id: string | null;
    eapb: CatalogoItem;
    actor: CatalogoItem | null;
}

export interface IpsActorItem {
    ips_id: string;
    actor_id?: string;
}

export interface IpsSelection {
    ips: IpsCatalogoItem;
    actor: CatalogoItem | null;
}

export interface SalidaIpsRecord {
    id: string;
    ips_id: string;
    actor_id: string | null;
    ips: IpsCatalogoItem;
    actor: CatalogoItem | null;
}

export interface RelatedName {
    id: string;
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
    areas_participantes?: SalidaArea[];
    municipios: CatalogoItem[];
    salida_ips: SalidaIpsRecord[];
    entidades: CatalogoItem[];
    salida_eapb: SalidaEapbRecord[];
    organizaciones: CatalogoItem[];
    idsn: CatalogoItem[];
    aprobador?: {
        names: string;
        email: string;
    };
    observaciones_aprobacion?: string;
    motivo_rechazo?: string;

    seguimiento_capacitacion?: {
        id?: string;
        se_realizo: boolean;
        num_instituciones_asistieron?: number | null;
        num_total_asistentes?: number | null;
        evaluacion_satisfaccion?: number | null;
        observaciones?: string | null;
    } | null;
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
    ips_actores?: IpsActorItem[];
    entidades_ids?: string[];
    eapb_actores?: EapbActorItem[];
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
