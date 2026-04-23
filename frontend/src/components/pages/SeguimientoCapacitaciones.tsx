import { useCallback, useEffect, useState } from "react";
import { RefreshCcw, Calendar, MapPin, Layers, ClipboardList, XCircle, X } from "lucide-react";
import FiltersPanel, { type FilterField } from '../ui/FiltersPanel';
import RecordsTable, { ViewButton, type TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';
import SlideBar from "../ui/SlideBar";
import { useAuth } from "../../hooks/useAuth";
import { salidasService } from "../../services/salidasService";
import type { SalidaRecord } from "../../types/salidas";


const ESTADO_STYLES: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    aprobada: 'bg-green-100 text-green-800 border-green-200',
    rechazada: 'bg-red-100 text-red-800 border-red-200',
    entregada: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelada: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}

const ESTADO_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    entregada: 'Entregada',
    cancelada: 'Cancelada',
};



const capacitacionColumns: TableColumn<SalidaRecord>[] = [
    { header: 'Código', render: r => <span className="font-mono font-bold text-primary text-xs">{r.codigo}</span> },
    { header: 'Tema', render: r => <span className="max-w-[180px] truncate font-medium text-zinc-800 block">{r.tema}</span> },
    {
        header: 'Tipo / Subtipo', render: r => (
            <div>
                <span className="block text-xs text-zinc-700">{r.tipo_salida}</span>
                <span className="text-zinc-400 text-xs">{r.subtipo_salida}</span>
            </div>
        )
    },
    { header: 'Área', render: r => <span className="text-zinc-600">{r.areas?.name || '—'}</span> },
    {
        header: 'Fechas', render: r => (
            <div className="whitespace-nowrap text-zinc-600">
                <span className="flex items-center gap-1"><Calendar size={12} className="text-zinc-400" />{new Date(r.fecha_inicio).toLocaleDateString('es-CO')}</span>
                {r.fecha_inicio !== r.fecha_final && <span className="text-zinc-400 text-xs">→ {new Date(r.fecha_final).toLocaleDateString('es-CO')}</span>}
            </div>
        )
    },
    { header: 'Lugar', render: r => <span className="flex items-center gap-1 text-zinc-600"><MapPin size={12} className="text-zinc-400" />{r.lugar_evento?.name || '—'}</span> },
    {
        header: 'Estado', render: r => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_STYLES[r.estado] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                {ESTADO_LABEL[r.estado] ?? r.estado}
            </span>
        )
    },
    { header: 'Solicitante', render: r => <span className="text-zinc-600 text-xs">{r.solicitante?.names || '—'}</span> },
    {
        header: 'Seguimiento', render: r => {
            const seg = r.seguimiento_capacitacion;
            if (!seg) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-zinc-100 text-zinc-500 border-zinc-200">
                        Pendiente
                    </span>
                );
            }
            return (
                <div className="space-y-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${seg.se_realizo ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {seg.se_realizo ? 'Realizada' : 'No realizada'}
                    </span>
                    {seg.evaluacion_satisfaccion != null && (
                        <p className="text-zinc-500 text-xs">Eval: <span className="font-semibold text-zinc-700">{seg.evaluacion_satisfaccion}%</span></p>
                    )}
                    {seg.num_total_asistentes != null && (
                        <p className="text-zinc-500 text-xs">Asistentes: <span className="font-semibold text-zinc-700">{seg.num_total_asistentes}</span></p>
                    )}
                </div>
            );
        }
    },
];

interface SeguimientoModalProps {
    record: SalidaRecord,
    onClose: () => void,
    onSaved: () => void,
}

