export interface AsesoriaAsistente {
    id?: string;
    identificacion?: string;
    nombre: string;
    apellido: string;
    cargo: string;
    email?: string;
    movil?: string;
}

export interface CatalogoItem {
    id: string;
    name: string;
}

export interface AsesoriasCatalogosResponse {
    municipios: CatalogoItem[];
    areas: CatalogoItem[];
    lideres: CatalogoItem[];
}


export interface CreateAsesoriaPayload {
    fecha: string;
    hora: string;
    hora_fin: string;
    medio: string;
    institucion: string;
    municipio_procedencia_id?: string;
    municipio_otro?: string;
    asistentes: AsesoriaAsistente[];
    temas_tratados: string;
    material_entregado: string;
    area_id?: string;
    solicitante_id?: string;
}

export interface AsesoriaRecord {
    id: string;
    codigo: string;
    fecha: string;
    hora: string;
    hora_fin: string;
    medio: string;
    institucion: string;
    municipio_procedencia_id?: string;
    municipio_otro?: string;
    temas_tratados: string;
    material_entregado: string;
    duracion_minutos: number;
    estado: string;
    fecha_registro: string;
    registrador: { id: string; names: string; email: string };
    areas: { id: string; name: string; subdirecciones?: { id: string; name: string } };
    municipio_procedencia?: { id: string; name: string };
    asistentes: AsesoriaAsistente[];
}
