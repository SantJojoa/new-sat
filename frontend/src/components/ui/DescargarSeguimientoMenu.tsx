import { useEffect, useRef, useState } from 'react';
import { FileDown, RefreshCcw, Paperclip } from 'lucide-react';
import { documentosAdicionalesService } from '../../services/documentosAdicionalesService';
import type { DocumentoAdicional } from '../../types/documentosAdicionales';

export interface DescargarMenuItem {
    key: string;
    label: string;
    onClick: () => void | Promise<void>;
}

interface DescargarSeguimientoMenuProps {
    items: DescargarMenuItem[];
    basePath: string;
    iconOnly?: boolean;
    disabled?: boolean;
}

export default function DescargarSeguimientoMenu({ items, basePath, iconOnly, disabled }: DescargarSeguimientoMenuProps) {
    const [open, setOpen] = useState(false);
    const [docs, setDocs] = useState<DocumentoAdicional[] | null>(null);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const toggleOpen = async () => {
        const next = !open;
        setOpen(next);
        if (next && docs === null) {
            setLoadingDocs(true);
            try {
                setDocs(await documentosAdicionalesService.list(basePath));
            } catch {
                setDocs([]);
            } finally {
                setLoadingDocs(false);
            }
        }
    };

    const runItem = async (item: DescargarMenuItem) => {
        setBusyKey(item.key);
        try {
            await item.onClick();
        } finally {
            setBusyKey(null);
            setOpen(false);
        }
    };

    const runDocDownload = async (doc: DocumentoAdicional) => {
        setBusyKey(doc.id);
        try {
            await documentosAdicionalesService.download(basePath, doc.id, doc.nombre);
        } finally {
            setBusyKey(null);
            setOpen(false);
        }
    };

    const isEmpty = items.length === 0 && docs !== null && docs.length === 0;

    return (
        <div className="relative inline-block" ref={containerRef}>
            {iconOnly ? (
                <button
                    type="button"
                    onClick={toggleOpen}
                    disabled={disabled}
                    title="Descargar"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                >
                    <FileDown size={16} />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={toggleOpen}
                    disabled={disabled}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    <FileDown size={14} />
                    Descargar
                </button>
            )}

            {open && (
                <div className="absolute z-20 mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 right-0">
                    {items.map(item => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => runItem(item)}
                            disabled={busyKey === item.key}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                        >
                            {busyKey === item.key ? <RefreshCcw size={13} className="animate-spin" /> : <FileDown size={13} />}
                            {item.label}
                        </button>
                    ))}

                    {items.length > 0 && <div className="my-1 border-t border-zinc-100" />}

                    <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Paperclip size={10} /> Documentos adicionales
                    </p>
                    {loadingDocs ? (
                        <p className="px-3 pb-2 text-xs text-zinc-400 italic">Cargando...</p>
                    ) : !docs || docs.length === 0 ? (
                        <p className="px-3 pb-2 text-xs text-zinc-400 italic">Sin documentos adicionales</p>
                    ) : (
                        docs.map(doc => (
                            <button
                                key={doc.id}
                                type="button"
                                onClick={() => runDocDownload(doc)}
                                disabled={busyKey === doc.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                            >
                                {busyKey === doc.id ? <RefreshCcw size={13} className="animate-spin" /> : <FileDown size={13} />}
                                <span className="truncate">{doc.nombre}</span>
                            </button>
                        ))
                    )}

                    {isEmpty && (
                        <p className="px-3 pt-1 pb-1.5 text-xs text-zinc-400 italic">No hay archivos para descargar</p>
                    )}
                </div>
            )}
        </div>
    );
}
