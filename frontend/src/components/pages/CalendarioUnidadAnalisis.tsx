import { useAuth } from '../../hooks/useAuth';
import { unidadAnalisisService } from '../../services/unidadAnalisisService';
import CalendarPage, { type CalendarProgramacionRecord } from '../ui/CalendarPage';

const EVENT_COLOR = { bg: '#e0f2fe', border: '#0284c7', text: '#075985' };

export default function CalendarioUnidadAnalisis() {
    const { user } = useAuth();
    const isSuperAdmin = user?.user_type?.name === 'superadmin';

    return (
        <CalendarPage<CalendarProgramacionRecord>
            pageTitle="Calendario Unidad de Análisis"
            pageDescription="Visualice los registros de Unidad de Análisis en el calendario."
            statLabel="Total Registros"
            emptyMessage="No hay registros para mostrar"
            detailTitle="Detalle Unidad de Análisis"
            eventColor={EVENT_COLOR}
            getAll={async (viewAll): Promise<CalendarProgramacionRecord[]> => {
                const records = await unidadAnalisisService.getAll(viewAll);
                return records.map(r => ({
                    id: r.id,
                    codigo: r.codigo,
                    tema: r.tema,
                    fecha_inicio: r.fecha_inicio,
                    fecha_final: r.fecha_final,
                    jornada: r.jornada,
                    instituciones_convocadas: r.instituciones_convocadas?.toString(),
                    lugar_evento: r.lugar_evento,
                    areas: r.areas?.id ? { id: r.areas.id, name: r.areas.name } : undefined,
                    solicitante: r.solicitante_id ? { id: r.solicitante_id, names: r.solicitante?.names ?? '', email: r.solicitante?.email ?? '' } : undefined,
                }));
            }}
            isSuperAdmin={isSuperAdmin}
        />
    );
}
