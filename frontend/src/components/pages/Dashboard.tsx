import { Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import SlideBar from "../ui/SlideBar"
import type { DashboardModulePermission } from "../../types/salidas";
import { canAccessModule } from "../../utils/userAccess";

export default function Dashboard() {
    const { user } = useAuth();

    const allowedModules = user?.user_type?.permissions?.filter(
        permission =>
            permission.can_view &&
            permission.modules.is_active &&
            permission.modules.name !== 'dashboard'
    )
        .filter((permission) => {
            const restrictedModules = ['areas', 'subdirecciones', 'usuarios'];
            if (restrictedModules.includes(permission.modules.name)) {
                return user?.user_type?.name === 'superadmin';
            }
            return canAccessModule(permission.modules.name, user);
        })
        .sort((a, b) => (a.modules.order || 0) - (b.modules.order || 0)) || [];

    const today = new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const categories: Record<string, string[]> = {
        'Programaciones': ['solicitar_salida', 'gestionar_salida', 'calendario_salidas', 'reportes_salidas'],
        'Articulacion': ['solicitar_articulacion', 'gestionar_articulacion', 'calendario_articulaciones', 'reportes_articulacion'],
        'IVC': ['solicitar_ivc', 'gestionar_ivc', 'calendario_ivc', 'reportes_ivc'],
        'Gestion de Dependencias': ['areas', 'subdirecciones'],
        'Usuarios': ['usuarios'],
        'Asesorias': ['programar_asesoria', 'gestionar_asesoria'],
        'Seguimiento/Actas': ['seguimiento_capacitaciones', 'seguimiento_ivc', 'seguimiento_articulacion_iv', 'seguimiento_acompanamiento']
    };

    const getCategory = (moduleName: string) => {
        for (const [category, modules] of Object.entries(categories)) {
            if (modules.includes(moduleName)) return category;
        }
        return 'Otros';
    };

    const extraModules: DashboardModulePermission[] = [
        {
            id: 'calendario-salidas-module',
            modules: { id: 'calendario-salidas-module', name: 'calendario_salidas', description: 'Calendario de Programación', icon: 'calendar_month', path: '/calendario-salidas', is_active: true, order: 98 },
            can_view: true
        },
        {
            id: 'reportes-salidas-module',
            modules: { id: 'reportes-salidas-module', name: 'reportes_salidas', description: 'Reportes y Estadisticas', icon: 'bar_chart', path: '/reportes-salidas', is_active: true, order: 99 },
            can_view: true
        },
        {
            id: 'reportes-articulacion-module',
            modules: { id: 'reportes-articulacion-module', name: 'reportes_articulacion', description: 'Reportes y Estadisticas', icon: 'bar_chart', path: '/reportes-articulacion', is_active: true, order: 100 },
            can_view: true
        },
        {
            id: 'reportes-ivc-module',
            modules: { id: 'reportes-ivc-module', name: 'reportes_ivc', description: 'Reportes y Estadisticas', icon: 'bar_chart', path: '/reportes-ivc', is_active: true, order: 101 },
            can_view: true
        },
        {
            id: 'seguimiento-capacitaciones-module',
            modules: { id: 'seguimiento-capacitaciones-module', name: 'seguimiento_capacitaciones', description: 'Seguimiento de Desarrollo de Capacidades', icon: 'stack', path: '/seguimiento-capacitaciones', is_active: true, order: 102 },
            can_view: true
        },
        {
            id: 'seguimiento-ivc-module',
            modules: { id: 'seguimiento-ivc-module', name: 'seguimiento_ivc', description: 'Seguimiento IVC', icon: 'verified_user', path: '/seguimiento-ivc', is_active: true, order: 103 },
            can_view: true
        },
        {
            id: 'seguimiento-articulacion-iv-module',
            modules: { id: 'seguimiento-articulacion-iv-module', name: 'seguimiento_articulacion_iv', description: 'Seguimiento Inspección y Vigilancia SP', icon: 'hub', path: '/seguimiento-articulacion-iv', is_active: true, order: 104 },
            can_view: true
        },
        {
            id: 'programar-asesoria-module',
            modules: { id: 'programar-asesoria-module', name: 'programar_asesoria', description: 'Datos Asesoria', icon: 'support_agent', path: '/programar-asesoria', is_active: true, order: 105 },
            can_view: true
        },
        {
            id: 'gestionar-asesoria-module',
            modules: { id: 'gestionar-asesoria-module', name: 'gestionar_asesoria', description: 'Gestionar Asesorías', icon: 'manage_search', path: '/gestionar-asesoria', is_active: true, order: 105 },
            can_view: true
        },
        {
            id: 'seguimiento-acompanamiento-module',
            modules: { id: 'seguimiento-acompanamiento-module', name: 'seguimiento_acompanamiento', description: 'Seguimiento de Acompañamiento', icon: 'handshake', path: '/seguimiento-acompanamiento', is_active: true, order: 106 },
            can_view: true
        }
    ];

    const dedupedModules = [...allowedModules, ...extraModules].reduce<DashboardModulePermission[]>((acc, permission) => {
        const typedPermission = permission as DashboardModulePermission;
        if (canAccessModule(typedPermission.modules.name, user) && !acc.some((current) => current.modules.name === typedPermission.modules.name)) {
            acc.push(typedPermission);
        }
        return acc;
    }, []);

    const groupedModules = dedupedModules.reduce((acc, permission) => {
        const category = getCategory(permission.modules.name);
        if (!acc[category]) acc[category] = [];
        acc[category].push(permission);
        return acc;
    }, {} as Record<string, DashboardModulePermission[]>);

    const categoryOrder = ['Programaciones', 'Articulacion', 'IVC', 'Asesorias', 'Seguimiento/Actas', 'Gestion de Dependencias', 'Usuarios', 'Otros'];

    return (
        <div className="bg-bg-light font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <SlideBar />

                <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50">
                    <div className="bg-white border-b border-zinc-200 px-8 py-6">
                        <div className="max-w-6xl mx-auto">
                            <p className="text-xs text-zinc-400 font-medium mb-1.5 capitalize tracking-wide">{today}</p>
                            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                                Hola, <span className="text-primary">{user?.names?.split(' ')[0]}</span>
                            </h1>
                            <div className="flex items-center gap-4 mt-2">
                                {user?.subdireccion?.name && (
                                    <span className="text-sm text-zinc-500">
                                        <span className="font-medium text-zinc-700">Subdirección:</span> {user.subdireccion.name}
                                    </span>
                                )}
                                {user?.area?.name && (
                                    <span className="text-sm text-zinc-500">
                                        <span className="font-medium text-zinc-700">Área:</span> {user.area.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="max-w-6xl mx-auto space-y-8">
                            {dedupedModules.length > 0 ? (
                                categoryOrder.map((category) => {
                                    const modules = groupedModules[category];
                                    if (!modules || modules.length === 0) return null;

                                    return (
                                        <div key={category} className="animate-fadeIn">
                                            <div className="mb-4">
                                                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{category}</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {modules.map((permission) => (
                                                    <Link
                                                        key={permission.id}
                                                        to={permission.modules.path || '#'}
                                                        className="group bg-white rounded-xl p-5 border border-zinc-200 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-start gap-3"
                                                    >
                                                        <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-200">
                                                            <span className="material-symbols-outlined text-[24px]">
                                                                {permission.modules.icon || 'grid_view'}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-primary transition-colors leading-snug">
                                                                {permission.modules.description || permission.modules.name.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                            </h3>
                                                        </div>
                                                        <div className="w-full flex items-center justify-end text-xs font-medium text-zinc-400 group-hover:text-primary transition-colors">
                                                            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                                                                arrow_forward
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 border-dashed">
                                    <div className="size-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-4">
                                        <span className="material-symbols-outlined text-[40px]">lock_person</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900">Sin accesos asignados</h3>
                                    <p className="text-zinc-500 mt-2 text-center max-w-md">
                                        Tu usuario no tiene modulos asignados actualmente.
                                        Por favor contacta al administrador del sistema.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
