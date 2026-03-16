import { useEffect, useRef, useState } from 'react';
import type { EventClickArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { RefreshCcw, XCircle, CheckCircle, AlertCircle, MapPin, Calendar, Layers, Clock, User } from 'lucide-react';
import { salidasService } from '../../services/salidasService';
import SlideBar from '../ui/SlideBar';
import type { SalidaRecord } from '../../types/salidas';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    extendedProps: {
        salida: SalidaRecord;
    };
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    aprobada: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    pendiente: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
    rechazada: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
};

export default function CalendarioSalidas() {
    const [salidas, setSalidas] = useState<SalidaRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [selectedSalida, setSelectedSalida] = useState<SalidaRecord | null>(null);
    const calendarRef = useRef<FullCalendar>(null);

    useEffect(() => {
        const fetchSalidas = async () => {
            setLoading(true);
            try {
                const data = await salidasService.getSalidas(viewAll);
                setSalidas(data);
            } catch (error) {
                console.error('Error fetching salidas:', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchSalidas();
    }, [viewAll]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedSalida(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const events: CalendarEvent[] = salidas.map((salida) => {
        const colors = STATUS_COLORS[salida.estado] || STATUS_COLORS.pendiente;
        const endDate = new Date(salida.fecha_final);
        endDate.setDate(endDate.getDate() + 1);

        return {
            id: salida.id,
            title: `${salida.codigo} · ${salida.areas?.name || ''} · ${salida.lugar_evento?.name || 'Sin lugar'}`,
            start: salida.fecha_inicio,
            end: endDate.toISOString().split('T')[0],
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: colors.text,
            extendedProps: { salida },
        };
    });

    const handleEventClick = (info: EventClickArg) => {
        setSelectedSalida(info.event.extendedProps.salida as SalidaRecord);
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

    const stats = {
        total: salidas.length,
        aprobadas: salidas.filter((salida) => salida.estado === 'aprobada').length,
        pendientes: salidas.filter((salida) => salida.estado === 'pendiente').length,
        rechazadas: salidas.filter((salida) => salida.estado === 'rechazada').length,
    };

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <Calendar className="text-primary" size={32} />
                            Calendario de Programación
                        </h1>
                        <p className="text-zinc-500 mt-2">Visualice las programaciones en el calendario.</p>
                        <div className="mt-4 flex items-center gap-4 flex-wrap">
                            <button
                                onClick={() => setViewAll((prev) => !prev)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'
                                    }`}
                            >
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                {viewAll ? 'Viendo Todas las Areas' : 'Ver Todas las Areas'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} /> Aprobadas</p>
                            <p className="text-2xl font-black text-green-700 mt-1">{stats.aprobadas}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider flex items-center gap-1"><AlertCircle size={12} /> Pendientes</p>
                            <p className="text-2xl font-black text-yellow-700 mt-1">{stats.pendientes}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1"><XCircle size={12} /> Rechazadas</p>
                            <p className="text-2xl font-black text-red-700 mt-1">{stats.rechazadas}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mb-4 text-xs font-medium text-zinc-600">
                        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-green-500"></span> Aprobada</span>
                        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-yellow-500"></span> Pendiente</span>
                        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-red-500"></span> Rechazada</span>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden p-4 calendario-container">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCcw size={24} className="animate-spin text-primary" />
                                <span className="ml-3 text-zinc-500 font-medium">Cargando programación...</span>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Calendar size={32} className="text-zinc-300 mb-3" />
                                <p className="text-zinc-600 font-medium">No hay programación para mostrar</p>
                                <p className="text-zinc-400 text-sm mt-1">Pruebe cambiar el alcance o registrar una nueva programación.</p>
                            </div>
                        ) : (
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin]}
                                initialView="dayGridMonth"
                                events={events}
                                eventClick={handleEventClick}
                                locale="es"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,dayGridWeek'
                                }}
                                buttonText={{
                                    today: 'Hoy',
                                    month: 'Mes',
                                    week: 'Semana',
                                }}
                                height="auto"
                                dayMaxEvents={3}
                                moreLinkText={(count) => `+${count} mas`}
                                eventDisplay="block"
                                eventTimeFormat={{
                                    hour: undefined,
                                    minute: undefined,
                                    meridiem: false,
                                }}
                            />
                        )}
                    </div>
                </div>

                {selectedSalida && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                        onClick={(e) => { if (e.target === e.currentTarget) setSelectedSalida(null); }}
                    >
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-slideUp">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900">Detalle de Programación</h3>
                                    <p className="text-zinc-500 text-sm">Codigo: <span className="font-mono font-bold text-primary">{selectedSalida.codigo}</span></p>
                                </div>
                                <button
                                    onClick={() => setSelectedSalida(null)}
                                    className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-3 flex-wrap">
                                    {getStatusBadge(selectedSalida.estado)}
                                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium border border-primary/20">
                                        <Layers size={12} /> {selectedSalida.tipo_salida}
                                    </span>
                                    {selectedSalida.subtipo_salida && (
                                        <span className="bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full text-xs font-medium border border-zinc-200">
                                            {selectedSalida.subtipo_salida}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                                            <User size={12} /> Solicitante
                                        </span>
                                        <p className="text-zinc-900 font-medium mt-1">{selectedSalida.solicitante.names}</p>
                                        <p className="text-zinc-500 text-xs">{selectedSalida.solicitante.email}</p>
                                    </div>

                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                                            <Layers size={12} /> Area / Subdireccion
                                        </span>
                                        <p className="text-zinc-900 font-medium mt-1">{selectedSalida.areas?.name || 'N/A'}</p>
                                        <p className="text-zinc-500 text-xs">{selectedSalida.areas?.subdirecciones?.name || ''}</p>
                                    </div>

                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                                            <Calendar size={12} /> Fechas
                                        </span>
                                        <p className="text-zinc-900 font-medium mt-1">
                                            {new Date(selectedSalida.fecha_inicio).toLocaleDateString('es-CO')}
                                            {selectedSalida.fecha_inicio !== selectedSalida.fecha_final &&
                                                ` - ${new Date(selectedSalida.fecha_final).toLocaleDateString('es-CO')}`}
                                        </p>
                                    </div>

                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                                            <Clock size={12} /> Jornada
                                        </span>
                                        <p className="text-zinc-900 font-medium mt-1">{selectedSalida.jornada}</p>
                                    </div>

                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 sm:col-span-2">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                                            <MapPin size={12} /> Lugar
                                        </span>
                                        <p className="text-zinc-900 font-medium mt-1">{selectedSalida.lugar_evento?.name || 'No especificado'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Tema</h4>
                                    <p className="text-zinc-800 font-medium">{selectedSalida.tema}</p>
                                </div>

                                {selectedSalida.descripcion && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Descripcion</h4>
                                        <p className="text-zinc-600 text-sm leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                            {selectedSalida.descripcion}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
                                <button
                                    onClick={() => setSelectedSalida(null)}
                                    className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
