import { useCallback, useEffect, useState } from "react";
import { RefreshCcw, Calendar, ClipboardList, FileDown, Upload, X, Plus, Trash2, FilePlus2 } from "lucide-react";
import FiltersPanel, { type FilterField } from '../ui/FiltersPanel';
import RecordsTable, { ViewButton } from '../ui/RecordsTable';
import type { TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';
import DocumentosAdicionales from '../ui/DocumentosAdicionales';
import SlideBar from "../ui/SlideBar";
import { useAuth } from "../../hooks/useAuth";
import { acompanamientosNoRegistradosService } from "../../services/acompanamientosNoRegistradosService";
import { salidasService } from "../../services/salidasService";
import type { CatalogoItem } from "../../types/salidas";
import type { AcompanamientoNoRegistrado } from "../../types/acompanamientoNoRegistrado";

const INSTITUCIONES = ['DLS', 'EAPB', 'ENTIDADES PRIVADAS', 'ENTIDADES PUBLICAS', 'IDSN', 'IPS', 'PARTICULAR', 'UNIVERSIDAD'];
const MATERIALES = ['Ninguno', 'Magnético', 'Impreso', 'Magnético/Impreso'];

interface Asistente { _id: string; identificacion: string; nombre: string; apellido: string; cargo: string; email: string; movil: string; }
interface OrdenDia { _id: string; tematica: string; responsable: string; }
interface Compromiso { _id: string; compromiso: string; responsable: string; fecha: string; observaciones: string; }

const uid = () => Math.random().toString(36).slice(2);
const emptyAsistente = (): Asistente => ({ _id: uid(), identificacion: '', nombre: '', apellido: '', cargo: '', email: '', movil: '' });
const emptyOrden = (): OrdenDia => ({ _id: uid(), tematica: '', responsable: '' });
const emptyCompromiso = (): Compromiso => ({ _id: uid(), compromiso: '', responsable: '', fecha: '', observaciones: '' });

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">{children}</h4>
            <div className="flex-1 h-px bg-zinc-200" />
        </div>
    );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            {children}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm bg-white";
const selectCls = "w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm bg-white";

interface NuevaActaDrawerProps { onClose: () => void; onSaved: () => void; municipios: CatalogoItem[]; }

