import { ivcService } from '../../services/ivcService';
import ReportesPage from '../ui/ReportesPage';

export default function ReportesIvc() {
    return (
        <ReportesPage
            pageTitle="Reportes — IVC"
            pageDescription="Estadísticas de actividades de Inspección, Vigilancia y Control."
            kpiIcon="verified_user"
            entityLabel="IVC"
            service={ivcService}
        />
    );
}
