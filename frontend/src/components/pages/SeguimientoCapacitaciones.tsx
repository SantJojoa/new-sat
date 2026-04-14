import { useCallback, useEffect, useState } from "react";
import { RefreshCcw, Calendar, MapPin, Layers } from "lucide-react";
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
];

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
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[32px]">stack</span>
                            Seguimiento de Capacitaciones
                        </h1>
                        <p className="text-zinc-500 mt-2">Listado de programaciones de Capacitación</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {isAdmin && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    <Layers size={16} />
                                    {viewAll ? 'Ver solo mis capacitaciones' : 'Ver todas las capacitaciones'}
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
                        renderActions={r => <ViewButton onClick={() => setDetailRecord(r)} />}
                        emptyIcon="school"
                        emptyMessage="No hay capacitaciones para mostrar"
                        emptySubMessage="Registre una programación con subtipo Capacitación o ajuste los filtros."
                    />
                </div>

                {detailRecord && (
                    <DetailModal title="Detalle de Capacitación" codigo={detailRecord.codigo} onClose={() => setDetailRecord(null)}>
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
                        </div>
                    </DetailModal>
                )}

            </main>
        </div>
    );
}