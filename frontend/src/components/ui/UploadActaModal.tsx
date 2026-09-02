import { useState } from 'react';
import { RefreshCcw, Upload, X } from 'lucide-react';

interface UploadActaModalProps {
    title: string;
    codigo?: string;
    onClose: () => void;
    onSubmit: (file: File, seRealizo: boolean) => Promise<void>;
}

export default function UploadActaModal({ title, codigo, onClose, onSubmit }: UploadActaModalProps) {
    const [seRealizo, setSeRealizo] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!seRealizo) { setError('Debe indicar si se realizó o no'); return; }
        if (!file) { setError('Debe seleccionar un archivo PDF'); return; }
        if (file.type !== 'application/pdf') { setError('Solo se permiten archivos PDF'); return; }
        setSaving(true); setError('');
        try {
            await onSubmit(file, seRealizo === 'true');
            onClose();
        } catch {
            setError('Error al subir el acta escaneada');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-y-auto">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-zinc-900">{title}</h3>
                        {codigo && <p className="text-zinc-500 text-sm">Código: <span className="font-mono font-bold text-primary">{codigo}</span></p>}
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            ¿Se realizó? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-6 mt-1">
                            {[['true', 'Sí'], ['false', 'No']].map(([v, l]) => (
                                <label key={v} className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="se_realizo"
                                        value={v}
                                        checked={seRealizo === v}
                                        onChange={e => setSeRealizo(e.target.value)}
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-zinc-700">{l}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            Archivo PDF <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={e => setFile(e.target.files?.[0] ?? null)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                        />
                        {file && <p className="text-zinc-500 text-xs mt-1">{file.name}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                            {saving ? <RefreshCcw size={14} className="animate-spin" /> : <Upload size={14} />}
                            {saving ? 'Subiendo...' : 'Subir Acta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
