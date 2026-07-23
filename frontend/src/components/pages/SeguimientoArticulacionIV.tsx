import { useCallback, useEffect, useState } from "react";
import { RefreshCcw, Calendar, MapPin, Layers, ClipboardList, X } from "lucide-react";
import FiltersPanel, { type FilterField } from '../ui/FiltersPanel';
import RecordsTable, { ViewButton, type TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';
import SlideBar from "../ui/SlideBar";
import { useAuth } from "../../hooks/useAuth";
import { salidasService } from "../../services/salidasService";
import type { SalidaRecord } from "../../types/salidas";
import { ESTADO_STYLES, ESTADO_LABEL } from "../../utils/estados";

const articulacionIvColumns: TableColumn<SalidaRecord>[] = [
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
            const seg = r.seguimiento_articulacion_iv;
            if (!seg) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-zinc-100 text-zinc-500 border-zinc-200">
                        Pendiente
                    </span>
                );
            }
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${seg.se_realizo_vsp ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    VSP: {seg.se_realizo_vsp ? 'Realizada' : 'No realizada'}
                </span>
            );
        }
    },
];

interface SeguimientoModalProps {
    record: SalidaRecord;
    onClose: () => void;
    onSaved: () => void;
}

function SeguimientoArticulacionIVModal({ record, onClose, onSaved }: SeguimientoModalProps) {
    const existing = record.seguimiento_articulacion_iv;

    const [seRealizoVsp, setSeRealizoVsp] = useState<string>(
        existing != null ? (existing.se_realizo_vsp ? 'true' : 'false') : ''
    );
    const [observaciones, setObservaciones] = useState(existing?.observaciones ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await salidasService.setSeguimientoArticulacionIv(record.id, {
                se_realizo_vsp: seRealizoVsp === 'true',
                observaciones: observaciones || undefined,
            });
            onSaved();
            onClose();
        } catch {
            setError('Error al guardar el seguimiento');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-black text-zinc-900">Seguimiento Inspección y Vigilancia Salud Pública</h3>
                        <p className="text-zinc-500 text-sm">Codigo: <span className="font-mono font-bold text-primary">{record.codigo}</span></p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form id="seguimiento-articulacion-iv-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            ¿Se realizó Vigilancia Salud Pública? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-6 mt-1">
                            {[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }].map(opt => (
                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="se_realizo_vsp"
                                        value={opt.value}
                                        checked={seRealizoVsp === opt.value}
                                        onChange={e => setSeRealizoVsp(e.target.value)}
                                        required
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-zinc-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
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
                        form="seguimiento-articulacion-iv-form"
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

export default function SeguimientoArticulacionIV() {
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
    const [uniqueSubdirecciones, setUniqueSubdirecciones] = useState<string[]>([]);
    const [uniqueMunicipios, setUniqueMunicipios] = useState<string[]>([]);
    const [uniqueYears, setUniqueYears] = useState<number[]>([]);
    const [detailRecord, setDetailRecord] = useState<SalidaRecord | null>(null);
    const [seguimientoRecord, setSeguimientoRecord] = useState<SalidaRecord | null>(null);

    const isSuperAdmin = user?.user_type?.name === 'superadmin';

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await salidasService.getSalidas(viewAll);
            const filtered = data.filter(r =>
                r.subtipo_salida &&
                r.subtipo_salida.split(', ').some(s => s.trim() === 'Inspección y Vigilancia SP (IV)')
            );
            setRecords(filtered);
            setUniqueSubdirecciones(Array.from(new Set(filtered.map(r => r.areas?.subdirecciones?.name).filter(Boolean))) as string[]);
            setUniqueMunicipios(Array.from(new Set(filtered.map(r => r.lugar_evento?.name).filter(Boolean))) as string[]);
            setUniqueYears(Array.from(new Set(filtered.map(r => new Date(r.fecha_inicio).getFullYear()))).sort((a, b) => b - a));
        } catch (err) {
            console.error('Error fetching records:', err);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetailRecord(null); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleResetFilters = () => {
        setSearchTerm(''); setFilterArea(''); setFilterSubdireccion('');
        setFilterEstado(''); setFilterMunicipio(''); setFilterMonth('');
        setFilterYear(''); setFilterDateStart(''); setFilterDateEnd('');
    };

    const areaOptionsForFilter = filterSubdireccion
        ? Array.from(new Set(records.filter(r => r.areas?.subdirecciones?.name === filterSubdireccion).map(r => r.areas?.name).filter(Boolean))) as string[]
        : [];

    const filterValues: Record<string, string> = { search: searchTerm, area: filterArea, subdireccion: filterSubdireccion, estado: filterEstado, municipio: filterMunicipio, month: filterMonth, year: filterYear, dateStart: filterDateStart, dateEnd: filterDateEnd };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, tema o solicitante...' },
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'subdireccion', emptyLabel: 'Todas las Subdirecciones', options: uniqueSubdirecciones }] : []),
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'area', emptyLabel: 'Todas las Áreas', options: areaOptionsForFilter, disabled: !filterSubdireccion, disabledTitle: 'Seleccione primero una subdirección' }] : []),
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
        else if (key === 'subdireccion') { setFilterSubdireccion(value); setFilterArea(''); }
        else if (key === 'estado') setFilterEstado(value);
        else if (key === 'municipio') setFilterMunicipio(value);
        else if (key === 'month') setFilterMonth(value);
        else if (key === 'year') setFilterYear(value);
        else if (key === 'dateStart') setFilterDateStart(value);
        else if (key === 'dateEnd') setFilterDateEnd(value);
    };

    const displayRecords = records.filter(r => {
        const term = searchTerm.toLowerCase();
        const matchSearch = !term || r.codigo.toLowerCase().includes(term) || r.tema?.toLowerCase().includes(term) || (r.solicitante?.names?.toLowerCase().includes(term) ?? false);
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
                <SeguimientoArticulacionIVModal
                    record={seguimientoRecord}
                    onClose={() => setSeguimientoRecord(null)}
                    onSaved={fetchRecords}
                />
            )}
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[32px]">hub</span>
                            Seguimiento Inspección y Vigilancia Salud Pública
                        </h1>
                        <p className="text-zinc-500 mt-2">Listado de programaciones con subtipo Inspección y Vigilancia SP (IV)</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {isSuperAdmin && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    <Layers size={16} />
                                    {viewAll ? 'Ver solo mis registros' : 'Ver todos los registros'}
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
                            <p className="text-2xl font-black text-zinc-900 mt-1">{displayRecords.length}</p>
                        </div>
                        {(['pendiente', 'aprobada', 'rechazada'] as const).map(estado => (
                            <div key={estado} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{ESTADO_LABEL[estado]}</p>
                                <p className="text-2xl font-black text-zinc-900 mt-1">{displayRecords.filter(r => r.estado === estado).length}</p>
                            </div>
                        ))}
                    </div>

                    <FiltersPanel values={filterValues} onChange={handleFilterChange} onReset={handleResetFilters} fields={filterFields} />

                    <RecordsTable
                        records={displayRecords}
                        loading={loading}
                        columns={articulacionIvColumns}
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
                        )}
                        emptyIcon="hub"
                        emptyMessage="No hay registros de Inspección y Vigilancia SP"
                        emptySubMessage="Registre una programación con subtipo Inspección y Vigilancia SP (IV) o ajuste los filtros."
                    />
                </div>

                {detailRecord && (
                    <DetailModal title="Detalle Inspección y Vigilancia SP" codigo={detailRecord.codigo} onClose={() => setDetailRecord(null)}>
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
                                    Seguimiento Inspección y Vigilancia Salud Pública
                                </h4>
                                {detailRecord.seguimiento_articulacion_iv ? (
                                    <DetailGrid>
                                        <DetailCard label="¿Se realizó Vigilancia Salud Pública?">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${detailRecord.seguimiento_articulacion_iv.se_realizo_vsp ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {detailRecord.seguimiento_articulacion_iv.se_realizo_vsp ? 'Sí' : 'No'}
                                            </span>
                                        </DetailCard>
                                        {detailRecord.seguimiento_articulacion_iv.observaciones && (
                                            <DetailCard label="Observaciones" fullWidth>
                                                <p className="text-zinc-800">{detailRecord.seguimiento_articulacion_iv.observaciones}</p>
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
