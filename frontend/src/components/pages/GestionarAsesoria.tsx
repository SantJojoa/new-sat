import { useCallback, useEffect, useState } from 'react';
import { User, RefreshCcw, Calendar, MapPin, Layers, Clock, Building2, MessageSquare, FileText, Trash2, X, Plus } from 'lucide-react';
import FeedbackModal from '../ui/FeedbackModal';
import ConfirmModal from '../ui/ConfirmModal';
import SlideBar from '../ui/SlideBar';
import { useAuth } from '../../hooks/useAuth';
import { asesoriasService } from '../../services/asesoriasService';
import FiltersPanel, { type FilterField } from '../ui/FiltersPanel';
import type { AsesoriaRecord, AsesoriaAsistente, CreateAsesoriaPayload } from '../../types/asesorias';
import RecordsTable, { ViewButton, EditButton, DeleteButton, type TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';
import DocumentosAdicionales from '../ui/DocumentosAdicionales';

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
    const [filterSubdireccion, setFilterSubdireccion] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [uniqueSubdirecciones, setUniqueSubdirecciones] = useState<string[]>([]);
    const [detailRecord, setDetailRecord] = useState<AsesoriaRecord | null>(null);
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const isSuperAdmin = user?.user_type?.name === 'superadmin';
    const [editRecord, setEditRecord] = useState<AsesoriaRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<AsesoriaRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editForm, setEditForm] = useState<Partial<CreateAsesoriaPayload>>({});
    const [areasData, setAreasData] = useState<{ id: string; name: string }[]>([]);
    const [municipiosData, setMunicipiosData] = useState<{ id: string; name: string }[]>([]);
    const [editAsistentes, setEditAsistentes] = useState<AsesoriaAsistente[]>([]);
    const [feedbackModal, setFeedbackModal] = useState<{ type: 'success' | 'error' | null; title: string; message: string }>({ type: null, title: '', message: '' });

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
            setUniqueSubdirecciones(Array.from(new Set(data.map(r => r.areas?.subdirecciones?.name).filter(Boolean))) as string[]);
        } catch (error) {
            console.error('Error fetching asesorias:', error);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        asesoriasService.getCatalogos().then(data => {
            setAreasData(data.areas);
            setMunicipiosData(data.municipios);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDetailRecord(null);
                setEditRecord(null);
                setDeleteRecord(null);
                setFeedbackModal({ type: null, title: '', message: '' });
            }
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
        const matchSubdireccion = !filterSubdireccion || r.areas?.subdirecciones?.name === filterSubdireccion;
        const matchStart = !filterDateStart || new Date(r.fecha) >= new Date(filterDateStart);
        const matchEnd = !filterDateEnd || new Date(r.fecha) <= new Date(filterDateEnd);
        return matchSearch && matchArea && matchSubdireccion && matchStart && matchEnd;
    });

    const areaOptionsForFilter = filterSubdireccion
        ? Array.from(new Set(records.filter(r => r.areas?.subdirecciones?.name === filterSubdireccion).map(r => r.areas?.name).filter(Boolean))) as string[]
        : [];

    const filterValues: Record<string, string> = { search: searchTerm, area: filterArea, subdireccion: filterSubdireccion, dateStart: filterDateStart, dateEnd: filterDateEnd };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, institución, tema o registrador...' },
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'subdireccion', emptyLabel: 'Todas las Subdirecciones', options: uniqueSubdirecciones }] : []),
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'area', emptyLabel: 'Todas las Áreas', options: areaOptionsForFilter, disabled: !filterSubdireccion, disabledTitle: 'Seleccione primero una subdirección' }] : []),
        { type: 'date', key: 'dateStart', title: 'Fecha Inicio' },
        { type: 'date', key: 'dateEnd', title: 'Fecha Final' },
    ];
    const handleFilterChange = (key: string, value: string) => {
        if (key === 'search') setSearchTerm(value);
        else if (key === 'area') setFilterArea(value);
        else if (key === 'subdireccion') { setFilterSubdireccion(value); setFilterArea(''); }
        else if (key === 'dateStart') setFilterDateStart(value);
        else if (key === 'dateEnd') setFilterDateEnd(value);
    };
    const handleResetFilters = () => { setSearchTerm(''); setFilterArea(''); setFilterSubdireccion(''); setFilterDateStart(''); setFilterDateEnd(''); };

    const handleOpenEdit = (r: AsesoriaRecord) => {
        setEditForm({
            fecha: r.fecha.slice(0, 10),
            hora: r.hora,
            hora_fin: r.hora_fin,
            medio: r.medio,
            institucion: r.institucion,
            municipio_procedencia_id: r.municipio_otro ? 'otro' : (r.municipio_procedencia_id ?? ''),
            municipio_otro: r.municipio_otro ?? '',
            temas_tratados: r.temas_tratados,
            material_entregado: r.material_entregado,
            area_id: r.areas?.id,
        });
        setEditAsistentes(r.asistentes ? r.asistentes.map(a => ({ ...a })) : []);
        setEditRecord(r);
    };

    const handleSave = async () => {
        if (!editRecord) return;
        setIsSaving(true);
        try {
            await asesoriasService.updateAsesoria(editRecord.id, {
                ...editForm,
                asistentes: editAsistentes,
            });
            setEditRecord(null);
            setFeedbackModal({ type: 'success', title: '¡Actualizado!', message: 'La asesoría fue actualizada exitosamente.' });
            void fetchRecords();
        } catch (error) {
            console.error('Error updating asesoria:', error);
            setFeedbackModal({ type: 'error', title: 'Error', message: 'No se pudo actualizar la asesoría.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteRecord) return;
        setIsDeleting(true);
        try {
            await asesoriasService.deleteAsesoria(deleteRecord.id);
            setDeleteRecord(null);
            setFeedbackModal({ type: 'success', title: '¡Eliminado!', message: 'La asesoría fue eliminada exitosamente.' });
            void fetchRecords();
        } catch (error) {
            console.error('Error deleting asesoria:', error);
            setFeedbackModal({ type: 'error', title: 'Error', message: 'No se pudo eliminar la asesoría.' });
        } finally {
            setIsDeleting(false);
        }
    };

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
                            {isSuperAdmin && (
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
                                    onClick={() => handleGenerateCertificate(r)}
                                    disabled={generatingId === r.id}
                                    title="Descargar Certificado PDF"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generatingId === r.id
                                        ? <RefreshCcw size={16} className="animate-spin" />
                                        : <FileText size={16} />}
                                </button>
                                {isSuperAdmin && (
                                    <>
                                        <EditButton onClick={() => handleOpenEdit(r)} />
                                        <DeleteButton onClick={() => setDeleteRecord(r)} />
                                    </>
                                )}
                            </>
                        )}
                        emptyIcon="support_agent"
                        emptyMessage="No hay asesorías para mostrar"
                        emptySubMessage="Registre una nueva asesoría o ajuste los filtros."
                    />
                </div>

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
                                    <p className="text-zinc-500 text-xs mt-0.5">Hora: {detailRecord.hora} - {detailRecord.hora_fin}</p>
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
                            </DetailGrid>

                            <DocumentosAdicionales basePath={`/asesorias/${detailRecord.id}`} />
                        </div>
                    </DetailModal>
                )}
                {editRecord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900">Editar Asesoría</h3>
                                    <p className="text-zinc-500 text-sm">Código: <span className="font-mono font-bold text-primary">{editRecord.codigo}</span></p>
                                </div>
                                <button onClick={() => setEditRecord(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Información básica */}
                                <div>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Información General</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fecha</label>
                                            <input type="date" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.fecha ?? ''} onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hora Inicial</label>
                                            <input type="time" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.hora ?? ''} onChange={e => setEditForm(f => ({ ...f, hora: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hora Final</label>
                                            <input type="time" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.hora_fin ?? ''} onChange={e => setEditForm(f => ({ ...f, hora_fin: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Medio</label>
                                            <select className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.medio ?? ''} onChange={e => setEditForm(f => ({ ...f, medio: e.target.value }))}>
                                                <option value="">Seleccionar...</option>
                                                {['Email', 'Telefónico', 'Presencial', 'Oficio', 'Virtual'].map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Área</label>
                                            <select className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.area_id ?? ''} onChange={e => setEditForm(f => ({ ...f, area_id: e.target.value }))}>
                                                <option value="">Sin cambiar</option>
                                                {areasData.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-full">
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Institución</label>
                                            <input type="text" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.institucion ?? ''} onChange={e => setEditForm(f => ({ ...f, institucion: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Municipio Procedencia</label>
                                            <select className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.municipio_procedencia_id ?? ''} onChange={e => setEditForm(f => ({ ...f, municipio_procedencia_id: e.target.value, municipio_otro: e.target.value === 'otro' ? f.municipio_otro : '' }))}>
                                                <option value="">Seleccionar...</option>
                                                {municipiosData.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                <option value="otro">Otro</option>
                                            </select>
                                        </div>
                                        {editForm.municipio_procedencia_id === 'otro' && (
                                            <div>
                                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Municipio (Otro)</label>
                                                <input type="text" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.municipio_otro ?? ''} onChange={e => setEditForm(f => ({ ...f, municipio_otro: e.target.value }))} />
                                            </div>
                                        )}
                                        <div className="col-span-full">
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Temas Tratados</label>
                                            <textarea rows={3} className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={editForm.temas_tratados ?? ''} onChange={e => setEditForm(f => ({ ...f, temas_tratados: e.target.value }))} />
                                        </div>
                                        <div className="col-span-full">
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Material Entregado</label>
                                            <textarea rows={2} className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={editForm.material_entregado ?? ''} onChange={e => setEditForm(f => ({ ...f, material_entregado: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Asistentes */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Asistentes ({editAsistentes.length})</p>
                                        <button type="button" onClick={() => setEditAsistentes(a => [...a, { identificacion: '', nombre: '', apellido: '', cargo: '', email: '', movil: '' }])} className="flex items-center gap-1 text-xs text-primary hover:text-primary font-semibold border border-primary/30 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors">
                                            <Plus size={12} /> Agregar
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {editAsistentes.length === 0 && <p className="text-zinc-400 text-xs italic py-1">Sin asistentes registrados.</p>}
                                        {editAsistentes.map((a, i) => (
                                            <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200 relative pr-8">
                                                <button type="button" onClick={() => setEditAsistentes(arr => arr.filter((_, j) => j !== i))} className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                                                <input placeholder="Nombre *" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" value={a.nombre} onChange={e => { const arr = [...editAsistentes]; arr[i] = { ...arr[i], nombre: e.target.value }; setEditAsistentes(arr); }} />
                                                <input placeholder="Apellido *" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" value={a.apellido} onChange={e => { const arr = [...editAsistentes]; arr[i] = { ...arr[i], apellido: e.target.value }; setEditAsistentes(arr); }} />
                                                <input placeholder="Cargo *" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" value={a.cargo ?? ''} onChange={e => { const arr = [...editAsistentes]; arr[i] = { ...arr[i], cargo: e.target.value }; setEditAsistentes(arr); }} />
                                                <input placeholder="Identificación" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" value={a.identificacion ?? ''} onChange={e => { const arr = [...editAsistentes]; arr[i] = { ...arr[i], identificacion: e.target.value }; setEditAsistentes(arr); }} />
                                                <input placeholder="Email" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" value={a.email ?? ''} onChange={e => { const arr = [...editAsistentes]; arr[i] = { ...arr[i], email: e.target.value }; setEditAsistentes(arr); }} />
                                                <input placeholder="Móvil" className="border border-zinc-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" value={a.movil ?? ''} onChange={e => { const arr = [...editAsistentes]; arr[i] = { ...arr[i], movil: e.target.value }; setEditAsistentes(arr); }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-2">
                                <button onClick={() => setEditRecord(null)} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer">{isSaving ? 'Guardando...' : 'Guardar'}</button>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    open={!!deleteRecord}
                    danger
                    title="Eliminar Asesoría"
                    message={<p>¿Está seguro que desea eliminar la asesoría <span className="font-mono font-bold text-primary">{deleteRecord?.codigo}</span>? Esta acción no se puede deshacer.</p>}
                    confirmLabel="Eliminar"
                    confirmingLabel="Eliminando..."
                    isLoading={isDeleting}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteRecord(null)}
                />

                <FeedbackModal state={feedbackModal} onClose={() => setFeedbackModal({ type: null, title: '', message: '' })} />
            </main>
        </div>
    );
}
