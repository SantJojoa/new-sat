import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { salidasService } from '../../services/salidasService';
import SlideBar from '../ui/SlideBar';
import { Search, CheckCircle, XCircle, AlertCircle, MapPin, Layers, Edit2, Trash2, RefreshCcw, Calendar, CheckSquare, Users, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { ApiErrorPayload } from '../../types/api';
import type { BulkActionResult, SalidaRecord } from '../../types/salidas';
import { solicitudesUnionService, type SolicitudUnion } from '../../services/solicitudesUnionService';

export default function GestionarSalida() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [salidas, setSalidas] = useState<SalidaRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterSubdireccion, setFilterSubdireccion] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterSubtipo, setFilterSubtipo] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');

    const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
    const [uniqueSubdirecciones, setUniqueSubdirecciones] = useState<string[]>([]);
    const [uniqueTipos, setUniqueTipos] = useState<string[]>([]);
    const [uniqueSubtipos, setUniqueSubtipos] = useState<string[]>([]);
    const [uniqueMunicipios, setUniqueMunicipios] = useState<string[]>([]);

    // Action Modals
    const [actionModal, setActionModal] = useState<{
        type: 'approve' | 'reject' | 'delete' | null;
        salidaId: string | null;
    }>({ type: null, salidaId: null });

    const [detailsModal, setDetailsModal] = useState<{
        isOpen: boolean;
        salida: SalidaRecord | null;
    }>({ isOpen: false, salida: null });

    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkModal, setBulkModal] = useState<{
        type: 'approve' | 'reject' | null;
    }>({ type: null });
    const [bulkComment, setBulkComment] = useState('');
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

    // Feedback modal state (replaces alerts)
    const [feedbackModal, setFeedbackModal] = useState<{
        type: 'success' | 'error' | null;
        title: string;
        message: string;
    }>({ type: null, title: '', message: '' });

    // Join requests state
    const [joinRequests, setJoinRequests] = useState<SolicitudUnion[]>([]);
    const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
    const [joinResolveModal, setJoinResolveModal] = useState<{ type: 'accept' | 'reject' | null; solicitudId: string | null }>({ type: null, solicitudId: null });
    const [joinResolveComment, setJoinResolveComment] = useState('');
    const [joinResolveSubmitting, setJoinResolveSubmitting] = useState(false);
    const [joinRequestsTab, setJoinRequestsTab] = useState(false);

    const isAdmin = ['admin_subdireccion', 'superadmin'].includes(user?.user_type?.name || '');

    const fetchJoinRequests = useCallback(async () => {
        if (!isAdmin) return;
        setJoinRequestsLoading(true);
        try {
            const data = await solicitudesUnionService.getAll();
            setJoinRequests(data);
        } catch (error) {
            console.error('Error fetching join requests:', error);
        } finally {
            setJoinRequestsLoading(false);
        }
    }, [isAdmin]);

    const handleJoinResolve = async () => {
        if (!joinResolveModal.solicitudId || !joinResolveModal.type) return;
        setJoinResolveSubmitting(true);
        try {
            if (joinResolveModal.type === 'accept') {
                await solicitudesUnionService.accept(joinResolveModal.solicitudId, joinResolveComment);
                setFeedbackModal({ type: 'success', title: '¡Aceptada!', message: 'La solicitud de unión fue aceptada.' });
            } else {
                await solicitudesUnionService.reject(joinResolveModal.solicitudId, joinResolveComment);
                setFeedbackModal({ type: 'success', title: 'Rechazada', message: 'La solicitud de unión fue rechazada.' });
            }
            setJoinResolveModal({ type: null, solicitudId: null });
            setJoinResolveComment('');
            fetchJoinRequests();
        } catch (error) {
            const apiError = error as AxiosError<ApiErrorPayload>;
            setFeedbackModal({ type: 'error', title: 'Error', message: typeof apiError.response?.data?.message === 'string' ? apiError.response.data.message : 'Error al procesar' });
        } finally {
            setJoinResolveSubmitting(false);
        }
    };

    const hasApprovePermission = user?.user_type?.permissions?.some(
        p => p.modules.name === 'gestionar_salida' && p.can_approve
    ) || ['superadmin', 'admin_subdireccion'].includes(user?.user_type?.name || '');

    const canBulkSelect = (salida: SalidaRecord) => {
        // Cannot select already approved or rejected salidas
        if (salida.estado === 'aprobada' || salida.estado === 'rechazada') return false;
        // Must belong to user's area/subdirección (reuse checkOwnership)
        return checkOwnership(salida);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const selectableIds = filteredSalidas.filter(canBulkSelect).map(s => s.id);
        const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id));
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(selectableIds));
        }
    };

    const handleBulkAction = async () => {
        if (!bulkModal.type || selectedIds.size === 0) return;
        setIsBulkSubmitting(true);
        try {
            const ids = Array.from(selectedIds);
            let result: BulkActionResult;
            if (bulkModal.type === 'approve') {
                result = await salidasService.bulkApproveSalidas(ids, bulkComment);
            } else {
                result = await salidasService.bulkRejectSalidas(ids, bulkComment);
            }

            const successCount = result.aprobadas?.length || result.rechazadas?.length || 0;
            const errorCount = result.errores?.length || 0;

            let msg = bulkModal.type === 'approve'
                ? `${successCount} salida(s) aprobada(s) exitosamente.`
                : `${successCount} salida(s) rechazada(s) exitosamente.`;
            if (errorCount > 0) {
                msg += `\n${errorCount} no se pudieron procesar.`;
            }
            setFeedbackModal({ type: 'success', title: 'Acción Masiva Completada', message: msg });

            setBulkModal({ type: null });
            setBulkComment('');
            setSelectedIds(new Set());
            fetchSalidas();
        } catch (error) {
            const apiError = error as AxiosError<ApiErrorPayload>;
            console.error('Error bulk action:', error);
            setFeedbackModal({ type: 'error', title: 'Error', message: typeof apiError.response?.data?.message === 'string' ? apiError.response.data.message : 'Error al procesar' });
        } finally {
            setIsBulkSubmitting(false);
        }
    };

    const fetchSalidas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await salidasService.getSalidas(viewAll);
            setSalidas(data);

            // Extract unique values for filters
            const areas = Array.from(new Set(data.map((s) => s.areas?.name).filter(Boolean))) as string[];
            const subdirecciones = Array.from(new Set(data.map((s) => s.areas?.subdirecciones?.name).filter(Boolean))) as string[];
            const tipos = Array.from(new Set(data.map((s) => s.tipo_salida).filter(Boolean))) as string[];
            const subtipos = Array.from(new Set(data.map((s) => s.subtipo_salida).filter(Boolean))) as string[];
            const municipios = Array.from(new Set(data.map((s) => s.lugar_evento?.name).filter(Boolean))) as string[];

            setUniqueAreas(areas);
            setUniqueSubdirecciones(subdirecciones);
            setUniqueTipos(tipos);
            setUniqueSubtipos(subtipos);
            setUniqueMunicipios(municipios);
        } catch (error) {
            console.error('Error fetching salidas:', error);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => {
        void fetchSalidas();
    }, [fetchSalidas]);

    useEffect(() => {
        void fetchJoinRequests();
    }, [fetchJoinRequests]);

    // Close modals on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (feedbackModal.type) setFeedbackModal({ type: null, title: '', message: '' });
                else if (joinResolveModal.type) { setJoinResolveModal({ type: null, solicitudId: null }); setJoinResolveComment(''); }
                else if (bulkModal.type) setBulkModal({ type: null });
                else if (actionModal.type) { setActionModal({ type: null, salidaId: null }); setComment(''); }
                else if (detailsModal.isOpen) setDetailsModal({ isOpen: false, salida: null });
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [feedbackModal.type, bulkModal.type, actionModal.type, detailsModal.isOpen, joinResolveModal.type]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterArea('');
        setFilterSubdireccion('');
        setFilterTipo('');
        setFilterSubtipo('');
        setFilterDateStart('');
        setFilterDateEnd('');
        setFilterMunicipio('');
    };

    const handleAction = async () => {
        if (!actionModal.salidaId || !actionModal.type) return;

        setIsSubmitting(true);
        try {
            if (actionModal.type === 'approve') {
                await salidasService.approveSalida(actionModal.salidaId, comment);
            } else if (actionModal.type === 'reject') {
                await salidasService.rejectSalida(actionModal.salidaId, comment);
            } else if (actionModal.type === 'delete') {
                await salidasService.deleteSalida(actionModal.salidaId);
            }
            // Success
            const actionText = {
                approve: 'aprobada',
                reject: 'rechazada',
                delete: 'eliminada'
            }[actionModal.type];

            setFeedbackModal({ type: 'success', title: '¡Éxito!', message: `Salida ${actionText} exitosamente.` });
            setActionModal({ type: null, salidaId: null });
            setComment('');
            fetchSalidas();
        } catch (error) {
            const apiError = error as AxiosError<ApiErrorPayload>;
            console.error('Error processing action:', error);
            setFeedbackModal({ type: 'error', title: 'Error', message: typeof apiError.response?.data?.message === 'string' ? apiError.response.data.message : 'Error al procesar la solicitud' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkOwnership = (salida: SalidaRecord) => {
        if (user?.user_type?.name === 'superadmin') return true;

        if (user?.user_type?.name === 'admin_subdireccion') {
            const userSubdireccionId = user.subdireccion_id;
            const salidaSubdireccionId = salida.areas?.subdirecciones?.id;
            if (userSubdireccionId && salidaSubdireccionId) {
                return userSubdireccionId === salidaSubdireccionId;
            }
            if (user.area_id && salida.areas?.id) {
                return user.area_id === salida.areas.id;
            }
            return false;
        }

        if (user?.area_id && salida.areas?.id) {
            return user.area_id === salida.areas.id;
        }
        if (user?.area_id && salida.areas?.id && user.area_id !== salida.areas.id) return false;

        return true;
    };

    const canApprove = (salida: SalidaRecord) => {
        if (!checkOwnership(salida)) return false;
        const isSuperAdmin = user?.user_type?.name === 'superadmin';
        const hasPerm = user?.user_type?.permissions?.some(p => p.modules.name === 'gestionar_salida' && p.can_approve);

        if (!hasPerm) return false;

        // If superadmin, can manage even if approved (to reject it)
        if (isSuperAdmin) return true;

        // Normal admin: only pending
        return salida.estado !== 'aprobada' && salida.estado !== 'rechazada';
    };

    const canEdit = (salida: SalidaRecord) => {
        if (!checkOwnership(salida)) return false;
        const hasPerm = user?.user_type?.permissions?.some(p => p.modules.name === 'gestionar_salida' && p.can_edit);
        // Edit usually restricted to pending for data integrity
        return hasPerm && salida.estado === 'pendiente';
    };

    const canDelete = (salida: SalidaRecord) => {
        if (!checkOwnership(salida)) return false;
        const isSuperAdmin = user?.user_type?.name === 'superadmin';
        const hasPerm = user?.user_type?.permissions?.some(p => p.modules.name === 'gestionar_salida' && p.can_delete);

        if (!hasPerm) return false;
        return isSuperAdmin || salida.estado === 'pendiente';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aprobada':
                return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200"><CheckCircle size={12} /> Aprobada</span>;
            case 'rechazada':
                return <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200"><XCircle size={12} /> Rechazada</span>;
            case 'pendiente':
                return <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-yellow-200"><AlertCircle size={12} /> Pendiente</span>;
            default:
                return <span className="bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full text-xs font-medium border border-zinc-200">{status}</span>;
        }
    };

    const filteredSalidas = salidas.filter(s => {
        const matchesSearch = s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.solicitante.names.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesArea = filterArea ? s.areas?.name === filterArea : true;
        const matchesSubdireccion = filterSubdireccion ? s.areas?.subdirecciones?.name === filterSubdireccion : true;
        const matchesTipo = filterTipo ? s.tipo_salida === filterTipo : true;
        const matchesSubtipo = filterSubtipo ? s.subtipo_salida === filterSubtipo : true;

        const matchesMunicipio = filterMunicipio ? s.lugar_evento?.name === filterMunicipio : true;

        const salidaStartDate = new Date(s.fecha_inicio).toISOString().split('T')[0];
        const salidaEndDate = new Date(s.fecha_final).toISOString().split('T')[0];
        const matchesStartDate = filterDateStart ? salidaStartDate >= filterDateStart : true;
        const matchesEndDate = filterDateEnd ? salidaEndDate <= filterDateEnd : true;
        const matchesDate = matchesStartDate && matchesEndDate;

        return matchesSearch && matchesArea && matchesSubdireccion && matchesTipo && matchesSubtipo && matchesMunicipio && matchesDate;
    });

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Gestionar Programaciones</h1>
                        <p className="text-zinc-500 mt-2">Revise, edite y gestione las solicitudes de programaciones.</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => setViewAll(!viewAll)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'
                                    }`}
                            >
                                <RefreshCcw size={16} className={loading && viewAll ? "animate-spin" : ""} />
                                {viewAll ? 'Viendo Todas las Áreas' : 'Ver Todas las Áreas'}
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setJoinRequestsTab(!joinRequestsTab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 relative ${joinRequestsTab
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'
                                        }`}
                                >
                                    <Bell size={16} />
                                    Solicitudes de Unión
                                    {joinRequests.filter(r => r.estado === 'pendiente').length > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {joinRequests.filter(r => r.estado === 'pendiente').length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
                        {/* Filters Header */}
                        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                                    <Search size={16} /> Filtros de Búsqueda
                                </h3>
                                {(searchTerm || filterArea || filterSubdireccion || filterTipo || filterSubtipo || filterMunicipio || filterDateStart || filterDateEnd) && (
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
                                        placeholder="Código o solicitante..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterArea}
                                        onChange={(e) => setFilterArea(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todas las Áreas</option>
                                        {uniqueAreas.map(area => (
                                            <option key={area} value={area}>{area}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterSubdireccion}
                                        onChange={(e) => setFilterSubdireccion(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todas las Subdirecciones</option>
                                        {uniqueSubdirecciones.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterTipo}
                                        onChange={(e) => setFilterTipo(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todos los Tipos</option>
                                        {uniqueTipos.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterSubtipo}
                                        onChange={(e) => setFilterSubtipo(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todos los Subtipos</option>
                                        {uniqueSubtipos.map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <select
                                        value={filterMunicipio}
                                        onChange={(e) => setFilterMunicipio(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todos los Municipios</option>
                                        {uniqueMunicipios.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-2 w-full pl-3 pr-4 py-2 rounded-lg border border-zinc-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white">
                                        <Calendar size={16} className="text-zinc-400" />
                                        <input
                                            type="date"
                                            value={filterDateStart}
                                            onChange={(e) => setFilterDateStart(e.target.value)}
                                            className="w-full outline-none text-sm bg-transparent"
                                            title="Filtrar por Fecha Inicio"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 text-zinc-500 font-semibold text-sm uppercase tracking-wider">
                                    <tr>
                                        {hasApprovePermission && (
                                            <th className="px-4 py-4 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={(() => {
                                                        const selectableIds = filteredSalidas.filter(canBulkSelect).map(s => s.id);
                                                        return selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id));
                                                    })()}
                                                    onChange={toggleSelectAll}
                                                    disabled={filteredSalidas.filter(canBulkSelect).length === 0}
                                                    className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title="Seleccionar todas las pendientes de mi área"
                                                />
                                            </th>
                                        )}
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Solicitante</th>
                                        <th className="px-6 py-4">Detalles</th>
                                        <th className="px-6 py-4">Fecha / Jornada</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {loading ? (
                                        <tr><td colSpan={hasApprovePermission ? 7 : 6} className="px-6 py-8 text-center text-zinc-500">Cargando solicitudes...</td></tr>
                                    ) : filteredSalidas.length === 0 ? (
                                        <tr><td colSpan={hasApprovePermission ? 7 : 6} className="px-6 py-8 text-center text-zinc-500">No hay solicitudes encontradas</td></tr>
                                    ) : (
                                        filteredSalidas.map((salida) => (
                                            <tr key={salida.id} className={`hover:bg-zinc-50 transition-colors text-sm ${selectedIds.has(salida.id) ? 'bg-primary/5' : ''}`}>
                                                {hasApprovePermission && (
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(salida.id)}
                                                            onChange={() => toggleSelect(salida.id)}
                                                            disabled={!canBulkSelect(salida)}
                                                            className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={!canBulkSelect(salida) ? (salida.estado !== 'pendiente' ? 'No se puede seleccionar (ya procesada)' : 'No pertenece a su área') : ''}
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 font-medium text-zinc-900">{salida.codigo}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-zinc-900">{salida.solicitante.names}</div>
                                                    <div className="text-zinc-500 text-xs">{salida.areas?.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600">
                                                    <div className="font-medium">{salida.tipo_salida}</div>
                                                    <div className="text-xs text-zinc-500 truncate max-w-[200px] flex items-center gap-1">
                                                        <MapPin size={10} />
                                                        {salida.lugar_evento?.name || 'Varios / No especificado'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600">
                                                    <div>{new Date(salida.fecha_inicio).toLocaleDateString()}</div>
                                                    <div className="text-xs text-zinc-500">{salida.jornada}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(salida.estado)}
                                                </td>
                                                <td className="px-6 py-4 flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setDetailsModal({ isOpen: true, salida })}
                                                        className="px-3 py-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg text-xs font-semibold transition-colors border border-zinc-200 flex items-center gap-1"
                                                        title="Ver Detalles"
                                                    >
                                                        <Search size={12} /> Ver
                                                    </button>
                                                    {canEdit(salida) && (
                                                        <button
                                                            onClick={() => navigate(`/gestionar-salida/editar/${salida.id}`)}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors border border-blue-200 flex items-center gap-1"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={12} /> Editar
                                                        </button>
                                                    )}
                                                    {canDelete(salida) && (
                                                        <button
                                                            onClick={() => setActionModal({ type: 'delete', salidaId: salida.id })}
                                                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors border border-red-200 flex items-center gap-1"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                    {canApprove(salida) && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setComment('');
                                                                    setActionModal({ type: 'approve', salidaId: salida.id });
                                                                }}
                                                                disabled={salida.estado === 'aprobada'}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-1 ${salida.estado === 'aprobada'
                                                                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                                                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                                                                    }`}
                                                            >
                                                                Aprobar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setComment('');
                                                                    setActionModal({ type: 'reject', salidaId: salida.id });
                                                                }}
                                                                disabled={salida.estado === 'rechazada'}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-1 ${salida.estado === 'rechazada'
                                                                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                                                                    : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                                                                    }`}
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Join Requests Panel */}
                {isAdmin && joinRequestsTab && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mt-6">
                        <div className="p-5 border-b border-zinc-200 bg-blue-50/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900">Solicitudes de Unión</h3>
                                    <p className="text-zinc-500 text-sm">Solicitudes de otras áreas para unirse a programaciones de tu subdirección</p>
                                </div>
                            </div>
                            <button onClick={fetchJoinRequests} className="text-zinc-500 hover:text-zinc-700 p-2 rounded-lg hover:bg-zinc-100 transition-colors" title="Actualizar">
                                <RefreshCcw size={16} className={joinRequestsLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Solicitante / Área</th>
                                        <th className="px-6 py-3">Programación</th>
                                        <th className="px-6 py-3">Fecha / Jornada</th>
                                        <th className="px-6 py-3 max-w-xs">Mensaje</th>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3">Fecha Solicitud</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {joinRequestsLoading ? (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Cargando solicitudes...</td></tr>
                                    ) : joinRequests.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-zinc-400 italic">No hay solicitudes de unión</td></tr>
                                    ) : joinRequests.map((req) => (
                                        <tr key={req.id} className={`hover:bg-zinc-50 transition-colors text-sm ${req.estado === 'pendiente' ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-zinc-900">{req.solicitante.names} {req.solicitante.last_name}</div>
                                                <div className="text-zinc-500 text-xs">{req.area_solicitante.name}</div>
                                                <div className="text-zinc-400 text-xs">{req.solicitante.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono font-bold text-zinc-900 text-xs">{req.salida.codigo}</div>
                                                <div className="text-zinc-600 text-xs font-medium truncate max-w-[180px]">{req.salida.tema}</div>
                                                <div className="text-zinc-400 text-xs">{req.salida.tipo_salida}</div>
                                                <div className="text-zinc-400 text-xs">{req.salida.areas.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 text-xs">
                                                <div>{new Date(req.salida.fecha_inicio).toLocaleDateString('es-CO')}</div>
                                                <div className="text-zinc-400">{new Date(req.salida.fecha_final).toLocaleDateString('es-CO')}</div>
                                                <div className="text-zinc-500">{req.salida.jornada}</div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-zinc-600 text-xs italic line-clamp-3">{req.mensaje || <span className="text-zinc-400">Sin mensaje</span>}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.estado === 'pendiente' && (
                                                    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-yellow-200">
                                                        <AlertCircle size={11} /> Pendiente
                                                    </span>
                                                )}
                                                {req.estado === 'aceptada' && (
                                                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200">
                                                        <CheckCircle size={11} /> Aceptada
                                                    </span>
                                                )}
                                                {req.estado === 'rechazada' && (
                                                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200">
                                                        <XCircle size={11} /> Rechazada
                                                    </span>
                                                )}
                                                {req.respuesta && (
                                                    <p className="text-zinc-500 text-xs mt-1 italic line-clamp-2">{req.respuesta}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 text-xs">
                                                {new Date(req.created_at).toLocaleDateString('es-CO')}
                                                <div className="text-zinc-400">{new Date(req.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.estado === 'pendiente' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => { setJoinResolveComment(''); setJoinResolveModal({ type: 'accept', solicitudId: req.id }); }}
                                                            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors border border-green-200 flex items-center gap-1"
                                                        >
                                                            <CheckCircle size={12} /> Aceptar
                                                        </button>
                                                        <button
                                                            onClick={() => { setJoinResolveComment(''); setJoinResolveModal({ type: 'reject', solicitudId: req.id }); }}
                                                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors border border-red-200 flex items-center gap-1"
                                                        >
                                                            <XCircle size={12} /> Rechazar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-400 text-xs italic">Procesada</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Join Resolve Modal */}
                {joinResolveModal.type && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) { setJoinResolveModal({ type: null, solicitudId: null }); setJoinResolveComment(''); } }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden">
                            <div className={`p-6 border-b ${joinResolveModal.type === 'accept' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${joinResolveModal.type === 'accept' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {joinResolveModal.type === 'accept' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-bold ${joinResolveModal.type === 'accept' ? 'text-green-900' : 'text-red-900'}`}>
                                            {joinResolveModal.type === 'accept' ? 'Aceptar Solicitud de Unión' : 'Rechazar Solicitud de Unión'}
                                        </h3>
                                        <p className={`text-sm ${joinResolveModal.type === 'accept' ? 'text-green-700' : 'text-red-700'}`}>
                                            {joinResolveModal.type === 'accept' ? 'Puede añadir una observación opcional.' : 'Indique el motivo del rechazo.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <textarea
                                    className="w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none text-sm"
                                    rows={3}
                                    placeholder={joinResolveModal.type === 'accept' ? 'Observación opcional...' : 'Motivo del rechazo (opcional)...'}
                                    value={joinResolveComment}
                                    onChange={(e) => setJoinResolveComment(e.target.value)}
                                />
                            </div>
                            <div className="p-4 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50">
                                <button
                                    onClick={() => { setJoinResolveModal({ type: null, solicitudId: null }); setJoinResolveComment(''); }}
                                    className="px-4 py-2 text-zinc-700 font-medium hover:bg-zinc-200 rounded-lg transition-colors text-sm"
                                    disabled={joinResolveSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleJoinResolve}
                                    disabled={joinResolveSubmitting}
                                    className={`px-4 py-2 text-white font-medium rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50 ${joinResolveModal.type === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    {joinResolveSubmitting ? 'Procesando...' : joinResolveModal.type === 'accept' ? 'Confirmar Aceptación' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Action Bar */}
                {hasApprovePermission && selectedIds.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white rounded-xl shadow-2xl shadow-zinc-900/30 px-6 py-3 flex items-center gap-4 animate-slideUp">
                        <div className="flex items-center gap-2">
                            <CheckSquare size={18} className="text-primary" />
                            <span className="font-semibold text-sm">{selectedIds.size} seleccionada{selectedIds.size > 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-px h-6 bg-zinc-700"></div>
                        <button
                            onClick={() => { setBulkComment(''); setBulkModal({ type: 'approve' }); }}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                        >
                            <CheckCircle size={14} /> Aprobar Seleccionadas
                        </button>
                        <button
                            onClick={() => { setBulkComment(''); setBulkModal({ type: 'reject' }); }}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                        >
                            <XCircle size={14} /> Rechazar Seleccionadas
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                {/* Confirm Action Modal */}
                {actionModal.type && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) { setActionModal({ type: null, salidaId: null }); setComment(''); } }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden">
                            <div className="p-6 border-b border-zinc-200">
                                <h3 className="text-lg font-bold text-zinc-900">
                                    {actionModal.type === 'approve' ? 'Aprobar Solicitud' :
                                        actionModal.type === 'reject' ? 'Rechazar Solicitud' : 'Eliminar Solicitud'}
                                </h3>
                            </div>
                            <div className="p-6">
                                <p className="text-zinc-600 mb-4 text-sm">
                                    {actionModal.type === 'approve'
                                        ? '¿Está seguro de aprobar esta salida? Puede añadir una observación opcional.'
                                        : actionModal.type === 'reject'
                                            ? 'Por favor indique el motivo del rechazo (obligatorio).'
                                            : '¿Está seguro de eliminar esta solicitud? Esta acción no se puede deshacer.'}
                                </p>
                                {actionModal.type !== 'delete' && (
                                    <textarea
                                        className="w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none text-sm"
                                        rows={3}
                                        placeholder={actionModal.type === 'approve' ? "Observaciones (opcional)..." : "Motivo del rechazo..."}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                )}
                            </div>
                            <div className="p-6 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50">
                                <button
                                    onClick={() => setActionModal({ type: null, salidaId: null })}
                                    className="px-4 py-2 text-zinc-700 font-medium hover:bg-zinc-200 rounded-lg transition-colors text-sm"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={isSubmitting || (actionModal.type === 'reject' && !comment.trim())}
                                    className={`px-4 py-2 text-white font-medium rounded-lg transition-colors text-sm shadow-sm ${actionModal.type === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                                        : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                                        }`}
                                >
                                    {isSubmitting ? 'Procesando...' :
                                        actionModal.type === 'approve' ? 'Confirmar Aprobación' :
                                            actionModal.type === 'reject' ? 'Rechazar Solicitud' : 'Confirmar Eliminación'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Action Modal */}
                {bulkModal.type && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) setBulkModal({ type: null }); }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden">
                            <div className={`p-6 border-b ${bulkModal.type === 'approve' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <h3 className={`text-lg font-bold ${bulkModal.type === 'approve' ? 'text-green-900' : 'text-red-900'}`}>
                                    {bulkModal.type === 'approve' ? 'Aprobar Programaciones Seleccionadas' : 'Rechazar Programaciones Seleccionadas'}
                                </h3>
                                <p className={`text-sm mt-1 ${bulkModal.type === 'approve' ? 'text-green-700' : 'text-red-700'}`}>
                                    {selectedIds.size} programación{selectedIds.size > 1 ? 'es' : ''} seleccionada{selectedIds.size > 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="p-6">
                                <p className="text-zinc-600 mb-4 text-sm">
                                    {bulkModal.type === 'approve'
                                        ? 'Puede añadir una observación que se aplicará a todas las programaciones seleccionadas.'
                                        : 'Indique el motivo del rechazo. Se aplicará a todas las programaciones seleccionadas.'}
                                </p>
                                <textarea
                                    className="w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none text-sm"
                                    rows={3}
                                    placeholder={bulkModal.type === 'approve' ? 'Observaciones (opcional)...' : 'Motivo del rechazo (obligatorio)...'}
                                    value={bulkComment}
                                    onChange={(e) => setBulkComment(e.target.value)}
                                />
                            </div>
                            <div className="p-6 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50">
                                <button
                                    onClick={() => setBulkModal({ type: null })}
                                    className="px-4 py-2 text-zinc-700 font-medium hover:bg-zinc-200 rounded-lg transition-colors text-sm"
                                    disabled={isBulkSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkAction}
                                    disabled={isBulkSubmitting || (bulkModal.type === 'reject' && !bulkComment.trim())}
                                    className={`px-4 py-2 text-white font-medium rounded-lg transition-colors text-sm shadow-sm ${bulkModal.type === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                                        : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                                        }`}
                                >
                                    {isBulkSubmitting ? 'Procesando...' :
                                        bulkModal.type === 'approve'
                                            ? `Aprobar ${selectedIds.size} Salida${selectedIds.size > 1 ? 's' : ''}`
                                            : `Rechazar ${selectedIds.size} Salida${selectedIds.size > 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {detailsModal.isOpen && detailsModal.salida && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) setDetailsModal({ isOpen: false, salida: null }); }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900">Detalles de la Solicitud</h3>
                                    <p className="text-zinc-500 text-sm">Código: <span className="font-mono font-bold text-primary">{detailsModal.salida.codigo}</span></p>
                                </div>
                                <button
                                    onClick={() => setDetailsModal({ isOpen: false, salida: null })}
                                    className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* General Info */}
                                    <div className="space-y-6">
                                        <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                            <Layers size={18} className="text-primary" /> Información General
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Estado</span>
                                                <div className="mt-1">{getStatusBadge(detailsModal.salida.estado)}</div>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Solicitante</span>
                                                <span className="text-zinc-900 font-medium">{detailsModal.salida.solicitante.names}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Área</span>
                                                <span className="text-zinc-700">{detailsModal.salida.areas?.name}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Subdirección</span>
                                                <span className="text-zinc-700">{detailsModal.salida.areas?.subdirecciones?.name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Tipo Programación</span>
                                                <span className="text-zinc-700">{detailsModal.salida.tipo_salida}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Subtipo</span>
                                                <span className="text-zinc-700">{detailsModal.salida.subtipo_salida || 'N/A'}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Tema</span>
                                                <span className="text-zinc-700">{detailsModal.salida.tema}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Descripción</span>
                                                <p className="text-zinc-600 mt-1 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                                    {detailsModal.salida.descripcion || 'Sin descripción'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logistics & Transport */}
                                    <div className="space-y-6">
                                        <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                            <Calendar size={18} className="text-primary" /> Logística y Transporte
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Fecha Inicio</span>
                                                <span className="text-zinc-900">{new Date(detailsModal.salida.fecha_inicio).toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Fecha Final</span>
                                                <span className="text-zinc-900">{new Date(detailsModal.salida.fecha_final).toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Jornada</span>
                                                <span className="text-zinc-900">{detailsModal.salida.jornada}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Lugar Evento</span>
                                                <span className="text-zinc-700">{detailsModal.salida.lugar_evento?.name || 'No aplica'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Medio Transporte</span>
                                                <span className="text-zinc-700">{detailsModal.salida.transporte_medio || 'No requerido'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Instituciones Inv.</span>
                                                <span className="text-zinc-700">{detailsModal.salida.instituciones_convocadas || 0}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Responsables Transporte</span>
                                                <span className="text-zinc-700">{detailsModal.salida.transporte_responsables || 'Ninguno'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Locations & Participants */}
                                    <div className="col-span-1 md:col-span-2 space-y-6">
                                        <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                            <MapPin size={18} className="text-primary" /> Ubicaciones y Actores
                                        </h4>
                                        {/* Municipios Convocados */}
                                        <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Municipios Convocados</span>
                                            <p className="text-zinc-700 text-sm">
                                                {detailsModal.salida.municipios_convocados || 'Ninguno'}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Municipios ({detailsModal.salida.municipios.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {detailsModal.salida.municipios.length > 0 ? (
                                                        detailsModal.salida.municipios.map((m, idx) => (
                                                            <span key={idx} className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded text-xs border border-zinc-200">{m.name}</span>
                                                        ))
                                                    ) : <span className="text-zinc-400 italic">Ninguno</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">IPS ({detailsModal.salida.ips.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {detailsModal.salida.ips.length > 0 ? (
                                                        detailsModal.salida.ips.map((i, idx) => (
                                                            <span key={idx} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-100">{i.name}</span>
                                                        ))
                                                    ) : <span className="text-zinc-400 italic">Ninguna</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Entidades ({detailsModal.salida.entidades.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {detailsModal.salida.entidades.length > 0 ? (
                                                        detailsModal.salida.entidades.map((e, idx) => (
                                                            <span key={idx} className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-xs border border-purple-100">{e.name}</span>
                                                        ))
                                                    ) : <span className="text-zinc-400 italic">Ninguna</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">EAPB ({detailsModal.salida.eapb.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {detailsModal.salida.eapb.length > 0 ? (
                                                        detailsModal.salida.eapb.map((e, idx) => (
                                                            <span key={idx} className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs border border-orange-100">{e.name}</span>
                                                        ))
                                                    ) : <span className="text-zinc-400 italic">Ninguna</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Organizaciones ({detailsModal.salida.organizaciones.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {detailsModal.salida.organizaciones.length > 0 ? (
                                                        detailsModal.salida.organizaciones.map((o, idx) => (
                                                            <span key={idx} className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs border border-rose-100">{o.name}</span>
                                                        ))
                                                    ) : <span className="text-zinc-400 italic">Ninguna</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">IDSN ({detailsModal.salida.idsn.length})</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {detailsModal.salida.idsn.length > 0 ? (
                                                        detailsModal.salida.idsn.map((i, idx) => (
                                                            <span key={idx} className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs border border-emerald-100">{i.name}</span>
                                                        ))
                                                    ) : <span className="text-zinc-400 italic">Ninguno</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approval Info */}
                                    {detailsModal.salida.aprobador && (
                                        <div className="col-span-1 md:col-span-2 bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                                            <h4 className="font-bold text-zinc-900 border-b border-zinc-200 pb-2 mb-3 flex items-center gap-2">
                                                <CheckCircle size={18} className="text-green-600" /> Información de Aprobación
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Aprobado Por</span>
                                                    <span className="text-zinc-900">{detailsModal.salida.aprobador.names}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Email</span>
                                                    <span className="text-zinc-700">{detailsModal.salida.aprobador.email}</span>
                                                </div>
                                                {detailsModal.salida.observaciones_aprobacion && (
                                                    <div className="col-span-2">
                                                        <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Observaciones Aprobación</span>
                                                        <p className="text-zinc-600 mt-1">{detailsModal.salida.observaciones_aprobacion}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejection Info */}
                                    {detailsModal.salida.estado === 'rechazada' && detailsModal.salida.motivo_rechazo && (
                                        <div className="col-span-1 md:col-span-2 bg-red-50 rounded-lg p-4 border border-red-200">
                                            <h4 className="font-bold text-red-900 border-b border-red-200 pb-2 mb-3 flex items-center gap-2">
                                                <XCircle size={18} className="text-red-600" /> Motivo del Rechazo
                                            </h4>
                                            <p className="text-red-700 text-sm">
                                                {detailsModal.salida.motivo_rechazo}
                                            </p>
                                        </div>
                                    )}

                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-200 flex justify-end bg-zinc-50 rounded-b-xl sticky bottom-0">
                                <button
                                    onClick={() => setDetailsModal({ isOpen: false, salida: null })}
                                    className="px-6 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                                >
                                    Cerrar Detalles
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Modal (Success / Error) */}
                {feedbackModal.type && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) setFeedbackModal({ type: null, title: '', message: '' }); }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-slideUp overflow-hidden">
                            <div className={`p-6 flex flex-col items-center text-center ${feedbackModal.type === 'success' ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${feedbackModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {feedbackModal.type === 'success'
                                        ? <CheckCircle size={28} />
                                        : <AlertCircle size={28} />}
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${feedbackModal.type === 'success' ? 'text-green-900' : 'text-red-900'
                                    }`}>{feedbackModal.title}</h3>
                                <p className={`text-sm whitespace-pre-line ${feedbackModal.type === 'success' ? 'text-green-700' : 'text-red-700'
                                    }`}>{feedbackModal.message}</p>
                            </div>
                            <div className="p-4 flex justify-center bg-white border-t border-zinc-100">
                                <button
                                    onClick={() => setFeedbackModal({ type: null, title: '', message: '' })}
                                    className={`px-6 py-2 text-white font-medium rounded-lg transition-colors text-sm shadow-sm ${feedbackModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
