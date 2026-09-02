export interface DocumentoAdicional {
    id: string;
    nombre: string;
    mime_type: string;
    tamano: number;
    created_at: string;
    uploaded_by?: { id: string; names: string; last_name: string } | null;
}
