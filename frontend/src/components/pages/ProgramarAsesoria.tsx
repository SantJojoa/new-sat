import SlideBar from "../ui/SlideBar"
import React, { useEffect, useState } from "react"
import { AxiosError } from "axios"
import { asesoriasService } from "../../services/asesoriasService"
import { useAuth } from "../../hooks/useAuth"
import type { CreateAsesoriaPayload, AsesoriaAsistente, CatalogoItem } from "../../types/asesorias"
import type { ApiErrorPayload } from "../../types/api"
import { CheckCircle, AlertCircle, ClipboardList, Plus, Trash2 } from "lucide-react"



const MEDIOS = ['Email', 'Telefónico', 'Presencial', 'Oficio', 'Virtual'];
const INSTITUCIONES = ['DLS', 'EAPB', 'ENTIDADES PRIVADAS', 'ENTIDADES PÚBLICAS', 'IDSN', 'IPS', 'PARTICULAR', 'UNIVERSIDAD'];
const MATERIALES = ['Ninguno', 'Magnético', 'Magnético e Impreso'];
const EMPTY_ASISTENTE: AsesoriaAsistente = { identificacion: '', nombre: '', apellido: '', cargo: '', email: '', movil: '' };

const nowDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const nowTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const calcularDuracionMinutos = (horaInicio: string, horaFin: string): number | null => {
    if (!horaInicio || !horaFin) return null;
    const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    let diff = toMinutes(horaFin) - toMinutes(horaInicio);
    if (diff < 0) diff += 24 * 60;
    return diff;
};

