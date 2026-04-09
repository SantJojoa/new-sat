import { useEffect, useState } from 'react';
import SlideBar from '../../ui/SlideBar';
import { ventanaProgramacionService, type VentanaStatus } from '../../../services/ventanaProgramacionService';
import { Calendar, CheckCircle, XCircle, AlertCircle, Lock, Unlock } from 'lucide-react';

export default function VentanaProgramacion() {
    const [status, setStatus] = useState<VentanaStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [now, setNow] = useState(new Date());
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const data = await ventanaProgramacionService.get();
            setStatus(data);
            if (data.ventana) {
                setFechaInicio(data.ventana.fecha_inicio.slice(0, 16));
                setFechaFin(data.ventana.fecha_fin.slice(0, 16));
            }
        } catch {
            setFeedback({ type: 'error', message: 'Error al cargar la configuración' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void fetchStatus(); }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const clientAbierta = status?.ventana
        ? now >= new Date(status.ventana.fecha_inicio) && now <= new Date(status.ventana.fecha_fin)
        : false;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fechaInicio || !fechaFin) return;
        if (fechaFin < fechaInicio) {
            setFeedback({ type: 'error', message: 'La fecha de cierre no puede ser anterior a la de apertura.' });
            return;
        }
        setSaving(true);
        try {
            await ventanaProgramacionService.set(fechaInicio, fechaFin);
            setFeedback({ type: 'success', message: 'Ventana de programación guardada exitosamente.' });
            await fetchStatus();
        } catch {
            setFeedback({ type: 'error', message: 'Error al guardar la configuración.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        setSaving(true);
        try {
            await ventanaProgramacionService.deactivate();
            setFeedback({ type: 'success', message: 'Ventana cerrada. No se podrán hacer solicitudes.' });
            await fetchStatus();
        } catch {
            setFeedback({ type: 'error', message: 'Error al cerrar la ventana.' });
        } finally {
            setSaving(false);
        }
    };

    const fmt = (dateStr: string) =>
        new Date(dateStr).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-2xl mx-auto w-full">

                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Calendar className="text-primary" size={22} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">Ventana de Programación</h1>
                                <p className="text-sm text-zinc-500">Configure el periodo en que se pueden solicitar programaciones</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado actual */}
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mb-6">
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-zinc-100">
                            <h2 className="text-base font-bold text-zinc-800">Estado Actual</h2>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <p className="text-zinc-500 text-sm">Cargando...</p>
                            ) : status?.ventana ? (
                                <div className="space-y-3">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${clientAbierta ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                        {clientAbierta
                                            ? <><Unlock size={14} /> Ventana Abierta</>
                                            : <><Lock size={14} /> Ventana Cerrada</>
                                        }
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Apertura</p>
                                            <p className="text-sm font-bold text-zinc-800">{fmt(status.ventana.fecha_inicio)}</p>
                                        </div>
                                        <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Cierre</p>
                                            <p className="text-sm font-bold text-zinc-800">{fmt(status.ventana.fecha_fin)}</p>
                                        </div>
                                    </div>
                                    {clientAbierta && (
                                        <button
                                            onClick={handleDeactivate}
                                            disabled={saving}
                                            className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <Lock size={14} />
                                            Cerrar Ventana Ahora
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-zinc-500">
                                    <AlertCircle size={18} className="text-yellow-500" />
                                    <span className="text-sm">No hay ventana configurada. El módulo de solicitudes está <strong>bloqueado</strong>.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-zinc-100">
                            <h2 className="text-base font-bold text-zinc-800">Configurar Nueva Ventana</h2>
                            <p className="text-sm text-zinc-500 mt-0.5">Defina el rango de días en que se aceptarán solicitudes</p>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                <strong>Ejemplo:</strong> Para solicitar programaciones de mayo, configure la apertura y cierre dentro del mes de abril.
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-zinc-700">
                                        Fecha y Hora de Apertura <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={fechaInicio}
                                        onChange={e => setFechaInicio(e.target.value)}
                                        required
                                        className="w-full h-12 px-4 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-zinc-700">
                                        Fecha y Hora de Cierre <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={fechaFin}
                                        min={fechaInicio}
                                        onChange={e => setFechaFin(e.target.value)}
                                        required
                                        className="w-full h-12 px-4 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {feedback && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    {feedback.message}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={saving || !fechaInicio || !fechaFin}
                                    className="px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Calendar size={18} />
                                    {saving ? 'Guardando...' : 'Guardar Ventana'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