function SeguimientoModal({ record, onClose, onSaved }: SeguimientoModalProps) {

    const existing = record.seguimiento_capacitacion;

    const [seRealizo, setSeRealizo] = useState<string>(
        existing != null ? (existing.se_realizo ? 'true' : 'false') : ''
    );

    const [numInstituciones, setNumInstituciones] = useState(
        existing?.num_instituciones_asistieron?.toString() ?? ''
    );
    const [numAsistentes, setNumAsistentes] = useState(
        existing?.num_total_asistentes?.toString() ?? ''
    );
    const [evaluacion, setEvaluacion] = useState(
        existing?.evaluacion_satisfaccion?.toString() ?? ''
    );

    const [observaciones, setObservaciones] = useState<string>(existing?.observaciones ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await salidasService.setSeguimiento(record.id, {
                se_realizo: seRealizo === 'true',
                num_instituciones_asistieron: numInstituciones !== '' ? parseInt(numInstituciones) : undefined,
                num_total_asistentes: numAsistentes !== '' ? parseInt(numAsistentes) : undefined,
                evaluacion_satisfaccion: evaluacion !== '' ? parseFloat(evaluacion) : undefined,
                observaciones: observaciones || undefined,
            });
            onSaved();
            onClose();

        } catch (err) {
            setError('Error al guardar el seguimiento');
        } finally {
            setSaving(false);
        }
    }


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[85vh] overflow-y-auto">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-black text-zinc-900">Seguimiento de Desarrollo de Capacidades</h3>
                        <p className="text-zinc-500 text-sm">Codigo: <span className="font-mono font-bold text-primary">{record.codigo}</span></p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form id="seguimiento-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                    {
                        error && (
                            <div className="bg-red-50 border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
                        )
                    }
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            ¿Se realizó el Desarrollo de Capacidades? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-6 mt-1">
                            {[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }].map(opt => (
                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="se_realizo"
                                        value={opt.value}
                                        checked={seRealizo === opt.value}
                                        onChange={e => setSeRealizo(e.target.value)}
                                        required
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-zinc-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label
                            className="block text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            Número de instituciones que asistieron
                        </label>

                        <input
                            type="number"
                            min="0"
                            value={numAsistentes}
                            onChange={e => setNumAsistentes(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            Evaluación de satisfacción (0 – 100)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={evaluacion}
                            onChange={e => setEvaluacion(e.target.value)}
                            placeholder="Ej: 85"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            Observaciones
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            placeholder="Observaciones del seguimiento..."
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm resize-none"
                        />
                        <p className="text-zinc-400 text-xs mt-1 text-right">{observaciones.length}/2000</p>
                    </div>
                </form>

                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="seguimiento-form"
                        disabled={saving}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <RefreshCcw size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                        {saving ? 'Guardando...' : 'Guardar Seguimiento'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SeguimientoCapacitaciones() {

    const { user } = useAuth();
    const [records, setRecords] = useState<SalidaRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterSubdireccion, setFilterSubdireccion] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
    const [uniqueSubdirecciones, setUniqueSubdirecciones] = useState<string[]>([]);
    const [uniqueMunicipios, setUniqueMunicipios] = useState<string[]>([]);
    const [uniqueYears, setUniqueYears] = useState<number[]>([]);
    const [detailRecord, setDetailRecord] = useState<SalidaRecord | null>(null);
    const [seguimientoRecord, setSeguimientoRecord] = useState<SalidaRecord | null>(null);

    const isAdmin = ['admin_subdireccion', 'superadmin'].includes(user?.user_type?.name || '');

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await salidasService.getSalidas(viewAll);
            const capacitaciones = data.filter(r =>
                r.subtipo_salida &&
                r.subtipo_salida.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('capacitacion')
            );
            setRecords(capacitaciones);
            setUniqueAreas(Array.from(new Set(capacitaciones.map(r => r.areas?.name).filter(Boolean))) as string[]);
            setUniqueSubdirecciones(Array.from(new Set(capacitaciones.map(r => r.areas?.subdirecciones?.name).filter(Boolean))) as string[]);
            setUniqueMunicipios(Array.from(new Set(capacitaciones.map(r => r.lugar_evento?.name).filter(Boolean))) as string[]);
            setUniqueYears(Array.from(new Set(capacitaciones.map(r => new Date(r.fecha_inicio).getFullYear()))).sort((a, b) => b - a));
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords() }, [fetchRecords]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetailRecord(null) };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterArea('');
        setFilterSubdireccion('');
        setFilterEstado('');
        setFilterMunicipio('');
        setFilterMonth('');
        setFilterYear('');
        setFilterDateStart('');
        setFilterDateEnd('');
    };

    const filterValues: Record<string, string> = { search: searchTerm, area: filterArea, subdireccion: filterSubdireccion, estado: filterEstado, municipio: filterMunicipio, month: filterMonth, year: filterYear, dateStart: filterDateStart, dateEnd: filterDateEnd };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, tema o solicitante...' },
        { type: 'select', key: 'area', emptyLabel: 'Todas las Áreas', options: uniqueAreas },
        { type: 'select', key: 'subdireccion', emptyLabel: 'Todas las Subdirecciones', options: uniqueSubdirecciones },
        { type: 'select', key: 'estado', emptyLabel: 'Todos los Estados', options: Object.entries(ESTADO_LABEL).map(([v, l]) => ({ value: v, label: l })) },
        { type: 'select', key: 'municipio', emptyLabel: 'Todos los Municipios', options: uniqueMunicipios, icon: 'pin' },
        { type: 'month', key: 'month' },
        { type: 'year', key: 'year', years: uniqueYears },
        { type: 'date', key: 'dateStart', title: 'Fecha Inicio' },
        { type: 'date', key: 'dateEnd', title: 'Fecha Final' },
    ];
    const handleFilterChange = (key: string, value: string) => {
        if (key === 'search') setSearchTerm(value);
        else if (key === 'area') setFilterArea(value);
        else if (key === 'subdireccion') setFilterSubdireccion(value);
        else if (key === 'estado') setFilterEstado(value);
        else if (key === 'municipio') setFilterMunicipio(value);
        else if (key === 'month') setFilterMonth(value);
        else if (key === 'year') setFilterYear(value);
        else if (key === 'dateStart') setFilterDateStart(value);
        else if (key === 'dateEnd') setFilterDateEnd(value);
    };

    const filtered = records.filter(r => {
        const term = searchTerm.toLowerCase();
        const matchSearch = !term ||
            r.codigo.toLowerCase().includes(term) ||
            r.tema?.toLowerCase().includes(term) ||
            (r.solicitante?.names?.toLowerCase().includes(term) ?? false);
        const matchArea = !filterArea || r.areas?.name === filterArea;
        const matchSubdireccion = !filterSubdireccion || r.areas?.subdirecciones?.name === filterSubdireccion;
        const matchEstado = !filterEstado || r.estado === filterEstado;
        const matchMunicipio = !filterMunicipio || r.lugar_evento?.name === filterMunicipio;
        const matchMonth = !filterMonth || new Date(r.fecha_inicio).getMonth() + 1 === parseInt(filterMonth);
        const matchYear = !filterYear || new Date(r.fecha_inicio).getFullYear() === parseInt(filterYear);
        const salidaStart = new Date(r.fecha_inicio).toISOString().split('T')[0];
        const salidaEnd = new Date(r.fecha_final).toISOString().split('T')[0];
        const matchStart = !filterDateStart || salidaStart >= filterDateStart;
        const matchEnd = !filterDateEnd || salidaEnd <= filterDateEnd;
        return matchSearch && matchArea && matchSubdireccion && matchEstado && matchMunicipio && matchMonth && matchYear && matchStart && matchEnd;
    });

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            {seguimientoRecord && (
                <SeguimientoModal
                    record={seguimientoRecord}
                    onClose={() => setSeguimientoRecord(null)}
                    onSaved={fetchRecords}
                />
            )}
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[32px]">stack</span>
                            Seguimiento de Desarrollo de Capacidades
                        </h1>
                        <p className="text-zinc-500 mt-2">Listado de programaciones de Desarrollo de Capacidades</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {isAdmin && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    <Layers size={16} />
                                    {viewAll ? 'Ver solo mis Desarrollo de Capacidades' : 'Ver todos los Desarrollo de Capacidades'}
                                </button>
                            )}
                            <button onClick={fetchRecords} className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50 flex items-center gap-2">
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                Actualizar
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{filtered.length}</p>
                        </div>
                        {(['pendiente', 'aprobada', 'rechazada'] as const).map(estado => (
                            <div key={estado} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{ESTADO_LABEL[estado]}</p>
                                <p className="text-2xl font-black text-zinc-900 mt-1">{filtered.filter(r => r.estado === estado).length}</p>
                            </div>
                        ))}
                    </div>
                    <FiltersPanel values={filterValues} onChange={handleFilterChange} onReset={handleResetFilters} fields={filterFields} />
                    <RecordsTable
                        records={filtered}
                        loading={loading}
                        columns={capacitacionColumns}
                        renderActions={r => (
                            <>
                                {r.estado === 'aprobada' && (
                                    <button
                                        onClick={() => setSeguimientoRecord(r)}
                                        title="Registrar seguimiento"
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                    >
                                        <ClipboardList size={16} />
                                    </button>
                                )}
                                <ViewButton onClick={() => setDetailRecord(r)} />
                            </>
                        )} emptyIcon="school"
                        emptyMessage="No hay Desarrollo de Capacidades para mostrar"
                        emptySubMessage="Registre una programación con subtipo Capacitación o ajuste los filtros."
                    />
                </div>

                {detailRecord && (
                    <DetailModal title="Detalle de Desarrollo de Capacidades" codigo={detailRecord.codigo} onClose={() => setDetailRecord(null)}>
                        <div className="p-6 space-y-4 text-sm">
                            <DetailGrid>
                                <DetailCard label="Solicitante">
                                    <p className="text-zinc-900 font-medium">{detailRecord.solicitante?.names}</p>
                                    <p className="text-zinc-500 text-xs">{detailRecord.solicitante?.email}</p>
                                </DetailCard>
                                <DetailCard label="Área" icon={<Layers size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.areas?.name || '—'}</p>
                                    {detailRecord.areas?.subdirecciones?.name && (
                                        <p className="text-zinc-500 text-xs">{detailRecord.areas.subdirecciones.name}</p>
                                    )}
                                </DetailCard>
                                <DetailCard label="Tipo / Subtipo">
                                    <p className="text-zinc-900 font-medium">{detailRecord.tipo_salida}</p>
                                    <p className="text-zinc-500 text-xs">{detailRecord.subtipo_salida}</p>
                                </DetailCard>
                                <DetailCard label="Estado">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_STYLES[detailRecord.estado] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                                        {ESTADO_LABEL[detailRecord.estado] ?? detailRecord.estado}
                                    </span>
                                </DetailCard>
                                <DetailCard label="Fechas" icon={<Calendar size={10} />}>
                                    <p className="text-zinc-900 font-medium">{new Date(detailRecord.fecha_inicio).toLocaleDateString('es-CO')} → {new Date(detailRecord.fecha_final).toLocaleDateString('es-CO')}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">Jornada: {detailRecord.jornada}</p>
                                </DetailCard>
                                <DetailCard label="Lugar del Evento" icon={<MapPin size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.lugar_evento?.name || '—'}</p>
                                    {detailRecord.municipios_convocados && (
                                        <p className="text-zinc-500 text-xs mt-0.5">{detailRecord.municipios_convocados}</p>
                                    )}
                                </DetailCard>
                                <DetailCard label="Tema / Actividad" fullWidth>
                                    <p className="text-zinc-800 font-medium">{detailRecord.tema}</p>
                                    {detailRecord.descripcion && (
                                        <p className="text-zinc-500 text-xs mt-1">{detailRecord.descripcion}</p>
                                    )}
                                </DetailCard>
                                {detailRecord.instituciones_convocadas != null && (
                                    <DetailCard label="Instituciones Convocadas" fullWidth>
                                        <p className="text-zinc-900 font-medium">{detailRecord.instituciones_convocadas}</p>
                                    </DetailCard>
                                )}
                                {detailRecord.transporte_medio && (
                                    <DetailCard label="Transporte" fullWidth>
                                        <p className="text-zinc-800">{detailRecord.transporte_medio}{detailRecord.transporte_responsables ? ` · ${detailRecord.transporte_responsables}` : ''}</p>
                                    </DetailCard>
                                )}
                                {detailRecord.observaciones_aprobacion && (
                                    <DetailCard label="Observaciones" fullWidth>
                                        <p className="text-zinc-800">{detailRecord.observaciones_aprobacion}</p>
                                    </DetailCard>
                                )}
                            </DetailGrid>

                            <div className="border-t border-zinc-200 pt-4">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                    <ClipboardList size={13} />
                                    Seguimiento
                                </h4>
                                {detailRecord.seguimiento_capacitacion ? (
                                    <DetailGrid>
                                        <DetailCard label="¿Se realizó?">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${detailRecord.seguimiento_capacitacion.se_realizo ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {detailRecord.seguimiento_capacitacion.se_realizo ? 'Sí' : 'No'}
                                            </span>
                                        </DetailCard>
                                        {detailRecord.seguimiento_capacitacion.num_instituciones_asistieron != null && (
                                            <DetailCard label="Instituciones asistentes">
                                                <p className="text-zinc-900 font-medium">{detailRecord.seguimiento_capacitacion.num_instituciones_asistieron}</p>
                                            </DetailCard>
                                        )}
                                        {detailRecord.seguimiento_capacitacion.num_total_asistentes != null && (
                                            <DetailCard label="Total asistentes">
                                                <p className="text-zinc-900 font-medium">{detailRecord.seguimiento_capacitacion.num_total_asistentes}</p>
                                            </DetailCard>
                                        )}
                                        {detailRecord.seguimiento_capacitacion.evaluacion_satisfaccion != null && (
                                            <DetailCard label="Evaluación de satisfacción">
                                                <p className="text-zinc-900 font-medium">{detailRecord.seguimiento_capacitacion.evaluacion_satisfaccion}%</p>
                                            </DetailCard>
                                        )}
                                        {detailRecord.seguimiento_capacitacion.observaciones && (
                                            <DetailCard label="Observaciones del seguimiento" fullWidth>
                                                <p className="text-zinc-800">{detailRecord.seguimiento_capacitacion.observaciones}</p>
                                            </DetailCard>
                                        )}
                                    </DetailGrid>
                                ) : (
                                    <p className="text-zinc-400 text-xs italic">Sin seguimiento registrado aún.</p>
                                )}
                            </div>
                        </div>
                    </DetailModal>
                )}

            </main>
        </div>
    );
}
