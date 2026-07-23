import { useState } from 'react';

interface TagListInputProps {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    emptyText?: string;
    hasError?: boolean;
}

// Patrón "escribir, Enter/Añadir, chip con quitar" usado para listas de texto libre
// (instituciones convocadas, responsables de transporte, etc.).
export default function TagListInput({ values, onChange, placeholder = 'Escriba y presione Enter...', emptyText = 'No hay elementos añadidos', hasError = false }: TagListInputProps) {
    const [draft, setDraft] = useState('');

    const addValue = () => {
        if (draft.trim()) {
            onChange([...values, draft.trim()]);
            setDraft('');
        }
    };

    const removeAt = (idx: number) => onChange(values.filter((_, i) => i !== idx));

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addValue();
                        }
                    }}
                    className={`flex-1 h-12 px-4 rounded-lg border focus:ring-primary focus:border-primary transition-all ${hasError && values.length === 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={addValue}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Añadir
                </button>
            </div>
            <div className={`p-4 bg-zinc-50 rounded-lg border min-h-[60px] flex items-center flex-wrap gap-2 ${hasError && values.length === 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}>
                {values.length === 0 ? (
                    <p className={`text-sm italic ${hasError ? 'text-red-500' : 'text-zinc-400'}`}>{emptyText}</p>
                ) : (
                    values.map((val, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                            {val}
                            <button
                                type="button"
                                onClick={() => removeAt(idx)}
                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                aria-label="Eliminar"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}
