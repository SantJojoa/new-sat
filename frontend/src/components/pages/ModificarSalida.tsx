import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { salidasService } from '../../services/salidasService';
import SlideBar from '../ui/SlideBar';
import { Search, CheckCircle, XCircle, AlertCircle, FileEdit } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { ApiErrorPayload } from '../../types/api';
import type { SalidaRecord } from '../../types/salidas';

export default function ModificarSalida() {
    const { user } = useAuth();
    const [salidas, setSalidas] = useState<SalidaRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubdireccion, setSelectedSubdireccion] = useState('');

    // Action Modals
    const [actionModal, setActionModal] = useState<{
        type: 'approve' | 'reject' | null;
        salidaId: string | null;
    }>({ type: null, salidaId: null });

    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSalidas = async () => {
        setLoading(true);
        try {
            const data = await salidasService.getSalidas();
            setSalidas(data);
        } catch (error) {
            console.error('Error fetching salidas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalidas();
    }, []);

    const handleAction = async () => {
        if (!actionModal.salidaId || !actionModal.type) return;

        setIsSubmitting(true);
        try {
            if (actionModal.type === 'approve') {
                await salidasService.approveSalida(actionModal.salidaId, comment);
            } else {
                await salidasService.rejectSalida(actionModal.salidaId, comment);
            }
            // Success
            alert(`Salida ${actionModal.type === 'approve' ? 'aprobada' : 'rechazada'} exitosamente.`);
            setActionModal({ type: null, salidaId: null });
            setComment('');
            fetchSalidas();
        } catch (error) {
            const apiError = error as AxiosError<ApiErrorPayload>;
            console.error('Error processing action:', error);
            alert(`Error: ${apiError.response?.data?.message || 'Error al procesar la solicitud'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canApprove = (salida: SalidaRecord) => {
        return salida.estado === 'pendiente' && user?.user_type?.permissions?.some(p => p.modules.name === 'modificar_salida' && p.can_approve);
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

    // Derive unique subdirecciones for filter
    const subdirecciones = Array.from(new Set(salidas.map(s => s.areas?.subdirecciones?.name).filter(Boolean)));

    const filteredSalidas = salidas.filter(s => {
        const matchesSearch = s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.solicitante.names.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubdireccion = selectedSubdireccion ? s.areas?.subdirecciones?.name === selectedSubdireccion : true;
        return matchesSearch && matchesSubdireccion;
    });

    const formatList = (items?: { name: string }[]) => {
        if (!items || items.length === 0) return '-';
        return items.map(i => i.name).join(', ');
    };

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-screen-2xl mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3"><FileEdit className="text-primary" size={32} />Gestión de Programaciones</h1>
                        <p className="text-zinc-500 mt-2">Revise y gestione las solicitudes de programaciones.</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
                                <div className="relative w-full md:max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por código o solicitante..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="w-full md:w-auto flex items-center gap-3">
                                    <label className="text-sm font-medium text-zinc-700 whitespace-nowrap">
                                        Filtrar Subdirección:
                                    </label>
                                    <select
                                        value={selectedSubdireccion}
                                        onChange={(e) => setSelectedSubdireccion(e.target.value)}
                                        className="w-full md:w-64 px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm bg-white"
                                    >
                                        <option value="">Todas las Subdirecciones</option>
                                        {subdirecciones.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 min-w-[120px]">Código</th>
                                        <th className="px-6 py-4 min-w-[200px]">Solicitante / Área</th>
                                        <th className="px-6 py-4 min-w-[150px]">Detalles Programación</th>
                                        <th className="px-6 py-4 min-w-[200px]">Ubicaciones / Actores</th>
                                        <th className="px-6 py-4 min-w-[150px]">Estado</th>
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
                                            <tr key={salida.id} className="hover:bg-zinc-50 transition-colors text-xs">
                                                <td className="px-6 py-4 font-medium text-zinc-900 align-top">
                                                    {salida.codigo}
                                                    <div className="text-zinc-400 mt-1">{new Date(salida.fecha_inicio).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="font-medium text-zinc-900">{salida.solicitante.names}</div>
                                                    <div className="text-zinc-500">{salida.areas?.name}</div>
                                                    <div className="text-zinc-400 italic">{salida.areas?.subdirecciones?.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600 align-top space-y-1">
                                                    <div><span className="font-semibold">Tipo:</span> {salida.tipo_salida}</div>
                                                    {salida.subtipo_salida && <div><span className="font-semibold">Subtipo:</span> {salida.subtipo_salida}</div>}
                                                    <div><span className="font-semibold">Jornada:</span> {salida.jornada}</div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600 align-top space-y-2 max-w-[300px]">
                                                    {salida.municipios?.length > 0 && (
                                                        <div><span className="font-semibold text-primary">Municipios:</span> {formatList(salida.municipios)}</div>
                                                    )}
                                                    {salida.entidades?.length > 0 && (
                                                        <div><span className="font-semibold text-primary">Entidades:</span> {formatList(salida.entidades)}</div>
                                                    )}
                                                    {(salida as any).salida_ips?.length > 0 && (
                                                        <div><span className="font-semibold text-primary">IPS:</span> {(salida as any).salida_ips.map((si: any) => si.ips?.type + (si.actor ? ` (${si.actor.name})` : '')).join(', ')}</div>
                                                    )}
                                                    {salida.salida_eapb?.length > 0 && (
                                                        <div><span className="font-semibold text-primary">EAPB:</span> {salida.salida_eapb.map((se: any) => se.eapb?.name + (se.actor ? ` (${se.actor.name})` : '')).join(', ')}</div>
                                                    )}
                                                    {salida.organizaciones?.length > 0 && (
                                                        <div><span className="font-semibold text-primary">Organizaciones:</span> {formatList(salida.organizaciones)}</div>
                                                    )}
                                                    {salida.idsn?.length > 0 && (
                                                        <div><span className="font-semibold text-primary">IDSN:</span> {formatList(salida.idsn)}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    {getStatusBadge(salida.estado)}
                                                </td>
                                                <td className="px-6 py-4 flex justify-end gap-2 align-top">
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
                                    {actionModal.type === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                                </h3>
                            </div>
                            <div className="p-6">
                                <p className="text-zinc-600 mb-4 text-sm">
                                    {actionModal.type === 'approve'
                                        ? '¿Está seguro de aprobar esta salida? Puede añadir una observación opcional.'
                                        : 'Por favor indique el motivo del rechazo (obligatorio).'}
                                </p>
                                <textarea
                                    className="w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none text-sm"
                                    rows={3}
                                    placeholder={actionModal.type === 'approve' ? "Observaciones (opcional)..." : "Motivo del rechazo..."}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
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
                                    {isSubmitting ? 'Procesando...' : (actionModal.type === 'approve' ? 'Confirmar Aprobación' : 'Rechazar Solicitud')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
