import { useEffect, useRef, useState } from 'react';
import type { EventClickArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { RefreshCcw, XCircle, CheckCircle, AlertCircle, MapPin, Calendar, Layers, Users } from 'lucide-react';
import { salidasService } from '../../services/salidasService';
import SlideBar from '../ui/SlideBar';
import type { SalidaRecord } from '../../types/salidas';
import DetailModal from '../ui/DetailModal';

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
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        return {
            id: salida.id,
            title: `${salida.codigo} · ${salida.areas?.name || ''}${salida.areas_participantes && salida.areas_participantes.length > 0 ? ` +${salida.areas_participantes.length} unida${salida.areas_participantes.length > 1 ? 's' : ''}` : ''} · ${salida.lugar_evento?.name || 'Sin lugar'}`,
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
                    <DetailModal title="Detalles de la Programación" codigo={selectedSalida.codigo} onClose={() => setSelectedSalida(null)} maxWidth="max-w-4xl">
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
                                            <div className="mt-1">{getStatusBadge(selectedSalida.estado)}</div>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Solicitante</span>
                                            <span className="text-zinc-900 font-medium">{selectedSalida.solicitante.names}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Área Principal</span>
                                            <span className="text-zinc-700">{selectedSalida.areas?.name}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Subdirección</span>
                                            <span className="text-zinc-700">{selectedSalida.areas?.subdirecciones?.name || 'N/A'}</span>
                                        </div>
                                        {selectedSalida.areas_participantes && selectedSalida.areas_participantes.length > 0 && (
                                            <div className="col-span-2">
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Áreas Participantes (Unidas)</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedSalida.areas_participantes.map(ap => (
                                                        <div key={ap.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                                                            <Users size={13} className="text-blue-600 shrink-0" />
                                                            <div>
                                                                <span className="text-blue-800 font-medium text-xs">{ap.name}</span>
                                                                {ap.subdirecciones?.name && (
                                                                    <span className="text-blue-500 text-[10px] block">{ap.subdirecciones.name}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Tipo Programación</span>
                                            <span className="text-zinc-700">{selectedSalida.tipo_salida}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Subtipo</span>
                                            <span className="text-zinc-700">{selectedSalida.subtipo_salida || 'N/A'}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Tema</span>
                                            <span className="text-zinc-700">{selectedSalida.tema}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Descripción</span>
                                            <p className="text-zinc-600 mt-1 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                                {selectedSalida.descripcion || 'Sin descripción'}
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
                                            <span className="text-zinc-900">{new Date(selectedSalida.fecha_inicio).toLocaleDateString('es-CO')}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Fecha Final</span>
                                            <span className="text-zinc-900">{new Date(selectedSalida.fecha_final).toLocaleDateString('es-CO')}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Jornada</span>
                                            <span className="text-zinc-900">{selectedSalida.jornada}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Lugar Evento</span>
                                            <span className="text-zinc-700">{selectedSalida.lugar_evento?.name || 'No aplica'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Medio Transporte</span>
                                            <span className="text-zinc-700">{selectedSalida.transporte_medio || 'No requerido'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Instituciones Inv.</span>
                                            <span className="text-zinc-700">{selectedSalida.instituciones_convocadas || 0}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Responsables Transporte</span>
                                            <span className="text-zinc-700">{selectedSalida.transporte_responsables || 'Ninguno'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Locations & Participants */}
                                <div className="col-span-1 md:col-span-2 space-y-6">
                                    <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                        <MapPin size={18} className="text-primary" /> Ubicaciones y Actores
                                    </h4>
                                    <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                                        <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Municipios Convocados</span>
                                        <p className="text-zinc-700 text-sm">{selectedSalida.municipios_convocados || 'Ninguno'}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Municipios ({selectedSalida.municipios.length})</span>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedSalida.municipios.length > 0 ? (
                                                    selectedSalida.municipios.map((m, idx) => (
                                                        <span key={idx} className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded text-xs border border-zinc-200">{m.name}</span>
                                                    ))
                                                ) : <span className="text-zinc-400 italic">Ninguno</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">IPS ({(selectedSalida as any).salida_ips?.length ?? 0})</span>
                                            <div className="flex flex-wrap gap-1">
                                                {((selectedSalida as any).salida_ips?.length ?? 0) > 0 ? (
                                                    (selectedSalida as any).salida_ips.map((si: any, idx: number) => (
                                                        <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-100">
                                                            {si.ips?.type}
                                                            {si.actor && <span className="bg-blue-200 text-blue-700 px-1 rounded font-semibold">{si.actor.name}</span>}
                                                        </span>
                                                    ))
                                                ) : <span className="text-zinc-400 italic">Ninguna</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Entidades ({selectedSalida.entidades.length})</span>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedSalida.entidades.length > 0 ? (
                                                    selectedSalida.entidades.map((e, idx) => (
                                                        <span key={idx} className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-xs border border-purple-100">{e.name}</span>
                                                    ))
                                                ) : <span className="text-zinc-400 italic">Ninguna</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">EAPB ({selectedSalida.salida_eapb?.length ?? 0})</span>
                                            <div className="flex flex-wrap gap-1">
                                                {(selectedSalida.salida_eapb?.length ?? 0) > 0 ? (
                                                    selectedSalida.salida_eapb.map((se: any, idx: number) => (
                                                        <span key={idx} className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs border border-orange-100">
                                                            {se.eapb?.name}
                                                            {se.actor && <span className="bg-orange-200 text-orange-700 px-1 rounded font-semibold">{se.actor.name}</span>}
                                                        </span>
                                                    ))
                                                ) : <span className="text-zinc-400 italic">Ninguna</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">Organizaciones ({selectedSalida.organizaciones.length})</span>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedSalida.organizaciones.length > 0 ? (
                                                    selectedSalida.organizaciones.map((o, idx) => (
                                                        <span key={idx} className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs border border-rose-100">{o.name}</span>
                                                    ))
                                                ) : <span className="text-zinc-400 italic">Ninguna</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-2">IDSN ({selectedSalida.idsn.length})</span>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedSalida.idsn.length > 0 ? (
                                                    selectedSalida.idsn.map((i, idx) => (
                                                        <span key={idx} className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs border border-emerald-100">{i.name}</span>
                                                    ))
                                                ) : <span className="text-zinc-400 italic">Ninguno</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Approval Info */}
                                {selectedSalida.aprobador && (
                                    <div className="col-span-1 md:col-span-2 bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                                        <h4 className="font-bold text-zinc-900 border-b border-zinc-200 pb-2 mb-3 flex items-center gap-2">
                                            <CheckCircle size={18} className="text-green-600" /> Información de Aprobación
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Aprobado Por</span>
                                                <span className="text-zinc-900">{selectedSalida.aprobador.names}</span>
                                            </div>
                                            <div>
                                                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Email</span>
                                                <span className="text-zinc-700">{selectedSalida.aprobador.email}</span>
                                            </div>
                                            {selectedSalida.observaciones_aprobacion && (
                                                <div className="col-span-2">
                                                    <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Observaciones Aprobación</span>
                                                    <p className="text-zinc-600 mt-1">{selectedSalida.observaciones_aprobacion}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Info */}
                                {selectedSalida.estado === 'rechazada' && selectedSalida.motivo_rechazo && (
                                    <div className="col-span-1 md:col-span-2 bg-red-50 rounded-lg p-4 border border-red-200">
                                        <h4 className="font-bold text-red-900 border-b border-red-200 pb-2 mb-3 flex items-center gap-2">
                                            <XCircle size={18} className="text-red-600" /> Motivo del Rechazo
                                        </h4>
                                        <p className="text-red-700 text-sm">{selectedSalida.motivo_rechazo}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DetailModal>
                )}
            </main>
        </div>
    );
}
