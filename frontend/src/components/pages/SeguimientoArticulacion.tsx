import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCcw, Calendar, MapPin, Layers, ClipboardList, FileDown, Upload, X, Plus, Trash2 } from "lucide-react";
import FiltersPanel, { type FilterField } from '../ui/FiltersPanel';
import RecordsTable, { ViewButton, type TableColumn } from '../ui/RecordsTable';
import DetailModal, { DetailCard, DetailGrid } from '../ui/DetailModal';
import SlideBar from "../ui/SlideBar";
import { useAuth } from "../../hooks/useAuth";
import { articulacionesService } from "../../services/articulacionesService";
import type { ArticulacionCatalogosResponse, ArticulacionRecord } from "../../types/articulaciones";

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

interface ActaDrawerProps { record: ArticulacionRecord; onClose: () => void; onSaved: () => void; municipios: ArticulacionCatalogosResponse['municipios']; }

function ActaFormDrawer({ record, onClose, onSaved, municipios }: ActaDrawerProps) {
    const ex = record.seguimiento_articulacion;
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const t = requestAnimationFrame(() => setIsOpen(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(onClose, 300);
    };

    const [seProgramo, setSeProgramo] = useState<string>(ex != null ? String(ex.se_programo) : '');
    const [seRealizo, setSeRealizo] = useState<string>(ex != null ? String(ex.se_realizo) : '');
    const [nombreReunion, setNombreReunion] = useState(ex?.nombre_reunion ?? '');
    const [fechaReunion, setFechaReunion] = useState(ex?.fecha_reunion ? ex.fecha_reunion.split('T')[0] : '');
    const [horaInicial, setHoraInicial] = useState(ex?.hora_inicial ?? '');
    const [horaFinal, setHoraFinal] = useState(ex?.hora_final ?? '');
    const [actaNumero, setActaNumero] = useState(ex?.acta_numero ?? '');
    const [institucion, setInstitucion] = useState(ex?.institucion ?? '');
    const [municipio, setMunicipio] = useState(ex?.municipio ?? '');
    const [lugar, setLugar] = useState(ex?.lugar ?? '');
    const [material, setMaterial] = useState(ex?.material_entregado ?? '');
    const [asistentes, setAsistentes] = useState<Asistente[]>(
        ex?.asistentes?.length ? (ex.asistentes as Asistente[]).map(a => ({ ...a, _id: uid() })) : [emptyAsistente()]
    );
    const [ordenDia, setOrdenDia] = useState<OrdenDia[]>(
        ex?.orden_del_dia?.length ? (ex.orden_del_dia as OrdenDia[]).map(o => ({ ...o, _id: uid() })) : [emptyOrden()]
    );
    const [desarrollo, setDesarrollo] = useState(ex?.desarrollo ?? '');
    const [conclusiones, setConclusiones] = useState(ex?.conclusiones ?? '');
    const [compromisos, setCompromisos] = useState<Compromiso[]>(
        ex?.compromisos?.length ? (ex.compromisos as Compromiso[]).map(c => ({ ...c, _id: uid() })) : []
    );
    const [proximaLugar, setProximaLugar] = useState(ex?.proxima_lugar ?? '');
    const [proximaFecha, setProximaFecha] = useState(ex?.proxima_fecha ? ex.proxima_fecha.split('T')[0] : '');
    const [proximaHora, setProximaHora] = useState(ex?.proxima_hora ?? '');
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
        if (!seProgramo || !seRealizo) { setError('Los campos ¿Se programó? y ¿Se realizó? son obligatorios'); return; }
        if (!nombreReunion.trim() || !fechaReunion || !horaInicial || !horaFinal || !institucion || !municipio || !lugar.trim()) {
            setError('Los campos Nombre de la reunión, Fecha, Hora inicial, Hora final, Institución, Municipio y Lugar son obligatorios');
            return;
        }
        setSaving(true); setError('');
        try {
            const clean = <T extends { _id: string }>(arr: T[]): Omit<T, '_id'>[] =>
                arr.map(({ _id: _unused, ...rest }) => rest);
            await articulacionesService.setSeguimientoArticulacion(record.id, {
                se_programo: seProgramo === 'true',
                se_realizo: seRealizo === 'true',
                nombre_reunion: nombreReunion || undefined,
                fecha_reunion: fechaReunion || undefined,
                hora_inicial: horaInicial || undefined,
                hora_final: horaFinal || undefined,
                acta_numero: actaNumero || undefined,
                institucion: institucion || undefined,
                municipio: municipio || undefined,
                lugar: lugar || undefined,
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
            onSaved(); handleClose();
        } catch { setError('Error al guardar el seguimiento'); }
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
                        <h2 className="text-lg font-black text-zinc-900">Acta de Seguimiento de Articulación</h2>
                        <p className="text-zinc-500 text-xs mt-0.5">Código: <span className="font-mono font-bold text-primary">{record.codigo}</span> · {record.tema}</p>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"><X size={20} /></button>
                </div>

                {/* Body */}
                <form id="acta-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mb-2">{error}</div>}

                    {/* 1. Estado */}
                    <SectionTitle>Estado de la Reunión</SectionTitle>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel required>¿Se programó la articulación?</FieldLabel>
                            <div className="flex gap-6 mt-1">{[['true', 'Sí'], ['false', 'No']].map(([v, l]) => (
                                <label key={v} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="se_programo" value={v} checked={seProgramo === v} onChange={e => setSeProgramo(e.target.value)} className="accent-primary w-4 h-4" /><span className="text-sm text-zinc-700">{l}</span>
                                </label>
                            ))}</div>
                        </div>
                        <div>
                            <FieldLabel required>¿Se realizó la articulación?</FieldLabel>
                            <div className="flex gap-6 mt-1">{[['true', 'Sí'], ['false', 'No']].map(([v, l]) => (
                                <label key={v} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="se_realizo" value={v} checked={seRealizo === v} onChange={e => setSeRealizo(e.target.value)} className="accent-primary w-4 h-4" /><span className="text-sm text-zinc-700">{l}</span>
                                </label>
                            ))}</div>
                        </div>
                    </div>

                    {/* 2. Info reunión */}
                    <SectionTitle>Información de la Reunión</SectionTitle>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <FieldLabel required>Nombre de la reunión</FieldLabel>
                            <input type="text" value={nombreReunion} onChange={e => setNombreReunion(e.target.value)} placeholder="Nombre o título de la reunión" className={inputCls} />
                        </div>
                        <div><FieldLabel required>Fecha</FieldLabel><input type="date" value={fechaReunion} onChange={e => setFechaReunion(e.target.value)} className={inputCls} /></div>
                        <div><FieldLabel>Acta N°</FieldLabel><input type="text" value={actaNumero} onChange={e => setActaNumero(e.target.value)} placeholder="Número de acta" className={inputCls} /></div>
                        <div><FieldLabel required>Hora inicial</FieldLabel><input type="time" value={horaInicial} onChange={e => setHoraInicial(e.target.value)} className={inputCls} /></div>
                        <div><FieldLabel required>Hora final</FieldLabel><input type="time" value={horaFinal} onChange={e => setHoraFinal(e.target.value)} className={inputCls} /></div>
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
                        <div className="col-span-2">
                            <FieldLabel>Material entregado</FieldLabel>
                            <select value={material} onChange={e => setMaterial(e.target.value)} className={selectCls}>
                                <option value="">Seleccionar...</option>
                                {MATERIALES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* 3. Asistentes */}
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

                    {/* 4. Orden del día */}
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

                    {/* 5. Desarrollo */}
                    <SectionTitle>Desarrollo</SectionTitle>
                    <textarea value={desarrollo} onChange={e => setDesarrollo(e.target.value)} rows={5} maxLength={5000} placeholder="Descripción del desarrollo de la reunión..." className={`${inputCls} resize-none`} />
                    <p className="text-zinc-400 text-xs text-right">{desarrollo.length}/5000</p>

                    {/* 6. Conclusiones */}
                    <SectionTitle>Conclusiones</SectionTitle>
                    <textarea value={conclusiones} onChange={e => setConclusiones(e.target.value)} rows={4} maxLength={5000} placeholder="Conclusiones de la reunión..." className={`${inputCls} resize-none`} />
                    <p className="text-zinc-400 text-xs text-right">{conclusiones.length}/5000</p>

                    {/* 7. Compromisos */}
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

                    {/* 8. Próxima reunión */}
                    <SectionTitle>Convocatoria Próxima Reunión</SectionTitle>
                    <div className="grid grid-cols-3 gap-4 pb-4">
                        <div className="col-span-3"><FieldLabel>Lugar</FieldLabel><input type="text" value={proximaLugar} onChange={e => setProximaLugar(e.target.value)} placeholder="Lugar de la próxima reunión" className={inputCls} /></div>
                        <div><FieldLabel>Fecha</FieldLabel><input type="date" value={proximaFecha} onChange={e => setProximaFecha(e.target.value)} className={inputCls} /></div>
                        <div><FieldLabel>Hora</FieldLabel><input type="time" value={proximaHora} onChange={e => setProximaHora(e.target.value)} className={inputCls} /></div>
                    </div>
                </form>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
                    <button type="button" onClick={handleClose} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                    <button type="submit" form="acta-form" disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                        {saving ? <RefreshCcw size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                        {saving ? 'Guardando...' : 'Guardar Acta'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const articulacionColumns: TableColumn<ArticulacionRecord>[] = [
    { header: 'Código', render: r => <span className="font-mono font-bold text-primary text-xs">{r.codigo}</span> },
    { header: 'Tema', render: r => <span className="max-w-[180px] truncate font-medium text-zinc-800 block">{r.tema}</span> },
    { header: 'Tipo', render: r => <span className="text-xs text-zinc-700">{r.tipo_programacion}</span> },
    { header: 'Área', render: r => <span className="text-zinc-600">{r.areas?.name || '—'}</span> },
    {
        header: 'Fechas', render: r => (
            <div className="whitespace-nowrap text-zinc-600">
                <span className="flex items-center gap-1"><Calendar size={12} className="text-zinc-400" />{new Date(r.fecha_inicio).toLocaleDateString('es-CO')}</span>
                {r.fecha_inicio !== r.fecha_final && <span className="text-zinc-400 text-xs">→ {new Date(r.fecha_final).toLocaleDateString('es-CO')}</span>}
            </div>
        )
    },
    { header: 'Lugar', render: r => <span className="flex items-center gap-1 text-zinc-600"><MapPin size={12} className="text-zinc-400" />{r.lugar_evento?.name || '—'}</span> },
    { header: 'Solicitante', render: r => <span className="text-zinc-600 text-xs">{r.solicitante?.names || '—'}</span> },
    {
        header: 'Seguimiento', render: r => {
            const seg = r.seguimiento_articulacion;
            if (!seg) return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border bg-zinc-100 text-zinc-500 border-zinc-200">Pendiente</span>;
            return (
                <div className="space-y-0.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${seg.se_programo ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                        {seg.se_programo ? 'Programado' : 'No programado'}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${seg.se_realizo ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {seg.se_realizo ? 'Realizado' : 'No realizado'}
                    </span>
                </div>
            );
        }
    },
];

export default function SeguimientoArticulacion() {
    const { user } = useAuth();
    const [records, setRecords] = useState<ArticulacionRecord[]>([]);
    const [municipios, setMunicipios] = useState<ArticulacionCatalogosResponse['municipios']>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterSubdireccion, setFilterSubdireccion] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [uniqueSubdirecciones, setUniqueSubdirecciones] = useState<string[]>([]);
    const [uniqueMunicipios, setUniqueMunicipios] = useState<string[]>([]);
    const [uniqueYears, setUniqueYears] = useState<number[]>([]);
    const [detailRecord, setDetailRecord] = useState<ArticulacionRecord | null>(null);
    const [actaRecord, setActaRecord] = useState<ArticulacionRecord | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const uploadTargetRef = useRef<ArticulacionRecord | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSuperAdmin = user?.user_type?.name === 'superadmin';

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await articulacionesService.getAll(viewAll);
            setRecords(data);
            setUniqueSubdirecciones(Array.from(new Set(data.map(r => r.areas?.subdirecciones?.name).filter(Boolean))) as string[]);
            setUniqueMunicipios(Array.from(new Set(data.map(r => r.lugar_evento?.name).filter(Boolean))) as string[]);
            setUniqueYears(Array.from(new Set(data.map(r => new Date(r.fecha_inicio).getFullYear()))).sort((a, b) => b - a));
        } catch (err) {
            console.error('Error fetching records:', err);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        articulacionesService.getCatalogos().then(d => setMunicipios(d.municipios)).catch(() => { });
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setDetailRecord(null); setActaRecord(null); }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleResetFilters = () => {
        setSearchTerm(''); setFilterArea(''); setFilterSubdireccion('');
        setFilterMunicipio(''); setFilterMonth('');
        setFilterYear(''); setFilterDateStart(''); setFilterDateEnd('');
    };

    const handleDownloadCertificado = async (record: ArticulacionRecord) => {
        setDownloadingId(record.id);
        try {
            await articulacionesService.downloadCertificadoArticulacion(record.id, record.codigo);
        } catch { alert('Error al generar el certificado'); }
        finally { setDownloadingId(null); }
    };

    const handleDownloadArchivo = async (record: ArticulacionRecord) => {
        setDownloadingId(record.id);
        try {
            await articulacionesService.downloadActaArchivoArticulacion(record.id, record.codigo);
        } catch { alert('Error al descargar el acta escaneada'); }
        finally { setDownloadingId(null); }
    };

    const triggerUploadActa = (record: ArticulacionRecord) => {
        uploadTargetRef.current = record;
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        const record = uploadTargetRef.current;
        uploadTargetRef.current = null;
        if (!file || !record) return;
        if (file.type !== 'application/pdf') { alert('Solo se permiten archivos PDF'); return; }
        setUploadingId(record.id);
        try {
            await articulacionesService.uploadActaArticulacion(record.id, file);
            await fetchRecords();
        } catch { alert('Error al subir el acta escaneada'); }
        finally { setUploadingId(null); }
    };

    const areaOptionsForFilter = filterSubdireccion
        ? Array.from(new Set(records.filter(r => r.areas?.subdirecciones?.name === filterSubdireccion).map(r => r.areas?.name).filter(Boolean))) as string[]
        : [];

    const filterValues: Record<string, string> = { search: searchTerm, area: filterArea, subdireccion: filterSubdireccion, municipio: filterMunicipio, month: filterMonth, year: filterYear, dateStart: filterDateStart, dateEnd: filterDateEnd };
    const filterFields: FilterField[] = [
        { type: 'search', key: 'search', placeholder: 'Código, tema o solicitante...' },
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'subdireccion', emptyLabel: 'Todas las Subdirecciones', options: uniqueSubdirecciones }] : []),
        ...(isSuperAdmin ? [{ type: 'select' as const, key: 'area', emptyLabel: 'Todas las Áreas', options: areaOptionsForFilter, disabled: !filterSubdireccion, disabledTitle: 'Seleccione primero una subdirección' }] : []),
        { type: 'select', key: 'municipio', emptyLabel: 'Todos los Municipios', options: uniqueMunicipios, icon: 'pin' },
        { type: 'month', key: 'month' },
        { type: 'year', key: 'year', years: uniqueYears },
        { type: 'date', key: 'dateStart', title: 'Fecha Inicio' },
        { type: 'date', key: 'dateEnd', title: 'Fecha Final' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'search') setSearchTerm(value);
        else if (key === 'area') setFilterArea(value);
        else if (key === 'subdireccion') { setFilterSubdireccion(value); setFilterArea(''); }
        else if (key === 'municipio') setFilterMunicipio(value);
        else if (key === 'month') setFilterMonth(value);
        else if (key === 'year') setFilterYear(value);
        else if (key === 'dateStart') setFilterDateStart(value);
        else if (key === 'dateEnd') setFilterDateEnd(value);
    };

    const displayRecords = records.filter(r => {
        const term = searchTerm.toLowerCase();
        const matchSearch = !term || r.codigo.toLowerCase().includes(term) || r.tema?.toLowerCase().includes(term) || (r.solicitante?.names?.toLowerCase().includes(term) ?? false);
        const matchArea = !filterArea || r.areas?.name === filterArea;
        const matchSub = !filterSubdireccion || r.areas?.subdirecciones?.name === filterSubdireccion;
        const matchMun = !filterMunicipio || r.lugar_evento?.name === filterMunicipio;
        const matchMonth = !filterMonth || new Date(r.fecha_inicio).getMonth() + 1 === parseInt(filterMonth);
        const matchYear = !filterYear || new Date(r.fecha_inicio).getFullYear() === parseInt(filterYear);
        const s0 = new Date(r.fecha_inicio).toISOString().split('T')[0];
        const s1 = new Date(r.fecha_final).toISOString().split('T')[0];
        return matchSearch && matchArea && matchSub && matchMun && matchMonth && matchYear &&
            (!filterDateStart || s0 >= filterDateStart) && (!filterDateEnd || s1 <= filterDateEnd);
    });

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelected} />
            {actaRecord && (
                <ActaFormDrawer
                    record={actaRecord}
                    municipios={municipios}
                    onClose={() => setActaRecord(null)}
                    onSaved={() => { void fetchRecords(); }}
                />
            )}
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[32px]">hub</span>
                            Seguimiento de Articulaciones
                        </h1>
                        <p className="text-zinc-500 mt-2">Listado de articulaciones intersectoriales</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {isSuperAdmin && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    <Layers size={16} />
                                    {viewAll ? 'Ver solo mis registros' : 'Ver todos los registros'}
                                </button>
                            )}
                            <button onClick={() => void fetchRecords()} className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50 flex items-center gap-2">
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                Actualizar
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{displayRecords.length}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Con Acta Registrada</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{displayRecords.filter(r => r.seguimiento_articulacion).length}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pendientes de Acta</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{displayRecords.filter(r => !r.seguimiento_articulacion).length}</p>
                        </div>
                    </div>

                    <FiltersPanel values={filterValues} onChange={handleFilterChange} onReset={handleResetFilters} fields={filterFields} />

                    <RecordsTable
                        records={displayRecords}
                        loading={loading}
                        columns={articulacionColumns}
                        renderActions={r => {
                            const seg = r.seguimiento_articulacion;
                            const hasUploaded = !!seg?.archivo_manual_nombre;
                            const formGenerated = !!seg?.se_realizo && !hasUploaded;
                            return (
                                <>
                                    <button
                                        onClick={() => setActaRecord(r)}
                                        disabled={hasUploaded}
                                        title={hasUploaded ? 'Deshabilitado: ya se subió un acta escaneada' : 'Registrar acta de seguimiento'}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                                    >
                                        <ClipboardList size={16} />
                                    </button>
                                    <button
                                        onClick={() => triggerUploadActa(r)}
                                        disabled={formGenerated || uploadingId === r.id}
                                        title={formGenerated ? 'Deshabilitado: el acta ya se generó por formulario' : 'Subir acta escaneada (PDF)'}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                                    >
                                        {uploadingId === r.id ? <RefreshCcw size={16} className="animate-spin" /> : <Upload size={16} />}
                                    </button>
                                    {hasUploaded && (
                                        <button
                                            onClick={() => handleDownloadArchivo(r)}
                                            disabled={downloadingId === r.id}
                                            title="Descargar acta escaneada"
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                                        >
                                            {downloadingId === r.id ? <RefreshCcw size={16} className="animate-spin" /> : <FileDown size={16} />}
                                        </button>
                                    )}
                                    {!hasUploaded && formGenerated && (
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
                            );
                        }}
                        emptyIcon="hub"
                        emptyMessage="No hay registros de Articulaciones"
                        emptySubMessage="Registre una articulación intersectorial o ajuste los filtros."
                    />
                </div>

                {detailRecord && (
                    <DetailModal title="Detalle de Articulación" codigo={detailRecord.codigo} onClose={() => setDetailRecord(null)}>
                        <div className="p-6 space-y-4 text-sm">
                            <DetailGrid>
                                <DetailCard label="Solicitante">
                                    <p className="text-zinc-900 font-medium">{detailRecord.solicitante?.names}</p>
                                    <p className="text-zinc-500 text-xs">{detailRecord.solicitante?.email}</p>
                                </DetailCard>
                                <DetailCard label="Área" icon={<Layers size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.areas?.name || '—'}</p>
                                    {detailRecord.areas?.subdirecciones?.name && <p className="text-zinc-500 text-xs">{detailRecord.areas.subdirecciones.name}</p>}
                                </DetailCard>
                                <DetailCard label="Tipo">
                                    <p className="text-zinc-900 font-medium">{detailRecord.tipo_programacion}</p>
                                </DetailCard>
                                <DetailCard label="Fechas" icon={<Calendar size={10} />}>
                                    <p className="text-zinc-900 font-medium">{new Date(detailRecord.fecha_inicio).toLocaleDateString('es-CO')} → {new Date(detailRecord.fecha_final).toLocaleDateString('es-CO')}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">Jornada: {detailRecord.jornada}</p>
                                </DetailCard>
                                <DetailCard label="Lugar del Evento" icon={<MapPin size={10} />}>
                                    <p className="text-zinc-900 font-medium">{detailRecord.lugar_evento?.name || '—'}</p>
                                </DetailCard>
                                <DetailCard label="Tema / Actividad" fullWidth>
                                    <p className="text-zinc-800 font-medium">{detailRecord.tema}</p>
                                </DetailCard>
                            </DetailGrid>

                            <div className="border-t border-zinc-200 pt-4">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                    <ClipboardList size={13} /> Acta de Seguimiento
                                </h4>
                                {detailRecord.seguimiento_articulacion ? (
                                    <DetailGrid>
                                        <DetailCard label="¿Se programó?">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${detailRecord.seguimiento_articulacion.se_programo ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                                                {detailRecord.seguimiento_articulacion.se_programo ? 'Sí' : 'No'}
                                            </span>
                                        </DetailCard>
                                        <DetailCard label="¿Se realizó?">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${detailRecord.seguimiento_articulacion.se_realizo ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {detailRecord.seguimiento_articulacion.se_realizo ? 'Sí' : 'No'}
                                            </span>
                                        </DetailCard>
                                        {detailRecord.seguimiento_articulacion.acta_numero && <DetailCard label="Acta N°"><p className="text-zinc-900 font-medium">{detailRecord.seguimiento_articulacion.acta_numero}</p></DetailCard>}
                                        {detailRecord.seguimiento_articulacion.nombre_reunion && <DetailCard label="Nombre reunión" fullWidth><p className="text-zinc-900">{detailRecord.seguimiento_articulacion.nombre_reunion}</p></DetailCard>}
                                        {detailRecord.seguimiento_articulacion.desarrollo && <DetailCard label="Desarrollo" fullWidth><p className="text-zinc-800 whitespace-pre-line">{detailRecord.seguimiento_articulacion.desarrollo}</p></DetailCard>}
                                        {detailRecord.seguimiento_articulacion.conclusiones && <DetailCard label="Conclusiones" fullWidth><p className="text-zinc-800 whitespace-pre-line">{detailRecord.seguimiento_articulacion.conclusiones}</p></DetailCard>}
                                    </DetailGrid>
                                ) : (
                                    <p className="text-zinc-400 text-xs italic">Sin acta registrada aún.</p>
                                )}
                                {detailRecord.seguimiento_articulacion?.archivo_manual_nombre && (
                                    <p className="text-zinc-500 text-xs italic mt-2">Acta escaneada subida: <span className="font-medium text-zinc-700">{detailRecord.seguimiento_articulacion.archivo_manual_nombre}</span></p>
                                )}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {(() => {
                                        const seg = detailRecord.seguimiento_articulacion;
                                        const hasUploaded = !!seg?.archivo_manual_nombre;
                                        const formGenerated = !!seg?.se_realizo && !hasUploaded;
                                        return (
                                            <>
                                                <button
                                                    onClick={() => { setDetailRecord(null); setActaRecord(detailRecord); }}
                                                    disabled={hasUploaded}
                                                    title={hasUploaded ? 'Deshabilitado: ya se subió un acta escaneada' : undefined}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <ClipboardList size={14} />
                                                    {seg ? 'Editar Acta' : 'Registrar Acta'}
                                                </button>
                                                <button
                                                    onClick={() => triggerUploadActa(detailRecord)}
                                                    disabled={formGenerated || uploadingId === detailRecord.id}
                                                    title={formGenerated ? 'Deshabilitado: el acta ya se generó por formulario' : undefined}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {uploadingId === detailRecord.id ? <RefreshCcw size={14} className="animate-spin" /> : <Upload size={14} />}
                                                    {uploadingId === detailRecord.id ? 'Subiendo...' : 'Subir Acta Escaneada'}
                                                </button>
                                                {hasUploaded && (
                                                    <button
                                                        onClick={() => handleDownloadArchivo(detailRecord)}
                                                        disabled={downloadingId === detailRecord.id}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        {downloadingId === detailRecord.id ? <RefreshCcw size={14} className="animate-spin" /> : <FileDown size={14} />}
                                                        {downloadingId === detailRecord.id ? 'Descargando...' : 'Descargar Acta Escaneada'}
                                                    </button>
                                                )}
                                                {!hasUploaded && formGenerated && (
                                                    <button
                                                        onClick={() => handleDownloadCertificado(detailRecord)}
                                                        disabled={downloadingId === detailRecord.id}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        {downloadingId === detailRecord.id ? <RefreshCcw size={14} className="animate-spin" /> : <FileDown size={14} />}
                                                        {downloadingId === detailRecord.id ? 'Generando...' : 'Descargar Certificado'}
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </DetailModal>
                )}
            </main>
        </div>
    );
}
