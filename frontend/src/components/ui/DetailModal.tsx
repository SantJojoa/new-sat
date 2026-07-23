import { XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface DetailModalProps {
    title: string;
    codigo: string;
    onClose: () => void;
    children: ReactNode;
    maxWidth?: string;
}

export function DetailGrid({ children }: { children: ReactNode }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {children}
        </div>
    );
}

export function DetailCard({ label, icon, children, fullWidth }: {
    label?: string;
    icon?: ReactNode;
    children: ReactNode;
    fullWidth?: boolean;
}) {
    return (
        <div className={`bg-zinc-50 rounded-lg p-3 border border-zinc-100${fullWidth ? ' col-span-full' : ''}`}>
            {label && (
                <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-1">
                    {icon}{label}
                </span>
            )}
            {children}
        </div>
    );
}

export default function DetailModal({ title, codigo, onClose, children, maxWidth = 'max-w-2xl' }: DetailModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} max-h-[85vh] overflow-y-auto`}>
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-black text-zinc-900">{title}</h3>
                        <p className="text-zinc-500 text-sm">Código: <span className="font-mono font-bold text-primary">{codigo}</span></p>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar" className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
                {children}
                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
