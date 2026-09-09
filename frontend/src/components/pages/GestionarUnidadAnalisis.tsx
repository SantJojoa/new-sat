import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCcw, Calendar, MapPin, Layers, ClipboardList, Upload, FileDown, X } from "lucide-react";
import FiltersPanel, { type FilterField } from '../ui/FiltersPanel';
import RecordsTable, { ViewButton, EditButton, DeleteButton, type TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';
import DocumentosAdicionales from '../ui/DocumentosAdicionales';
import UploadActaModal from '../ui/UploadActaModal';
import ConfirmModal from '../ui/ConfirmModal';
import FeedbackModal, { type FeedbackModalState } from '../ui/FeedbackModal';
import SlideBar from "../ui/SlideBar";
import { useAuth } from "../../hooks/useAuth";
import { unidadAnalisisService } from "../../services/unidadAnalisisService";
import type { SalidaRecord } from "../../types/salidas";

const columns: TableColumn<SalidaRecord>[] = [
    { header: 'Código', render: r => <span className="font-mono font-bold text-primary text-xs">{r.codigo}</span> },
    { header: 'Tema', render: r => <span className="max-w-[180px] truncate font-medium text-zinc-800 block">{r.tema}</span> },
    { header: 'Tipo', render: r => <span className="text-zinc-700 text-xs">{r.tipo_salida}</span> },
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
    { header: 'Solicitante', render: r => <span className="text-zinc-600 text-xs">{r.solicitante?.names || '—'}</span> },
    {
        header: 'Seguimiento', render: r => {
            const seg = r.seguimiento_articulacion_iv;
            if (!seg) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-zinc-100 text-zinc-500 border-zinc-200">
                        Pendiente
                    </span>
                );
            }
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${seg.se_realizo_vsp ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {seg.se_realizo_vsp ? 'Realizada' : 'No realizada'}
                </span>
            );
        }
    },
];

interface SeguimientoModalProps {
    record: SalidaRecord;
    onClose: () => void;
    onSaved: () => void;
}

