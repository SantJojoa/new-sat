import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message?: ReactNode;
    children?: ReactNode;
    confirmLabel?: string;
    confirmingLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

// Modal genérico de confirmación (usado tanto para "eliminar" como para "confirmar envío").
// `message` es para un texto simple; `children` permite un resumen/detalle más rico.
export default function ConfirmModal({
    open, title, message, children,
    confirmLabel = 'Confirmar', confirmingLabel = 'Enviando...', cancelLabel = 'Cancelar',
    isLoading = false, danger = false, onConfirm, onCancel,
}: ConfirmModalProps) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className={`p-6 border-b ${danger ? 'bg-red-50 border-red-100' : ''}`}>
                    <div className="flex items-center gap-3">
                        {danger && (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                                <Trash2 size={20} />
                            </div>
                        )}
                        <h3 className={`text-lg font-bold ${danger ? 'text-red-900' : 'text-zinc-900'}`}>{title}</h3>
                    </div>
                </div>
                {(message || children) && (
                    <div className="p-6 text-sm text-zinc-700 space-y-3">
                        {message}
                        {children}
                    </div>
                )}
                <div className="px-6 pb-6 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-6 py-2 rounded-lg text-white font-bold transition-colors disabled:opacity-50 cursor-pointer ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'}`}
                    >
                        {isLoading ? confirmingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