export default function ProgramarAsesoria() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        fecha: nowDateStr(),
        hora: nowTimeStr(),
        horaFin: '',
        medio: '',
        institucion: '',
        municipioProcedenciaId: '',
        municipioOtro: '',
        temasTratados: '',
        materialEntregado: '',
        areaId: '',
        solicitanteId: '',
    });

    const [asistentes, setAsistentes] = useState<AsesoriaAsistente[]>([{ ...EMPTY_ASISTENTE }]);
    const [municipiosData, setMunicipiosData] = useState<CatalogoItem[]>([]);
    const [areasData, setAreasData] = useState<CatalogoItem[]>([]);
    const [lideresData, setLideresData] = useState<CatalogoItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [confirmModal, setConfirmModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<CreateAsesoriaPayload | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<{ type: 'success' | 'error' | null; title: string; message: string; codigo?: string }>({ type: null, title: '', message: '' });

    const duracionCalculada = calcularDuracionMinutos(formData.hora, formData.horaFin);

    useEffect(() => {
        asesoriasService.getCatalogos()
            .then(data => { setMunicipiosData(data.municipios); setAreasData(data.areas); setLideresData(data.lideres); })
            .catch(() => setFeedbackModal({ type: 'error', title: 'Error de Carga', message: 'No se pudieron cargar los listados' }))
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    }

    const handleAsistenteChange = (i: number, field: keyof AsesoriaAsistente, value: string) =>
        setAsistentes(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
    const addAsistente = () => setAsistentes(prev => [...prev, { ...EMPTY_ASISTENTE }]);
    const removeAsistente = (i: number) => { if (asistentes.length > 1) setAsistentes(prev => prev.filter((_, idx) => idx !== i)); };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newErrors: Record<string, boolean> = {};
        if (user?.user_type?.name === 'superadmin' && !formData.areaId) newErrors.areaId = true;
        if (!formData.fecha) newErrors.fecha = true;
        if (!formData.hora) newErrors.hora = true;
        if (!formData.horaFin) newErrors.horaFin = true;
        if (!formData.medio) newErrors.medio = true;
        if (!formData.institucion) newErrors.institucion = true;
        if (!formData.municipioProcedenciaId) newErrors.municipio = true;
        if (formData.municipioProcedenciaId === 'otro' && !formData.municipioOtro.trim()) newErrors.municipio = true;
        if (!formData.temasTratados.trim()) newErrors.temasTratados = true;
        if (!formData.materialEntregado) newErrors.materialEntregado = true;
        const validAsistentes = asistentes.filter(a => a.nombre.trim() && a.apellido.trim() && a.cargo?.trim());
        if (validAsistentes.length === 0) newErrors.asistentes = true;
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setFeedbackModal({ type: 'error', title: 'Campos Incompletos', message: 'Por favor diligencie todos los campos requeridos.' });
            return;
        }
        setErrors({});
        setPendingPayload({
            fecha: formData.fecha, hora: formData.hora, hora_fin: formData.horaFin, medio: formData.medio, institucion: formData.institucion,
            municipio_procedencia_id: formData.municipioProcedenciaId !== 'otro' ? formData.municipioProcedenciaId || undefined : undefined,
            municipio_otro: formData.municipioProcedenciaId === 'otro' ? formData.municipioOtro : undefined,
            asistentes: validAsistentes,
            temas_tratados: formData.temasTratados, material_entregado: formData.materialEntregado,
            area_id: user?.user_type?.name === 'superadmin' ? formData.areaId || undefined : undefined,
            solicitante_id: formData.solicitanteId || undefined,
        });
        setConfirmModal(true);
    };


    const handleConfirmSubmit = async () => {
        if (!pendingPayload) return;
        setConfirmModal(false);
        setIsLoading(true);
        try {
            const result = await asesoriasService.createAsesoria(pendingPayload);
            setFeedbackModal({ type: 'success', title: '¡Asesoría Registrada!', message: 'La asesoría fue programada exitosamente.', codigo: result.codigo });
            setFormData({ fecha: nowDateStr(), hora: nowTimeStr(), horaFin: '', medio: '', institucion: '', municipioProcedenciaId: '', municipioOtro: '', temasTratados: '', materialEntregado: '', areaId: '', solicitanteId: '' });
            setAsistentes([{ ...EMPTY_ASISTENTE }]);
        } catch (error) {
            const msg = (error as AxiosError<ApiErrorPayload>).response?.data?.message || 'Error al guardar';
            setFeedbackModal({ type: 'error', title: 'Error', message: typeof msg === 'string' ? msg : JSON.stringify(msg) });
        } finally {
            setIsLoading(false);
            setPendingPayload(null);
        }
    };
    const inputCls = (f: string) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors[f] ? 'border-red-400 bg-red-50' : 'border-zinc-200 bg-white'}`;
    const selCls = (f: string) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors[f] ? 'border-red-400 bg-red-50' : 'border-zinc-200 bg-white'}`;
    const rowInput = 'w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white';

    return (
        <div className="flex h-screen bg-zinc-50">
            <SlideBar />
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-primary">support_agent</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">Asesoría</h1>
                            <p className="text-sm text-zinc-500">Registre los datos de la asesoría realizada o a realizar</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {user?.user_type?.name === 'superadmin' && (
                            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                                <h2 className="text-base font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">admin_panel_settings</span>
                                    Configuración Superadmin
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Área <span className="text-red-500">*</span></label>
                                        <select name="areaId" value={formData.areaId} onChange={handleInputChange} className={selCls('areaId')}>
                                            <option value="">Seleccionar área...</option>
                                            {areasData.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Registrador</label>
                                        <select name="solicitanteId" value={formData.solicitanteId} onChange={handleInputChange} className={selCls('solicitanteId')}>
                                            <option value="">Usuario actual</option>
                                            {lideresData.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                                Datos Generales
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Fecha <span className="text-red-500">*</span></label>
                                    <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} className={inputCls('fecha')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Hora Inicial <span className="text-red-500">*</span></label>
                                    <input type="time" name="hora" value={formData.hora} onChange={handleInputChange} className={inputCls('hora')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Hora Final <span className="text-red-500">*</span></label>
                                    <input type="time" name="horaFin" value={formData.horaFin} onChange={handleInputChange} className={inputCls('horaFin')} />
                                    {duracionCalculada !== null && (
                                        <p className="text-xs text-zinc-500 mt-1">Duración: {duracionCalculada} minutos</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Medio <span className="text-red-500">*</span></label>
                                    <select name="medio" value={formData.medio} onChange={handleInputChange} className={selCls('medio')}>
                                        <option value="">Seleccionar medio...</option>
                                        {MEDIOS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Institución <span className="text-red-500">*</span></label>
                                    <select name="institucion" value={formData.institucion} onChange={handleInputChange} className={selCls('institucion')}>
                                        <option value="">Seleccionar institución...</option>
                                        {INSTITUCIONES.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Municipio de Procedencia <span className="text-red-500">*</span></label>
                                    <select name="municipioProcedenciaId" value={formData.municipioProcedenciaId} onChange={handleInputChange} className={selCls('municipio')}>
                                        <option value="">Seleccionar municipio...</option>
                                        {municipiosData.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        <option value="otro">Otro</option>
                                    </select>
                                    {formData.municipioProcedenciaId === 'otro' && (
                                        <input type="text" name="municipioOtro" value={formData.municipioOtro} onChange={handleInputChange} placeholder="Especifique el municipio" className={`mt-2 ${inputCls('municipio')}`} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-zinc-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">group</span>
                                    Datos Asistentes
                                    {errors.asistentes && <span className="text-xs text-red-500 font-normal ml-1">(mínimo uno requerido)</span>}
                                </h2>
                                <button type="button" onClick={addAsistente} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                                    <Plus size={14} /> Agregar
                                </button>
                            </div>
                            <div className="space-y-4">
                                {asistentes.map((a, idx) => (
                                    <div key={idx} className={`border rounded-lg p-4 ${errors.asistentes ? 'border-red-300 bg-red-50/30' : 'border-zinc-100 bg-zinc-50/50'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-zinc-500">Asistente {idx + 1}</span>
                                            {asistentes.length > 1 && (
                                                <button type="button" onClick={() => removeAsistente(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['nombre', 'apellido'] as const).map(field => (
                                                <div key={field}>
                                                    <label className="block text-xs font-semibold text-zinc-600 mb-1 capitalize">{field.charAt(0).toUpperCase() + field.slice(1)} <span className="text-red-500">*</span></label>
                                                    <input type="text" value={a[field] as string} onChange={e => handleAsistenteChange(idx, field, e.target.value)} className={rowInput} />
                                                </div>
                                            ))}
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-600 mb-1">Cargo <span className="text-red-500">*</span></label>
                                                <input type="text" value={a.cargo || ''} onChange={e => handleAsistenteChange(idx, 'cargo', e.target.value)} className={rowInput} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-600 mb-1">Identificación</label>
                                                <input type="text" value={a.identificacion || ''} onChange={e => handleAsistenteChange(idx, 'identificacion', e.target.value)} className={rowInput} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-600 mb-1">Email</label>
                                                <input type="email" value={a.email || ''} onChange={e => handleAsistenteChange(idx, 'email', e.target.value)} className={rowInput} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-600 mb-1">Móvil</label>
                                                <input type="tel" value={a.movil || ''} onChange={e => handleAsistenteChange(idx, 'movil', e.target.value)} className={rowInput} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">topic</span>
                                Detalles de la Asesoría
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Temas Tratados <span className="text-red-500">*</span></label>
                                    <textarea name="temasTratados" value={formData.temasTratados} onChange={handleInputChange} placeholder="Temas tratados en la asesoría..." rows={4} className={`${inputCls('temasTratados')} resize-none`} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Material Entregado <span className="text-red-500">*</span></label>
                                    <select name="materialEntregado" value={formData.materialEntregado} onChange={handleInputChange} className={selCls('materialEntregado')}>
                                        <option value="">Seleccionar...</option>
                                        {MATERIALES.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
                                {isLoading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Guardando...</> : <><ClipboardList size={18} /> Registrar Asesoría</>}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            {confirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirmar Registro</h3>
                        <p className="text-sm text-zinc-600 mb-6">¿Está seguro que desea registrar esta asesoría?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmModal(false)} className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors">Cancelar</button>
                            <button onClick={handleConfirmSubmit} disabled={isLoading} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">{isLoading ? 'Enviando...' : 'Confirmar'}</button>
                        </div>
                    </div>
                </div>
            )}
            {feedbackModal.type && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
                        {feedbackModal.type === 'success' ? <CheckCircle className="text-green-500 mb-3 mx-auto" size={48} /> : <AlertCircle className="text-red-500 mb-3 mx-auto" size={48} />}
                        <h3 className="text-lg font-bold text-zinc-900 mb-1">{feedbackModal.title}</h3>
                        <p className="text-sm text-zinc-600 mb-2">{feedbackModal.message}</p>
                        {feedbackModal.codigo && <p className="text-sm font-mono bg-zinc-100 px-3 py-1 rounded-lg text-zinc-800 mb-4">Código: <strong>{feedbackModal.codigo}</strong></p>}
                        <button onClick={() => setFeedbackModal({ type: null, title: '', message: '' })} className="mt-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    )
}
