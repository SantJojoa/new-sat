import { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCcw, Calendar, MapPin, Layers, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import SlideBar from '../ui/SlideBar';
import { useAuth } from '../../hooks/useAuth';
import { articulacionesService } from '../../services/articulacionesService';
import type { ArticulacionRecord } from '../../types/articulaciones';

export default function GestionarArticulacion() {
    const { user } = useAuth();
    const [records, setRecords] = useState<ArticulacionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewAll, setViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
    const [detailRecord, setDetailRecord] = useState<ArticulacionRecord | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<{ type: 'success' | 'error' | null; title: string; message: string }>({ type: null, title: '', message: '' });

    const isAdmin = ['admin_subdireccion', 'superadmin'].includes(user?.user_type?.name || '');

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await articulacionesService.getAll(viewAll);
            setRecords(data);
            setUniqueAreas(Array.from(new Set(data.map(r => r.areas?.name).filter(Boolean))) as string[]);
        } catch (error) {
            console.error('Error fetching articulaciones:', error);
        } finally {
            setLoading(false);
        }
    }, [viewAll]);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDetailRecord(null);
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
        const matchStart = !filterDateStart || new Date(r.fecha_inicio) >= new Date(filterDateStart);
        const matchEnd = !filterDateEnd || new Date(r.fecha_final) <= new Date(filterDateEnd);
        return matchSearch && matchArea && matchStart && matchEnd;
    });

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[32px]">hub</span>
                            Gestionar Articulaciones
                        </h1>
                        <p className="text-zinc-500 mt-2">Listado de articulaciones intersectoriales registradas.</p>
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {isAdmin && (
                                <button
                                    onClick={() => setViewAll(prev => !prev)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${viewAll ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    <Layers size={16} />
                                    {viewAll ? 'Viendo todas las áreas' : 'Ver todas las áreas'}
                                </button>
                            )}
                            <button onClick={fetchRecords} className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50 flex items-center gap-2">
                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                Actualizar
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Articulaciones</p>
                            <p className="text-2xl font-black text-zinc-900 mt-1">{filtered.length}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm mb-4 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-zinc-50 rounded-lg border border-zinc-200 px-3 py-2">
                            <Search size={16} className="text-zinc-400 shrink-0" />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por código, tema, solicitante..." className="bg-transparent w-full text-sm outline-none text-zinc-700 placeholder-zinc-400" />
                        </div>
                        {isAdmin && (
                            <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-700 bg-white">
                                <option value="">Todas las áreas</option>
                                {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        )}
                        <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-700 bg-white" />
                        <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-700 bg-white" />
                        {(searchTerm || filterArea || filterDateStart || filterDateEnd) && (
                            <button onClick={() => { setSearchTerm(''); setFilterArea(''); setFilterDateStart(''); setFilterDateEnd(''); }} className="h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-500 hover:bg-zinc-50 flex items-center gap-1">
                                <XCircle size={14} /> Limpiar
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCcw size={24} className="animate-spin text-primary" />
                                <span className="ml-3 text-zinc-500 font-medium">Cargando...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <span className="material-symbols-outlined text-zinc-300 text-[48px] mb-3">hub</span>
                                <p className="text-zinc-600 font-medium">No hay articulaciones para mostrar</p>
                                <p className="text-zinc-400 text-sm mt-1">Registre una nueva articulación o ajuste los filtros.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 border-b border-zinc-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Código</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tema</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Área</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fechas</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lugar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {filtered.map(r => (
                                            <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-primary text-xs">{r.codigo}</td>
                                                <td className="px-4 py-3 max-w-[200px] truncate font-medium text-zinc-800">{r.tema}</td>
                                                <td className="px-4 py-3 text-zinc-600">{r.areas?.name || '—'}</td>
                                                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                                                    <span className="flex items-center gap-1"><Calendar size={12} className="text-zinc-400" />{new Date(r.fecha_inicio).toLocaleDateString('es-CO')}</span>
                                                    {r.fecha_inicio !== r.fecha_final && <span className="text-zinc-400 text-xs">→ {new Date(r.fecha_final).toLocaleDateString('es-CO')}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-600">
                                                    <span className="flex items-center gap-1"><MapPin size={12} className="text-zinc-400" />{r.lugar_evento?.name || '—'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Modal */}
                {detailRecord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setDetailRecord(null); }}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900">Detalle de Articulación</h3>
                                    <p className="text-zinc-500 text-sm">Código: <span className="font-mono font-bold text-primary">{detailRecord.codigo}</span></p>
                                </div>
                                <button onClick={() => setDetailRecord(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"><XCircle size={24} /></button>
                            </div>
                            <div className="p-6 space-y-4 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1"><User size={10} className="inline mr-1" />Solicitante</span>
                                        <p className="text-zinc-900 font-medium">{detailRecord.solicitante?.names}</p>
                                        <p className="text-zinc-500 text-xs">{detailRecord.solicitante?.email}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1"><Layers size={10} className="inline mr-1" />Área</span>
                                        <p className="text-zinc-900 font-medium">{detailRecord.areas?.name || '—'}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1"><Calendar size={10} className="inline mr-1" />Fechas</span>
                                        <p className="text-zinc-900 font-medium">{new Date(detailRecord.fecha_inicio).toLocaleDateString('es-CO')} → {new Date(detailRecord.fecha_final).toLocaleDateString('es-CO')}</p>
                                        <p className="text-zinc-500 text-xs mt-0.5">Jornada: {detailRecord.jornada}</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1"><MapPin size={10} className="inline mr-1" />Lugar del Evento</span>
                                        <p className="text-zinc-900 font-medium">{detailRecord.lugar_evento?.name || '—'}</p>
                                    </div>
                                </div>
                                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Tema / Actividad</span>
                                    <p className="text-zinc-800 font-medium">{detailRecord.tema}</p>
                                </div>
                                {detailRecord.instituciones_convocadas && (
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-2">Instituciones Convocadas</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {detailRecord.instituciones_convocadas.split(',').map((inst, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">{inst.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {detailRecord.responsable_articulacion && (
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Responsable(s)</span>
                                        <p className="text-zinc-800">{detailRecord.responsable_articulacion}</p>
                                    </div>
                                )}
                                {detailRecord.transporte_medio && (
                                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold block mb-1">Transporte</span>
                                        <p className="text-zinc-800">{detailRecord.transporte_medio}{detailRecord.transporte_num_instituciones ? ` · ${detailRecord.transporte_num_instituciones} institución(es)` : ''}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
                                <button onClick={() => setDetailRecord(null)} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors">Cerrar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {feedbackModal.type && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                            <div className={`p-6 border-b ${feedbackModal.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${feedbackModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {feedbackModal.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <h3 className={`text-lg font-bold ${feedbackModal.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>{feedbackModal.title}</h3>
                                </div>
                            </div>
                            <div className="p-6"><p className="text-zinc-700 text-sm">{feedbackModal.message}</p></div>
                            <div className="px-6 pb-6 flex justify-end">
                                <button onClick={() => setFeedbackModal({ type: null, title: '', message: '' })} className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors cursor-pointer">Aceptar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
