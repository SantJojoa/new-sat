import { useCallback, useEffect, useState } from 'react';
import type { FilterField } from '../components/ui/FiltersPanel';
import type { FeedbackModalState } from '../components/ui/FeedbackModal';

export interface ProgramacionRecord {
    id: string;
    codigo: string;
    tema: string;
    fecha_inicio: string;
    fecha_final: string;
    jornada: string;
    instituciones_convocadas?: string;
    transporte_medio?: string;
    transporte_num_instituciones?: number;
    responsable_articulacion?: string;
    area_id: string;
    solicitante?: { id: string; names: string; email: string };
    areas?: { id: string; name: string; subdirecciones?: { id: string; name: string } };
}

export interface ProgramacionEditForm {
    tema?: string;
    fecha_inicio?: string;
    fecha_final?: string;
    jornada?: string;
    instituciones_convocadas?: string;
    responsable_articulacion?: string;
    transporte_medio?: string;
    transporte_num_instituciones?: number;
    area_id?: string;
}

interface ProgramacionService<T extends ProgramacionRecord> {
    getAll(viewAll: boolean): Promise<T[]>;
    getCatalogos(): Promise<{ areas: { id: string; name: string }[] }>;
    update(id: string, data: ProgramacionEditForm): Promise<T>;
    delete(id: string): Promise<void>;
}

// Encapsula el estado y los handlers compartidos por las páginas "Gestionar<Programación>"
// (Articulaciones/IVC hoy, ambas ~99% idénticas): fetch + filtros + editar + borrar + feedback.
export function useGestionarProgramacion<T extends ProgramacionRecord>(
    service: ProgramacionService<T>,
    isSuperAdmin: boolean,
) {
    const [records, setRecords] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterSubdireccion, setFilterSubdireccion] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [uniqueSubdirecciones, setUniqueSubdirecciones] = useState<string[]>([]);
    const [detailRecord, setDetailRecord] = useState<T | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({ type: null, title: '', message: '' });

    const [editRecord, setEditRecord] = useState<T | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<T | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editForm, setEditForm] = useState<ProgramacionEditForm>({});
    const [areasData, setAreasData] = useState<{ id: string; name: string }[]>([]);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await service.getAll(viewAll);
            setRecords(data);
            setUniqueSubdirecciones(Array.from(new Set(data.map(r => r.areas?.subdirecciones?.name).filter(Boolean))) as string[]);
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        service.getCatalogos().then(data => setAreasData(data.areas)).catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDetailRecord(null);
                setEditRecord(null);
                setDeleteRecord(null);
                setFeedbackModal({ type: null, title: '', message: '' });
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const filtered = records.filter(r => {
        const term = searchTerm.toLowerCase();
        const matchSearch = !term || r.codigo.toLowerCase().includes(term) || r.tema.toLowerCase().includes(term) || r.solicitante?.names?.toLowerCase().includes(term) || false;
        const matchArea = !filterArea || r.areas?.name === filterArea;
        const matchSubdireccion = !filterSubdireccion || r.areas?.subdirecciones?.name === filterSubdireccion;
        const matchStart = !filterDateStart || new Date(r.fecha_inicio) >= new Date(filterDateStart);
        const matchEnd = !filterDateEnd || new Date(r.fecha_final) <= new Date(filterDateEnd);
        return matchSearch && matchArea && matchSubdireccion && matchStart && matchEnd;
    });

    const areaOptionsForFilter = filterSubdireccion
        ? Array.from(new Set(records.filter(r => r.areas?.subdirecciones?.name === filterSubdireccion).map(r => r.areas?.name).filter(Boolean))) as string[]
        : [];

    const filterValues: Record<string, string> = { search: searchTerm, area: filterArea, subdireccion: filterSubdireccion, dateStart: filterDateStart, dateEnd: filterDateEnd };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, tema o solicitante...' },
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'subdireccion', emptyLabel: 'Todas las Subdirecciones', options: uniqueSubdirecciones }] : []),
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'area', emptyLabel: 'Todas las Áreas', options: areaOptionsForFilter, disabled: !filterSubdireccion, disabledTitle: 'Seleccione primero una subdirección' }] : []),
        { type: 'date', key: 'dateStart', title: 'Fecha Inicio' },
        { type: 'date', key: 'dateEnd', title: 'Fecha Final' },
    ];
    const handleFilterChange = (key: string, value: string) => {
        if (key === 'search') setSearchTerm(value);
        else if (key === 'area') setFilterArea(value);
        else if (key === 'subdireccion') { setFilterSubdireccion(value); setFilterArea(''); }
        else if (key === 'dateStart') setFilterDateStart(value);
        else if (key === 'dateEnd') setFilterDateEnd(value);
    };
    const handleResetFilters = () => { setSearchTerm(''); setFilterArea(''); setFilterSubdireccion(''); setFilterDateStart(''); setFilterDateEnd(''); };

    const handleOpenEdit = (r: T) => {
        setEditForm({
            tema: r.tema,
            fecha_inicio: r.fecha_inicio.slice(0, 10),
            fecha_final: r.fecha_final.slice(0, 10),
            jornada: r.jornada,
            instituciones_convocadas: r.instituciones_convocadas ?? '',
            responsable_articulacion: r.responsable_articulacion ?? '',
            transporte_medio: r.transporte_medio ?? '',
            transporte_num_instituciones: r.transporte_num_instituciones,
            area_id: r.area_id,
        });
        setEditRecord(r);
    };

    const handleSave = async (successMessage: string, errorMessage: string) => {
        if (!editRecord) return;
        setIsSaving(true);
        try {
            await service.update(editRecord.id, editForm);
            setEditRecord(null);
            setFeedbackModal({ type: 'success', title: '¡Actualizado!', message: successMessage });
            void fetchRecords();
        } catch (error) {
            console.error('Error updating record:', error);
            setFeedbackModal({ type: 'error', title: 'Error', message: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (successMessage: string, errorMessage: string) => {
        if (!deleteRecord) return;
        setIsDeleting(true);
        try {
            await service.delete(deleteRecord.id);
            setDeleteRecord(null);
            setFeedbackModal({ type: 'success', title: '¡Eliminado!', message: successMessage });
            void fetchRecords();
        } catch (error) {
            console.error('Error deleting record:', error);
            setFeedbackModal({ type: 'error', title: 'Error', message: errorMessage });
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        records, loading, viewAll, setViewAll, fetchRecords, filtered,
        detailRecord, setDetailRecord, feedbackModal, setFeedbackModal,
        editRecord, setEditRecord, deleteRecord, setDeleteRecord,
        isSaving, isDeleting, editForm, setEditForm, areasData,
        filterValues, filterFields, handleFilterChange, handleResetFilters,
        handleOpenEdit, handleSave, handleDelete,
    };
}
