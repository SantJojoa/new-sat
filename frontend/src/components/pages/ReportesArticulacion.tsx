import { articulacionesService } from '../../services/articulacionesService';
import ReportesPage from '../ui/ReportesPage';

export default function ReportesArticulacion() {
    return (
        <ReportesPage
            pageTitle="Reportes — Articulación"
            pageDescription="Estadísticas de articulaciones intersectoriales."
            kpiIcon="hub"
            entityLabel="Articulaciones"
            service={articulacionesService}
        />
    );
}
