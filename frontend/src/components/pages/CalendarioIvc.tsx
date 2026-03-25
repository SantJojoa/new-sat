import { useEffect, useRef, useState } from 'react';
import type { EventClickArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { RefreshCcw, XCircle, MapPin, Calendar, Layers, Clock, User } from 'lucide-react';
import { ivcService } from '../../services/ivcService';
import SlideBar from '../ui/SlideBar';
import { useAuth } from '../../hooks/useAuth';
import type { IvcRecord } from '../../types/ivc';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    extendedProps: { record: IvcRecord };
}

const EVENT_COLOR = { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a5f' };

export default function CalendarioIvc() {
    const { user } = useAuth();
    const [records, setRecords] = useState<IvcRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [selected, setSelected] = useState<IvcRecord | null>(null);
    const calendarRef = useRef<FullCalendar>(null);

    const isAdmin = ['admin_subdireccion', 'superadmin'].includes(user?.user_type?.name || '');

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await ivcService.getAll(viewAll);
                setRecords(data);
            } catch (e) {
                console.error('Error fetching IVC:', e);
            } finally {
                setLoading(false);
            }
        };
        void fetch();
    }, [viewAll]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const events: CalendarEvent[] = records.map(r => {
        const endDate = new Date(r.fecha_final);
        endDate.setDate(endDate.getDate() + 1);
        return {
            id: r.id,
            title: `${r.codigo} · ${r.areas?.name || ''} · ${r.lugar_evento?.name || 'Sin lugar'}`,
            start: r.fecha_inicio,
            end: endDate.toISOString().split('T')[0],
            backgroundColor: EVENT_COLOR.bg,
            borderColor: EVENT_COLOR.border,
            textColor: EVENT_COLOR.text,
            extendedProps: { record: r },
        };
    });

    const handleEventClick = (info: EventClickArg) => {
        setSelected(info.event.extendedProps.record as IvcRecord);
    };

    const total = records.length;

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <Calendar className="text-primary" size={32} />
                            Calendario IVC
                        </h1>
                        <p className="text-zinc-500 mt-2">Visualice los registros de Inspección, Vigilancia y Control en el calendario.</p>
                        <div className="mt-4 flex items-center gap-4 flex-wrap">
                            {isAdmin && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                    {viewAll ? 'Viendo todas las áreas' : 'Ver todas las áreas'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total IVC</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{total}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden p-4 calendario-container">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCcw size={24} className="animate-spin text-primary" />
                                <span className="ml-3 text-zinc-500 font-medium">Cargando...</span>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Calendar size={32} className="text-zinc-300 mb-3" />
                                <p className="text-zinc-600 font-medium">No hay registros IVC para mostrar</p>
                            </div>
                        ) : (
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin]}
                                initialView="dayGridMonth"
                                events={events}
                                eventClick={handleEventClick}
                                locale="es"
                                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
                                buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana' }}
                                height="auto"
                                dayMaxEvents={3}
                                moreLinkText={(count) => `+${count} mas`}
                                eventDisplay="block"
                                eventTimeFormat={{ hour: undefined, minute: undefined, meridiem: false }}
                            />
                        )}
                    </div>
                </div>

                {selected && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900">Detalle de IVC</h3>
                                    <p className="text-zinc-500 text-sm">Código: <span className="font-mono font-bold text-primary">{selected.codigo}</span></p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"><XCircle size={24} /></button>
                            </div>
                            <div className="p-6 space-y-4 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-1"><User size={10} /> Solicitante</span>
                                        <p className="text-zinc-900 font-medium">{selected.solicitante?.names}</p>
                                        <p className="text-zinc-500 text-xs">{selected.solicitante?.email}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-1"><Layers size={10} /> Área</span>
                                        <p className="text-zinc-900 font-medium">{selected.areas?.name || '—'}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-1"><Calendar size={10} /> Fechas</span>
                                        <p className="text-zinc-900 font-medium">{new Date(selected.fecha_inicio).toLocaleDateString('es-CO')} → {new Date(selected.fecha_final).toLocaleDateString('es-CO')}</p>
                                        <p className="text-zinc-500 text-xs mt-0.5"><Clock size={10} className="inline mr-1" />Jornada: {selected.jornada}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-1"><MapPin size={10} /> Lugar del Evento</span>
                                        <p className="text-zinc-900 font-medium">{selected.lugar_evento?.name || '—'}</p>
                                    </div>
                                </div>
                                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Tema / Actividad</span>
                                    <p className="text-zinc-800 font-medium">{selected.tema}</p>
                                </div>
                                {selected.instituciones_convocadas && (
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-2">Instituciones Convocadas</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selected.instituciones_convocadas.split(',').map((inst, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">{inst.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selected.responsable_articulacion && (
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Responsable(s)</span>
                                        <p className="text-zinc-800">{selected.responsable_articulacion}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
                                <button onClick={() => setSelected(null)} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">Cerrar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
