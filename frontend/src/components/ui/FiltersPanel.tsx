import { Search, Layers, MapPin, Calendar, RefreshCcw } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface FilterField {
    type: 'search' | 'select' | 'month' | 'year' | 'date';
    key: string;
    placeholder?: string;
    emptyLabel?: string;
    options?: (string | SelectOption)[];
    years?: number[];
    title?: string;
    icon?: 'layers' | 'pin' | 'calendar';
    disabled?: boolean;
    disabledTitle?: string;
}

interface FiltersPanelProps {
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    onReset: () => void;
    fields: FilterField[];
}

const MONTH_LABELS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function renderField(
    field: FilterField,
    values: Record<string, string>,
    onChange: (k: string, v: string) => void,
) {
    const value = values[field.key] ?? '';

    if (field.type === 'search') {
        return (
            <div key={field.key} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                    type="text"
                    placeholder={field.placeholder ?? 'Buscar...'}
                    value={value}
                    onChange={e => onChange(field.key, e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
            </div>
        );
    }

    if (field.type === 'select') {
        const opts = (field.options ?? []).map(o =>
            typeof o === 'string' ? { value: o, label: o } : o,
        );
        const Icon = field.icon === 'pin' ? MapPin : field.icon === 'calendar' ? Calendar : Layers;
        return (
            <div key={field.key} className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <select
                    value={value}
                    onChange={e => onChange(field.key, e.target.value)}
                    disabled={field.disabled}
                    title={field.disabled ? field.disabledTitle : undefined}
                    className={`w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm appearance-none bg-white ${field.disabled ? 'opacity-50 cursor-not-allowed bg-zinc-100' : ''}`}
                >
                    <option value="">{field.emptyLabel ?? 'Todos'}</option>
                    {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
        );
    }

    if (field.type === 'month') {
        return (
            <div key={field.key} className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <select
                    value={value}
                    onChange={e => onChange(field.key, e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm appearance-none bg-white"
                >
                    <option value="">Todos los Meses</option>
                    {MONTH_LABELS.map((m, i) => (
                        <option key={i + 1} value={String(i + 1)}>{m}</option>
                    ))}
                </select>
            </div>
        );
    }

    if (field.type === 'year') {
        return (
            <div key={field.key} className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <select
                    value={value}
                    onChange={e => onChange(field.key, e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm appearance-none bg-white"
                >
                    <option value="">Todos los Años</option>
                    {(field.years ?? []).map(y => (
                        <option key={y} value={String(y)}>{y}</option>
                    ))}
                </select>
            </div>
        );
    }

    if (field.type === 'date') {
        return (
            <div key={field.key} className="relative">
                <div className="flex items-center gap-2 w-full pl-3 pr-4 py-2 rounded-lg border border-zinc-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary bg-white">
                    <Calendar size={16} className="text-zinc-400" />
                    <input
                        type="date"
                        value={value}
                        onChange={e => onChange(field.key, e.target.value)}
                        className="w-full outline-none text-sm bg-transparent"
                        title={field.title}
                    />
                </div>
            </div>
        );
    }

    return null;
}

export default function FiltersPanel({ values, onChange, onReset, fields }: FiltersPanelProps) {
    const hasActive = fields.some(f => !!values[f.key]);

    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
            <div className="px-4 pt-3 pb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-zinc-500">
                        <Search size={14} />
                        <span className="text-xs font-medium">Filtros</span>
                    </div>
                    {hasActive && (
                        <button
                            onClick={onReset}
                            className="text-xs flex items-center gap-1 text-primary hover:text-primary-hover font-medium transition-colors"
                        >
                            <RefreshCcw size={11} /> Limpiar
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {fields.map(f => renderField(f, values, onChange))}
                </div>
            </div>
        </div>
    );
}
