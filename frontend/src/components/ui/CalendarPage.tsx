import { useEffect, useRef, useState } from 'react';
import type { EventClickArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { RefreshCcw, MapPin, Calendar, Layers, Clock, User } from 'lucide-react';
import SlideBar from './SlideBar';
import DetailModal, { DetailCard, DetailGrid } from './DetailModal';

export interface CalendarProgramacionRecord {
    id: string;
    codigo: string;
    tema: string;
    fecha_inicio: string;
    fecha_final: string;
    jornada: string;
    instituciones_convocadas?: string;
    responsable_articulacion?: string;
    lugar_evento?: { id: string; name: string };
    areas?: { id: string; name: string };
    solicitante?: { id: string; names: string; email: string };
}

interface CalendarPageProps<T extends CalendarProgramacionRecord> {
    pageTitle: string;
    pageDescription: string;
    statLabel: string;
    emptyMessage: string;
    detailTitle: string;
    eventColor: { bg: string; border: string; text: string };
    getAll: (viewAll: boolean) => Promise<T[]>;
    isSuperAdmin: boolean;
}

// Genérico para los calendarios de Articulaciones/IVC (misma forma de registro y detalle,
// solo cambian título/color/servicio). CalendarioSalidas.tsx queda aparte por su detalle más rico.
export default function CalendarPage<T extends CalendarProgramacionRecord>({
    pageTitle, pageDescription, statLabel, emptyMessage, detailTitle, eventColor, getAll, isSuperAdmin,
}: CalendarPageProps<T>) {
    const [records, setRecords] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [selected, setSelected] = useState<T | null>(null);
    const calendarRef = useRef<FullCalendar>(null);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await getAll(viewAll);
                setRecords(data);
            } catch (e) {
                console.error('Error fetching records:', e);
            } finally {
                setLoading(false);
            }
        };
        void fetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewAll]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const events = records.map(r => {
        const endDate = new Date(r.fecha_final);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        return {
            id: r.id,
            title: `${r.codigo} · ${r.areas?.name || ''} · ${r.lugar_evento?.name || 'Sin lugar'}`,
            start: r.fecha_inicio,
            end: endDate.toISOString().split('T')[0],
            backgroundColor: eventColor.bg,
            borderColor: eventColor.border,
            textColor: eventColor.text,
            extendedProps: { record: r },
        };
    });

    const handleEventClick = (info: EventClickArg) => {
        setSelected(info.event.extendedProps.record as T);
    };

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <Calendar className="text-primary" size={32} />
                            {pageTitle}
                        </h1>
                        <p className="text-zinc-500 mt-2">{pageDescription}</p>
                        <div className="mt-4 flex items-center gap-4 flex-wrap">
                            {isSuperAdmin && (
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
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{statLabel}</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{records.length}</p>
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
                                <p className="text-zinc-600 font-medium">{emptyMessage}</p>
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
                    <DetailModal title={detailTitle} codigo={selected.codigo} onClose={() => setSelected(null)}>
                        <div className="p-6 space-y-4 text-sm">
                            <DetailGrid>
                                <DetailCard label="Solicitante" icon={<User size={10} />}>
                                    <p className="text-zinc-900 font-medium">{selected.solicitante?.names}</p>
                                    <p className="text-zinc-500 text-xs">{selected.solicitante?.email}</p>
                                </DetailCard>
                                <DetailCard label="Área" icon={<Layers size={10} />}>
                                    <p className="text-zinc-900 font-medium">{selected.areas?.name || '—'}</p>
                                </DetailCard>
                                <DetailCard label="Fechas" icon={<Calendar size={10} />}>
                                    <p className="text-zinc-900 font-medium">{new Date(selected.fecha_inicio).toLocaleDateString('es-CO')} → {new Date(selected.fecha_final).toLocaleDateString('es-CO')}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5"><Clock size={10} className="inline mr-1" />Jornada: {selected.jornada}</p>
                                </DetailCard>
                                <DetailCard label="Lugar del Evento" icon={<MapPin size={10} />}>
                                    <p className="text-zinc-900 font-medium">{selected.lugar_evento?.name || '—'}</p>
                                </DetailCard>
                                <DetailCard label="Tema / Actividad" fullWidth>
                                    <p className="text-zinc-800 font-medium">{selected.tema}</p>
                                </DetailCard>
                                {selected.instituciones_convocadas && (
                                    <DetailCard label="Instituciones Convocadas" fullWidth>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selected.instituciones_convocadas.split(',').map((inst, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">{inst.trim()}</span>
                                            ))}
                                        </div>
                                    </DetailCard>
                                )}
                                {selected.responsable_articulacion && (
                                    <DetailCard label="Responsable(s)" fullWidth>
                                        <p className="text-zinc-800">{selected.responsable_articulacion}</p>
                                    </DetailCard>
                                )}
                            </DetailGrid>
                        </div>
                    </DetailModal>
                )}
            </main>
        </div>
    );
}
