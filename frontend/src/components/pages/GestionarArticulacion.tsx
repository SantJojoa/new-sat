import { useCallback, useEffect, useState } from 'react';
import { User, RefreshCcw, Calendar, MapPin, Layers, CheckCircle, AlertCircle, Trash2, X } from 'lucide-react';
import SlideBar from '../ui/SlideBar';
import { useAuth } from '../../hooks/useAuth';
import { articulacionesService } from '../../services/articulacionesService';
import FiltersPanel, { type FilterField } from '../ui/FiltersPanel';
import type { ArticulacionRecord, CreateArticulacionPayload } from '../../types/articulaciones';
import RecordsTable, { ViewButton, EditButton, DeleteButton, type TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';

const articulacionColumns: TableColumn<ArticulacionRecord>[] = [
    { header: 'Código', render: r => <span className="font-mono font-bold text-primary text-xs">{r.codigo}</span> },
    { header: 'Tema', render: r => <span className="max-w-[200px] truncate font-medium text-zinc-800 block">{r.tema}</span> },
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
        header: 'Instituciones Convocadas', render: r => r.instituciones_convocadas ? (
            <div className="flex flex-wrap gap-1">
                {r.instituciones_convocadas.split(',').slice(0, 3).map((inst, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">{inst.trim()}</span>
                ))}
                {r.instituciones_convocadas.split(',').length > 3 && (
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium">+{r.instituciones_convocadas.split(',').length - 3} más</span>
                )}
            </div>
        ) : <span className="text-zinc-400 italic text-xs">—</span>
    },
];

