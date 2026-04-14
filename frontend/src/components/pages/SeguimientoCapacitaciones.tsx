import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCcw, Calendar, MapPin, Layers, XCircle, Eye } from "lucide-react";
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

    const hasActiveFilters = !!(searchTerm || filterArea || filterSubdireccion || filterEstado || filterMunicipio || filterMonth || filterYear || filterDateStart || filterDateEnd);

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
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
                        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                                    <Search size={16} /> Filtros de Búsqueda
                                </h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="text-xs flex items-center gap-1 text-primary hover:text-primary-hover font-medium transition-colors"
                                    >
                                        <RefreshCcw size={12} /> Limpiar Filtros
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Código, tema o solicitante..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterArea}
                                        onChange={e => setFilterArea(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todas las Áreas</option>
                                        {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterSubdireccion}
                                        onChange={e => setFilterSubdireccion(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todas las Subdirecciones</option>
                                        {uniqueSubdirecciones.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterEstado}
                                        onChange={e => setFilterEstado(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todos los Estados</option>
                                        {Object.entries(ESTADO_LABEL).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterMunicipio}
                                        onChange={e => setFilterMunicipio(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todos los Municipios</option>
                                        {uniqueMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterMonth}
                                        onChange={e => setFilterMonth(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todos los Meses</option>
                                        <option value="1">Enero</option>
                                        <option value="2">Febrero</option>
                                        <option value="3">Marzo</option>
                                        <option value="4">Abril</option>
                                        <option value="5">Mayo</option>
                                        <option value="6">Junio</option>
                                        <option value="7">Julio</option>
                                        <option value="8">Agosto</option>
                                        <option value="9">Septiembre</option>
                                        <option value="10">Octubre</option>
                                        <option value="11">Noviembre</option>
                                        <option value="12">Diciembre</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterYear}
                                        onChange={e => setFilterYear(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todos los Años</option>
                                        {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-2 w-full pl-3 pr-4 py-2 rounded-lg border border-zinc-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white">
                                        <Calendar size={16} className="text-zinc-400" />
                                        <input
                                            type="date"
                                            value={filterDateStart}
                                            onChange={e => setFilterDateStart(e.target.value)}
                                            className="w-full outline-none text-sm bg-transparent"
                                            title="Filtrar por Fecha Inicio"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-2 w-full pl-3 pr-4 py-2 rounded-lg border border-zinc-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white">
                                        <Calendar size={16} className="text-zinc-400" />
                                        <input
                                            type="date"
                                            value={filterDateEnd}
                                            onChange={e => setFilterDateEnd(e.target.value)}
                                            className="w-full outline-none text-sm bg-transparent"
                                            title="Filtrar por Fecha Final"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCcw size={24} className="animate-spin text-primary" />
                                <span className="ml-3 text-zinc-500 font-medium">Cargando...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <span className="material-symbols-outlined text-zinc-300 text-[48px] mb-3">school</span>
                                <p className="text-zinc-600 font-medium">No hay capacitaciones para mostrar</p>
                                <p className="text-zinc-400 text-sm mt-1">Registre una programación con subtipo Capacitación o ajuste los filtros.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 border-b border-zinc-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Código</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tema</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo / Subtipo</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Área</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fechas</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lugar</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Estado</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Solicitante</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {filtered.map(r => (
                                            <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-primary text-xs">{r.codigo}</td>
                                                <td className="px-4 py-3 max-w-[180px] truncate font-medium text-zinc-800">{r.tema}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="block text-xs text-zinc-700">{r.tipo_salida}</span>
                                                    <span className="text-zinc-400 text-xs">{r.subtipo_salida}</span>
                                                </td>
                                                <td className="px-4 py-3 text-zinc-600">{r.areas?.name || '—'}</td>
                                                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} className="text-zinc-400" />
                                                        {new Date(r.fecha_inicio).toLocaleDateString('es-CO')}
                                                    </span>
                                                    {r.fecha_inicio !== r.fecha_final && (
                                                        <span className="text-zinc-400 text-xs">→ {new Date(r.fecha_final).toLocaleDateString('es-CO')}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-600">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={12} className="text-zinc-400" />
                                                        {r.lugar_evento?.name || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_STYLES[r.estado] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                                                        {ESTADO_LABEL[r.estado] ?? r.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-zinc-600 text-xs">{r.solicitante?.names || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => setDetailRecord(r)}
                                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {detailRecord && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={e => { if (e.target === e.currentTarget) setDetailRecord(null); }}
                    >
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900">Detalle de Capacitación</h3>
                                    <p className="text-zinc-500 text-sm">Código: <span className="font-mono font-bold text-primary">{detailRecord.codigo}</span></p>
                                </div>
                                <button onClick={() => setDetailRecord(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Solicitante</span>
                                        <p className="text-zinc-900 font-medium">{detailRecord.solicitante?.names}</p>
                                        <p className="text-zinc-500 text-xs">{detailRecord.solicitante?.email}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">
                                            <Layers size={10} className="inline mr-1" />Área
                                        </span>
                                        <p className="text-zinc-900 font-medium">{detailRecord.areas?.name || '—'}</p>
                                        {detailRecord.areas?.subdirecciones?.name && (
                                            <p className="text-zinc-500 text-xs">{detailRecord.areas.subdirecciones.name}</p>
                                        )}
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Tipo / Subtipo</span>
                                        <p className="text-zinc-900 font-medium">{detailRecord.tipo_salida}</p>
                                        <p className="text-zinc-500 text-xs">{detailRecord.subtipo_salida}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Estado</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_STYLES[detailRecord.estado] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                                            {ESTADO_LABEL[detailRecord.estado] ?? detailRecord.estado}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">
                                            <Calendar size={10} className="inline mr-1" />Fechas
                                        </span>
                                        <p className="text-zinc-900 font-medium">
                                            {new Date(detailRecord.fecha_inicio).toLocaleDateString('es-CO')} → {new Date(detailRecord.fecha_final).toLocaleDateString('es-CO')}
                                        </p>
                                        <p className="text-zinc-500 text-xs mt-0.5">Jornada: {detailRecord.jornada}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">
                                            <MapPin size={10} className="inline mr-1" />Lugar del Evento
                                        </span>
                                        <p className="text-zinc-900 font-medium">{detailRecord.lugar_evento?.name || '—'}</p>
                                        {detailRecord.municipios_convocados && (
                                            <p className="text-zinc-500 text-xs mt-0.5">{detailRecord.municipios_convocados}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Tema / Actividad</span>
                                    <p className="text-zinc-800 font-medium">{detailRecord.tema}</p>
                                    {detailRecord.descripcion && (
                                        <p className="text-zinc-500 text-xs mt-1">{detailRecord.descripcion}</p>
                                    )}
                                </div>
                                {detailRecord.instituciones_convocadas != null && (
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Instituciones Convocadas</span>
                                        <p className="text-zinc-900 font-medium">{detailRecord.instituciones_convocadas}</p>
                                    </div>
                                )}
                                {detailRecord.transporte_medio && (
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Transporte</span>
                                        <p className="text-zinc-800">
                                            {detailRecord.transporte_medio}
                                            {detailRecord.transporte_responsables ? ` · ${detailRecord.transporte_responsables}` : ''}
                                        </p>
                                    </div>
                                )}
                                {detailRecord.observaciones_aprobacion && (
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Observaciones</span>
                                        <p className="text-zinc-800">{detailRecord.observaciones_aprobacion}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
                                <button onClick={() => setDetailRecord(null)} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}


            </main>
        </div>
    );
}