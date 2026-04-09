import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { articulacionesService } from '../../services/articulacionesService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import SlideBar from '../ui/SlideBar';

type EstData = { total: number; estados: { name: string; count: number }[]; topSolicitantes: { name: string; count: number }[]; areas: { name: string; count: number }[] };


const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportesArticulacion() {
    const [data, setData] = useState<EstData | null>(null);
    const [loading, setLoading] = useState(true);
    const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedEstado] = useState('');
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        articulacionesService.getCatalogos().then(c => setAreas(c.areas || [])).catch(() => { });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await articulacionesService.getEstadisticas(
                startDate || undefined, endDate || undefined,
                selectedArea || undefined, selectedEstado || undefined
            );
            setData(res);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void fetchData(); }, [startDate, endDate, selectedArea, selectedEstado]);

    const handleClear = () => { setStartDate(''); setEndDate(''); setSelectedArea(''); };

    const triggerDownload = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
    };

    if (loading && !data) {
        return (
            <div className="flex justify-center items-center h-screen bg-bg-light">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                                        <BarChart2 className="text-primary" size={32} />Reportes — Articulación
                                    </h1>
                                    <p className="text-zinc-500 mt-1">Estadísticas de articulaciones intersectoriales.</p>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <button
                                        onClick={async () => { setIsGeneratingExcel(true); try { const r = await articulacionesService.downloadExcel(startDate || undefined, endDate || undefined, selectedArea || undefined, selectedEstado || undefined); triggerDownload(r.blob, r.filename); } finally { setIsGeneratingExcel(false); } }}
                                        disabled={!data?.total || isGeneratingExcel}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors text-white font-semibold rounded-xl shadow-sm text-sm"
                                    >
                                        {isGeneratingExcel ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <span className="material-symbols-outlined text-[18px]">table_view</span>}
                                        {isGeneratingExcel ? 'Generando...' : 'Exportar Excel'}
                                    </button>
                                    <button
                                        onClick={async () => { setIsGeneratingPdf(true); try { const r = await articulacionesService.downloadPdf(startDate || undefined, endDate || undefined, selectedArea || undefined, selectedEstado || undefined); triggerDownload(r.blob, r.filename); } finally { setIsGeneratingPdf(false); } }}
                                        disabled={!data?.total || isGeneratingPdf}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors text-white font-semibold rounded-xl shadow-sm text-sm"
                                    >
                                        {isGeneratingPdf ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <span className="material-symbols-outlined text-[18px]">file_download</span>}
                                        {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                                    </button>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg text-primary">filter_list</span>
                                        Filtros
                                    </h2>
                                    <button onClick={handleClear} className="text-xs font-semibold text-zinc-500 hover:text-primary transition-colors flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">clear_all</span>Limpiar
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Fecha Inicial', type: 'date', value: startDate, set: setStartDate },
                                        { label: 'Fecha Final', type: 'date', value: endDate, set: setEndDate },
                                    ].map(f => (
                                        <div key={f.label} className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">{f.label}</label>
                                            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                                                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                        </div>
                                    ))}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Área</label>
                                        <div className="relative">
                                            <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}
                                                className="w-full h-10 pl-3 pr-8 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none">
                                                <option value="">Todas las áreas</option>
                                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-lg">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                {loading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-2xl flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                    </div>
                                )}

                                {/* KPI */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                                    <div className="bg-gradient-to-br from-primary to-indigo-600 p-6 rounded-2xl shadow-md flex items-center gap-5 relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                                        <div className="size-14 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm border border-white/10">
                                            <span className="material-symbols-outlined text-[32px]">hub</span>
                                        </div>
                                        <div className="z-10">
                                            <p className="text-indigo-100 font-medium text-sm mb-1">Total Articulaciones</p>
                                            <h3 className="text-4xl font-black text-white tracking-tight">{data?.total || 0}</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                    <div className="bg-white p-5 md:p-7 rounded-2xl border border-zinc-200/80 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1.5 rounded-lg text-sm">bar_chart</span>
                                            <h3 className="text-lg font-bold text-zinc-800">Top Solicitantes</h3>
                                        </div>
                                        <div className="h-[300px]">
                                            {!data?.topSolicitantes?.length ? (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No hay datos</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={data.topSolicitantes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717A', fontWeight: 600 }} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={80} />
                                                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
                                                        <RechartsTooltip cursor={{ fill: '#f4f4f5', radius: 6 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0/0.1)', padding: '12px 16px' }} />
                                                        <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Articulaciones" maxBarSize={50} isAnimationActive={false}>
                                                            {data.topSolicitantes.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#34d399'} />)}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 md:p-7 rounded-2xl border border-zinc-200/80 shadow-sm lg:col-span-2">
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-indigo-500 bg-indigo-50 p-1.5 rounded-lg text-sm">domain</span>
                                            <h3 className="text-lg font-bold text-zinc-800">Articulaciones por Área</h3>
                                        </div>
                                        <div className="h-[350px]">
                                            {!data?.areas?.length ? (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No hay datos</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={data.areas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717A', fontWeight: 600 }} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={100} />
                                                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
                                                        <RechartsTooltip cursor={{ fill: '#f4f4f5', radius: 6 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0/0.1)', padding: '12px 16px' }} />
                                                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Articulaciones" maxBarSize={60} isAnimationActive={false}>
                                                            {data.areas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