function NuevaActaDrawer({ onClose, onSaved, municipios }: NuevaActaDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'formulario' | 'pdf'>('formulario');

    useEffect(() => {
        const t = requestAnimationFrame(() => setIsOpen(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(onClose, 300);
    };

    const [nombreReunion, setNombreReunion] = useState('');
    const [fechaReunion, setFechaReunion] = useState('');
    const [horaInicial, setHoraInicial] = useState('');
    const [horaFinal, setHoraFinal] = useState('');
    const [actaNumero, setActaNumero] = useState('');
    const [institucion, setInstitucion] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [lugar, setLugar] = useState('');
    const [material, setMaterial] = useState('');
    const [asistentes, setAsistentes] = useState<Asistente[]>([emptyAsistente()]);
    const [ordenDia, setOrdenDia] = useState<OrdenDia[]>([emptyOrden()]);
    const [desarrollo, setDesarrollo] = useState('');
    const [conclusiones, setConclusiones] = useState('');
    const [compromisos, setCompromisos] = useState<Compromiso[]>([]);
    const [proximaLugar, setProximaLugar] = useState('');
    const [proximaFecha, setProximaFecha] = useState('');
    const [proximaHora, setProximaHora] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const updateAsistente = (id: string, field: keyof Asistente, value: string) =>
        setAsistentes(prev => prev.map(a => a._id === id ? { ...a, [field]: value } : a));
    const updateOrden = (id: string, field: keyof OrdenDia, value: string) =>
        setOrdenDia(prev => prev.map(o => o._id === id ? { ...o, [field]: value } : o));
    const updateCompromiso = (id: string, field: keyof Compromiso, value: string) =>
        setCompromisos(prev => prev.map(c => c._id === id ? { ...c, [field]: value } : c));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombreReunion.trim() || !fechaReunion || !institucion || !municipio || !lugar.trim()) {
            setError('Los campos Nombre de la reunión, Fecha, Institución, Municipio y Lugar son obligatorios');
            return;
        }
        if (mode === 'formulario' && (!horaInicial || !horaFinal)) {
            setError('Los campos Hora inicial y Hora final son obligatorios');
            return;
        }
        if (mode === 'pdf' && !file) {
            setError('Debe seleccionar un archivo PDF');
            return;
        }
        setSaving(true); setError('');
        try {
            if (mode === 'pdf') {
                await acompanamientosNoRegistradosService.uploadArchivo({
                    nombre_reunion: nombreReunion,
                    fecha_reunion: fechaReunion,
                    institucion,
                    municipio,
                    lugar,
                }, file as File);
            } else {
                const clean = <T extends { _id: string }>(arr: T[]): Omit<T, '_id'>[] =>
                    arr.map(({ _id: _unused, ...rest }) => rest);
                await acompanamientosNoRegistradosService.create({
                    nombre_reunion: nombreReunion,
                    fecha_reunion: fechaReunion,
                    hora_inicial: horaInicial,
                    hora_final: horaFinal,
                    acta_numero: actaNumero || undefined,
                    institucion,
                    municipio,
                    lugar,
                    material_entregado: material || undefined,
                    asistentes: clean(asistentes.filter(a => a.nombre || a.identificacion)),
                    orden_del_dia: clean(ordenDia.filter(o => o.tematica)),
                    desarrollo: desarrollo || undefined,
                    conclusiones: conclusiones || undefined,
                    compromisos: clean(compromisos.filter(c => c.compromiso)),
                    proxima_lugar: proximaLugar || undefined,
                    proxima_fecha: proximaFecha || undefined,
                    proxima_hora: proximaHora || undefined,
                });
            }
            onSaved(); handleClose();
        } catch { setError('Error al guardar el acta'); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            <div
                className={`flex-1 backdrop-blur-sm transition-all duration-300 ${isOpen ? 'bg-black/40' : 'bg-black/0'}`}
                onClick={handleClose}
            />
            <div className={`w-full max-w-3xl bg-white shadow-2xl flex flex-col h-full overflow-hidden transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="shrink-0 px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-lg font-black text-zinc-900">Acta de Acompañamiento No Registrado</h2>
                        <p className="text-zinc-500 text-xs mt-0.5">Acompañamiento realizado que no fue programado previamente en el sistema</p>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"><X size={20} /></button>
                </div>

                {/* Body */}
                <form id="acta-no-registrada-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mb-2">{error}</div>}

                    <SectionTitle>Forma de Registro</SectionTitle>
                    <div className="flex gap-6 mt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="mode" checked={mode === 'formulario'} onChange={() => setMode('formulario')} className="accent-primary w-4 h-4" />
                            <span className="text-sm text-zinc-700">Diligenciar formulario</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="mode" checked={mode === 'pdf'} onChange={() => setMode('pdf')} className="accent-primary w-4 h-4" />
                            <span className="text-sm text-zinc-700">Subir acta escaneada (PDF)</span>
                        </label>
                    </div>

                    {/* Info reunión (común a ambos modos) */}
                    <SectionTitle>Información de la Reunión</SectionTitle>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <FieldLabel required>Nombre de la reunión</FieldLabel>
                            <input type="text" value={nombreReunion} onChange={e => setNombreReunion(e.target.value)} placeholder="Nombre o título de la reunión" className={inputCls} />
                        </div>
                        <div><FieldLabel required>Fecha</FieldLabel><input type="date" value={fechaReunion} onChange={e => setFechaReunion(e.target.value)} className={inputCls} /></div>
                        {mode === 'formulario' && <div><FieldLabel>Acta N°</FieldLabel><input type="text" value={actaNumero} onChange={e => setActaNumero(e.target.value)} placeholder="Número de acta" className={inputCls} /></div>}
                        {mode === 'formulario' && <div><FieldLabel required>Hora inicial</FieldLabel><input type="time" value={horaInicial} onChange={e => setHoraInicial(e.target.value)} className={inputCls} /></div>}
                        {mode === 'formulario' && <div><FieldLabel required>Hora final</FieldLabel><input type="time" value={horaFinal} onChange={e => setHoraFinal(e.target.value)} className={inputCls} /></div>}
                        <div>
                            <FieldLabel required>Institución</FieldLabel>
                            <select value={institucion} onChange={e => setInstitucion(e.target.value)} className={selectCls}>
                                <option value="">Seleccionar...</option>
                                {INSTITUCIONES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div>
                            <FieldLabel required>Municipio</FieldLabel>
                            <select value={municipio} onChange={e => setMunicipio(e.target.value)} className={selectCls}>
                                <option value="">Seleccionar...</option>
                                {municipios.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2"><FieldLabel required>Lugar</FieldLabel><input type="text" value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Lugar de la reunión" className={inputCls} /></div>
                        {mode === 'formulario' && (
                            <div className="col-span-2">
                                <FieldLabel>Material entregado</FieldLabel>
                                <select value={material} onChange={e => setMaterial(e.target.value)} className={selectCls}>
                                    <option value="">Seleccionar...</option>
                                    {MATERIALES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {mode === 'pdf' && (
                        <>
                            <SectionTitle>Archivo PDF</SectionTitle>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={e => setFile(e.target.files?.[0] ?? null)}
                                className={inputCls}
                            />
                            {file && <p className="text-zinc-500 text-xs mt-1">{file.name}</p>}
                        </>
                    )}

                    {mode === 'formulario' && (
                        <>
                            {/* Asistentes */}
                            <SectionTitle>Datos de Asistentes</SectionTitle>
                            <div className="space-y-3">
                                {asistentes.map((a, idx) => (
                                    <div key={a._id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Asistente {idx + 1}</span>
                                            {asistentes.length > 1 && <button type="button" onClick={() => setAsistentes(prev => prev.filter(x => x._id !== a._id))} className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><FieldLabel>Identificación</FieldLabel><input type="text" value={a.identificacion} onChange={e => updateAsistente(a._id, 'identificacion', e.target.value)} className={inputCls} /></div>
                                            <div><FieldLabel>Nombre</FieldLabel><input type="text" value={a.nombre} onChange={e => updateAsistente(a._id, 'nombre', e.target.value)} className={inputCls} /></div>
                                            <div><FieldLabel>Apellido</FieldLabel><input type="text" value={a.apellido} onChange={e => updateAsistente(a._id, 'apellido', e.target.value)} className={inputCls} /></div>
                                            <div><FieldLabel>Cargo</FieldLabel><input type="text" value={a.cargo} onChange={e => updateAsistente(a._id, 'cargo', e.target.value)} className={inputCls} /></div>
                                            <div><FieldLabel>Email</FieldLabel><input type="email" value={a.email} onChange={e => updateAsistente(a._id, 'email', e.target.value)} className={inputCls} /></div>
                                            <div><FieldLabel>Móvil</FieldLabel><input type="tel" value={a.movil} onChange={e => updateAsistente(a._id, 'movil', e.target.value)} className={inputCls} /></div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setAsistentes(prev => [...prev, emptyAsistente()])} className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors py-1">
                                    <Plus size={16} />Agregar asistente
                                </button>
                            </div>

                            {/* Orden del día */}
                            <SectionTitle>Orden del Día</SectionTitle>
                            <div className="space-y-2">
                                {ordenDia.map((o, idx) => (
                                    <div key={o._id} className="flex gap-3 items-start bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                                        <span className="text-xs font-bold text-zinc-400 mt-2.5 w-5 shrink-0">{idx + 1}.</span>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <div><FieldLabel>Temática</FieldLabel><input type="text" value={o.tematica} onChange={e => updateOrden(o._id, 'tematica', e.target.value)} className={inputCls} /></div>
                                            <div><FieldLabel>Responsable</FieldLabel><input type="text" value={o.responsable} onChange={e => updateOrden(o._id, 'responsable', e.target.value)} className={inputCls} /></div>
                                        </div>
                                        {ordenDia.length > 1 && <button type="button" onClick={() => setOrdenDia(prev => prev.filter(x => x._id !== o._id))} className="p-1.5 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors mt-5 shrink-0"><Trash2 size={14} /></button>}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setOrdenDia(prev => [...prev, emptyOrden()])} className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors py-1">
                                    <Plus size={16} />Agregar ítem
                                </button>
                            </div>

                            {/* Desarrollo */}
                            <SectionTitle>Desarrollo</SectionTitle>
                            <textarea value={desarrollo} onChange={e => setDesarrollo(e.target.value)} rows={5} maxLength={5000} placeholder="Descripción del desarrollo de la reunión..." className={`${inputCls} resize-none`} />
                            <p className="text-zinc-400 text-xs text-right">{desarrollo.length}/5000</p>

                            {/* Conclusiones */}
                            <SectionTitle>Conclusiones</SectionTitle>
                            <textarea value={conclusiones} onChange={e => setConclusiones(e.target.value)} rows={4} maxLength={5000} placeholder="Conclusiones de la reunión..." className={`${inputCls} resize-none`} />
                            <p className="text-zinc-400 text-xs text-right">{conclusiones.length}/5000</p>

                            {/* Compromisos */}
                            <SectionTitle>Compromisos / Tareas</SectionTitle>
                            <div className="space-y-3">
                                {compromisos.map((c, idx) => (
                                    <div key={c._id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Compromiso {idx + 1}</span>
                                            <button type="button" onClick={() => setCompromisos(prev => prev.filter(x => x._id !== c._id))} className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="col-span-2"><FieldLabel>Compromiso</FieldLabel><input type="text" value={c.compromiso} onChange={e => updateCompromiso(c._id, 'compromiso', e.target.value)} className={inputCls} /></div>
                                            <div><FieldLabel>Responsable</FieldLabel><input type="text" value={c.responsable} onChange={e => updateCompromiso(c._id, 'responsable', e.target.value)} className={inputCls} /></div>
                                            <div><FieldLabel>Fecha</FieldLabel><input type="date" value={c.fecha} onChange={e => updateCompromiso(c._id, 'fecha', e.target.value)} className={inputCls} /></div>
                                            <div className="col-span-2"><FieldLabel>Observaciones</FieldLabel><input type="text" value={c.observaciones} onChange={e => updateCompromiso(c._id, 'observaciones', e.target.value)} className={inputCls} /></div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setCompromisos(prev => [...prev, emptyCompromiso()])} className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors py-1">
                                    <Plus size={16} />Agregar compromiso
                                </button>
                            </div>

                            {/* Próxima reunión */}
                            <SectionTitle>Convocatoria Próxima Reunión</SectionTitle>
                            <div className="grid grid-cols-3 gap-4 pb-4">
                                <div className="col-span-3"><FieldLabel>Lugar</FieldLabel><input type="text" value={proximaLugar} onChange={e => setProximaLugar(e.target.value)} placeholder="Lugar de la próxima reunión" className={inputCls} /></div>
                                <div><FieldLabel>Fecha</FieldLabel><input type="date" value={proximaFecha} onChange={e => setProximaFecha(e.target.value)} className={inputCls} /></div>
                                <div><FieldLabel>Hora</FieldLabel><input type="time" value={proximaHora} onChange={e => setProximaHora(e.target.value)} className={inputCls} /></div>
                            </div>
                        </>
                    )}
                </form>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
                    <button type="button" onClick={handleClose} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                    <button type="submit" form="acta-no-registrada-form" disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                        {saving ? <RefreshCcw size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                        {saving ? 'Guardando...' : 'Guardar Acta'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const columns: TableColumn<AcompanamientoNoRegistrado>[] = [
    { header: 'Código', render: r => <span className="font-mono font-bold text-primary text-xs">{r.codigo}</span> },
    { header: 'Nombre reunión', render: r => <span className="max-w-[180px] truncate font-medium text-zinc-800 block">{r.nombre_reunion || '—'}</span> },
    { header: 'Institución', render: r => <span className="text-zinc-600 text-xs">{r.institucion || '—'}</span> },
    { header: 'Municipio', render: r => <span className="text-zinc-600 text-xs">{r.municipio || '—'}</span> },
    {
        header: 'Fecha', render: r => (
            <span className="flex items-center gap-1 text-zinc-600 whitespace-nowrap">
                <Calendar size={12} className="text-zinc-400" />{r.fecha_reunion ? new Date(r.fecha_reunion).toLocaleDateString('es-CO') : '—'}
            </span>
        )
    },
    { header: 'Área', render: r => <span className="text-zinc-600 text-xs">{r.areas?.name || '—'}</span> },
    { header: 'Registrado por', render: r => <span className="text-zinc-600 text-xs">{r.registrador?.names || '—'}</span> },
    {
        header: 'Acta', render: r => (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${r.archivo_manual_nombre ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                {r.archivo_manual_nombre ? 'PDF escaneado' : 'Formulario'}
            </span>
        )
    },
];

export default function ActaAcompanamientoNoRegistrado() {
    const { user } = useAuth();
    const [records, setRecords] = useState<AcompanamientoNoRegistrado[]>([]);
    const [municipios, setMunicipios] = useState<CatalogoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [detailRecord, setDetailRecord] = useState<AcompanamientoNoRegistrado | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const isSuperAdmin = user?.user_type?.name === 'superadmin';

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await acompanamientosNoRegistradosService.getAll(viewAll);
            setRecords(data);
        } catch (err) {
            console.error('Error fetching records:', err);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        salidasService.getCatalogos().then(d => setMunicipios(d.municipios)).catch(() => { });
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setDetailRecord(null); setShowForm(false); }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleDownloadCertificado = async (record: AcompanamientoNoRegistrado) => {
        setDownloadingId(record.id);
        try {
            await acompanamientosNoRegistradosService.downloadCertificado(record.id, record.codigo);
        } catch { alert('Error al generar el certificado'); }
        finally { setDownloadingId(null); }
    };

    const handleDownloadArchivo = async (record: AcompanamientoNoRegistrado) => {
        setDownloadingId(record.id);
        try {
            await acompanamientosNoRegistradosService.downloadArchivo(record.id, record.codigo);
        } catch { alert('Error al descargar el acta escaneada'); }
        finally { setDownloadingId(null); }
    };

    const filterValues: Record<string, string> = { search: searchTerm };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, nombre de reunión o institución...' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'search') setSearchTerm(value);
    };

    const displayRecords = records.filter(r => {
        const term = searchTerm.toLowerCase();
        return !term ||
            r.codigo.toLowerCase().includes(term) ||
            (r.nombre_reunion?.toLowerCase().includes(term) ?? false) ||
            (r.institucion?.toLowerCase().includes(term) ?? false);
    });

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            {showForm && (
                <NuevaActaDrawer
                    municipios={municipios}
                    onClose={() => setShowForm(false)}
                    onSaved={() => { void fetchRecords(); }}
                />
            )}
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[32px]">note_add</span>
                            Acta de Acompañamiento No Registrado
                        </h1>
                        <p className="text-zinc-500 mt-2">Registre el acta de acompañamientos que se realizaron sin haber sido programados previamente</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <FilePlus2 size={16} />
                                Nueva Acta
                            </button>
                            {isSuperAdmin && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    {viewAll ? 'Ver solo mis registros' : 'Ver todos los registros'}
                                </button>
                            )}
                            <button onClick={() => void fetchRecords()} className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50 flex items-center gap-2">
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                Actualizar
                            </button>
                        </div>
                    </div>

                    <FiltersPanel values={filterValues} onChange={handleFilterChange} onReset={() => setSearchTerm('')} fields={filterFields} />

                    <RecordsTable
                        records={displayRecords}
                        loading={loading}
                        columns={columns}
                        renderActions={r => (
                            <>
                                {r.archivo_manual_nombre ? (
                                    <button
                                        onClick={() => handleDownloadArchivo(r)}
                                        disabled={downloadingId === r.id}
                                        title="Descargar acta escaneada"
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                                    >
                                        {downloadingId === r.id ? <RefreshCcw size={16} className="animate-spin" /> : <FileDown size={16} />}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleDownloadCertificado(r)}
                                        disabled={downloadingId === r.id}
                                        title="Descargar certificado"
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                                    >
                                        {downloadingId === r.id ? <RefreshCcw size={16} className="animate-spin" /> : <FileDown size={16} />}
                                    </button>
                                )}
                                <ViewButton onClick={() => setDetailRecord(r)} />
                            </>
                        )}
                        emptyIcon="note_add"
                        emptyMessage="No hay actas de acompañamiento no registrado"
                        emptySubMessage="Registre una nueva acta con el botón 'Nueva Acta'."
                    />
                </div>

                {detailRecord && (
                    <DetailModal title="Detalle del Acta" codigo={detailRecord.codigo} onClose={() => setDetailRecord(null)}>
                        <div className="p-6 space-y-4 text-sm">
                            <DetailGrid>
                                <DetailCard label="Registrado por">
                                    <p className="text-zinc-900 font-medium">{detailRecord.registrador?.names}</p>
                                    <p className="text-zinc-500 text-xs">{detailRecord.registrador?.email}</p>
                                </DetailCard>
                                <DetailCard label="Área">
                                    <p className="text-zinc-900 font-medium">{detailRecord.areas?.name || '—'}</p>
                                    {detailRecord.areas?.subdirecciones?.name && <p className="text-zinc-500 text-xs">{detailRecord.areas.subdirecciones.name}</p>}
                                </DetailCard>
                                <DetailCard label="Nombre reunión" fullWidth>
                                    <p className="text-zinc-800 font-medium">{detailRecord.nombre_reunion || '—'}</p>
                                </DetailCard>
                                <DetailCard label="Fecha" icon={<Calendar size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.fecha_reunion ? new Date(detailRecord.fecha_reunion).toLocaleDateString('es-CO') : '—'}</p>
                                </DetailCard>
                                <DetailCard label="Institución / Municipio">
                                    <p className="text-zinc-900 font-medium">{detailRecord.institucion || '—'}</p>
                                    <p className="text-zinc-500 text-xs">{detailRecord.municipio || '—'}</p>
                                </DetailCard>
                                {detailRecord.desarrollo && <DetailCard label="Desarrollo" fullWidth><p className="text-zinc-800 whitespace-pre-line">{detailRecord.desarrollo}</p></DetailCard>}
                                {detailRecord.conclusiones && <DetailCard label="Conclusiones" fullWidth><p className="text-zinc-800 whitespace-pre-line">{detailRecord.conclusiones}</p></DetailCard>}
                            </DetailGrid>
                            {detailRecord.archivo_manual_nombre && (
                                <p className="text-zinc-500 text-xs italic">Acta escaneada subida: <span className="font-medium text-zinc-700">{detailRecord.archivo_manual_nombre}</span></p>
                            )}
                            <div className="flex flex-wrap gap-3">
                                {detailRecord.archivo_manual_nombre ? (
                                    <button
                                        onClick={() => handleDownloadArchivo(detailRecord)}
                                        disabled={downloadingId === detailRecord.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {downloadingId === detailRecord.id ? <RefreshCcw size={14} className="animate-spin" /> : <Upload size={14} />}
                                        {downloadingId === detailRecord.id ? 'Descargando...' : 'Descargar Acta Escaneada'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleDownloadCertificado(detailRecord)}
                                        disabled={downloadingId === detailRecord.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {downloadingId === detailRecord.id ? <RefreshCcw size={14} className="animate-spin" /> : <FileDown size={14} />}
                                        {downloadingId === detailRecord.id ? 'Generando...' : 'Descargar Certificado'}
                                    </button>
                                )}
                            </div>

                            <DocumentosAdicionales basePath={`/acompanamientos-no-registrados/${detailRecord.id}`} />
                        </div>
                    </DetailModal>
                )}
            </main>
        </div>
    );
}
