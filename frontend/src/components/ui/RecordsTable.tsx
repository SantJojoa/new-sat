import { Eye, RefreshCcw, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

export interface TableColumn<T> {
    header: ReactNode;
    render: (record: T) => ReactNode;
    className?: string;
}

interface RecordsTableProps<T extends { id: string | number }> {
    records: T[];
    loading: boolean;
    columns: TableColumn<T>[];
    renderActions: (record: T) => ReactNode;
    rowClassName?: (record: T) => string;
    emptyIcon?: string;
    emptyMessage?: string;
    emptySubMessage?: string;
}

export function ViewButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
        >
            <Eye size={16} />
        </button>
    );
}

export function EditButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title="Editar"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
            <Pencil size={16} />
        </button>
    );
}

export function DeleteButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title="Eliminar"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
            <Trash2 size={16} />
        </button>
    );
}

export default function RecordsTable<T extends { id: string | number }>({
    records,
    loading,
    columns,
    renderActions,
    rowClassName,
    emptyIcon = 'table_rows',
    emptyMessage = 'No hay registros para mostrar',
    emptySubMessage,
}: RecordsTableProps<T>) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden flex items-center justify-center py-24">
                <RefreshCcw size={20} className="animate-spin text-primary" />
                <span className="ml-3 text-zinc-500 text-sm font-medium">Cargando...</span>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col items-center justify-center py-24 text-center">
                <div className="size-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-zinc-400 text-[28px]">{emptyIcon}</span>
                </div>
                <p className="text-zinc-700 font-medium text-sm">{emptyMessage}</p>
                {emptySubMessage && <p className="text-zinc-400 text-xs mt-1">{emptySubMessage}</p>}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50/80 border-b border-zinc-200">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={`px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ${col.className ?? ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {records.map((record, i) => (
                            <tr
                                key={record.id ?? i}
                                className={`hover:bg-zinc-50/60 transition-colors ${rowClassName ? rowClassName(record) : ''}`}
                            >
                                {columns.map((col, j) => (
                                    <td key={j} className={`px-4 py-3 ${col.className ?? ''}`}>
                                        {col.render(record)}
                                    </td>
                                ))}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {renderActions(record)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
