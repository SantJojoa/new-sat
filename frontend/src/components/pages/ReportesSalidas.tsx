import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { salidasService } from '../../services/salidasService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import SlideBar from '../ui/SlideBar';
import type { ApiErrorPayload } from '../../types/api';
import type { EstadisticasData } from '../../types/salidas';


const ESTADOS = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
];

const JORNADAS = [
    { value: 'Manana', label: 'Mañana' },
    { value: 'Tarde', label: 'Tarde' },
    { value: 'Completa', label: 'Completa' },
];

// Paleta de colores más moderna y vibrante
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportesSalidas() {
    const [data, setData] = useState<EstadisticasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [areas, setAreas] = useState<{ id: string, name: string }[]>([]);

    // Estados de filtros
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [selectedEstado, setSelectedEstado] = useState<string>('');
    const [selectedJornada, setSelectedJornada] = useState<string>('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    useEffect(() => {
        const loadCatalogos = async () => {
            try {
                const cat = await salidasService.getCatalogos();
                setAreas(cat.areas || []);
            } catch (e) {
                console.error('Failed to load areas', e);
            }
        };

        void loadCatalogos();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const start = startDate || undefined;
            const end = endDate || undefined;
            const areaId = selectedArea || undefined;
            const estado = selectedEstado || undefined;
            const jornada = selectedJornada || undefined;

            const res = await salidasService.getEstadisticas(start, end, areaId, estado, jornada);
            setData(res);
            setError(null);
        } catch (err) {
            const apiError = err as AxiosError<ApiErrorPayload>;
            const message = apiError.response?.data?.message;
            setError(typeof message === 'string' ? message : 'Error cargando estadisticas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, [startDate, endDate, selectedArea, selectedEstado, selectedJornada]);

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedArea('');
        setSelectedEstado('');
        setSelectedJornada('');
    };

    if (loading && !data) {
        return (
            <div className="flex justify-center items-center h-screen bg-bg-light">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="p-8 text-center text-red-500 flex flex-col items-center justify-center h-screen bg-bg-light">
                <span className="material-symbols-outlined text-5xl mb-4 text-red-400">error</span>
                <p className="text-lg font-medium">{error}</p>
                <button onClick={() => void fetchData()} className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-dark transition-colors text-white font-medium rounded-xl shadow-sm">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="bg-bg-light font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <SlideBar />

                <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50">
                    <div className="p-4 md:p-8 min-h-full">
                        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Reportes y Estadísticas</h1>
                                    <p className="text-zinc-500">Analiza el rendimiento y distribución de las programaciones en el sistema.</p>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <button
                                        onClick={async () => {
                                            if (!data?.items || data.items.length === 0) return;
                                            setIsGeneratingExcel(true);

                                            try {
                                                const result = await salidasService.downloadEstadisticasExcel(
                                                    startDate || undefined,
                                                    endDate || undefined,
                                                    selectedArea || undefined,
                                                    selectedEstado || undefined,
                                                    selectedJornada || undefined
                                                );

                                                const url = window.URL.createObjectURL(result.blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = result.filename;
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                window.URL.revokeObjectURL(url);
                                            } finally {
                                                setIsGeneratingExcel(false);
                                            }
                                        }}
                                        disabled={!data?.items || data.items.length === 0 || isGeneratingExcel}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors text-white font-semibold rounded-xl shadow-sm whitespace-nowrap"
                                    >
                                        {isGeneratingExcel ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-[20px]">table_view</span>
                                        )}
                                        {isGeneratingExcel ? 'Generando...' : 'Exportar Excel'}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!data?.items || data.items.length === 0) return;
                                            setIsGeneratingPdf(true);

                                            try {
                                                const result = await salidasService.downloadEstadisticasPdf(
                                                    startDate || undefined,
                                                    endDate || undefined,
                                                    selectedArea || undefined,
                                                    selectedEstado || undefined,
                                                    selectedJornada || undefined
                                                );

                                                const url = window.URL.createObjectURL(result.blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = result.filename;
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                window.URL.revokeObjectURL(url);
                                            } finally {
                                                setIsGeneratingPdf(false);
                                            }
                                        }}
                                        disabled={!data?.items || data.items.length === 0 || isGeneratingPdf}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors text-white font-semibold rounded-xl shadow-sm whitespace-nowrap"
                                    >
                                        {isGeneratingPdf ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-[20px]">file_download</span>
                                        )}
                                        {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                                    </button>
                                </div>
                            </div>

                            {/* Filters Section */}
                            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg text-primary">filter_list</span>
                                        Filtros de Búsqueda
                                    </h2>
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-xs font-semibold text-zinc-500 hover:text-primary transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">clear_all</span>
                                        Limpiar Filtros
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Fecha Inicial</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-800 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Fecha Final</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-800 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Área</label>
                                        <div className="relative">
                                            <select
                                                value={selectedArea}
                                                onChange={(e) => setSelectedArea(e.target.value)}
                                                className="w-full h-10 pl-3 pr-8 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-800 font-medium appearance-none"
                                            >
                                                <option value="">Todas las áreas</option>
                                                {areas.map((area) => (
                                                    <option key={area.id} value={area.id}>{area.name}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-lg">expand_more</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Estado</label>
                                        <div className="relative">
                                            <select
                                                value={selectedEstado}
                                                onChange={(e) => setSelectedEstado(e.target.value)}
                                                className="w-full h-10 pl-3 pr-8 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-800 font-medium appearance-none"
                                            >
                                                <option value="">Todos los estados</option>
                                                {ESTADOS.map((est) => (
                                                    <option key={est.value} value={est.value}>{est.label}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-lg">expand_more</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Jornada</label>
                                        <div className="relative">
                                            <select
                                                value={selectedJornada}
                                                onChange={(e) => setSelectedJornada(e.target.value)}
                                                className="w-full h-10 pl-3 pr-8 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-800 font-medium appearance-none"
                                            >
                                                <option value="">Todas las jornadas</option>
                                                {JORNADAS.map((jor) => (
                                                    <option key={jor.value} value={jor.value}>{jor.label}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-lg">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Relative Container for loading overlay */}
                            <div className="relative">
                                {loading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-2xl flex items-center justify-center transition-all duration-300">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary shadow-sm"></div>
                                    </div>
                                )}

                                {/* KPIs Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                                    <div className="bg-gradient-to-br from-primary to-indigo-600 p-6 rounded-2xl shadow-md flex items-center gap-5 relative overflow-hidden group">
                                        {/* Decorative circle */}
                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>

                                        <div className="size-14 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10">
                                            <span className="material-symbols-outlined text-[32px]">dataset</span>
                                        </div>
                                        <div className="z-10">
                                            <p className="text-indigo-100 font-medium text-sm mb-1">Total Programaciones</p>
                                            <h3 className="text-4xl font-black text-white tracking-tight">{data?.total || 0}</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Section */}
                                <div id="charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                    {/* Pie Chart: Estados */}
                                    <div className="bg-white p-5 md:p-7 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-sm">pie_chart</span>
                                            <h3 className="text-lg font-bold text-zinc-800">Distribución por Estado</h3>
                                        </div>
                                        <div className="h-[300px] w-full">
                                            {(!data?.estados || data.estados.length === 0) ? (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm font-medium">No hay datos disponibles</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data.estados}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={65}
                                                            outerRadius={100}
                                                            paddingAngle={3}
                                                            dataKey="count"
                                                            stroke="none"
                                                            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                                            labelLine={false}
                                                            isAnimationActive={false}
                                                        >
                                                            {data.estados.map((_entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip
                                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 500 }}
                                                            itemStyle={{ color: '#3f3f46', fontWeight: 600 }}
                                                        />
                                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#52525B', paddingTop: '20px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bar Chart: Solicitantes */}
                                    <div className="bg-white p-5 md:p-7 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1.5 rounded-lg text-sm">bar_chart</span>
                                            <h3 className="text-lg font-bold text-zinc-800">Top Solicitantes</h3>
                                        </div>
                                        <div className="h-[300px] w-full">
                                            {(!data?.topSolicitantes || data.topSolicitantes.length === 0) ? (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm font-medium">No hay datos disponibles</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={data.topSolicitantes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                                        <XAxis
                                                            dataKey="name"
                                                            tick={{ fontSize: 11, fill: '#71717A', fontWeight: 600 }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            interval={0}
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={80}
                                                        />
                                                        <YAxis
                                                            allowDecimals={false}
                                                            tick={{ fontSize: 12, fill: '#A1A1AA', fontWeight: 500 }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <RechartsTooltip
                                                            cursor={{ fill: '#f4f4f5', radius: 6 }}
                                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                                                            itemStyle={{ color: '#10b981', fontWeight: 700 }}
                                                        />
                                                        <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Salidas" maxBarSize={50} isAnimationActive={false}>
                                                            {data.topSolicitantes.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#34d399'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bar Chart: Areas */}
                                    <div className="bg-white p-5 md:p-7 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 lg:col-span-2">
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-indigo-500 bg-indigo-50 p-1.5 rounded-lg text-sm">domain</span>
                                            <h3 className="text-lg font-bold text-zinc-800">Programaciones por Área</h3>
                                        </div>
                                        <div className="h-[350px] w-full">
                                            {(!data?.areas || data.areas.length === 0) ? (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm font-medium">No hay datos disponibles</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={data.areas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                                        <XAxis
                                                            dataKey="name"
                                                            tick={{ fontSize: 11, fill: '#71717A', fontWeight: 600 }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            interval={0}
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={100}
                                                        />
                                                        <YAxis
                                                            allowDecimals={false}
                                                            tick={{ fontSize: 12, fill: '#A1A1AA', fontWeight: 500 }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <RechartsTooltip
                                                            cursor={{ fill: '#f4f4f5', radius: 6 }}
                                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                                                            itemStyle={{ color: '#6366f1', fontWeight: 700 }}
                                                        />
                                                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Salidas" maxBarSize={60} isAnimationActive={false}>
                                                            {data.areas.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