function SeguimientoModal({ record, onClose, onSaved }: SeguimientoModalProps) {
    const existing = record.seguimiento_articulacion_iv;

    const [seRealizoVsp, setSeRealizoVsp] = useState<string>(
        existing != null ? (existing.se_realizo_vsp ? 'true' : 'false') : ''
    );
    const [observaciones, setObservaciones] = useState(existing?.observaciones ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await unidadAnalisisService.setSeguimiento(record.id, {
                se_realizo_vsp: seRealizoVsp === 'true',
                observaciones: observaciones || undefined,
            });
            onSaved();
            onClose();
        } catch {
            setError('Error al guardar el seguimiento');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-black text-zinc-900">Seguimiento Unidad de Análisis</h3>
                        <p className="text-zinc-500 text-sm">Codigo: <span className="font-mono font-bold text-primary">{record.codigo}</span></p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form id="seguimiento-unidad-analisis-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            ¿Se realizó? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-6 mt-1">
                            {[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }].map(opt => (
                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="se_realizo_vsp"
                                        value={opt.value}
                                        checked={seRealizoVsp === opt.value}
                                        onChange={e => setSeRealizoVsp(e.target.value)}
                                        required
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-zinc-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                            Observaciones
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            placeholder="Observaciones del seguimiento..."
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm resize-none"
                        />
                        <p className="text-zinc-400 text-xs mt-1 text-right">{observaciones.length}/2000</p>
                    </div>
                </form>
                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="seguimiento-unidad-analisis-form"
                        disabled={saving}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <RefreshCcw size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                        {saving ? 'Guardando...' : 'Guardar Seguimiento'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GestionarUnidadAnalisis() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [records, setRecords] = useState<SalidaRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterSubdireccion, setFilterSubdireccion] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [uniqueSubdirecciones, setUniqueSubdirecciones] = useState<string[]>([]);
    const [uniqueMunicipios, setUniqueMunicipios] = useState<string[]>([]);
    const [detailRecord, setDetailRecord] = useState<SalidaRecord | null>(null);
    const [seguimientoRecord, setSeguimientoRecord] = useState<SalidaRecord | null>(null);
    const [uploadActaRecord, setUploadActaRecord] = useState<SalidaRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<SalidaRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({ type: null, title: '', message: '' });

    const isSuperAdmin = user?.user_type?.name === 'superadmin';
    const isAdminSubdireccion = user?.user_type?.name === 'admin_subdireccion';

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await unidadAnalisisService.getAll(viewAll);
            setRecords(data);
            setUniqueSubdirecciones(Array.from(new Set(data.map(r => r.areas?.subdirecciones?.name).filter(Boolean))) as string[]);
            setUniqueMunicipios(Array.from(new Set(data.map(r => r.lugar_evento?.name).filter(Boolean))) as string[]);
        } catch (err) {
            console.error('Error fetching records:', err);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDetailRecord(null); setDeleteRecord(null); } };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleResetFilters = () => {
        setSearchTerm(''); setFilterArea(''); setFilterSubdireccion('');
        setFilterMunicipio(''); setFilterDateStart(''); setFilterDateEnd('');
    };

    const handleUploadActa = async (file: File, seRealizo: boolean) => {
        if (!uploadActaRecord) return;
        await unidadAnalisisService.uploadActaSeguimiento(uploadActaRecord.id, file, seRealizo);
        await fetchRecords();
    };

    const handleDownloadArchivo = async (record: SalidaRecord) => {
        setDownloadingId(record.id);
        try {
            await unidadAnalisisService.downloadActaArchivoSeguimiento(record.id, record.codigo);
        } catch { alert('Error al descargar el acta escaneada'); }
        finally { setDownloadingId(null); }
    };

    const handleDelete = async () => {
        if (!deleteRecord) return;
        setIsDeleting(true);
        try {
            await unidadAnalisisService.delete(deleteRecord.id);
            setDeleteRecord(null);
            setFeedbackModal({ type: 'success', title: '¡Eliminado!', message: 'El registro fue eliminado correctamente.' });
            void fetchRecords();
        } catch {
            setFeedbackModal({ type: 'error', title: 'Error', message: 'No se pudo eliminar el registro.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const canManage = (r: SalidaRecord) => isSuperAdmin || isAdminSubdireccion || r.solicitante_id === user?.id;

    const areaOptionsForFilter = filterSubdireccion
        ? Array.from(new Set(records.filter(r => r.areas?.subdirecciones?.name === filterSubdireccion).map(r => r.areas?.name).filter(Boolean))) as string[]
        : [];

    const filterValues: Record<string, string> = { search: searchTerm, area: filterArea, subdireccion: filterSubdireccion, municipio: filterMunicipio, dateStart: filterDateStart, dateEnd: filterDateEnd };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, tema o solicitante...' },
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'subdireccion', emptyLabel: 'Todas las Subdirecciones', options: uniqueSubdirecciones }] : []),
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'area', emptyLabel: 'Todas las Áreas', options: areaOptionsForFilter, disabled: !filterSubdireccion, disabledTitle: 'Seleccione primero una subdirección' }] : []),
        { type: 'select', key: 'municipio', emptyLabel: 'Todos los Municipios', options: uniqueMunicipios, icon: 'pin' },
        { type: 'date', key: 'dateStart', title: 'Fecha Inicio' },
        { type: 'date', key: 'dateEnd', title: 'Fecha Final' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'search') setSearchTerm(value);
        else if (key === 'area') setFilterArea(value);
        else if (key === 'subdireccion') { setFilterSubdireccion(value); setFilterArea(''); }
        else if (key === 'municipio') setFilterMunicipio(value);
        else if (key === 'dateStart') setFilterDateStart(value);
        else if (key === 'dateEnd') setFilterDateEnd(value);
    };

    const displayRecords = records.filter(r => {
        const term = searchTerm.toLowerCase();
        const matchSearch = !term || r.codigo.toLowerCase().includes(term) || r.tema?.toLowerCase().includes(term) || (r.solicitante?.names?.toLowerCase().includes(term) ?? false);
        const matchArea = !filterArea || r.areas?.name === filterArea;
        const matchSubdireccion = !filterSubdireccion || r.areas?.subdirecciones?.name === filterSubdireccion;
        const matchMunicipio = !filterMunicipio || r.lugar_evento?.name === filterMunicipio;
        const salidaStart = new Date(r.fecha_inicio).toISOString().split('T')[0];
        const salidaEnd = new Date(r.fecha_final).toISOString().split('T')[0];
        const matchStart = !filterDateStart || salidaStart >= filterDateStart;
        const matchEnd = !filterDateEnd || salidaEnd <= filterDateEnd;
        return matchSearch && matchArea && matchSubdireccion && matchMunicipio && matchStart && matchEnd;
    });

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            {seguimientoRecord && (
                <SeguimientoModal
                    record={seguimientoRecord}
                    onClose={() => setSeguimientoRecord(null)}
                    onSaved={fetchRecords}
                />
            )}
            {uploadActaRecord && (
                <UploadActaModal
                    title="Subir Acta Escaneada"
                    codigo={uploadActaRecord.codigo}
                    onClose={() => setUploadActaRecord(null)}
                    onSubmit={handleUploadActa}
                />
            )}
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[32px]">analytics</span>
                            IV - Unidad de Análisis
                        </h1>
                        <p className="text-zinc-500 mt-2">Gestión y seguimiento de los registros de Unidad de Análisis</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {(isSuperAdmin || isAdminSubdireccion) && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    <Layers size={16} />
                                    {viewAll ? 'Ver solo mis registros' : 'Ver todos los registros'}
                                </button>
                            )}
                            <button onClick={fetchRecords} className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50 flex items-center gap-2">
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                Actualizar
                            </button>
                        </div>
                    </div>

                    <FiltersPanel values={filterValues} onChange={handleFilterChange} onReset={handleResetFilters} fields={filterFields} />

                    <RecordsTable
                        records={displayRecords}
                        loading={loading}
                        columns={columns}
                        renderActions={r => (
                            <>
                                <button
                                    onClick={() => setSeguimientoRecord(r)}
                                    title="Registrar seguimiento"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                    <ClipboardList size={16} />
                                </button>
                                <button
                                    onClick={() => setUploadActaRecord(r)}
                                    title="Subir acta escaneada (PDF)"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                >
                                    <Upload size={16} />
                                </button>
                                {r.seguimiento_articulacion_iv?.archivo_manual_nombre && (
                                    <button
                                        onClick={() => handleDownloadArchivo(r)}
                                        disabled={downloadingId === r.id}
                                        title="Descargar acta escaneada"
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                                    >
                                        {downloadingId === r.id ? <RefreshCcw size={16} className="animate-spin" /> : <FileDown size={16} />}
                                    </button>
                                )}
                                <ViewButton onClick={() => setDetailRecord(r)} />
                                {canManage(r) && <EditButton onClick={() => navigate(`/gestionar-unidad-analisis/editar/${r.id}`)} />}
                                {canManage(r) && <DeleteButton onClick={() => setDeleteRecord(r)} />}
                            </>
                        )}
                        emptyIcon="analytics"
                        emptyMessage="No hay registros de Unidad de Análisis"
                        emptySubMessage="Registre una nueva actividad desde 'IV - Unidad de Análisis' o ajuste los filtros."
                    />
                </div>

                {detailRecord && (
                    <DetailModal title="Detalle Unidad de Análisis" codigo={detailRecord.codigo} onClose={() => setDetailRecord(null)}>
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
                                {detailRecord.transporte_medio && (
                                    <DetailCard label="Transporte" fullWidth>
                                        <p className="text-zinc-800">{detailRecord.transporte_medio}{detailRecord.transporte_responsables ? ` · ${detailRecord.transporte_responsables}` : ''}</p>
                                    </DetailCard>
                                )}
                            </DetailGrid>

                            <div className="border-t border-zinc-200 pt-4">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                    <ClipboardList size={13} />
                                    Seguimiento
                                </h4>
                                {detailRecord.seguimiento_articulacion_iv ? (
                                    <DetailGrid>
                                        <DetailCard label="¿Se realizó?">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${detailRecord.seguimiento_articulacion_iv.se_realizo_vsp ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {detailRecord.seguimiento_articulacion_iv.se_realizo_vsp ? 'Sí' : 'No'}
                                            </span>
                                        </DetailCard>
                                        {detailRecord.seguimiento_articulacion_iv.observaciones && (
                                            <DetailCard label="Observaciones" fullWidth>
                                                <p className="text-zinc-800">{detailRecord.seguimiento_articulacion_iv.observaciones}</p>
                                            </DetailCard>
                                        )}
                                    </DetailGrid>
                                ) : (
                                    <p className="text-zinc-400 text-xs italic">Sin seguimiento registrado aún.</p>
                                )}
                                {detailRecord.seguimiento_articulacion_iv?.archivo_manual_nombre && (
                                    <p className="text-zinc-500 text-xs italic mt-2">Acta escaneada subida: <span className="font-medium text-zinc-700">{detailRecord.seguimiento_articulacion_iv.archivo_manual_nombre}</span></p>
                                )}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => { setDetailRecord(null); setSeguimientoRecord(detailRecord); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <ClipboardList size={14} />
                                        {detailRecord.seguimiento_articulacion_iv ? 'Editar Seguimiento' : 'Registrar Seguimiento'}
                                    </button>
                                    <button
                                        onClick={() => setUploadActaRecord(detailRecord)}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Upload size={14} />
                                        Subir Acta Escaneada
                                    </button>
                                    {detailRecord.seguimiento_articulacion_iv?.archivo_manual_nombre && (
                                        <button
                                            onClick={() => handleDownloadArchivo(detailRecord)}
                                            disabled={downloadingId === detailRecord.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {downloadingId === detailRecord.id ? <RefreshCcw size={14} className="animate-spin" /> : <FileDown size={14} />}
                                            {downloadingId === detailRecord.id ? 'Descargando...' : 'Descargar Acta Escaneada'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <DocumentosAdicionales basePath={`/unidad-analisis/${detailRecord.id}`} />
                        </div>
                    </DetailModal>
                )}

                <ConfirmModal
                    open={!!deleteRecord}
                    title="Eliminar Registro"
                    message={<p>¿Está seguro que desea eliminar el registro <span className="font-mono font-bold text-primary">{deleteRecord?.codigo}</span>? Esta acción no se puede deshacer.</p>}
                    confirmLabel="Eliminar"
                    confirmingLabel="Eliminando..."
                    danger
                    isLoading={isDeleting}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteRecord(null)}
                />

                <FeedbackModal state={feedbackModal} onClose={() => setFeedbackModal({ type: null, title: '', message: '' })} />
            </main>
        </div>
    );
}
