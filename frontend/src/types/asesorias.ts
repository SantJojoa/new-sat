export interface AsesoriaAsistente {
    id?: string;
    identificacion: string;
    nombre: string;
    apellido: string;
    cargo?: string;
    email?: string;
    movil?: string;
}

export interface AsesoriaCompromiso {
    id?: string;
    compromiso: string;
    responsable: string;
    fecha?: string;
    observaciones?: string;
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
    medio: string;
    institucion: string;
    municipio_procedencia_id?: string;
    municipio_otro?: string;
    lugar: string;
    asistentes: AsesoriaAsistente[];
    temas_tratados: string;
    material_entregado: string;
    duracion_minutos: number;
    compromisos?: AsesoriaCompromiso[];
    area_id?: string;
    solicitante_id?: string;
}

export interface AsesoriaRecord {
    id: string;
    codigo: string;
    fecha: string;
    hora: string;
    medio: string;
    institucion: string;
    municipio_procedencia_id?: string;
    municipio_otro?: string;
    lugar: string;
    temas_tratados: string;
    material_entregado: string;
    duracion_minutos: number;
    estado: string;
    fecha_registro: string;
    registrador: { id: string; names: string; email: string };
    areas: { id: string; name: string };
    municipio_procedencia?: { id: string; name: string };
    asistentes: AsesoriaAsistente[];
    compromisos: AsesoriaCompromiso[];
}