import { useState, useEffect } from 'react';
import { salidasService } from '../../services/salidasService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import SlideBar from '../ui/SlideBar';

interface EstadisticasData {
    estados: { name: string, count: number }[];
    topSolicitantes: { name: string, count: number }[];
    areas: { name: string, count: number }[];
    total: number;
}

const MONTHS = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportesSalidas() {
    const [data, setData] = useState<EstadisticasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [areas, setAreas] = useState<{ id: string, name: string }[]>([]);

    // Filters state
    const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
    const [selectedArea, setSelectedArea] = useState<string>('');

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedArea]);

    useEffect(() => {
        loadCatalogos();
    }, []);

    const loadCatalogos = async () => {
        try {
            const cat = await salidasService.getCatalogos();
            setAreas(cat.areas || []);
        } catch (e) {
            console.error("Failed to load areas", e);
        }
    }

    const loadData = async () => {
        try {
            setLoading(true);
            const m = selectedMonth !== '' ? Number(selectedMonth) : undefined;
            const a = selectedArea !== '' ? selectedArea : undefined;
            const res = await salidasService.getEstadisticas(m, a);
            setData(res);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error cargando estadísticas');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[500px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <span className="material-symbols-outlined text-4xl mb-4">error</span>
                <p>{error}</p>
                <button onClick={loadData} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
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
                    <div className="p-8 min-h-full">
                        <div className="max-w-7xl mx-auto space-y-8">

                            {/* Header and Filters */}
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Reportes y Estadísticas</h1>
                                    <p className="text-zinc-500">Visualiza el resumen de salidas solicitadas y aprobadas en el sistema.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                    <div className="flex flex-col gap-1.5 w-full sm:w-48">
                                        <label className="text-sm font-semibold text-zinc-700">Mes</label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-700"
                                        >
                                            <option value="">Todos los meses</option>
                                            {MONTHS.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5 w-full sm:w-64">
                                        <label className="text-sm font-semibold text-zinc-700">Área</label>
                                        <select
                                            value={selectedArea}
                                            onChange={(e) => setSelectedArea(e.target.value)}
                                            className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-700"
                                        >
                                            <option value="">Todas las áreas</option>
                                            {areas.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                                    <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[32px]">summarize</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-500">Total Salidas</p>
                                        <h3 className="text-3xl font-black text-zinc-900">{data?.total || 0}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                {/* Salidas por Estado */}
                                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-zinc-900 mb-6">Salidas por Estado</h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data?.estados || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="count"
                                                    stroke="none"
                                                >
                                                    {(data?.estados || []).map((_entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#52525B' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Top Solicitantes */}
                                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-zinc-900 mb-6">Top Solicitantes</h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={data?.topSolicitantes || []}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 12, fill: '#71717A', fontWeight: 500 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    interval={0}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                />
                                                <YAxis
                                                    allowDecimals={false}
                                                    tick={{ fontSize: 12, fill: '#71717A', fontWeight: 500 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <RechartsTooltip
                                                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Cantidad" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Salidas por Área */}
                                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm lg:col-span-2">
                                    <h3 className="text-lg font-bold text-zinc-900 mb-6">Salidas por Área</h3>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={data?.areas || []}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 12, fill: '#71717A', fontWeight: 500 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    interval={0}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={100}
                                                />
                                                <YAxis
                                                    allowDecimals={false}
                                                    tick={{ fontSize: 12, fill: '#71717A', fontWeight: 500 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <RechartsTooltip
                                                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} name="Cantidad" />
                                            </BarChart>
                                        </ResponsiveContainer>
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
