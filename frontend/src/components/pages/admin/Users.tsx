import { useState, useEffect } from 'react';
import { api } from '../../../api/client';
import SlideBar from '../../ui/SlideBar';
import { Plus, Search, Trash2, Edit, X, UserCog, Ban, CheckCircle } from 'lucide-react';

interface UserType {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
}

interface User {
    id: string;
    username: string;
    names: string;
    last_name: string;
    email: string;
    num_id: string;
    charge?: string;
    user_type_id: string;
    area_id?: string;
    is_active: boolean;
    user_types?: UserType;
    areas?: Area;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [userTypes, setUserTypes] = useState<UserType[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        names: '',
        last_name: '',
        num_id: '',
        email: '',
        user_type_id: '',
        area_id: '',
        charge: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, typesRes, areasRes] = await Promise.all([
                api.get('/users'),
                api.get('/users/types'),
                api.get('/areas')
            ]);
            setUsers(usersRes.data);
            setUserTypes(typesRes.data);
            setAreas(areasRes.data);
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
            const payload: Partial<typeof formData> = { ...formData };
            if (editingId) {
                // Remove password if empty during edit
                if (!payload.password) delete payload.password;

                await api.patch(`/users/${editingId}`, payload);
            } else {
                await api.post('/users', payload);
            }
            fetchData();
            closeModal();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar usuario. Verifique los datos.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const toggleStatus = async (user: User) => {
        try {
            if (user.is_active) {
                await api.patch(`/users/${user.id}/deactivate`);
            } else {
                await api.patch(`/users/${user.id}/activate`);
            }
            fetchData();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setFormData({
                username: user.username,
                password: '', // Don't show password
                names: user.names,
                last_name: user.last_name,
                num_id: user.num_id,
                email: user.email,
                user_type_id: user.user_type_id,
                area_id: user.area_id || '',
                charge: user.charge || '',
            });
            setEditingId(user.id);
        } else {
            setFormData({
                username: '',
                password: '',
                names: '',
                last_name: '',
                num_id: '',
                email: '',
                user_type_id: '',
                area_id: '',
                charge: '',
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const filteredUsers = users.filter(user =>
        user.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Usuarios</h1>
                            <p className="text-zinc-500 mt-2">Gestiona los usuarios, roles y permisos</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <Plus size={20} />
                            Nuevo Usuario
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o usuario..."
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
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Rol</th>
                                        <th className="px-6 py-4">Área</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Cargando...</td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No se encontraron usuarios</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-zinc-900">{user.names} {user.last_name}</div>
                                                        <div className="text-sm text-zinc-500">@{user.username}</div>
                                                        <div className="text-xs text-zinc-400">{user.email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                                                        <UserCog size={14} />
                                                        {user.user_types?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600">
                                                    {user.areas?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.is_active ? (
                                                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-sm font-medium">
                                                            <CheckCircle size={14} /> Activo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-sm font-medium">
                                                            <Ban size={14} /> Inactivo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 flex justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleStatus(user)}
                                                        className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-zinc-400 hover:text-red-600 hover:bg-red-50' : 'text-zinc-400 hover:text-green-600 hover:bg-green-50'}`}
                                                        title={user.is_active ? "Desactivar" : "Activar"}
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(user)}
                                                        className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
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
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center shrink-0">
                                <h3 className="text-xl font-bold text-zinc-900">
                                    {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h3>
                                <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="overflow-y-auto p-6">
                                <form id="userForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Información Personal</h4>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Nombres</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.names}
                                            onChange={(e) => setFormData({ ...formData, names: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Apellidos</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Identificación (Cédula)</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.num_id}
                                            onChange={(e) => setFormData({ ...formData, num_id: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>

                                    <div className="md:col-span-2 mt-2">
                                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Cuenta y Accesos</h4>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Nombre de Usuario</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">
                                            Contraseña {editingId && <span className="text-zinc-400 font-normal">(Dejar en blanco para no cambiar)</span>}
                                        </label>
                                        <input
                                            type="password"
                                            required={!editingId}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Rol / Tipo de Usuario</label>
                                        <select
                                            required
                                            value={formData.user_type_id}
                                            onChange={(e) => setFormData({ ...formData, user_type_id: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                        >
                                            <option value="">Seleccione rol...</option>
                                            {userTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Área</label>
                                        <select
                                            value={formData.area_id}
                                            onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                        >
                                            <option value="">N/A (Sin área)</option>
                                            {areas.map(area => (
                                                <option key={area.id} value={area.id}>{area.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Cargo</label>
                                        <input
                                            type="text"
                                            value={formData.charge}
                                            onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                            placeholder="Cargo opcional"
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-zinc-200 shrink-0 flex gap-3 bg-zinc-50">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="userForm"
                                    className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
                                >
                                    Guardar Usuario
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
