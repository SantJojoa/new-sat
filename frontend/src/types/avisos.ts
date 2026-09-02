export interface Aviso {
    id: string;
    titulo: string;
    mensaje: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    created_by?: { id: string; names: string; last_name: string } | null;
}

export interface ActiveAviso {
    id: string;
    titulo: string;
    mensaje: string;
    created_at: string;
}
