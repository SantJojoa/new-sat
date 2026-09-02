import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Megaphone, EyeOff, Eye } from 'lucide-react';
import SlideBar from '../../ui/SlideBar';
import { avisosService } from '../../../services/avisosService';
import type { Aviso } from '../../../types/avisos';

export default function Avisos() {
    const [avisos, setAvisos] = useState<Aviso[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ titulo: '', mensaje: '' });
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await avisosService.getAll();
            setAvisos(data);
        } catch (error) {
            console.error('Error fetching avisos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await avisosService.create(formData);
            fetchData();
            closeModal();
        } catch (error) {
            console.error('Error creating aviso:', error);
            alert('Error al crear el aviso');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (aviso: Aviso) => {
        try {
            await avisosService.update(aviso.id, { is_active: !aviso.is_active });
            fetchData();
        } catch (error) {
            console.error('Error toggling aviso:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este aviso? Ya no se mostrará a nadie.')) return;
        try {
            await avisosService.remove(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting aviso:', error);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ titulo: '', mensaje: '' });
    };

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                                <Megaphone className="text-primary" size={32} />
                                Avisos a Usuarios
                            </h1>
                            <p className="text-zinc-500 mt-2">Mensajes emergentes que verán todos los usuarios al iniciar sesión</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shrink-0"
                        >
                            <Plus size={20} />
                            Nuevo Aviso
                        </button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center text-zinc-500">Cargando...</div>
                        ) : avisos.length === 0 ? (
                            <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center text-zinc-500">No hay avisos registrados</div>
                        ) : (
                            avisos.map(aviso => (
                                <div key={aviso.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-zinc-900">{aviso.titulo}</h3>
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${aviso.is_active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                                                    {aviso.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            <p className="text-zinc-600 text-sm whitespace-pre-line">{aviso.mensaje}</p>
                                            <p className="text-zinc-400 text-xs mt-2">
                                                {aviso.created_by ? `${aviso.created_by.names} ${aviso.created_by.last_name} · ` : ''}
                                                {new Date(aviso.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleToggleActive(aviso)}
                                                title={aviso.is_active ? 'Desactivar (dejará de mostrarse)' : 'Activar'}
                                                className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            >
                                                {aviso.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(aviso.id)}
                                                title="Eliminar"
                                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-zinc-900">Nuevo Aviso</h3>
                                <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Título</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={150}
                                        value={formData.titulo}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        placeholder="Ej: Extensión del periodo de prueba"
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Mensaje</label>
                                    <textarea
                                        required
                                        maxLength={3000}
                                        rows={6}
                                        value={formData.mensaje}
                                        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                                        placeholder="Escribe el mensaje que verán todos los usuarios..."
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                                    />
                                    <p className="text-zinc-400 text-xs mt-1 text-right">{formData.mensaje.length}/3000</p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {saving ? 'Publicando...' : 'Publicar Aviso'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
