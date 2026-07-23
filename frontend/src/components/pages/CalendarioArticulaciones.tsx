import { useAuth } from '../../hooks/useAuth';
import { articulacionesService } from '../../services/articulacionesService';
import CalendarPage from '../ui/CalendarPage';

const EVENT_COLOR = { bg: '#ede9fe', border: '#7c3aed', text: '#4c1d95' };

export default function CalendarioArticulaciones() {
    const { user } = useAuth();
    const isSuperAdmin = user?.user_type?.name === 'superadmin';

    return (
        <CalendarPage
            pageTitle="Calendario de Articulaciones"
            pageDescription="Visualice las articulaciones intersectoriales en el calendario."
            statLabel="Total Articulaciones"
            emptyMessage="No hay articulaciones para mostrar"
            detailTitle="Detalle de Articulación"
            eventColor={EVENT_COLOR}
            getAll={(viewAll) => articulacionesService.getAll(viewAll)}
            isSuperAdmin={isSuperAdmin}
        />
    );
}
