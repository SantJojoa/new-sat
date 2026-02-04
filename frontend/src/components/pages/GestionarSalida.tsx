import { useState, useEffect } from 'react';
import { salidasService } from '../../services/salidasService';
import SlideBar from '../ui/SlideBar';
import { Search, CheckCircle, XCircle, AlertCircle, MapPin, Layers, Edit2, Trash2, RefreshCcw, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Salida {
    id: string;
    codigo: string;
    tipo_salida: string;
    subtipo_salida: string;
    fecha_inicio: string;
    fecha_final: string;
    jornada: string;
    estado: string;
    solicitante: {
        names: string;
        email: string;
    };
    areas: {
        name: string;
    };
    municipios: { name: string }[];
    lugar_evento?: { name: string };
}

export default function GestionarSalida() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [salidas, setSalidas] = useState<Salida[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');

    const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
    const [uniqueMunicipios, setUniqueMunicipios] = useState<string[]>([]);

    // Action Modals
    const [actionModal, setActionModal] = useState<{
        type: 'approve' | 'reject' | 'delete' | null;
        salidaId: string | null;
    }>({ type: null, salidaId: null });

    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSalidas = async () => {
        setLoading(true);
        try {
            const data = await salidasService.getSalidas();
            setSalidas(data);

            // Extract unique values for filters
            const areas = Array.from(new Set(data.map((s: Salida) => s.areas?.name).filter(Boolean))) as string[];
            const municipios = Array.from(new Set(data.map((s: Salida) => s.lugar_evento?.name).filter(Boolean))) as string[];

            setUniqueAreas(areas);
            setUniqueMunicipios(municipios);
        } catch (error) {
            console.error('Error fetching salidas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalidas();
    }, []);

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterArea('');
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

            alert(`Salida ${actionText} exitosamente.`);
            setActionModal({ type: null, salidaId: null });
            setComment('');
            fetchSalidas();
        } catch (error: any) {
            console.error('Error processing action:', error);
            alert(`Error: ${error.response?.data?.message || 'Error al procesar la solicitud'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canApprove = (salida: Salida) => {
        // Can approve if NOT already approved, or if we want to allow re-approval (update obs). 
        // User asked: "las rechazadas se puedan aprobar" (so rejected -> approve OK).
        // "Approved -> Approve"? Maybe redundant but harmless. 
        // Let's hide Approve button if ALREADY approved.
        return salida.estado !== 'aprobada' && user?.user_type?.permissions?.some(p => p.modules.name === 'gestionar_salida' && p.can_approve);
    };

    const canEdit = (salida: Salida) => {
        // Logic: User has edit permission AND (is superadmin OR is solicitante OR (is admin_sub and own area? - usually admin edits any in area))
        // Checking simple permission first:
        const hasPerm = user?.user_type?.permissions?.some(p => p.modules.name === 'gestionar_salida' && p.can_edit);
        // If pending, usually editable. If approved, usually not editable unless superadmin.
        // Let's assume pending only for now to be safe, or follow backend rules.
        return hasPerm && salida.estado === 'pendiente';
    };

    const canDelete = (salida: Salida) => {
        // Can delete if permission calls for it and is pending (safety)
        return salida.estado === 'pendiente' && user?.user_type?.permissions?.some(p => p.modules.name === 'gestionar_salida' && p.can_delete);
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

        const matchesMunicipio = filterMunicipio ? s.lugar_evento?.name === filterMunicipio : true;

        let matchesDate = true;
        if (filterDateStart) {
            // Check if start date matches the filter date (ignoring time)
            // Backend date is usually ISO string with time info or just date string.
            // Assuming s.fecha_inicio is ISO string. 
            // We compare YYYY-MM-DD parts.
            const salidaDate = new Date(s.fecha_inicio).toISOString().split('T')[0];
            matchesDate = salidaDate === filterDateStart;
        }

        return matchesSearch && matchesArea && matchesMunicipio && matchesDate;
    });

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Gestionar Salidas</h1>
                        <p className="text-zinc-500 mt-2">Revise, edite y gestione las solicitudes de salida.</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
                        {/* Filters Header */}
                        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                                    <Search size={16} /> Filtros de Búsqueda
                                </h3>
                                {(searchTerm || filterArea || filterMunicipio || filterDateStart || filterDateEnd) && (
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
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Cargando solicitudes...</td></tr>
                                    ) : filteredSalidas.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No hay solicitudes encontradas</td></tr>
                                    ) : (
                                        filteredSalidas.map((salida) => (
                                            <tr key={salida.id} className="hover:bg-zinc-50 transition-colors text-sm">
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
                                                                className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors border border-green-200"
                                                            >
                                                                Aprobar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setComment('');
                                                                    setActionModal({ type: 'reject', salidaId: salida.id });
                                                                }}
                                                                className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors border border-red-200"
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

                {/* Confirm Action Modal */}
                {actionModal.type && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
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
            </main>
        </div>
    );
}
