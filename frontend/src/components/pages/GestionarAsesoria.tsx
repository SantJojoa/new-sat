import { useCallback, useEffect, useState } from 'react';
import { User, RefreshCcw, Calendar, MapPin, Layers, Clock, Building2, MessageSquare, FileText, Monitor } from 'lucide-react';
import SlideBar from '../ui/SlideBar';
import { useAuth } from '../../hooks/useAuth';
import { asesoriasService } from '../../services/asesoriasService';
import FiltersPanel, { type FilterField } from '../ui/FiltersPanel';
import type { AsesoriaRecord } from '../../types/asesorias';
import RecordsTable, { ViewButton, type TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';

const asesoriaColumns: TableColumn<AsesoriaRecord>[] = [
    { header: 'Código', render: r => <span className="font-mono font-bold text-primary text-xs">{r.codigo}</span> },
    { header: 'Institución', render: r => <span className="max-w-[200px] truncate font-medium text-zinc-800 block">{r.institucion}</span> },
    { header: 'Temas Tratados', render: r => <span className="max-w-[220px] truncate text-zinc-600 block">{r.temas_tratados}</span> },
    { header: 'Área', render: r => <span className="text-zinc-600">{r.areas?.name || '—'}</span> },
    {
        header: 'Fecha', render: r => (
            <div className="whitespace-nowrap text-zinc-600">
                <span className="flex items-center gap-1"><Calendar size={12} className="text-zinc-400" />{new Date(r.fecha).toLocaleDateString('es-CO')}</span>
                <span className="flex items-center gap-1 text-zinc-400 text-xs"><Clock size={10} />{r.hora}</span>
            </div>
        )
    },
    { header: 'Medio', render: r => <span className="text-zinc-600">{r.medio}</span> },
    {
        header: 'Asistentes', render: r => (
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                {r.asistentes?.length ?? 0}
            </span>
        )
    },
];

export default function GestionarAsesoria() {
    const { user } = useAuth();
    const [records, setRecords] = useState<AsesoriaRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
    const [detailRecord, setDetailRecord] = useState<AsesoriaRecord | null>(null);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [previewingId, setPreviewingId] = useState<string | null>(null);

    const isAdmin = ['admin_subdireccion', 'superadmin'].includes(user?.user_type?.name || '');

    const handlePreview = async (record: AsesoriaRecord) => {
        setPreviewingId(record.id);
        try {
            const html = await asesoriasService.previewCertificado(record.id);
            setPreviewHtml(html);
        } catch (error) {
            console.error('Error cargando preview:', error);
        } finally {
            setPreviewingId(null);
        }
    };

    const handleGenerateCertificate = async (record: AsesoriaRecord) => {
        setGeneratingId(record.id);
        try {
            await asesoriasService.generateCertificado(record.id, record.codigo);
        } catch (error) {
            console.error('Error generando certificado:', error);
        } finally {
            setGeneratingId(null);
        }
    };

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await asesoriasService.getAsesorias(viewAll);
            setRecords(data);
            setUniqueAreas(Array.from(new Set(data.map(r => r.areas?.name).filter(Boolean))) as string[]);
        } catch (error) {
            console.error('Error fetching asesorias:', error);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setDetailRecord(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const filtered = records.filter(r => {
        const term = searchTerm.toLowerCase();
        const matchSearch = !term
            || r.codigo.toLowerCase().includes(term)
            || r.institucion.toLowerCase().includes(term)
            || r.temas_tratados.toLowerCase().includes(term)
            || r.registrador?.names?.toLowerCase().includes(term) || false;
        const matchArea = !filterArea || r.areas?.name === filterArea;
        const matchStart = !filterDateStart || new Date(r.fecha) >= new Date(filterDateStart);
        const matchEnd = !filterDateEnd || new Date(r.fecha) <= new Date(filterDateEnd);
        return matchSearch && matchArea && matchStart && matchEnd;
    });

    const filterValues: Record<string, string> = { search: searchTerm, area: filterArea, dateStart: filterDateStart, dateEnd: filterDateEnd };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, institución, tema o registrador...' },
        ...(isAdmin ? [{ type: 'select' as const, key: 'area', emptyLabel: 'Todas las Áreas', options: uniqueAreas }] : []),
        { type: 'date', key: 'dateStart', title: 'Fecha Inicio' },
        { type: 'date', key: 'dateEnd', title: 'Fecha Final' },
    ];
    const handleFilterChange = (key: string, value: string) => {
        if (key === 'search') setSearchTerm(value);
        else if (key === 'area') setFilterArea(value);
        else if (key === 'dateStart') setFilterDateStart(value);
        else if (key === 'dateEnd') setFilterDateEnd(value);
    };
    const handleResetFilters = () => { setSearchTerm(''); setFilterArea(''); setFilterDateStart(''); setFilterDateEnd(''); };

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[32px]">support_agent</span>
                            Gestionar Asesorías
                        </h1>
                        <p className="text-zinc-500 mt-2">Listado de asesorías registradas en la subdirección y área.</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {isAdmin && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    <Layers size={16} />
                                    {viewAll ? 'Viendo todas las áreas' : 'Ver todas las áreas'}
                                </button>
                            )}
                            <button onClick={fetchRecords} className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50 flex items-center gap-2">
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                Actualizar
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Asesorías</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{filtered.length}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Asistentes</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{filtered.reduce((acc, r) => acc + (r.asistentes?.length ?? 0), 0)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Duración Total (min)</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{filtered.reduce((acc, r) => acc + (r.duracion_minutos ?? 0), 0)}</p>
                        </div>
                    </div>

                    <FiltersPanel values={filterValues} onChange={handleFilterChange} onReset={handleResetFilters} fields={filterFields} />

                    <RecordsTable
                        records={filtered}
                        loading={loading}
                        columns={asesoriaColumns}
                        renderActions={r => (
                            <>
                                <ViewButton onClick={() => setDetailRecord(r)} />
                                <button
                                    onClick={() => handlePreview(r)}
                                    disabled={previewingId === r.id}
                                    title="Previsualizar certificado"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {previewingId === r.id
                                        ? <RefreshCcw size={16} className="animate-spin" />
                                        : <Monitor size={16} />}
                                </button>
                                <button
                                    onClick={() => handleGenerateCertificate(r)}
                                    disabled={generatingId === r.id}
                                    title="Descargar Certificado PDF"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generatingId === r.id
                                        ? <RefreshCcw size={16} className="animate-spin" />
                                        : <FileText size={16} />}
                                </button>
                            </>
                        )}
                        emptyIcon="support_agent"
                        emptyMessage="No hay asesorías para mostrar"
                        emptySubMessage="Registre una nueva asesoría o ajuste los filtros."
                    />
                </div>

                {previewHtml && (
                    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
                        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-zinc-200 shrink-0">
                            <span className="font-bold text-zinc-800 flex items-center gap-2"><Monitor size={18} className="text-primary" />Previsualización del Certificado</span>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-zinc-400">Edita <code className="bg-zinc-100 px-1 rounded text-xs">asesorias-certificate.report.ts</code> y vuelve a abrir el preview para ver los cambios</p>
                                <button onClick={() => setPreviewHtml(null)} className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium transition-colors">Cerrar</button>
                            </div>
                        </div>
                        <iframe
                            srcDoc={previewHtml}
                            className="flex-1 w-full bg-white"
                            title="Preview certificado"
                        />
                    </div>
                )}

                {detailRecord && (
                    <DetailModal title="Detalle de Asesoría" codigo={detailRecord.codigo} onClose={() => setDetailRecord(null)}>
                        <div className="p-6 space-y-4 text-sm">
                            <DetailGrid>
                                <DetailCard label="Registrador" icon={<User size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.registrador?.names}</p>
                                    <p className="text-zinc-500 text-xs">{detailRecord.registrador?.email}</p>
                                </DetailCard>
                                <DetailCard label="Área" icon={<Layers size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.areas?.name || '—'}</p>
                                </DetailCard>
                                <DetailCard label="Fecha y Hora" icon={<Calendar size={10} />}>
                                    <p className="text-zinc-900 font-medium">{new Date(detailRecord.fecha).toLocaleDateString('es-CO')}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">Hora: {detailRecord.hora}</p>
                                </DetailCard>
                                <DetailCard label="Medio" icon={<MapPin size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.medio}</p>
                                </DetailCard>
                                <DetailCard label="Institución" icon={<Building2 size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.institucion}</p>
                                    {detailRecord.municipio_procedencia && (
                                        <p className="text-zinc-500 text-xs mt-0.5">{detailRecord.municipio_procedencia.name}</p>
                                    )}
                                    {detailRecord.municipio_otro && (
                                        <p className="text-zinc-500 text-xs mt-0.5">{detailRecord.municipio_otro}</p>
                                    )}
                                </DetailCard>
                                <DetailCard label="Lugar" icon={<MapPin size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.lugar}</p>
                                </DetailCard>
                                <DetailCard label="Duración" icon={<Clock size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.duracion_minutos} minutos</p>
                                </DetailCard>
                                <DetailCard label="Estado">
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 capitalize">{detailRecord.estado}</span>
                                </DetailCard>
                                <DetailCard label="Temas Tratados" fullWidth icon={<MessageSquare size={10} />}>
                                    <p className="text-zinc-800">{detailRecord.temas_tratados}</p>
                                </DetailCard>
                                <DetailCard label="Material Entregado" fullWidth>
                                    <p className="text-zinc-800">{detailRecord.material_entregado}</p>
                                </DetailCard>
                                {detailRecord.asistentes && detailRecord.asistentes.length > 0 && (
                                    <DetailCard label={`Asistentes (${detailRecord.asistentes.length})`} fullWidth>
                                        <div className="space-y-2 mt-1">
                                            {detailRecord.asistentes.map((a, i) => (
                                                <div key={i} className="flex flex-wrap items-center gap-2 text-xs text-zinc-700 border-b border-zinc-100 pb-1 last:border-0 last:pb-0">
                                                    <span className="font-medium">{a.nombre} {a.apellido}</span>
                                                    {a.cargo && <span className="text-zinc-400">· {a.cargo}</span>}
                                                    {a.email && <span className="text-zinc-400">· {a.email}</span>}
                                                    {a.movil && <span className="text-zinc-400">· {a.movil}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </DetailCard>
                                )}
                                {detailRecord.compromisos && detailRecord.compromisos.length > 0 && (
                                    <DetailCard label={`Compromisos (${detailRecord.compromisos.length})`} fullWidth>
                                        <div className="space-y-2 mt-1">
                                            {detailRecord.compromisos.map((c, i) => (
                                                <div key={i} className="text-xs text-zinc-700 border-b border-zinc-100 pb-1 last:border-0 last:pb-0">
                                                    <p className="font-medium">{c.compromiso}</p>
                                                    <p className="text-zinc-500">Responsable: {c.responsable}{c.fecha ? ` · ${new Date(c.fecha).toLocaleDateString('es-CO')}` : ''}</p>
                                                    {c.observaciones && <p className="text-zinc-400">{c.observaciones}</p>}
                                                </div>
                                            ))}
                                        </div>
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
