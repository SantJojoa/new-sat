import { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, Upload, FileDown, Trash2, RefreshCcw } from 'lucide-react';
import { documentosAdicionalesService } from '../../services/documentosAdicionalesService';
import type { DocumentoAdicional } from '../../types/documentosAdicionales';

interface DocumentosAdicionalesProps {
    basePath: string;
    title?: string;
}

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,application/pdf,image/jpeg,image/png,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentosAdicionales({ basePath, title = 'Documentos adicionales' }: DocumentosAdicionalesProps) {
    const [docs, setDocs] = useState<DocumentoAdicional[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await documentosAdicionalesService.list(basePath);
            setDocs(data);
        } catch {
            setError('Error al cargar los documentos');
        } finally {
            setLoading(false);
        }
    }, [basePath]);

    useEffect(() => { void fetchDocs(); }, [fetchDocs]);

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        if (files.length === 0) return;
        setUploading(true); setError('');
        try {
            await documentosAdicionalesService.upload(basePath, files);
            await fetchDocs();
        } catch {
            setError('Error al subir los documentos');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc: DocumentoAdicional) => {
        setDownloadingId(doc.id);
        try {
            await documentosAdicionalesService.download(basePath, doc.id, doc.nombre);
        } catch {
            setError('Error al descargar el documento');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = async (doc: DocumentoAdicional) => {
        if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return;
        setDeletingId(doc.id);
        try {
            await documentosAdicionalesService.remove(basePath, doc.id);
            await fetchDocs();
        } catch {
            setError('Error al eliminar el documento');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="border-t border-zinc-200 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip size={13} /> {title}
                </h4>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                    {uploading ? <RefreshCcw size={13} className="animate-spin" /> : <Upload size={13} />}
                    {uploading ? 'Subiendo...' : 'Subir documentos'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={handleFilesSelected}
                />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-1.5 text-xs mb-2">{error}</div>}

            {loading ? (
                <p className="text-zinc-400 text-xs italic">Cargando documentos...</p>
            ) : docs.length === 0 ? (
                <p className="text-zinc-400 text-xs italic">Sin documentos adicionales. Sube listas de asistencia u otra evidencia.</p>
            ) : (
                <ul className="space-y-1.5">
                    {docs.map(doc => (
                        <li key={doc.id} className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                            <div className="min-w-0">
                                <p className="text-sm text-zinc-800 font-medium truncate">{doc.nombre}</p>
                                <p className="text-zinc-400 text-xs">{formatBytes(doc.tamano)} · {new Date(doc.created_at).toLocaleDateString('es-CO')}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleDownload(doc)}
                                    disabled={downloadingId === doc.id}
                                    title="Descargar"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                                >
                                    {downloadingId === doc.id ? <RefreshCcw size={14} className="animate-spin" /> : <FileDown size={14} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(doc)}
                                    disabled={deletingId === doc.id}
                                    title="Eliminar"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                                >
                                    {deletingId === doc.id ? <RefreshCcw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
