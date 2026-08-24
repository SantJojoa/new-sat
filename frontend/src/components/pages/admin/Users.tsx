import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../../../services/api';
import SlideBar from '../../ui/SlideBar';
import { Plus, Search, Trash2, Edit, X, UserCog, Ban, CheckCircle, Upload, Download, XCircle } from 'lucide-react';
import BulkUploadUsersModal from './BulkUploadUsersModal';
import { useAuth } from '../../../hooks/useAuth';

interface UserType {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
    subdireccion_id: string;
    subdirecciones?: Subdireccion;
}

interface Subdireccion {
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
    subdireccion_id?: string;
    is_active: boolean;
    user_types?: UserType;
    areas?: Area;
    subdirecciones?: Subdireccion;
}

interface BulkRoleResult {
    updated: number;
    failed: number;
    results: { id: string; status: 'ok' | 'error'; message?: string }[];
}

export default function Users() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [userTypes, setUserTypes] = useState<UserType[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [subdirecciones, setSubdirecciones] = useState<Subdireccion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubdireccionId, setFilterSubdireccionId] = useState('');
    const [filterAreaId, setFilterAreaId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Bulk selection / role change
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isBulkRoleModalOpen, setIsBulkRoleModalOpen] = useState(false);
    const [bulkRoleTypeId, setBulkRoleTypeId] = useState('');
    const [isBulkRoleSubmitting, setIsBulkRoleSubmitting] = useState(false);
    const [bulkRoleResult, setBulkRoleResult] = useState<BulkRoleResult | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        names: '',
        last_name: '',
        num_id: '',
        email: '',
        user_type_id: '',
        area_id: '',
        subdireccion_id: '',
        charge: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, typesRes, areasRes, subRes] = await Promise.all([
                api.get('/users'),
                api.get('/users/types'),
                api.get('/areas'),
                api.get('/subdirecciones')
            ]);
            setUsers(usersRes.data);
            setUserTypes(typesRes.data);
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
            const payload: Partial<typeof formData> = { ...formData };
            if (selectedRoleName === 'admin_subdireccion') {
                delete payload.area_id;
            }

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
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            alert(message || 'Error al eliminar usuario.');
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
                subdireccion_id: user.subdireccion_id || user.areas?.subdireccion_id || user.areas?.subdirecciones?.id || '',
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
                subdireccion_id: '',
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

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase());

        const userSubdireccionId = user.subdireccion_id || user.areas?.subdireccion_id;
        const matchesSubdireccion = !filterSubdireccionId || userSubdireccionId === filterSubdireccionId;
        const matchesArea = !filterAreaId || user.area_id === filterAreaId;

        return matchesSearch && matchesSubdireccion && matchesArea;
    });

    const selectedUserType = userTypes.find(type => type.id === formData.user_type_id);
    const selectedRoleName = selectedUserType?.name;
    const isSubdirector = selectedRoleName === 'admin_subdireccion';
    const filteredAreas = formData.subdireccion_id
        ? areas.filter(area => area.subdireccion_id === formData.subdireccion_id)
        : [];
    const filterAreas = filterSubdireccionId
        ? areas.filter(area => area.subdireccion_id === filterSubdireccionId)
        : areas;

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/users/export', {
                params: {
                    subdireccion_id: filterSubdireccionId || undefined,
                    area_id: filterAreaId || undefined,
                },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'usuarios.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error('Error exporting users:', error);
            alert('Error al exportar usuarios.');
        } finally {
            setIsExporting(false);
        }
    };

    const toggleSelectUser = (id: string) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectableUsers = filteredUsers.filter(u => u.id !== currentUser?.id);
    const allSelectableSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUserIds.has(u.id));

    const toggleSelectAll = () => {
        if (allSelectableSelected) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(selectableUsers.map(u => u.id)));
        }
    };

    const handleBulkRoleChange = async () => {
        if (!bulkRoleTypeId || selectedUserIds.size === 0) return;
        setIsBulkRoleSubmitting(true);
        try {
            const response = await api.patch<BulkRoleResult>('/users/bulk/role', {
                user_ids: Array.from(selectedUserIds),
                user_type_id: bulkRoleTypeId,
            });
            setBulkRoleResult(response.data);
            setSelectedUserIds(new Set());
            setIsBulkRoleModalOpen(false);
            setBulkRoleTypeId('');
            fetchData();
        } catch (error) {
            console.error('Error updating roles in bulk:', error);
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
            alert(message || 'Error al cambiar el rol de los usuarios seleccionados.');
        } finally {
            setIsBulkRoleSubmitting(false);
        }
    };

    return (
        <div className="bg-bg-light font-display min-h-screen flex h-screen overflow-hidden">
            <SlideBar />
            <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50 p-8">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3"><UserCog className="text-primary" size={32} />Usuarios</h1>
                            <p className="text-zinc-500 mt-2">Gestiona los usuarios, roles y permisos</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="bg-white text-zinc-700 border border-zinc-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-100 transition-colors disabled:opacity-60"
                            >
                                <Download size={20} />
                                {isExporting ? 'Exportando...' : 'Exportar Excel'}
                            </button>
                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="bg-white text-zinc-700 border border-zinc-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-100 transition-colors"
                            >
                                <Upload size={20} />
                                Cargar desde Excel
                            </button>
                            <button
                                onClick={() => openModal()}
                                className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={20} />
                                Nuevo Usuario
                            </button>
                        </div>
                    </div>

                    {selectedUserIds.size > 0 && (
                        <div className="mb-4 bg-primary/5 border border-primary/30 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-3">
                            <span className="text-sm font-semibold text-zinc-700">
                                {selectedUserIds.size} usuario{selectedUserIds.size !== 1 ? 's' : ''} seleccionado{selectedUserIds.size !== 1 ? 's' : ''}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsBulkRoleModalOpen(true)}
                                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                                >
                                    <UserCog size={16} />
                                    Cambiar rol
                                </button>
                                <button
                                    onClick={() => setSelectedUserIds(new Set())}
                                    className="px-3 py-2 rounded-lg text-sm font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-wrap items-center gap-3">
                            <div className="relative max-w-md flex-1 min-w-[220px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <select
                                value={filterSubdireccionId}
                                onChange={(e) => { setFilterSubdireccionId(e.target.value); setFilterAreaId(''); }}
                                className="px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white text-sm"
                            >
                                <option value="">Todas las subdirecciones</option>
                                {subdirecciones.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                            <select
                                value={filterAreaId}
                                onChange={(e) => setFilterAreaId(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white text-sm"
                            >
                                <option value="">Todas las áreas</option>
                                {filterAreas.map(area => (
                                    <option key={area.id} value={area.id}>{area.name}</option>
                                ))}
                            </select>
                            {(filterSubdireccionId || filterAreaId) && (
                                <button
                                    onClick={() => { setFilterSubdireccionId(''); setFilterAreaId(''); }}
                                    className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                                >
                                    <XCircle size={14} /> Limpiar filtros
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 text-zinc-500 font-semibold text-sm uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allSelectableSelected}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                                            />
                                        </th>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Rol</th>
                                        <th className="px-6 py-4">Subdirección</th>
                                        <th className="px-6 py-4">Área</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Cargando...</td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No se encontraron usuarios</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className={`hover:bg-zinc-50 transition-colors ${selectedUserIds.has(user.id) ? 'bg-primary/5' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.has(user.id)}
                                                        disabled={user.id === currentUser?.id}
                                                        onChange={() => toggleSelectUser(user.id)}
                                                        title={user.id === currentUser?.id ? 'No puedes seleccionar tu propio usuario' : undefined}
                                                        className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary disabled:opacity-40"
                                                    />
                                                </td>
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
                                                    {user.subdirecciones?.name || user.areas?.subdirecciones?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600">
                                                    {user.user_types?.name === 'admin_subdireccion'
                                                        ? 'N/A'
                                                        : (user.areas?.name || 'N/A')}
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
                                        <label className="block text-sm font-semibold text-zinc-700 mb-1">Subdirección</label>
                                        <select
                                            required
                                            value={formData.subdireccion_id}
                                            onChange={(e) => setFormData({ ...formData, subdireccion_id: e.target.value, area_id: '' })}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                        >
                                            <option value="">Seleccione subdirección...</option>
                                            {subdirecciones.map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                            ))}
                                        </select>
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
                                            onChange={(e) => {
                                                const nextId = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    user_type_id: nextId,
                                                    area_id: '',
                                                }));
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                        >
                                            <option value="">Seleccione rol...</option>
                                            {userTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {!isSubdirector && (
                                        <div>
                                            <label className="block text-sm font-semibold text-zinc-700 mb-1">Área</label>
                                            <select
                                                required
                                                disabled={!formData.subdireccion_id}
                                                value={formData.area_id}
                                                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
                                            >
                                                <option value="">{formData.subdireccion_id ? 'Seleccione área...' : 'Seleccione primero una subdirección'}</option>
                                                {filteredAreas.map(area => (
                                                    <option key={area.id} value={area.id}>{area.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {!isSubdirector && (
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
                                    )}
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

                {isBulkModalOpen && (
                    <BulkUploadUsersModal
                        userTypes={userTypes}
                        areas={areas}
                        subdirecciones={subdirecciones}
                        onClose={() => setIsBulkModalOpen(false)}
                        onCompleted={fetchData}
                    />
                )}

                {isBulkRoleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-zinc-900">Cambiar rol en bloque</h3>
                                <button onClick={() => setIsBulkRoleModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-zinc-600">
                                    Se cambiará el rol de <span className="font-bold">{selectedUserIds.size}</span> usuario{selectedUserIds.size !== 1 ? 's' : ''} seleccionado{selectedUserIds.size !== 1 ? 's' : ''}.
                                </p>
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Nuevo rol</label>
                                    <select
                                        value={bulkRoleTypeId}
                                        onChange={(e) => setBulkRoleTypeId(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                    >
                                        <option value="">Seleccione rol...</option>
                                        {userTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-200 flex gap-3 bg-zinc-50">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkRoleModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={!bulkRoleTypeId || isBulkRoleSubmitting}
                                    onClick={handleBulkRoleChange}
                                    className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-60"
                                >
                                    {isBulkRoleSubmitting ? 'Aplicando...' : 'Aplicar cambio'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {bulkRoleResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slideUp overflow-hidden max-h-[85vh] flex flex-col">
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center shrink-0">
                                <h3 className="text-xl font-bold text-zinc-900">Resultado del cambio de rol</h3>
                                <button onClick={() => setBulkRoleResult(null)} className="text-zinc-400 hover:text-zinc-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3 overflow-y-auto">
                                <div className="flex gap-4 text-sm">
                                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg font-semibold">
                                        <CheckCircle size={16} /> {bulkRoleResult.updated} actualizados
                                    </span>
                                    {bulkRoleResult.failed > 0 && (
                                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-3 py-1.5 rounded-lg font-semibold">
                                            <XCircle size={16} /> {bulkRoleResult.failed} fallidos
                                        </span>
                                    )}
                                </div>
                                {bulkRoleResult.failed > 0 && (
                                    <ul className="text-sm text-zinc-600 space-y-1 border-t border-zinc-100 pt-3">
                                        {bulkRoleResult.results.filter(r => r.status === 'error').map(r => {
                                            const u = users.find(user => user.id === r.id);
                                            return (
                                                <li key={r.id} className="flex justify-between gap-2">
                                                    <span className="font-medium text-zinc-800">{u ? `${u.names} ${u.last_name}` : r.id}</span>
                                                    <span className="text-red-600 text-right">{r.message}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                            <div className="p-6 border-t border-zinc-200 shrink-0">
                                <button
                                    onClick={() => setBulkRoleResult(null)}
                                    className="w-full px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
