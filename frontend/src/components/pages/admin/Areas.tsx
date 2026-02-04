import { useState, useEffect } from 'react';
import { api } from '../../../api/client';
import SlideBar from '../../ui/SlideBar';
import { Plus, Search, Trash2, Edit, X } from 'lucide-react';

interface Subdireccion {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
    subdireccion_id: string;
    subdirecciones?: Subdireccion;
}

export default function Areas() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [subdirecciones, setSubdirecciones] = useState<Subdireccion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', subdireccion_id: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [areasRes, subRes] = await Promise.all([
                api.get('/areas'),
                api.get('/subdirecciones')
            ]);
            setAreas(areasRes.data);
            setSubdirecciones(subRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/areas/${editingId}`, formData);
            } else {
                await api.post('/areas', formData);
            }
            fetchData();
            closeModal();
        } catch (error) {
            console.error('Error saving area:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta área?')) return;
        try {
            await api.delete(`/areas/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting area:', error);
        }
    };

    const openModal = (area?: Area) => {
        if (area) {
            setFormData({ name: area.name, subdireccion_id: area.subdireccion_id });
            setEditingId(area.id);
        } else {
            setFormData({ name: '', subdireccion_id: '' });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', subdireccion_id: '' });
        setEditingId(null);
    };

    const filteredAreas = areas.filter(area =>
        area.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Áreas</h1>
                            <p className="text-zinc-500 mt-2">Gestiona las áreas y sus subdirecciones asociadas</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <Plus size={20} />
                            Nueva Área
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar área..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 text-zinc-500 font-semibold text-sm uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Subdirección</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">Cargando...</td>
                                        </tr>
                                    ) : filteredAreas.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No se encontraron áreas</td>
                                        </tr>
                                    ) : (
                                        filteredAreas.map((area) => (
                                            <tr key={area.id} className="hover:bg-zinc-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-zinc-900">{area.name}</td>
                                                <td className="px-6 py-4 text-zinc-600">
                                                    <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded text-sm font-medium">
                                                        {area.subdirecciones?.name || 'Sin Asignar'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(area)}
                                                        className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(area.id)}
                                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-zinc-900">
                                    {editingId ? 'Editar Área' : 'Nueva Área'}
                                </h3>
                                <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Subdirección</label>
                                    <select
                                        required
                                        value={formData.subdireccion_id}
                                        onChange={(e) => setFormData({ ...formData, subdireccion_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                    >
                                        <option value="">Seleccione una subdirección...</option>
                                        {subdirecciones.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
                                    >
                                        Guardar
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
