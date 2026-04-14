import { Eye, RefreshCcw } from 'lucide-react';
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
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex items-center justify-center py-20">
                <RefreshCcw size={24} className="animate-spin text-primary" />
                <span className="ml-3 text-zinc-500 font-medium">Cargando...</span>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-zinc-300 text-[48px] mb-3">{emptyIcon}</span>
                <p className="text-zinc-600 font-medium">{emptyMessage}</p>
                {emptySubMessage && <p className="text-zinc-400 text-sm mt-1">{emptySubMessage}</p>}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider ${col.className ?? ''}`}
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
                                className={`hover:bg-zinc-50 transition-colors ${rowClassName ? rowClassName(record) : ''}`}
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