export default function GestionarArticulacion() {
    const { user } = useAuth();
    const [records, setRecords] = useState<ArticulacionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
    const [detailRecord, setDetailRecord] = useState<ArticulacionRecord | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<{ type: 'success' | 'error' | null; title: string; message: string }>({ type: null, title: '', message: '' });

    const isAdmin = ['admin_subdireccion', 'superadmin'].includes(user?.user_type?.name || '');
    const isSuperAdmin = user?.user_type?.name === 'superadmin';
    const [editRecord, setEditRecord] = useState<ArticulacionRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<ArticulacionRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editForm, setEditForm] = useState<Partial<CreateArticulacionPayload>>({});
    const [areasData, setAreasData] = useState<{ id: string; name: string }[]>([]);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await articulacionesService.getAll(viewAll);
            setRecords(data);
            setUniqueAreas(Array.from(new Set(data.map(r => r.areas?.name).filter(Boolean))) as string[]);
        } catch (error) {
            console.error('Error fetching articulaciones:', error);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        articulacionesService.getCatalogos().then(data => setAreasData(data.areas)).catch(console.error);
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
        const matchSearch = !term || r.codigo.toLowerCase().includes(term) || r.tema.toLowerCase().includes(term) || r.solicitante?.names?.toLowerCase().includes(term) || false;
        const matchArea = !filterArea || r.areas?.name === filterArea;
        const matchStart = !filterDateStart || new Date(r.fecha_inicio) >= new Date(filterDateStart);
        const matchEnd = !filterDateEnd || new Date(r.fecha_final) <= new Date(filterDateEnd);
        return matchSearch && matchArea && matchStart && matchEnd;
    });

    const filterValues: Record<string, string> = { search: searchTerm, area: filterArea, dateStart: filterDateStart, dateEnd: filterDateEnd };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, tema o solicitante...' },
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

    const handleOpenEdit = (r: ArticulacionRecord) => {
        setEditForm({
            tema: r.tema,
            fecha_inicio: r.fecha_inicio.slice(0, 10),
            fecha_final: r.fecha_final.slice(0, 10),
            jornada: r.jornada,
            instituciones_convocadas: r.instituciones_convocadas ?? '',
            responsable_articulacion: r.responsable_articulacion ?? '',
            transporte_medio: r.transporte_medio ?? '',
            transporte_num_instituciones: r.transporte_num_instituciones,
            area_id: r.area_id,
        });
        setEditRecord(r);
    };

    const handleSave = async () => {
        if (!editRecord) return;
        setIsSaving(true);
        try {
            await articulacionesService.update(editRecord.id, editForm);
            setEditRecord(null);
            setFeedbackModal({ type: 'success', title: '¡Actualizado!', message: 'La articulación fue actualizada exitosamente.' });
            void fetchRecords();
        } catch {
            setFeedbackModal({ type: 'error', title: 'Error', message: 'No se pudo actualizar la articulación.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteRecord) return;
        setIsDeleting(true);
        try {
            await articulacionesService.delete(deleteRecord.id);
            setDeleteRecord(null);
            setFeedbackModal({ type: 'success', title: '¡Eliminado!', message: 'La articulación fue eliminada exitosamente.' });
            void fetchRecords();
        } catch {
            setFeedbackModal({ type: 'error', title: 'Error', message: 'No se pudo eliminar la articulación.' });
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
                            <span className="material-symbols-outlined text-primary text-[32px]">hub</span>
                            Gestionar Articulaciones
                        </h1>
                        <p className="text-zinc-500 mt-2">Listado de articulaciones intersectoriales registradas.</p>
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
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Articulaciones</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{filtered.length}</p>
                        </div>
                    </div>

                    <FiltersPanel values={filterValues} onChange={handleFilterChange} onReset={handleResetFilters} fields={filterFields} />

                    <RecordsTable
                        records={filtered}
                        loading={loading}
                        columns={articulacionColumns}
                        renderActions={r => (
                            <>
                                <ViewButton onClick={() => setDetailRecord(r)} />
                                {isSuperAdmin && (
                                    <>
                                        <EditButton onClick={() => handleOpenEdit(r)} />
                                        <DeleteButton onClick={() => setDeleteRecord(r)} />
                                    </>
                                )}
                            </>
                        )}
                        emptyIcon="hub"
                        emptyMessage="No hay articulaciones para mostrar"
                        emptySubMessage="Registre una nueva articulación o ajuste los filtros."
                    />
                </div>

                {detailRecord && (
                    <DetailModal title="Detalle de Articulación" codigo={detailRecord.codigo} onClose={() => setDetailRecord(null)}>
                        <div className="p-6 space-y-4 text-sm">
                            <DetailGrid>
                                <DetailCard label="Solicitante" icon={<User size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.solicitante?.names}</p>
                                    <p className="text-zinc-500 text-xs">{detailRecord.solicitante?.email}</p>
                                </DetailCard>
                                <DetailCard label="Área" icon={<Layers size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.areas?.name || '—'}</p>
                                </DetailCard>
                                <DetailCard label="Fechas" icon={<Calendar size={10} />}>
                                    <p className="text-zinc-900 font-medium">{new Date(detailRecord.fecha_inicio).toLocaleDateString('es-CO')} → {new Date(detailRecord.fecha_final).toLocaleDateString('es-CO')}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">Jornada: {detailRecord.jornada}</p>
                                </DetailCard>
                                <DetailCard label="Lugar del Evento" icon={<MapPin size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.lugar_evento?.name || '—'}</p>
                                </DetailCard>
                                <DetailCard label="Tema / Actividad" fullWidth>
                                    <p className="text-zinc-800 font-medium">{detailRecord.tema}</p>
                                </DetailCard>
                                {detailRecord.instituciones_convocadas && (
                                    <DetailCard label="Instituciones Convocadas" fullWidth>
                                        <div className="flex flex-wrap gap-1.5">
                                            {detailRecord.instituciones_convocadas.split(',').map((inst, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">{inst.trim()}</span>
                                            ))}
                                        </div>
                                    </DetailCard>
                                )}
                                {detailRecord.responsable_articulacion && (
                                    <DetailCard label="Responsable(s)" fullWidth>
                                        <p className="text-zinc-800">{detailRecord.responsable_articulacion}</p>
                                    </DetailCard>
                                )}
                                {detailRecord.transporte_medio && (
                                    <DetailCard label="Transporte" fullWidth>
                                        <p className="text-zinc-800">{detailRecord.transporte_medio}{detailRecord.transporte_num_instituciones ? ` · ${detailRecord.transporte_num_instituciones} institución(es)` : ''}</p>
                                    </DetailCard>
                                )}
                            </DetailGrid>
                        </div>
                    </DetailModal>
                )}

                {editRecord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900">Editar Articulación</h3>
                                    <p className="text-zinc-500 text-sm">Código: <span className="font-mono font-bold text-primary">{editRecord.codigo}</span></p>
                                </div>
                                <button onClick={() => setEditRecord(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-full">
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tema / Actividad</label>
                                        <input type="text" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.tema ?? ''} onChange={e => setEditForm(f => ({ ...f, tema: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fecha Inicio</label>
                                        <input type="date" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.fecha_inicio ?? ''} onChange={e => setEditForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fecha Final</label>
                                        <input type="date" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.fecha_final ?? ''} onChange={e => setEditForm(f => ({ ...f, fecha_final: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Jornada</label>
                                        <select className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.jornada ?? ''} onChange={e => setEditForm(f => ({ ...f, jornada: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            <option value="Manana">Mañana</option>
                                            <option value="Tarde">Tarde</option>
                                            <option value="Completa">Jornada Completa</option>
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
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Instituciones Convocadas</label>
                                        <input type="text" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.instituciones_convocadas ?? ''} onChange={e => setEditForm(f => ({ ...f, instituciones_convocadas: e.target.value }))} />
                                    </div>
                                    <div className="col-span-full">
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Responsable(s)</label>
                                        <input type="text" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.responsable_articulacion ?? ''} onChange={e => setEditForm(f => ({ ...f, responsable_articulacion: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Transporte</label>
                                        <input type="text" className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.transporte_medio ?? ''} onChange={e => setEditForm(f => ({ ...f, transporte_medio: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">N° Instituc. Transporte</label>
                                        <input type="number" min={0} className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editForm.transporte_num_instituciones ?? ''} onChange={e => setEditForm(f => ({ ...f, transporte_num_instituciones: e.target.value ? parseInt(e.target.value) : undefined }))} />
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

                {deleteRecord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                            <div className="p-6 border-b bg-red-50 border-red-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                                        <Trash2 size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-red-900">Eliminar Articulación</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-zinc-700 text-sm">¿Está seguro que desea eliminar la articulación <span className="font-mono font-bold text-primary">{deleteRecord.codigo}</span>? Esta acción no se puede deshacer.</p>
                            </div>
                            <div className="px-6 pb-6 flex justify-end gap-2">
                                <button onClick={() => setDeleteRecord(null)} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                                <button onClick={handleDelete} disabled={isDeleting} className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer">{isDeleting ? 'Eliminando...' : 'Eliminar'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {feedbackModal.type && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                            <div className={`p-6 border-b ${feedbackModal.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${feedbackModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {feedbackModal.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <h3 className={`text-lg font-bold ${feedbackModal.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>{feedbackModal.title}</h3>
                                </div>
                            </div>
                            <div className="p-6"><p className="text-zinc-700 text-sm">{feedbackModal.message}</p></div>
                            <div className="px-6 pb-6 flex justify-end">
                                <button onClick={() => setFeedbackModal({ type: null, title: '', message: '' })} className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors cursor-pointer">Aceptar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
