import { useAuth } from '../../hooks/useAuth';
import { ivcService } from '../../services/ivcService';
import CalendarPage from '../ui/CalendarPage';

const EVENT_COLOR = { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a5f' };

export default function CalendarioIvc() {
    const { user } = useAuth();
    const isSuperAdmin = user?.user_type?.name === 'superadmin';

    return (
        <CalendarPage
            pageTitle="Calendario IVC"
            pageDescription="Visualice los registros de Inspección, Vigilancia y Control en el calendario."
            statLabel="Total IVC"
            emptyMessage="No hay registros IVC para mostrar"
            detailTitle="Detalle de IVC"
            eventColor={EVENT_COLOR}
            getAll={(viewAll) => ivcService.getAll(viewAll)}
            isSuperAdmin={isSuperAdmin}
        />
    );
}
