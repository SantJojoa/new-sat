import SlideBar from "../ui/SlideBar"
import MultiSelectModal from "../ui/MultiSelectModal"
import { useEffect, useState } from "react"
import { AxiosError } from "axios"
import { unidadAnalisisService, type CatalogoItem } from "../../services/unidadAnalisisService"
import type { CreateUnidadAnalisisPayload } from "../../services/unidadAnalisisService"
import { useParams, useNavigate } from "react-router-dom"
import { CheckCircle, AlertCircle, ClipboardList } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import type { ApiErrorPayload } from "../../types/api"
import type { EapbSelection, IpsSelection, IpsCatalogoItem, IpsActorItem, EapbActorItem } from "../../types/salidas"
import TagListInput from "../ui/TagListInput"

function ChipList({ items, onRemove, emptyText }: { items: CatalogoItem[], onRemove: (item: CatalogoItem) => void, emptyText: string }) {
    if (items.length === 0) {
        return (
            <p className="text-sm text-zinc-400 italic">
                {emptyText}
            </p>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                >
                    {item.name}
                    <button
                        onClick={() => onRemove(item)}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        type="button"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </span>
            ))}
        </div>
    );
}

export default function SolicitarUnidadAnalisis() {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        tipoSalida: '',
        tema: '',
        fechaInicio: '',
        fechaFinal: '',
        jornada: 'Día Completo',
        descripcion: '',
        transporteMedio: '',
        institucionesConvocadas: '',
        areaId: '',
        solicitanteId: ''
    });

    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    // Selected Items State
    const [selectedMunicipios, setSelectedMunicipios] = useState<CatalogoItem[]>([]);
    const [selectedIPS, setSelectedIPS] = useState<IpsSelection[]>([]);
    const [selectedEntidades, setSelectedEntidades] = useState<CatalogoItem[]>([]);
    const [selectedEAPB, setSelectedEAPB] = useState<EapbSelection[]>([]);
    const [selectedOrganizaciones, setSelectedOrganizaciones] = useState<CatalogoItem[]>([]);
    const [selectedIDSN, setSelectedIDSN] = useState<CatalogoItem[]>([]);

    // Transport section state
    const [transporteResponsables, setTransporteResponsables] = useState<string[]>([]);
    const [selectedLugarEvento, setSelectedLugarEvento] = useState<CatalogoItem | null>(null);

    // Modal states (replaces alerts)
    const [confirmModal, setConfirmModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<CreateUnidadAnalisisPayload | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<{
        type: 'success' | 'error' | null;
        title: string;
        message: string;
        codigo?: string;
    }>({ type: null, title: '', message: '' });

    // Catalog Data State
    const [municipiosData, setMunicipiosData] = useState<CatalogoItem[]>([]);
    const [ipsData, setIpsData] = useState<IpsCatalogoItem[]>([]);
    const [entidadesData, setEntidadesData] = useState<CatalogoItem[]>([]);
    const [eapbData, setEapbData] = useState<CatalogoItem[]>([]);
    const [eapbActoresData, setEapbActoresData] = useState<CatalogoItem[]>([]);
    const [activeEapbActorModal, setActiveEapbActorModal] = useState(false);
    const [eapbActorSearch, setEapbActorSearch] = useState('');
    const [selectedEapbActors, setSelectedEapbActors] = useState<CatalogoItem[]>([]);
    const [ipsActoresData, setIpsActoresData] = useState<CatalogoItem[]>([]);
    const [activeIpsActorModal, setActiveIpsActorModal] = useState(false);
    const [ipsActorSearch, setIpsActorSearch] = useState('');
    const [selectedIpsActors, setSelectedIpsActors] = useState<CatalogoItem[]>([]);
    const [organizacionesData, setOrganizacionesData] = useState<CatalogoItem[]>([]);
    const [idsnData, setIdsnData] = useState<CatalogoItem[]>([]);
    const [areasData, setAreasData] = useState<CatalogoItem[]>([]);
    const [lideresData, setLideresData] = useState<CatalogoItem[]>([]);

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const data = await unidadAnalisisService.getCatalogos();
                setMunicipiosData(data.municipios);
                setIpsData(data.ips);
                setIpsActoresData(data.ipsActores || []);
                setEntidadesData(data.entidades);
                setEapbData(data.eapb);
                setEapbActoresData(data.eapbActores || []);
                setOrganizacionesData(data.organizaciones);
                setIdsnData(data.idsn);
                setAreasData(data.areas);
                if (data.lideres) {
                    setLideresData(data.lideres);
                }
            } catch (error) {
                console.error("Error fetching catalogos:", error);
                setFeedbackModal({ type: 'error', title: 'Error de Carga', message: 'Error al cargar listados. Por favor recargue la página.' });
            }
        };

        fetchCatalogos();
    }, []);

    useEffect(() => {
        const fetchRegistro = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const registro = await unidadAnalisisService.getById(id);

                setFormData({
                    tipoSalida: registro.tipo_salida,
                    tema: registro.tema,
                    fechaInicio: registro.fecha_inicio.split('T')[0],
                    fechaFinal: registro.fecha_final.split('T')[0],
                    jornada: registro.jornada === 'Manana' ? 'Mañana' : (registro.jornada === 'Completa' ? 'Día Completo' : registro.jornada),
                    descripcion: registro.descripcion || '',
                    transporteMedio: registro.transporte_medio || '',
                    institucionesConvocadas: registro.instituciones_convocadas?.toString() || '',
                    areaId: registro.area_id || '',
                    solicitanteId: registro.solicitante_id || ''
                });

                setSelectedMunicipios(registro.municipios.map((m) => ({ id: m.id, name: m.name })));
                const ipsMap = new Map<string, any>();
                const actorMap = new Map<string, any>();
                registro.salida_ips.forEach((si: any) => {
                    if (!ipsMap.has(si.ips.id)) ipsMap.set(si.ips.id, si);
                    if (si.actor && !actorMap.has(si.actor.id)) actorMap.set(si.actor.id, si.actor);
                });
                setSelectedIPS([...ipsMap.values()].map((si: any) => ({
                    ips: { id: si.ips.id, type: si.ips.type },
                    actor: null
                })));
                setSelectedIpsActors([...actorMap.values()].map((a: any) => ({ id: a.id, name: a.name })));
                setSelectedEntidades(registro.entidades.map((e) => ({ id: e.id, name: e.name })));
                const eapbMap = new Map<string, any>();
                const eapbActorMap = new Map<string, any>();
                registro.salida_eapb.forEach((se: any) => {
                    if (!eapbMap.has(se.eapb.id)) eapbMap.set(se.eapb.id, se);
                    if (se.actor && !eapbActorMap.has(se.actor.id)) eapbActorMap.set(se.actor.id, se.actor);
                });
                setSelectedEAPB([...eapbMap.values()].map((se: any) => ({
                    eapb: { id: se.eapb.id, name: se.eapb.name },
                    actor: null
                })));
                setSelectedEapbActors([...eapbActorMap.values()].map((a: any) => ({ id: a.id, name: a.name })));
                setSelectedOrganizaciones(registro.organizaciones.map((o) => ({ id: o.id, name: o.name })));
                setSelectedIDSN(registro.idsn.map((i) => ({ id: i.id, name: i.name })));

                if (registro.transporte_responsables) {
                    setTransporteResponsables(registro.transporte_responsables.split(', '));
                }

                if (registro.lugar_evento) {
                    setSelectedLugarEvento({ id: registro.lugar_evento.id, name: registro.lugar_evento.name });
                }

            } catch (error) {
                console.error("Error loading registro:", error);
                setFeedbackModal({ type: 'error', title: 'Error', message: 'Error al cargar el registro.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegistro();
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    useEffect(() => {
        const hasAnyParticipant = selectedMunicipios.length > 0 ||
            selectedIPS.length > 0 ||
            selectedEntidades.length > 0 ||
            selectedEAPB.length > 0 ||
            selectedOrganizaciones.length > 0 ||
            selectedIDSN.length > 0;

        if (hasAnyParticipant && errors.participantes) {
            setErrors(prev => ({ ...prev, participantes: false }));
        }
    }, [selectedMunicipios, selectedIPS, selectedEntidades, selectedEAPB, selectedOrganizaciones, selectedIDSN, errors.participantes]);

    useEffect(() => {
        if (selectedLugarEvento && errors.lugarEvento) {
            setErrors(prev => ({ ...prev, lugarEvento: false }));
        }
    }, [selectedLugarEvento, errors.lugarEvento]);

    useEffect(() => {
        if (transporteResponsables.length > 0 && errors.transporteResponsables) {
            setErrors(prev => ({ ...prev, transporteResponsables: false }));
        }
    }, [transporteResponsables, errors.transporteResponsables]);

    useEffect(() => {
        if (selectedIpsActors.length > 0 && errors.ipsActores) {
            setErrors(prev => ({ ...prev, ipsActores: false }));
        }
    }, [selectedIpsActors, errors.ipsActores]);

    useEffect(() => {
        if (selectedEapbActors.length > 0 && errors.eapbActores) {
            setErrors(prev => ({ ...prev, eapbActores: false }));
        }
    }, [selectedEapbActors, errors.eapbActores]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newErrors: Record<string, boolean> = {};

        if (user?.user_type?.name === 'superadmin') {
            if (!formData.areaId) newErrors.areaId = true;
            if (formData.areaId && !formData.solicitanteId) newErrors.solicitanteId = true;
        }

        if (user?.user_type?.name === 'admin_subdireccion' && !formData.solicitanteId) newErrors.solicitanteId = true;

        if (!formData.tipoSalida) newErrors.tipoSalida = true;
        if (!formData.tema.trim()) newErrors.tema = true;
        if (!formData.fechaInicio) newErrors.fechaInicio = true;
        if (!formData.fechaFinal) newErrors.fechaFinal = true;
        if (!formData.jornada) newErrors.jornada = true;

        const hasAnyParticipant = selectedMunicipios.length > 0 ||
            selectedIPS.length > 0 ||
            selectedEntidades.length > 0 ||
            selectedEAPB.length > 0 ||
            selectedOrganizaciones.length > 0 ||
            selectedIDSN.length > 0;

        if (!hasAnyParticipant) {
            newErrors.participantes = true;
        }

        if (selectedIPS.length > 0 && selectedIpsActors.length === 0) newErrors.ipsActores = true;
        if (selectedEAPB.length > 0 && selectedEapbActors.length === 0) newErrors.eapbActores = true;

        if (!formData.transporteMedio) newErrors.transporteMedio = true;

        if (formData.transporteMedio && formData.transporteMedio !== 'No Aplica') {
            if (!formData.institucionesConvocadas || parseInt(formData.institucionesConvocadas) <= 0) {
                newErrors.institucionesConvocadas = true;
            }
            if (transporteResponsables.length === 0) {
                newErrors.transporteResponsables = true;
            }
        }

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

        const payload: CreateUnidadAnalisisPayload = {
            tipo_salida: formData.tipoSalida,
            tema: formData.tema,
            fecha_inicio: formData.fechaInicio,
            fecha_final: formData.fechaFinal,
            jornada: mapJornada(formData.jornada),
            descripcion: formData.descripcion,
            municipios_ids: selectedMunicipios.map(i => i.id),
            ips_actores: selectedIPS.flatMap<IpsActorItem>(i =>
                selectedIpsActors.map(actor => ({ ips_id: i.ips.id, actor_id: actor.id }))
            ),
            entidades_ids: selectedEntidades.map(i => i.id),
            eapb_actores: selectedEAPB.flatMap<EapbActorItem>(i =>
                selectedEapbActors.map(actor => ({ eapb_id: i.eapb.id, actor_id: actor.id }))
            ),
            organizaciones_ids: selectedOrganizaciones.map(i => i.id),
            idsn_ids: selectedIDSN.map(i => i.id),
            transporte_medio: formData.transporteMedio || undefined,
            transporte_responsables: transporteResponsables.length > 0 ? transporteResponsables.join(', ') : undefined,
            instituciones_convocadas: formData.institucionesConvocadas ? parseInt(formData.institucionesConvocadas) : undefined,
            lugar_evento_id: selectedLugarEvento?.id || undefined,
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
            if (isEditing && id) {
                await unidadAnalisisService.update(id, pendingPayload);
                setFeedbackModal({ type: 'success', title: '¡Registro Actualizado!', message: 'El registro de Unidad de Análisis fue actualizado exitosamente.' });
            } else {
                const result = await unidadAnalisisService.create(pendingPayload);
                setFeedbackModal({
                    type: 'success',
                    title: '¡Registro Creado!',
                    message: 'El registro de Unidad de Análisis fue creado exitosamente.',
                    codigo: result.codigo
                });
                setFormData({
                    tipoSalida: '',
                    tema: '',
                    fechaInicio: '',
                    fechaFinal: '',
                    jornada: 'Día Completo',
                    descripcion: '',
                    transporteMedio: '',
                    institucionesConvocadas: '',
                    areaId: '',
                    solicitanteId: ''
                });
                setSelectedMunicipios([]);
                setSelectedIPS([]);
                setSelectedIpsActors([]);
                setIpsActorSearch('');
                setSelectedEapbActors([]);
                setEapbActorSearch('');
                setSelectedEntidades([]);
                setSelectedEAPB([]);
                setSelectedOrganizaciones([]);
                setSelectedIDSN([]);
                setTransporteResponsables([]);
                setSelectedLugarEvento(null);
            }
        } catch (error) {
            const apiError = error as AxiosError<ApiErrorPayload>;
            console.error("Error saving registro:", error);
            const msg = apiError.response?.data?.message || "Error al guardar el registro";
            setFeedbackModal({ type: 'error', title: 'Error', message: typeof msg === 'string' ? msg : JSON.stringify(msg) });
        } finally {
            setIsLoading(false);
            setPendingPayload(null);
        }
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (feedbackModal.type) {
                    setFeedbackModal({ type: null, title: '', message: '' });
                } else if (confirmModal) {
                    setConfirmModal(false);
                }
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [feedbackModal.type, confirmModal]);

    const removeChip = (item: CatalogoItem, setterFunction: React.Dispatch<React.SetStateAction<CatalogoItem[]>>, currentArray: CatalogoItem[]) => {
        setterFunction(currentArray.filter(i => i.id !== item.id));
    };

    const removeIpsChip = (ipsId: string) => {
        setSelectedIPS(prev => prev.filter(s => s.ips.id !== ipsId));
    };

    const handleIpsModalSave = (selectedItems: CatalogoItem[]) => {
        setSelectedIPS(prev => {
            const prevMap = new Map(prev.map(s => [s.ips.id, s]));
            return selectedItems.map(item => ({
                ips: { id: item.id, type: item.name } as IpsCatalogoItem,
                actor: prevMap.get(item.id)?.actor ?? null,
            }));
        });
        setActiveModal(null);
        if (selectedItems.length > 0) {
            setActiveIpsActorModal(true);
        }
    };

    const removeEapbChip = (eapbId: string) => {
        setSelectedEAPB(prev => prev.filter(s => s.eapb.id !== eapbId));
    };

    const handleEapbModalSave = (selectedItems: CatalogoItem[]) => {
        setSelectedEAPB(prev => {
            const prevMap = new Map(prev.map(s => [s.eapb.id, s]));
            return selectedItems.map(item => ({
                eapb: item,
                actor: prevMap.get(item.id)?.actor ?? null,
            }));
        });
        setActiveModal(null);
        if (selectedItems.length > 0) {
            setActiveEapbActorModal(true);
        }
    };

    const closeIpsActorModal = () => {
        setIpsActorSearch('');
        setActiveIpsActorModal(false);
        if (selectedIpsActors.length === 0) {
            setSelectedIPS([]);
        }
    };

    const closeEapbActorModal = () => {
        setEapbActorSearch('');
        setActiveEapbActorModal(false);
        if (selectedEapbActors.length === 0) {
            setSelectedEAPB([]);
        }
    };

    return (
        <div className="bg-bg-light font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <SlideBar />

                <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50">
                    <div className="p-4 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <ClipboardList className="text-primary" size={22} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-zinc-900">{isEditing ? 'Editar Unidad de Análisis' : 'IV - Unidad de Análisis'}</h1>
                                        <p className="text-sm text-zinc-500">{isEditing ? 'Modifique la información del registro.' : 'Registro de Inspección y Vigilancia SP para la Unidad de Análisis. Puede registrarse cualquier fecha, pasada o futura.'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-8 py-5 border-b border-zinc-100">
                                    <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                                        Información General
                                    </h2>
                                    <p className="text-sm text-zinc-500 mt-0.5">Diligencie todos los campos requeridos</p>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                        {user?.user_type?.name === 'superadmin' && (
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Área <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="areaId"
                                                    value={formData.areaId}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all px-4 bg-white ${errors.areaId ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                >
                                                    <option value="" disabled>Seleccione un área...</option>
                                                    {areasData.map(area => (
                                                        <option key={area.id} value={area.id}>{area.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {user?.user_type?.name === 'admin_subdireccion' && (
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Líder Solicitante <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="solicitanteId"
                                                    value={formData.solicitanteId}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all px-4 bg-white ${errors.solicitanteId ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                >
                                                    <option value="" disabled>Seleccione un líder...</option>
                                                    {lideresData.map(lider => (
                                                        <option key={lider.id} value={lider.id}>{lider.name}</option>
                                                    ))}
                                                </select>
                                                {errors.solicitanteId && (
                                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                        <AlertCircle size={12} /> Seleccione un líder
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {user?.user_type?.name === 'superadmin' && formData.areaId && (
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Líder Solicitante <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="solicitanteId"
                                                    value={formData.solicitanteId}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all px-4 bg-white ${errors.solicitanteId ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                >
                                                    <option value="" disabled>Seleccione un líder...</option>
                                                    {lideresData.filter(l => l.area_id === formData.areaId).map(lider => (
                                                        <option key={lider.id} value={lider.id}>{lider.name}</option>
                                                    ))}
                                                </select>
                                                {errors.solicitanteId && (
                                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                        <AlertCircle size={12} /> Seleccione un líder
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Tipo <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="tipoSalida"
                                                value={formData.tipoSalida}
                                                onChange={handleInputChange}
                                                className={`w-full h-12 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.tipoSalida ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                            >
                                                <option value="">Seleccione tipo</option>
                                                <option value="Presencial">Presencial</option>
                                                <option value="Virtual">Virtual</option>
                                                <option value="Presencial y Virtual">Presencial y Virtual</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Tema <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="tema"
                                                value={formData.tema}
                                                onChange={handleInputChange}
                                                className={`w-full h-12 px-4 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.tema ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                placeholder="Ingrese el tema principal"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Fecha de Inicio <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    name="fechaInicio"
                                                    value={formData.fechaInicio}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-12 pl-10 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.fechaInicio ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                />
                                                <span className={`material-symbols-outlined absolute left-3 top-3 pointer-events-none ${errors.fechaInicio ? 'text-red-500' : 'text-zinc-400'}`}>
                                                    calendar_today
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Fecha Final <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    name="fechaFinal"
                                                    value={formData.fechaFinal}
                                                    onChange={handleInputChange}
                                                    className={`w-full h-12 pl-10 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.fechaFinal ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
                                                />
                                                <span className={`material-symbols-outlined absolute left-3 top-3 pointer-events-none ${errors.fechaFinal ? 'text-red-500' : 'text-zinc-400'}`}>
                                                    event_available
                                                </span>
                                            </div>
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
                                                <option>Mañana</option>
                                                <option>Tarde</option>
                                                <option>Día Completo</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Descripción (Opcional)
                                            </label>
                                            <textarea
                                                name="descripcion"
                                                value={formData.descripcion}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full p-4 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all resize-none"
                                                placeholder="Detalles adicionales..."
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-zinc-100 mt-8 mb-6">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">group</span>
                                            Actores y Ubicaciones
                                        </h3>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Haga clic en cada sección para seleccionar uno o varios elementos
                                        </p>
                                        {errors.participantes && (
                                            <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm flex items-center gap-2 mb-4">
                                                <AlertCircle size={18} />
                                                Debe seleccionar al menos un actor (Municipio, IPS, Entidad, EAPB, Organización o IDSN).
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Municipios Convocados
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('municipios')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Seleccionar Municipios
                                                </button>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center">
                                                <ChipList
                                                    items={selectedMunicipios}
                                                    onRemove={(item) => removeChip(item, setSelectedMunicipios, selectedMunicipios)}
                                                    emptyText="No hay municipios seleccionados"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    IPS (Instituciones Prestadoras de Salud)
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('ips')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Seleccionar IPS
                                                </button>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center">
                                                {selectedIPS.length === 0 ? (
                                                    <p className="text-sm text-zinc-400 italic">No hay IPS seleccionadas</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedIPS.map(sel => (
                                                                <span key={sel.ips.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                                                                    <span>{sel.ips.type}</span>
                                                                    <button onClick={() => removeIpsChip(sel.ips.id)} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors" type="button">
                                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {selectedIpsActors.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                                                                <span className="text-xs text-zinc-500 font-semibold">Actores:</span>
                                                                {selectedIpsActors.map(actor => (
                                                                    <span key={actor.id} className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                                                                        {actor.name}
                                                                        <button onClick={() => setSelectedIpsActors(prev => prev.filter(a => a.id !== actor.id))} className="hover:bg-primary/30 rounded-full p-0.5 transition-colors" type="button">
                                                                            <span className="material-symbols-outlined text-[13px]">close</span>
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {errors.ipsActores && (
                                                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm flex items-center gap-2">
                                                    <AlertCircle size={18} />
                                                    Debe seleccionar al menos un actor para las IPS elegidas.
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Entidades Territoriales
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('entidades')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Seleccionar Entidades
                                                </button>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center">
                                                <ChipList
                                                    items={selectedEntidades}
                                                    onRemove={(item) => removeChip(item, setSelectedEntidades, selectedEntidades)}
                                                    emptyText="No hay entidades territoriales seleccionadas"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    EAPB (Entidades Administradoras de Planes de Beneficios)
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('eapb')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Seleccionar EAPB
                                                </button>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center">
                                                {selectedEAPB.length === 0 ? (
                                                    <p className="text-sm text-zinc-400 italic">No hay EAPB seleccionadas</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedEAPB.map(sel => (
                                                                <span key={sel.eapb.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                                                                    <span>{sel.eapb.name}</span>
                                                                    <button onClick={() => removeEapbChip(sel.eapb.id)} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors" type="button">
                                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {selectedEapbActors.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                                                                <span className="text-xs text-zinc-500 font-semibold">Actores:</span>
                                                                {selectedEapbActors.map(actor => (
                                                                    <span key={actor.id} className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                                                                        {actor.name}
                                                                        <button onClick={() => setSelectedEapbActors(prev => prev.filter(a => a.id !== actor.id))} className="hover:bg-primary/30 rounded-full p-0.5 transition-colors" type="button">
                                                                            <span className="material-symbols-outlined text-[13px]">close</span>
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {errors.eapbActores && (
                                                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm flex items-center gap-2">
                                                    <AlertCircle size={18} />
                                                    Debe seleccionar al menos un actor para las EAPB elegidas.
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Organizaciones
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('organizaciones')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Seleccionar Organizaciones
                                                </button>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center">
                                                <ChipList
                                                    items={selectedOrganizaciones}
                                                    onRemove={(item) => removeChip(item, setSelectedOrganizaciones, selectedOrganizaciones)}
                                                    emptyText="No hay organizaciones seleccionadas"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    IDSN
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('idsn')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Seleccionar IDSN
                                                </button>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center">
                                                <ChipList
                                                    items={selectedIDSN}
                                                    onRemove={(item) => removeChip(item, setSelectedIDSN, selectedIDSN)}
                                                    emptyText="No hay IDSN seleccionados"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-zinc-100 mt-8 mb-6">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">person</span>
                                            Responsable(s)
                                        </h3>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Personas responsables de esta actividad
                                        </p>
                                    </div>

                                    <TagListInput
                                        values={transporteResponsables}
                                        onChange={setTransporteResponsables}
                                        placeholder="Escriba el nombre del responsable y presione Enter o Añadir"
                                        emptyText="No hay responsables añadidos"
                                        hasError={errors.transporteResponsables}
                                    />

                                    <div className="pt-6 border-t border-zinc-100 mt-8 mb-6">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">directions_bus</span>
                                            Transporte
                                        </h3>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Información sobre el transporte para la actividad
                                        </p>
                                    </div>

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
                                                <option value="" disabled>Seleccione medio</option>
                                                <option value="Pasajero">Pasajero</option>
                                                <option value="Permanente">Permanente</option>
                                                <option value="Institucional">Institucional</option>
                                                <option value="No Aplica">No Aplica</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Número de Instituciones Convocadas
                                            </label>
                                            <input
                                                type="number"
                                                name="institucionesConvocadas"
                                                value={formData.institucionesConvocadas}
                                                onChange={handleInputChange}
                                                min="0"
                                                className={`w-full h-12 px-4 rounded-lg border focus:ring-primary focus:border-primary transition-all ${errors.institucionesConvocadas ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-200'}`}
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
                                                            onClick={() => setSelectedLugarEvento(null)}
                                                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                                            type="button"
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

                                    <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-zinc-100">
                                        <button
                                            type="button"
                                            onClick={() => navigate(-1)}
                                            className="px-6 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 transition-colors cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-8 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">send</span>
                                            {isLoading ? 'Enviando...' : 'Registrar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main >
            </div >
            <MultiSelectModal
                isOpen={activeModal === 'municipios'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar Municipios"
                items={municipiosData}
                selectedItems={selectedMunicipios}
                onSave={setSelectedMunicipios}
                searchPlaceholder="Buscar municipio..."
                icon="location_on"
            />

            <MultiSelectModal
                isOpen={activeModal === 'ips'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar IPS"
                items={ipsData.map(i => ({ id: i.id, name: i.type }))}
                selectedItems={selectedIPS.map(s => ({ id: s.ips.id, name: s.ips.type }))}
                onSave={handleIpsModalSave}
                searchPlaceholder="Buscar IPS..."
                icon="local_hospital"
            />

            <MultiSelectModal
                isOpen={activeModal === 'entidades'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar Entidades Territoriales"
                items={entidadesData}
                selectedItems={selectedEntidades}
                onSave={setSelectedEntidades}
                searchPlaceholder="Buscar entidad..."
                icon="apartment"
            />

            <MultiSelectModal
                isOpen={activeModal === 'eapb'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar EAPB"
                items={eapbData}
                selectedItems={selectedEAPB.map(s => s.eapb)}
                onSave={handleEapbModalSave}
                searchPlaceholder="Buscar EAPB..."
                icon="health_and_safety"
            />

            <MultiSelectModal
                isOpen={activeModal === 'organizaciones'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar Organizaciones"
                items={organizacionesData}
                selectedItems={selectedOrganizaciones}
                onSave={setSelectedOrganizaciones}
                searchPlaceholder="Buscar organización..."
                icon="groups"
            />

            <MultiSelectModal
                isOpen={activeModal === 'idsn'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar IDSN"
                items={idsnData}
                selectedItems={selectedIDSN}
                onSave={setSelectedIDSN}
                searchPlaceholder="Buscar IDSN..."
                icon="health_and_safety"
            />

            {/* Modal para lugar de evento - single select usando array wrapper */}
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

            {/* Actor de IPS Modal */}
            {activeIpsActorModal && selectedIPS.length > 0 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={(e) => { if (e.target === e.currentTarget) closeIpsActorModal(); }}
                >
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-zinc-200 animate-slideUp">
                        <div className="p-6 border-b border-zinc-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 size-10 rounded-lg flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">person_check</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900">Actores a Visitar por IPS</h3>
                                        <p className="text-sm text-zinc-500 mt-0.5">Los actores seleccionados se aplicarán a las {selectedIPS.length} IPS elegidas</p>
                                    </div>
                                </div>
                                <button onClick={closeIpsActorModal} className="text-zinc-400 hover:text-zinc-600 transition-colors" type="button">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="mt-4 relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[20px]">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar actor..."
                                    value={ipsActorSearch}
                                    onChange={(e) => setIpsActorSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                            {ipsActoresData
                                .filter(a => a.name.toLowerCase().includes(ipsActorSearch.toLowerCase()))
                                .map(actor => {
                                    const isSelected = selectedIpsActors.some(a => a.id === actor.id);
                                    return (
                                        <label
                                            key={actor.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-primary/50 hover:bg-zinc-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => setSelectedIpsActors(prev =>
                                                    isSelected ? prev.filter(a => a.id !== actor.id) : [...prev, actor]
                                                )}
                                                className="text-primary focus:ring-primary rounded"
                                            />
                                            <span className={`text-sm ${isSelected ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                                                {actor.name}
                                            </span>
                                        </label>
                                    );
                                })
                            }
                            {ipsActoresData.filter(a => a.name.toLowerCase().includes(ipsActorSearch.toLowerCase())).length === 0 && (
                                <p className="text-sm text-zinc-400 italic text-center py-4">No se encontraron actores</p>
                            )}
                        </div>
                        <div className="p-6 border-t border-zinc-200 flex gap-3">
                            <button
                                onClick={closeIpsActorModal}
                                className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors"
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={closeIpsActorModal}
                                className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[20px]">check</span>
                                Confirmar ({selectedIpsActors.length} seleccionados)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actor de EAPB Modal */}
            {activeEapbActorModal && selectedEAPB.length > 0 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={(e) => { if (e.target === e.currentTarget) closeEapbActorModal(); }}
                >
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-zinc-200 animate-slideUp">
                        <div className="p-6 border-b border-zinc-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 size-10 rounded-lg flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">person_check</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900">Actores a Visitar por EAPB</h3>
                                        <p className="text-sm text-zinc-500 mt-0.5">Los actores seleccionados se aplicarán a las {selectedEAPB.length} EAPB elegidas</p>
                                    </div>
                                </div>
                                <button onClick={closeEapbActorModal} className="text-zinc-400 hover:text-zinc-600 transition-colors" type="button">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="mt-4 relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[20px]">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar actor..."
                                    value={eapbActorSearch}
                                    onChange={(e) => setEapbActorSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                            {eapbActoresData
                                .filter(a => a.name.toLowerCase().includes(eapbActorSearch.toLowerCase()))
                                .map(actor => {
                                    const isSelected = selectedEapbActors.some(a => a.id === actor.id);
                                    return (
                                        <label
                                            key={actor.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-primary/50 hover:bg-zinc-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => setSelectedEapbActors(prev =>
                                                    isSelected ? prev.filter(a => a.id !== actor.id) : [...prev, actor]
                                                )}
                                                className="text-primary focus:ring-primary rounded"
                                            />
                                            <span className={`text-sm ${isSelected ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                                                {actor.name}
                                            </span>
                                        </label>
                                    );
                                })
                            }
                            {eapbActoresData.filter(a => a.name.toLowerCase().includes(eapbActorSearch.toLowerCase())).length === 0 && (
                                <p className="text-sm text-zinc-400 italic text-center py-4">No se encontraron actores</p>
                            )}
                        </div>
                        <div className="p-6 border-t border-zinc-200 flex gap-3">
                            <button
                                onClick={closeEapbActorModal}
                                className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors"
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={closeEapbActorModal}
                                className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[20px]">check</span>
                                Confirmar ({selectedEapbActors.length} seleccionados)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {
                confirmModal && pendingPayload && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(false); }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-slideUp overflow-hidden max-h-[85vh] flex flex-col">
                            <div className="p-6 border-b border-zinc-200 bg-blue-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <ClipboardList size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-blue-900">{isEditing ? 'Confirmar Actualización' : 'Confirmar Registro'}</h3>
                                        <p className="text-blue-700 text-sm">Revise la información antes de continuar</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Tipo</span>
                                        <p className="text-zinc-900 font-medium">{formData.tipoSalida}</p>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Jornada</span>
                                        <p className="text-zinc-900 font-medium">{formData.jornada}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Tema</span>
                                        <p className="text-zinc-900 font-medium">{formData.tema}</p>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Fecha Inicio</span>
                                        <p className="text-zinc-900">{formData.fechaInicio}</p>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Fecha Final</span>
                                        <p className="text-zinc-900">{formData.fechaFinal}</p>
                                    </div>
                                </div>
                                {selectedMunicipios.length > 0 && (
                                    <div>
                                        <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Municipios ({selectedMunicipios.length})</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedMunicipios.map(m => (
                                                <span key={m.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200">{m.name}</span>
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
                            <div className="p-4 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50">
                                <button
                                    onClick={() => setConfirmModal(false)}
                                    className="px-4 py-2 text-zinc-700 font-medium hover:bg-zinc-200 rounded-lg transition-colors text-sm"
                                >
                                    Volver a Editar
                                </button>
                                <button
                                    onClick={handleConfirmSubmit}
                                    disabled={isLoading}
                                    className="px-5 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition-colors text-sm shadow-sm disabled:opacity-50"
                                >
                                    {isLoading ? 'Enviando...' : (isEditing ? 'Confirmar Actualización' : 'Confirmar y Enviar')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Feedback Modal (Success / Error) */}
            {
                feedbackModal.type && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) setFeedbackModal({ type: null, title: '', message: '' }); }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-slideUp overflow-hidden">
                            <div className={`p-6 flex flex-col items-center text-center ${feedbackModal.type === 'success' ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${feedbackModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {feedbackModal.type === 'success'
                                        ? <CheckCircle size={28} />
                                        : <AlertCircle size={28} />}
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${feedbackModal.type === 'success' ? 'text-green-900' : 'text-red-900'
                                    }`}>{feedbackModal.title}</h3>
                                <p className={`text-sm whitespace-pre-line ${feedbackModal.type === 'success' ? 'text-green-700' : 'text-red-700'
                                    }`}>{feedbackModal.message}</p>
                                {feedbackModal.codigo && (
                                    <div className="mt-4 bg-white border-2 border-green-300 rounded-lg px-5 py-3">
                                        <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold block mb-1">Código Asignado</span>
                                        <span className="text-2xl font-black text-green-700 font-mono">{feedbackModal.codigo}</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex justify-center bg-white border-t border-zinc-100">
                                <button
                                    onClick={() => {
                                        setFeedbackModal({ type: null, title: '', message: '' });
                                        if (feedbackModal.type === 'success' && isEditing) {
                                            navigate('/gestionar-unidad-analisis');
                                        }
                                    }}
                                    className={`px-6 py-2 text-white font-medium rounded-lg transition-colors text-sm shadow-sm ${feedbackModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
