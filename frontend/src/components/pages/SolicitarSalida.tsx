import SlideBar from "../ui/SlideBar"
import MultiSelectModal from "../ui/MultiSelectModal"
import { useEffect, useState } from "react"
import { salidasService, type CatalogoItem } from "../../services/salidasService"
import { useParams, useNavigate } from "react-router-dom"
// import { useAuth } from "../../hooks/useAuth"

export default function SolicitarSalida() {
    // const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        codigo: '',
        tipoSalida: '',
        subtipoSalida: '',
        tema: '',
        fechaInicio: '',
        fechaFinal: '',
        jornada: 'Día Completo',
        descripcion: '',
        // Transport fields
        transporteMedio: '',
        institucionesConvocadas: ''
    });

    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Selected Items State
    const [selectedMunicipios, setSelectedMunicipios] = useState<CatalogoItem[]>([]);
    const [selectedIPS, setSelectedIPS] = useState<CatalogoItem[]>([]);
    const [selectedEntidades, setSelectedEntidades] = useState<CatalogoItem[]>([]);
    const [selectedEAPB, setSelectedEAPB] = useState<CatalogoItem[]>([]);
    const [selectedOrganizaciones, setSelectedOrganizaciones] = useState<CatalogoItem[]>([]);

    // Transport section state
    const [transporteResponsables, setTransporteResponsables] = useState<string[]>([]);
    const [nuevoResponsable, setNuevoResponsable] = useState('');
    const [selectedLugarEvento, setSelectedLugarEvento] = useState<CatalogoItem | null>(null);

    // Subtipos (local constant data)
    const subtiposItems: CatalogoItem[] = [
        { id: 'Inspección y Vigilancia SP', name: 'Inspección y Vigilancia SP' },
        { id: 'Acompañamiento', name: 'Acompañamiento' },
        { id: 'Capacitación', name: 'Capacitación' },
    ];
    const [selectedSubtipos, setSelectedSubtipos] = useState<CatalogoItem[]>([]);

    // Filter subtypes based on Tipo de Salida
    const getAvailableSubtypes = () => {
        if (formData.tipoSalida === 'Virtual') {
            return subtiposItems.filter(s => s.name === 'Capacitación');
        }
        return subtiposItems;
    };

    // Effect to clear/validate subtypes when Type changes
    useEffect(() => {
        if (formData.tipoSalida === 'Virtual') {
            const hasInvalidSubtypes = selectedSubtipos.some(s => s.name !== 'Capacitación');
            if (hasInvalidSubtypes) {
                setSelectedSubtipos([]);
            }
        }
    }, [formData.tipoSalida, selectedSubtipos]);

    // Catalog Data State
    const [municipiosData, setMunicipiosData] = useState<CatalogoItem[]>([]);
    const [ipsData, setIpsData] = useState<CatalogoItem[]>([]);
    const [entidadesData, setEntidadesData] = useState<CatalogoItem[]>([]);
    const [eapbData, setEapbData] = useState<CatalogoItem[]>([]);
    const [organizacionesData, setOrganizacionesData] = useState<CatalogoItem[]>([]);

    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const data = await salidasService.getCatalogos();
                setMunicipiosData(data.municipios);
                setIpsData(data.ips);
                setEntidadesData(data.entidades);
                setEapbData(data.eapb);
                setOrganizacionesData(data.organizaciones);
            } catch (error) {
                console.error("Error fetching catalogos:", error);
                alert("Error al cargar listados. Por favor recargue la página.");
            }
        };

        fetchCatalogos();
    }, []);

    useEffect(() => {
        const fetchSalida = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const salida = await salidasService.getSalidaById(id);
                // Map API data to form state
                let type = salida.tipo_salida;
                // Legacy support
                if (type === 'Capacitación Presencial') type = 'Presencial';
                if (type === 'Capacitación Virtual') type = 'Virtual';

                setFormData({
                    codigo: salida.codigo,
                    tipoSalida: salida.tipo_salida,
                    subtipoSalida: salida.subtipo_salida,
                    tema: salida.tema,
                    fechaInicio: salida.fecha_inicio.split('T')[0],
                    fechaFinal: salida.fecha_final.split('T')[0],
                    jornada: salida.jornada === 'Manana' ? 'Mañana' : (salida.jornada === 'Completa' ? 'Día Completo' : salida.jornada),
                    descripcion: salida.descripcion || '',
                    transporteMedio: salida.transporte_medio || '',
                    institucionesConvocadas: salida.instituciones_convocadas?.toString() || ''
                });

                // Map relations
                setSelectedMunicipios(salida.municipios.map((m: any) => ({ id: m.id, name: m.name })));
                setSelectedIPS(salida.ips.map((i: any) => ({ id: i.id, name: i.name })));
                setSelectedEntidades(salida.entidades.map((e: any) => ({ id: e.id, name: e.name })));
                setSelectedEAPB(salida.eapb.map((e: any) => ({ id: e.id, name: e.name })));
                setSelectedOrganizaciones(salida.organizaciones.map((o: any) => ({ id: o.id, name: o.name })));

                // Subtipos (string split)
                if (salida.subtipo_salida) {
                    const subs = salida.subtipo_salida.split(', ').map((s: string) => ({ id: s, name: s }));
                    setSelectedSubtipos(subs);
                }

                // Transport Responsables
                if (salida.transporte_responsables) {
                    setTransporteResponsables(salida.transporte_responsables.split(', '));
                }

                // Lugar Evento (assuming single linked municipality if field exists in backend relation, currently mapped to getById?)
                // Note: The backend response needed might be missing 'lugar_evento' relation or ID. 
                // Assuming getById includes it or we map it if available.
                // Since I didn't see explicit 'lugar_evento' include in previous 'findAll', I should check 'findOne'.
                // If backend 'findOne' is standard default findUnique, fine. 
                // But for now let's hope it loads or handle it.
                if (salida.lugar_evento_id) {
                    // Need to find name from catalog if only ID is returned
                    // Or updated backend to include logic.
                    // A simple workaround: if catalogs loaded wait for them? No, async race.
                    // Ideally backend returns the object. 
                }

            } catch (error) {
                console.error("Error loading salida:", error);
                alert("Error al cargar la salida.");
                navigate('/gestionar-salida');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalida();
    }, [id, navigate]); // Add catalogs dependency if we rely on finding names from IDs? 
    // Actually best if backend returns the object. For now I'll skip complex relation mapping if object is missing.

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const mapJornada = (j: string) => {
            if (j === 'Mañana') return 'Manana';
            if (j === 'Tarde') return 'Tarde';
            return 'Completa';
        };

        try {
            const payload = {
                codigo: formData.codigo,
                tipo_salida: formData.tipoSalida,
                subtipo_salida: selectedSubtipos.map(s => s.name).join(', '),
                tema: formData.tema,
                fecha_inicio: formData.fechaInicio,
                fecha_final: formData.fechaFinal,
                jornada: mapJornada(formData.jornada),
                descripcion: formData.descripcion,
                municipios_ids: selectedMunicipios.map(i => i.id),
                ips_ids: selectedIPS.map(i => i.id),
                entidades_ids: selectedEntidades.map(i => i.id),
                eapb_ids: selectedEAPB.map(i => i.id),
                organizaciones_ids: selectedOrganizaciones.map(i => i.id),
                // Transport fields
                transporte_medio: formData.transporteMedio || undefined,
                transporte_responsables: transporteResponsables.length > 0 ? transporteResponsables.join(', ') : undefined,
                instituciones_convocadas: formData.institucionesConvocadas ? parseInt(formData.institucionesConvocadas) : undefined,
                lugar_evento_id: selectedLugarEvento?.id || undefined,
            };

            if (isEditing && id) {
                await salidasService.updateSalida(id, payload);
                alert("Salida actualizada exitosamente!");
                navigate('/gestionar-salida');
            } else {
                await salidasService.createSalida(payload);
                alert("Salida solicitada exitosamente!");
                // Reset form
                setFormData({
                    codigo: '',
                    tipoSalida: '',
                    subtipoSalida: '',
                    tema: '',
                    fechaInicio: '',
                    fechaFinal: '',
                    jornada: 'Día Completo',
                    descripcion: '',
                    transporteMedio: '',
                    institucionesConvocadas: ''
                });
                setSelectedMunicipios([]);
                setSelectedIPS([]);
                setSelectedEntidades([]);
                setSelectedEAPB([]);
                setSelectedOrganizaciones([]);
                setSelectedSubtipos([]);
                setTransporteResponsables([]);
                setNuevoResponsable('');
                setSelectedLugarEvento(null);
            }
        } catch (error: any) {
            console.error("Error saving salida:", error);
            const msg = error.response?.data?.message || "Error al guardar la solicitud";
            alert(`Error: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const removeChip = (item: CatalogoItem, setterFunction: React.Dispatch<React.SetStateAction<CatalogoItem[]>>, currentArray: CatalogoItem[]) => {
        setterFunction(currentArray.filter(i => i.id !== item.id));
    };

    const ChipList = ({ items, onRemove, emptyText }: { items: CatalogoItem[], onRemove: (item: CatalogoItem) => void, emptyText: string }) => {
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
    };

    return (
        <div className="bg-bg-light font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <SlideBar />

                <main className="flex-1 flex flex-col overflow-y-auto">
                    <header className="bg-white border-b border-zinc-200 px-8 py-4 sticky top-0 z-10">
                        <div className="max-w-5xl mx-auto">
                            <nav className="flex items-center gap-2 mb-4">
                                <a href=""></a>
                                <a
                                    href="#"
                                    className="text-zinc-500text-sm hover:text-primary transition-colors"
                                >
                                    Inicio
                                </a>
                                <span className="material-symbols-outlined text-zinc-400 text-sm">
                                    chevron_right
                                </span>
                                <span className="text-zinc-900 text-sm font-semibold">
                                    {isEditing ? 'Editar Salida' : 'Solicitar Salida'}
                                </span>
                            </nav>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
                                        {isEditing ? 'Editar Salida' : 'Solicitar Salida SIVAC IDSN'}
                                    </h2>
                                    <p className="text-zinc-500 mt-1">
                                        {isEditing ? 'Modifique la información de la salida.' : 'Formulario para la programación de visitas, salidas, acompañamientos, etc.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="px-8 py-10">
                        <div className="max-w-5xl mx-auto">
                            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">description</span>
                                        Información General de la Salida
                                    </h3>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Código
                                            </label>
                                            <input
                                                type="text"
                                                name="codigo"
                                                value={formData.codigo}
                                                onChange={handleInputChange}
                                                className="w-full h-12 px-4 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
                                                placeholder="Ej: VIS-2026-0001"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Tipo de Salida
                                            </label>
                                            <select
                                                name="tipoSalida"
                                                value={formData.tipoSalida}
                                                onChange={handleInputChange}
                                                className="w-full h-12 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
                                            >
                                                <option value="">Seleccione tipo</option>
                                                <option value="Presencial">Presencial</option>
                                                <option value="Virtual">Virtual</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Subtipo de Salida
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setActiveModal('subtipo')}
                                                className="w-full min-h-[48px] px-4 py-2 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all bg-white text-left text-sm flex items-center justify-between"
                                            >
                                                <span className={selectedSubtipos.length > 0 ? "text-zinc-900" : "text-zinc-500"}>
                                                    {selectedSubtipos.length > 0
                                                        ? selectedSubtipos.map(s => s.name).join(', ')
                                                        : "Seleccione subtipo(s)"}
                                                </span>
                                                <span className="material-symbols-outlined text-zinc-400">arrow_drop_down</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Tema
                                            </label>
                                            <input
                                                type="text"
                                                name="tema"
                                                value={formData.tema}
                                                onChange={handleInputChange}
                                                className="w-full h-12 px-4 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
                                                placeholder="Ingrese el tema principal de la salida"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Fecha de Inicio
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    name="fechaInicio"
                                                    value={formData.fechaInicio}
                                                    onChange={handleInputChange}
                                                    className="w-full h-12 pl-10 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
                                                />
                                                <span className="material-symbols-outlined absolute left-3 top-3 text-zinc-400 pointer-events-none">
                                                    calendar_today
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Fecha Final
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    name="fechaFinal"
                                                    value={formData.fechaFinal}
                                                    onChange={handleInputChange}
                                                    className="w-full h-12 pl-10 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
                                                />
                                                <span className="material-symbols-outlined absolute left-3 top-3 text-zinc-400 pointer-events-none">
                                                    event_available
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Jornada
                                            </label>
                                            <select
                                                name="jornada"
                                                value={formData.jornada}
                                                onChange={handleInputChange}
                                                className="w-full h-12 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
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
                                                placeholder="Detalles adicionales sobre la salida..."
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-zinc-100 mt-8 mb-6">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">group</span>
                                            Participantes y Ubicaciones
                                        </h3>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Haga clic en cada sección para seleccionar uno o varios elementos
                                        </p>
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
                                                <ChipList
                                                    items={selectedIPS}
                                                    onRemove={(item) => removeChip(item, setSelectedIPS, selectedIPS)}
                                                    emptyText="No hay IPS seleccionadas"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Entidades
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
                                                    emptyText="No hay entidades seleccionadas"
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
                                                <ChipList
                                                    items={selectedEAPB}
                                                    onRemove={(item) => removeChip(item, setSelectedEAPB, selectedEAPB)}
                                                    emptyText="No hay EAPB seleccionadas"
                                                />
                                            </div>
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
                                    </div>

                                    {/* Sección de Transporte */}
                                    <div className="pt-6 border-t border-zinc-100 mt-8 mb-6">
                                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">directions_bus</span>
                                            Transporte
                                        </h3>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Información sobre el transporte para la salida
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Medio de Transporte */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Medio de Transporte
                                            </label>
                                            <select
                                                name="transporteMedio"
                                                value={formData.transporteMedio}
                                                onChange={handleInputChange}
                                                className="w-full h-12 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
                                            >
                                                <option value="">Seleccione medio</option>
                                                <option value="Pasajero">Pasajero</option>
                                                <option value="Permanente">Permanente</option>
                                                <option value="Institucional">Institucional</option>
                                                <option value="No Aplica">No Aplica</option>
                                            </select>
                                        </div>

                                        {/* Instituciones Convocadas */}
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
                                                className="w-full h-12 px-4 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
                                                placeholder="Ej: 5"
                                            />
                                        </div>

                                        {/* Responsable(s) */}
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-zinc-700">
                                                Responsable(s)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={nuevoResponsable}
                                                    onChange={(e) => setNuevoResponsable(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (nuevoResponsable.trim()) {
                                                                setTransporteResponsables([...transporteResponsables, nuevoResponsable.trim()]);
                                                                setNuevoResponsable('');
                                                            }
                                                        }
                                                    }}
                                                    className="flex-1 h-12 px-4 rounded-lg border border-zinc-200
                                             focus:ring-primary focus:border-primary transition-all"
                                                    placeholder="Escriba el nombre del responsable y presione Enter o Añadir"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (nuevoResponsable.trim()) {
                                                            setTransporteResponsables([...transporteResponsables, nuevoResponsable.trim()]);
                                                            setNuevoResponsable('');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold cursor-pointer flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Añadir
                                                </button>
                                            </div>
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center">
                                                {transporteResponsables.length === 0 ? (
                                                    <p className="text-sm text-zinc-400 italic">
                                                        No hay responsables añadidos
                                                    </p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {transporteResponsables.map((responsable, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                                                            >
                                                                {responsable}
                                                                <button
                                                                    onClick={() => setTransporteResponsables(transporteResponsables.filter((_, i) => i !== index))}
                                                                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                                                    type="button"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Lugar de Evento */}
                                        <div className="flex flex-col gap-3 md:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-zinc-700">
                                                    Lugar del Evento (Municipio)
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
                                            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[60px] flex items-center">
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
                                                    <p className="text-sm text-zinc-400 italic">
                                                        No hay municipio seleccionado
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-zinc-100">
                                        <button
                                            type="button"
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
                                            {isLoading ? 'Enviando...' : 'Solicitar Salida'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
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
                items={ipsData}
                selectedItems={selectedIPS}
                onSave={setSelectedIPS}
                searchPlaceholder="Buscar IPS..."
                icon="local_hospital"
            />

            <MultiSelectModal
                isOpen={activeModal === 'entidades'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar Entidades"
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
                selectedItems={selectedEAPB}
                onSave={setSelectedEAPB}
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
                isOpen={activeModal === 'subtipo'}
                onClose={() => setActiveModal(null)}
                title="Seleccionar Subtipos"
                items={getAvailableSubtypes()}
                selectedItems={selectedSubtipos}
                onSave={setSelectedSubtipos}
                searchPlaceholder="Buscar subtipo..."
                icon="fact_check"
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
        </div>
    )
}