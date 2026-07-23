import { User, RefreshCcw, Calendar, MapPin, Layers, X } from 'lucide-react';
import SlideBar from '../ui/SlideBar';
import { useAuth } from '../../hooks/useAuth';
import { articulacionesService } from '../../services/articulacionesService';
import FiltersPanel from '../ui/FiltersPanel';
import type { ArticulacionRecord } from '../../types/articulaciones';
import RecordsTable, { ViewButton, EditButton, DeleteButton, type TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';
import FeedbackModal from '../ui/FeedbackModal';
import ConfirmModal from '../ui/ConfirmModal';
import { useGestionarProgramacion } from '../../hooks/useGestionarProgramacion';

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
    const isSuperAdmin = user?.user_type?.name === 'superadmin';
    const {
        loading, viewAll, setViewAll, fetchRecords, filtered,
        detailRecord, setDetailRecord, feedbackModal, setFeedbackModal,
        editRecord, setEditRecord, deleteRecord, setDeleteRecord,
        isSaving, isDeleting, editForm, setEditForm, areasData,
        filterValues, filterFields, handleFilterChange, handleResetFilters,
        handleOpenEdit, handleSave, handleDelete,
    } = useGestionarProgramacion(articulacionesService, isSuperAdmin);

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
                                <button onClick={() => handleSave('La articulación fue actualizada exitosamente.', 'No se pudo actualizar la articulación.')} disabled={isSaving} className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer">{isSaving ? 'Guardando...' : 'Guardar'}</button>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    open={!!deleteRecord}
                    danger
                    title="Eliminar Articulación"
                    message={<p>¿Está seguro que desea eliminar la articulación <span className="font-mono font-bold text-primary">{deleteRecord?.codigo}</span>? Esta acción no se puede deshacer.</p>}
                    confirmLabel="Eliminar"
                    confirmingLabel="Eliminando..."
                    isLoading={isDeleting}
                    onConfirm={() => handleDelete('La articulación fue eliminada exitosamente.', 'No se pudo eliminar la articulación.')}
                    onCancel={() => setDeleteRecord(null)}
                />

                <FeedbackModal state={feedbackModal} onClose={() => setFeedbackModal({ type: null, title: '', message: '' })} />
            </main>
        </div>
    );
}
