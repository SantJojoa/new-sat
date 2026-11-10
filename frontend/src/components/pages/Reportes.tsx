import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import SlideBar from '../ui/SlideBar';
import { useAuth } from '../../hooks/useAuth';
import { salidasService } from '../../services/salidasService';
import { reportesService, type ConteoItem, type ReportesResumen, type SeguimientoStat } from '../../services/reportesService';
import type { AreaCatalogoItem } from '../../types/salidas';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
type Seccion = 'programaciones' | 'asesorias' | 'articulaciones' | 'ivc' | 'iv' | 'acompanamientos';
const SECCIONES: { id: Seccion; label: string }[] = [
    { id: 'programaciones', label: 'Programaciones' },
    { id: 'asesorias', label: 'Asesorías' },
    { id: 'articulaciones', label: 'Articulaciones' },
    { id: 'ivc', label: 'IVC' },
    { id: 'iv', label: 'Inspección y Vigilancia (IV)' },
    { id: 'acompanamientos', label: 'Acompañamientos' },
];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-black text-zinc-900 border-l-4 border-primary pl-3">{titulo}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{children}</div>
        </section>
    );
}

const SUBTIPO_LABELS: Record<string, string> = {
    'Inspección y Vigilancia SP (IV)': 'Inspección y Vigilancia IV',
    'Capacitación': 'Desarrollo de Capacidades',
};

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white p-5 md:p-6 rounded-2xl border border-zinc-200/80 shadow-sm ${className}`}>
            <h3 className="text-base font-bold text-zinc-800 mb-4">{title}</h3>
            {children}
        </div>
    );
}

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-black text-zinc-900 mt-1">{value}</p>
            {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
        </div>
    );
}

function Bars({ data = [], color = '#6366f1', labels }: { data?: ConteoItem[]; color?: string; labels?: Record<string, string> }) {
    if (!data.length) return <div className="h-[220px] flex items-center justify-center text-zinc-400 text-sm">No hay datos</div>;
    const rows = data.map(d => ({ ...d, name: labels?.[d.name] ?? d.name }));
    return (
        <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717A', fontWeight: 600 }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: '#f4f4f5' }} />
                    <Bar dataKey="count" name="Cantidad" fill={color} radius={[6, 6, 0, 0]} maxBarSize={50} isAnimationActive={false}>
                        {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function SeguimientoRow({ label, s, to }: { label: string; s: SeguimientoStat; to: string }) {
    const navigate = useNavigate();
    const pct = s.actividades ? Math.round((s.conSeguimiento / s.actividades) * 100) : 0;
    return (
        <tr className="border-t border-zinc-100 text-sm cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => navigate(to)} title={`Ir a ${label}`}>
            <td className="py-3 pr-3 font-semibold text-primary underline-offset-2 hover:underline">{label} →</td>
            <td className="py-3 px-2 text-center">{s.actividades}</td>
            <td className="py-3 px-2 text-center font-bold text-emerald-700">{s.conSeguimiento}</td>
            <td className="py-3 px-2 text-center text-amber-700">{s.sinSeguimiento}</td>
            <td className="py-3 px-2 text-center">{s.realizadas}</td>
            <td className="py-3 pl-2 w-32">
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                <span className="text-[11px] text-zinc-500">{pct}%</span>
            </td>
        </tr>
    );
}

export default function Reportes() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.user_type?.name;
    const isSuperAdmin = role === 'superadmin';
    const isAdminSub = role === 'admin_subdireccion';

    const [data, setData] = useState<ReportesResumen | null>(null);
    const [loading, setLoading] = useState(true);
    const [areas, setAreas] = useState<AreaCatalogoItem[]>([]);
    const [subdirecciones, setSubdirecciones] = useState<{ id: string; name: string }[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [subdireccionId, setSubdireccionId] = useState('');
    const [areaId, setAreaId] = useState('');
    const [visibles, setVisibles] = useState<Set<Seccion>>(new Set(SECCIONES.map(x => x.id)));
    const toggle = (id: Seccion) => setVisibles(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const show = (id: Seccion) => visibles.has(id);
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        if (!isSuperAdmin && !isAdminSub) return;
        salidasService.getCatalogos().then(c => { setAreas(c.areas || []); setSubdirecciones(c.subdirecciones || []); }).catch(() => { });
    }, [isSuperAdmin, isAdminSub]);

    useEffect(() => {
        setLoading(true);
        reportesService.getResumen({
            startDate: startDate || undefined, endDate: endDate || undefined,
            subdireccionId: subdireccionId || undefined, areaId: areaId || undefined,
        }).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
    }, [startDate, endDate, subdireccionId, areaId]);

    const areaOptions = isSuperAdmin
        ? (subdireccionId ? areas.filter(a => a.subdireccion_id === subdireccionId) : [])
        : areas;

    const download = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
    };

    const exportar = async (kind: 'excel' | 'pdf') => {
        const set = kind === 'excel' ? setIsGeneratingExcel : setIsGeneratingPdf;
        set(true);
        try {
            const r = await reportesService.exportar(kind, {
                startDate: startDate || undefined, endDate: endDate || undefined,
                subdireccionId: subdireccionId || undefined, areaId: areaId || undefined,
            }, Array.from(visibles));
            download(r.blob, r.filename);
        } finally { set(false); }
    };

    const clear = () => { setStartDate(''); setEndDate(''); setSubdireccionId(''); setAreaId(''); };
    const inputCls = 'w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

    const s = data?.seguimientos;
    const totalConSeg = s
        ? s.capacitaciones.conSeguimiento + s.ivc.conSeguimiento + s.inspeccionVigilancia.conSeguimiento + s.articulaciones.conSeguimiento + (data?.acompanamientos.programados.conSeguimiento ?? 0)
        : 0;

    return (
        <div className="bg-bg-light font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <SlideBar />
                <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50">
                    <div className="p-4 md:p-8 min-h-full">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                                        <BarChart2 className="text-primary" size={32} />Reportes y Estadísticas
                                    </h1>
                                    <p className="text-zinc-500 mt-1">Programaciones, asesorías, IVC, IV, articulaciones y acompañamientos en un solo panel.</p>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <button onClick={() => void exportar('excel')} disabled={isGeneratingExcel || !visibles.size}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white font-semibold rounded-xl text-sm">
                                        {isGeneratingExcel ? 'Generando...' : 'Exportar Excel'}
                                    </button>
                                    <button onClick={() => void exportar('pdf')} disabled={isGeneratingPdf || !visibles.size}
                                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-semibold rounded-xl text-sm">
                                        {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-bold text-zinc-800">Filtros</h2>
                                    <button onClick={clear} className="text-xs font-semibold text-zinc-500 hover:text-primary">Limpiar</button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div><label className="text-xs font-bold text-zinc-600 uppercase">Fecha Inicial</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
                                    <div><label className="text-xs font-bold text-zinc-600 uppercase">Fecha Final</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} /></div>
                                    {isSuperAdmin && (
                                        <div><label className="text-xs font-bold text-zinc-600 uppercase">Subdirección</label>
                                            <select value={subdireccionId} onChange={e => { setSubdireccionId(e.target.value); setAreaId(''); }} className={inputCls}>
                                                <option value="">Todas</option>
                                                {subdirecciones.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                                            </select></div>
                                    )}
                                    {(isSuperAdmin || isAdminSub) && (
                                        <div><label className="text-xs font-bold text-zinc-600 uppercase">Área</label>
                                            <select value={areaId} onChange={e => setAreaId(e.target.value)} disabled={isSuperAdmin && !subdireccionId} className={`${inputCls} disabled:opacity-50`}>
                                                <option value="">Todas</option>
                                                {areaOptions.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                                            </select></div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-zinc-100">
                                    <label className="text-xs font-bold text-zinc-600 uppercase">Ver estadísticas de</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {SECCIONES.map(x => (
                                            <button key={x.id} type="button" onClick={() => toggle(x.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${show(x.id) ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}>
                                                {x.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="relative space-y-6">
                                {loading && <div className="absolute inset-0 bg-white/60 z-10 rounded-2xl flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>}

                                {!data ? (
                                    !loading && <p className="text-zinc-500">No se pudo cargar el reporte.</p>
                                ) : (<>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {show('programaciones') && <Kpi label="Programaciones" value={data.programaciones.total} />}
                                        {show('asesorias') && <Kpi label="Asesorías" value={data.asesorias.total} hint={`${data.asesorias.minutos} min en total`} />}
                                        {show('ivc') && <Kpi label="IVC" value={data.ivc.total} />}
                                        {show('articulaciones') && <Kpi label="Articulaciones" value={data.articulaciones.total} />}
                                        {show('iv') && <Kpi label="Inspección y Vigilancia (IV)" value={data.iv.total} />}
                                        {show('acompanamientos') && <Kpi label="Acompañamientos" value={data.acompanamientos.total} hint={`${data.acompanamientos.programados.actividades} programados · ${data.acompanamientos.noProgramados} no programados`} />}
                                        <Kpi label="Actividades con seguimiento" value={totalConSeg} hint="Suma de todos los seguimientos" />
                                    </div>

                                    <Card title="Seguimiento a actividades">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-xs uppercase tracking-wider text-zinc-500">
                                                        <th className="pb-2">Tipo</th><th className="pb-2 text-center">Actividades</th>
                                                        <th className="pb-2 text-center">Con seguimiento</th><th className="pb-2 text-center">Sin seguimiento</th>
                                                        <th className="pb-2 text-center">Realizadas</th><th className="pb-2">Avance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {show('programaciones') && <SeguimientoRow label="Desarrollo de Capacidades" s={data.seguimientos.capacitaciones} to="/seguimiento-capacitaciones" />}
                                                    {show('ivc') && <SeguimientoRow label="IVC" s={data.seguimientos.ivc} to="/seguimiento-ivc" />}
                                                    {show('iv') && <SeguimientoRow label="Inspección y Vigilancia (IV)" s={data.seguimientos.inspeccionVigilancia} to="/seguimiento-articulacion-iv" />}
                                                    {show('articulaciones') && <SeguimientoRow label="Articulaciones" s={data.seguimientos.articulaciones} to="/seguimiento-articulacion" />}
                                                    {show('acompanamientos') && <SeguimientoRow label="Acompañamiento programado" s={data.acompanamientos.programados} to="/seguimiento-acompanamiento" />}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-sm text-zinc-600 mt-4">
                                            {show('acompanamientos') && <>Acompañamientos no programados registrados: <button type="button" onClick={() => navigate('/acompanamiento-no-registrado')} className="font-bold text-primary hover:underline">{data.acompanamientos.noProgramados} →</button></>}
                                        </p>
                                    </Card>

                                    {show('programaciones') && (
                                        <Seccion titulo="Programaciones">
                                            <Card title="Por Tipo"><Bars data={data.programaciones.porTipo} color="#6366f1" /></Card>
                                            <Card title="Por Subtipo"><Bars data={data.programaciones.porSubtipo} color="#10b981" labels={SUBTIPO_LABELS} /></Card>
                                            <Card title="Por Estado"><Bars data={data.programaciones.porEstado} color="#f59e0b" /></Card>
                                            <Card title="Por Subdirección"><Bars data={data.programaciones.porSubdireccion} color="#06b6d4" /></Card>
                                            <Card title="Por Área" className="lg:col-span-2"><Bars data={data.programaciones.porArea} color="#6366f1" /></Card>
                                        </Seccion>
                                    )}
                                    {show('asesorias') && (
                                        <Seccion titulo="Asesorías">
                                            <Card title="Por Medio"><Bars data={data.asesorias.porMedio} color="#06b6d4" /></Card>
                                            <Card title="Por Subdirección"><Bars data={data.asesorias.porSubdireccion} color="#06b6d4" /></Card>
                                            <Card title="Por Área" className="lg:col-span-2"><Bars data={data.asesorias.porArea} color="#6366f1" /></Card>
                                        </Seccion>
                                    )}
                                    {show('articulaciones') && (
                                        <Seccion titulo="Articulaciones">
                                            <Card title="Por Estado"><Bars data={data.articulaciones.porEstado} color="#ec4899" /></Card>
                                            <Card title="Por Subdirección"><Bars data={data.articulaciones.porSubdireccion} color="#06b6d4" /></Card>
                                            <Card title="Por Área" className="lg:col-span-2"><Bars data={data.articulaciones.porArea} color="#6366f1" /></Card>
                                        </Seccion>
                                    )}
                                    {show('ivc') && (
                                        <Seccion titulo="IVC">
                                            <Card title="Por Estado"><Bars data={data.ivc.porEstado} color="#8b5cf6" /></Card>
                                            <Card title="Por Subdirección"><Bars data={data.ivc.porSubdireccion} color="#06b6d4" /></Card>
                                            <Card title="Por Área" className="lg:col-span-2"><Bars data={data.ivc.porArea} color="#6366f1" /></Card>
                                        </Seccion>
                                    )}
                                    {show('iv') && (
                                        <Seccion titulo="Inspección y Vigilancia (IV)">
                                            <Card title="Por Subdirección"><Bars data={data.iv.porSubdireccion} color="#06b6d4" /></Card>
                                            <Card title="Por Área"><Bars data={data.iv.porArea} color="#6366f1" /></Card>
                                        </Seccion>
                                    )}
                                    {show('acompanamientos') && (
                                        <Seccion titulo="Acompañamientos (programados y no programados)">
                                            <Card title="Por Subdirección"><Bars data={data.acompanamientos.porSubdireccion} color="#06b6d4" /></Card>
                                            <Card title="Por Área"><Bars data={data.acompanamientos.porArea} color="#6366f1" /></Card>
                                        </Seccion>
                                    )}
                                    </>)}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
