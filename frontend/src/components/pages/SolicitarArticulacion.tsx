import SlideBar from "../ui/SlideBar"
import MultiSelectModal from "../ui/MultiSelectModal"
import { useEffect, useState } from "react"
import { AxiosError } from "axios"
import { articulacionesService } from "../../services/articulacionesService"
import { salidasService, type CatalogoItem } from "../../services/salidasService"
import { useAuth } from "../../hooks/useAuth"
import type { ApiErrorPayload } from "../../types/api"
import type { CreateArticulacionPayload } from "../../types/articulaciones"
import { CheckCircle, AlertCircle, ClipboardList } from "lucide-react"

export default function SolicitarArticulacion() {
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        tema: '',
        fechaInicio: '',
        fechaFinal: '',
        jornada: 'Día Completo',
        transporteMedio: '',
        transporteNumInstituciones: '',
        areaId: '',
        solicitanteId: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [activeModal, setActiveModal] = useState<string | null>(null);

    // Chip inputs
    const [institucionesConvocadas, setInstitucionesConvocadas] = useState<string[]>([]);
    const [nuevaInstitucion, setNuevaInstitucion] = useState('');
    const [responsables, setResponsables] = useState<string[]>([]);
    const [nuevoResponsable, setNuevoResponsable] = useState('');

    // Single municipio select
    const [selectedLugarEvento, setSelectedLugarEvento] = useState<CatalogoItem | null>(null);

    // Catalog data
    const [municipiosData, setMunicipiosData] = useState<CatalogoItem[]>([]);
    const [areasData, setAreasData] = useState<CatalogoItem[]>([]);
    const [lideresData, setLideresData] = useState<CatalogoItem[]>([]);

    // Modals
    const [confirmModal, setConfirmModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<CreateArticulacionPayload | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<{
        type: 'success' | 'error' | null;
        title: string;
        message: string;
        codigo?: string;
    }>({ type: null, title: '', message: '' });

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const data = await salidasService.getCatalogos();
                setMunicipiosData(data.municipios);
                if (data.areas) setAreasData(data.areas as CatalogoItem[]);
                if (data.lideres) setLideresData(data.lideres);
            } catch (error) {
                console.error("Error fetching catalogos:", error);
                setFeedbackModal({ type: 'error', title: 'Error de Carga', message: 'Error al cargar listados. Por favor recargue la página.' });
            }
        };
        fetchCatalogos();
    }, []);

    useEffect(() => {
        if (institucionesConvocadas.length > 0 && errors.institucionesConvocadas) {
            setErrors(prev => ({ ...prev, institucionesConvocadas: false }));
        }
    }, [institucionesConvocadas, errors.institucionesConvocadas]);

    useEffect(() => {
        if (selectedLugarEvento && errors.lugarEvento) {
            setErrors(prev => ({ ...prev, lugarEvento: false }));
        }
    }, [selectedLugarEvento, errors.lugarEvento]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newErrors: Record<string, boolean> = {};

        if (user?.user_type?.name === 'superadmin') {
            if (!formData.areaId) newErrors.areaId = true;
            if (formData.areaId && !formData.solicitanteId) newErrors.solicitanteId = true;
        }
        if (user?.user_type?.name === 'admin_subdireccion' && !formData.solicitanteId) newErrors.solicitanteId = true;

        if (!formData.tema.trim()) newErrors.tema = true;
        if (!formData.fechaInicio) newErrors.fechaInicio = true;
        if (!formData.fechaFinal) newErrors.fechaFinal = true;
        if (!formData.jornada) newErrors.jornada = true;
        if (institucionesConvocadas.length === 0) newErrors.institucionesConvocadas = true;
        if (!formData.transporteMedio) newErrors.transporteMedio = true;
        if (!selectedLugarEvento) newErrors.lugarEvento = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setFeedbackModal({
                type: 'error',
                title: 'Campos Incompletos',
                message: 'Por favor, diligencie todos los campos requeridos marcados en rojo.'
            });
            return;
        }

        setErrors({});

        const mapJornada = (j: string) => {
            if (j === 'Mañana') return 'Manana';
            if (j === 'Tarde') return 'Tarde';
            return 'Completa';
        };

        const payload: CreateArticulacionPayload = {
            tipo_programacion: 'Articulación Intersectorial',
            tema: formData.tema,
            fecha_inicio: formData.fechaInicio,
            fecha_final: formData.fechaFinal,
            jornada: mapJornada(formData.jornada),
            instituciones_convocadas: institucionesConvocadas.join(', '),
            transporte_medio: formData.transporteMedio || undefined,
            transporte_num_instituciones: formData.transporteNumInstituciones ? parseInt(formData.transporteNumInstituciones) : undefined,
            lugar_evento_id: selectedLugarEvento?.id || undefined,
            responsable_articulacion: responsables.length > 0 ? responsables.join(', ') : undefined,
            area_id: user?.user_type?.name === 'superadmin' ? formData.areaId : undefined,
            solicitante_id: (user?.user_type?.name === 'admin_subdireccion' || (user?.user_type?.name === 'superadmin' && formData.solicitanteId)) ? formData.solicitanteId : undefined,
        };

        setPendingPayload(payload);
        setConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        if (!pendingPayload) return;
        setConfirmModal(false);
        setIsLoading(true);

        try {
            const result = await articulacionesService.create(pendingPayload);
            setFeedbackModal({
                type: 'success',
                title: '¡Articulación Registrada!',
                message: 'La articulación fue registrada exitosamente.',
                codigo: result.codigo
            });
            setFormData({ tema: '', fechaInicio: '', fechaFinal: '', jornada: 'Día Completo', transporteMedio: '', transporteNumInstituciones: '', areaId: '', solicitanteId: '' });
            setInstitucionesConvocadas([]);
            setNuevaInstitucion('');
            setResponsables([]);
            setNuevoResponsable('');
            setSelectedLugarEvento(null);
        } catch (error) {
            const apiError = error as AxiosError<ApiErrorPayload>;
            const msg = apiError.response?.data?.message || 'Error al guardar la articulación';
            setFeedbackModal({ type: 'error', title: 'Error', message: typeof msg === 'string' ? msg : JSON.stringify(msg) });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLideres = formData.areaId
        ? lideresData.filter(l => l.area_id === formData.areaId)
        : lideresData;

    return (
        <div className="bg-bg-light font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <SlideBar />
                <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50">
                    <div className="p-4 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-[22px]">hub</span>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-zinc-900">Articulación</h1>
                                        <p className="text-sm text-zinc-500">Registre una nueva articulación intersectorial</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-8 py-5 border-b border-zinc-100">
                                    <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
                                        Formulario de Articulación
                                    </h2>
                                    <p className="text-sm text-zinc-500 mt-0.5">Diligencie todos los campos requeridos</p>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                                    {/* Superadmin area/solicitante selectors */}
                                    {user?.user_type?.name === 'superadmin' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-zinc-100">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-zinc-700">Área <span className="text-red-500">*</span></label>
                                                <select
                                                    name="areaId"
                                                    value={formData.areaId}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.areaId ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                >
                                                    <option value="">Seleccione área</option>
                                                    {areasData.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            </div>
                                            {formData.areaId && (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-semibold text-zinc-700">Solicitante <span className="text-red-500">*</span></label>
                                                    <select
                                                        name="solicitanteId"
                                                        value={formData.solicitanteId}
                                                        onChange={handleInputChange}
                                                        className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.solicitanteId ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                    >
                                                        <option value="">Seleccione solicitante</option>
                                                        {filteredLideres.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {user?.user_type?.name === 'admin_subdireccion' && (
                                        <div className="grid grid-cols-1 gap-6 pb-6 border-b border-zinc-100">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-zinc-700">Solicitante <span className="text-red-500">*</span></label>
                                                <select
                                                    name="solicitanteId"
                                                    value={formData.solicitanteId}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.solicitanteId ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                >
                                                    <option value="">Seleccione solicitante</option>
                                                    {lideresData.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tipo Programación (read-only) */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-zinc-700">Tipo de Programación</label>
                                        <div className="h-12 px-4 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center">
                                            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                                                <span className="material-symbols-outlined text-[18px]">hub</span>
                                                Articulación Intersectorial
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tema */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-zinc-700">
                                            Tema / Actividad <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="tema"
                                            value={formData.tema}
                                            onChange={handleInputChange}
                                            className={`w-full h-12 px-4 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.tema ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                            placeholder="Describa el tema o actividad de la articulación"
                                        />
                                    </div>

                                    {/* Fechas y Jornada */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Fecha Inicio <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="fechaInicio"
                                                value={formData.fechaInicio}
                                                onChange={handleInputChange}
                                                className={`w-full h-12 px-4 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.fechaInicio ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Fecha Final <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="fechaFinal"
                                                value={formData.fechaFinal}
                                                onChange={handleInputChange}
                                                min={formData.fechaInicio}
                                                className={`w-full h-12 px-4 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.fechaFinal ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Jornada <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="jornada"
                                                value={formData.jornada}
                                                onChange={handleInputChange}
                                                className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.jornada ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                            >
                                                <option value="Día Completo">Día Completo</option>
                                                <option value="Mañana">Mañana</option>
                                                <option value="Tarde">Tarde</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Instituciones Convocadas */}
                                    <div className="pt-6 border-t border-zinc-100">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-1">
                                            <span className="material-symbols-outlined text-primary">apartment</span>
                                            Instituciones Convocadas
                                        </h3>
                                        <p className="text-sm text-zinc-500 mb-4">
                                            Escriba el nombre de cada institución y presione Enter o Añadir
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={nuevaInstitucion}
                                                    onChange={(e) => setNuevaInstitucion(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (nuevaInstitucion.trim()) {
                                                                setInstitucionesConvocadas(prev => [...prev, nuevaInstitucion.trim()]);
                                                                setNuevaInstitucion('');
                                                            }
                                                        }
                                                    }}
                                                    className={`flex-1 h-12 px-4 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.institucionesConvocadas && institucionesConvocadas.length === 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                    placeholder="Nombre de la institución..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (nuevaInstitucion.trim()) {
                                                            setInstitucionesConvocadas(prev => [...prev, nuevaInstitucion.trim()]);
                                                            setNuevaInstitucion('');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Añadir
                                                </button>
                                            </div>
                                            <div className={`p-4 bg-zinc-50 rounded-lg border min-h-[60px] flex items-center flex-wrap gap-2 ${errors.institucionesConvocadas && institucionesConvocadas.length === 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}>
                                                {institucionesConvocadas.length === 0 ? (
                                                    <p className={`text-sm italic ${errors.institucionesConvocadas ? 'text-red-500' : 'text-zinc-400'}`}>
                                                        No hay instituciones añadidas
                                                    </p>
                                                ) : (
                                                    institucionesConvocadas.map((inst, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                                                            {inst}
                                                            <button
                                                                type="button"
                                                                onClick={() => setInstitucionesConvocadas(prev => prev.filter((_, i) => i !== idx))}
                                                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Responsable de Articulación */}
                                    <div className="pt-6 border-t border-zinc-100">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-1">
                                            <span className="material-symbols-outlined text-primary">person</span>
                                            Responsable(s) de Articulación
                                        </h3>
                                        <p className="text-sm text-zinc-500 mb-4">
                                            Personas responsables de esta articulación
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={nuevoResponsable}
                                                    onChange={(e) => setNuevoResponsable(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (nuevoResponsable.trim()) {
                                                                setResponsables(prev => [...prev, nuevoResponsable.trim()]);
                                                                setNuevoResponsable('');
                                                            }
                                                        }
                                                    }}
                                                    className="flex-1 h-12 px-4 rounded-lg border border-zinc-200 focus:ring-primary focus:border-primary transition-all"
                                                    placeholder="Nombre del responsable..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (nuevoResponsable.trim()) {
                                                            setResponsables(prev => [...prev, nuevoResponsable.trim()]);
                                                            setNuevoResponsable('');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Añadir
                                                </button>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center flex-wrap gap-2">
                                                {responsables.length === 0 ? (
                                                    <p className="text-sm italic text-zinc-400">No hay responsables añadidos</p>
                                                ) : (
                                                    responsables.map((r, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                                                            {r}
                                                            <button
                                                                type="button"
                                                                onClick={() => setResponsables(prev => prev.filter((_, i) => i !== idx))}
                                                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transporte */}
                                    <div className="pt-6 border-t border-zinc-100">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-primary">directions_bus</span>
                                            Transporte
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Medio de Transporte <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="transporteMedio"
                                                    value={formData.transporteMedio}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.transporteMedio ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                >
                                                    <option value="">Seleccione medio</option>
                                                    <option value="Pasajero">Pasajero</option>
                                                    <option value="Permanente">Permanente</option>
                                                    <option value="Institucional">Institucional</option>
                                                    <option value="No Aplica">No Aplica</option>
                                                </select>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Número de Instituciones
                                                </label>
                                                <input
                                                    type="number"
                                                    name="transporteNumInstituciones"
                                                    value={formData.transporteNumInstituciones}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    className="w-full h-12 px-4 rounded-lg border border-zinc-200 focus:ring-primary focus:border-primary transition-all"
                                                    placeholder="Ej: 5"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-3 md:col-span-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-semibold text-zinc-700">
                                                        Lugar del Evento (Municipio) <span className="text-red-500">*</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveModal('lugarEvento')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">place</span>
                                                        Seleccionar Municipio
                                                    </button>
                                                </div>
                                                <div className={`p-4 bg-zinc-50 rounded-lg border min-h-[60px] flex items-center ${errors.lugarEvento ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}>
                                                    {selectedLugarEvento ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                                                            {selectedLugarEvento.name}
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedLugarEvento(null)}
                                                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <p className={`text-sm italic ${errors.lugarEvento ? 'text-red-500' : 'text-zinc-400'}`}>
                                                            No hay municipio seleccionado
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <div className="flex justify-end gap-4 pt-8 mt-4 border-t border-zinc-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({ tema: '', fechaInicio: '', fechaFinal: '', jornada: 'Día Completo', transporteMedio: '', transporteNumInstituciones: '', areaId: '', solicitanteId: '' });
                                                setInstitucionesConvocadas([]);
                                                setResponsables([]);
                                                setSelectedLugarEvento(null);
                                                setErrors({});
                                            }}
                                            className="px-6 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 transition-colors cursor-pointer"
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-8 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">send</span>
                                            {isLoading ? 'Guardando...' : 'Registrar Articulación'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Lugar Evento Modal */}
            <MultiSelectModal
                isOpen={activeModal === 'lugarEvento'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar Lugar del Evento"
                items={municipiosData}
                selectedItems={selectedLugarEvento ? [selectedLugarEvento] : []}
                onSave={(selected) => setSelectedLugarEvento(selected.length > 0 ? selected[selected.length - 1] : null)}
                searchPlaceholder="Buscar municipio..."
                icon="place"
                singleSelect={true}
            />

            {/* Confirm Modal */}
            {confirmModal && pendingPayload && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(false); }}
                >
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 bg-blue-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <ClipboardList size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-blue-900">Confirmar Registro</h3>
                                    <p className="text-blue-700 text-sm">Revise la información antes de continuar</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Tema</span>
                                    <p className="text-zinc-900 font-medium">{pendingPayload.tema}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Jornada</span>
                                    <p className="text-zinc-900 font-medium">{formData.jornada}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Fecha Inicio</span>
                                    <p className="text-zinc-900">{pendingPayload.fecha_inicio}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Fecha Final</span>
                                    <p className="text-zinc-900">{pendingPayload.fecha_final}</p>
                                </div>
                            </div>
                            {institucionesConvocadas.length > 0 && (
                                <div>
                                    <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Instituciones ({institucionesConvocadas.length})</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {institucionesConvocadas.map((inst, i) => (
                                            <span key={i} className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs">{inst}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedLugarEvento && (
                                <div>
                                    <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Lugar del Evento</span>
                                    <p className="text-zinc-900">{selectedLugarEvento.name}</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 pb-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmModal(false)}
                                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                disabled={isLoading}
                                className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isLoading ? 'Enviando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackModal.type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className={`p-6 border-b ${feedbackModal.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${feedbackModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {feedbackModal.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${feedbackModal.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                                        {feedbackModal.title}
                                    </h3>
                                    {feedbackModal.codigo && (
                                        <p className="text-green-700 text-sm font-semibold">Código: {feedbackModal.codigo}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-zinc-700 text-sm">{feedbackModal.message}</p>
                        </div>
                        <div className="px-6 pb-6 flex justify-end">
                            <button
                                onClick={() => setFeedbackModal({ type: null, title: '', message: '' })}
                                className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
