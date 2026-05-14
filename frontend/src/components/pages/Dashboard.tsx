import { Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import SlideBar from "../ui/SlideBar"
import type { DashboardModulePermission } from "../../types/salidas";

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
            return true;
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
        'Asesorias': ['programar_asesoria'],
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
            modules: { id: 'programar-asesoria-module', name: 'programar_asesoria', description: 'Programar Asesoría', icon: 'support_agent', path: '/programar-asesoria', is_active: true, order: 105 },
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
        if (!acc.some((current) => current.modules.name === typedPermission.modules.name)) {
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
                    <div className="bg-white border-b border-zinc-200 px-8 py-8">
                        <div className="max-w-6xl mx-auto">
                            <p className="text-zinc-500 font-medium mb-2 capitalize">{today}</p>
                            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                                Hola, <span className="text-primary">{user?.names?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-zinc-600 mt-2 max-w-2xl text-lg">
                                Bienvenido al Sistema de Inspeccion, Vigilancia, Asistencia y Capacitacion.
                                Selecciona un modulo para comenzar.
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="max-w-6xl mx-auto space-y-12">
                            {dedupedModules.length > 0 ? (
                                categoryOrder.map((category) => {
                                    const modules = groupedModules[category];
                                    if (!modules || modules.length === 0) return null;

                                    return (
                                        <div key={category} className="animate-fadeIn">
                                            <div className="flex items-center gap-3 mb-6">
                                                <h2 className="text-xl font-bold text-zinc-800 tracking-tight">{category}</h2>
                                                <div className="h-px bg-zinc-200 flex-1"></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {modules.map((permission) => (
                                                    <Link
                                                        key={permission.id}
                                                        to={permission.modules.path || '#'}
                                                        className="group bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 flex flex-col items-start gap-4"
                                                    >
                                                        <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                                                            <span className="material-symbols-outlined text-[32px]">
                                                                {permission.modules.icon || 'grid_view'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-zinc-900 group-hover:text-primary transition-colors">
                                                                {permission.modules.description || permission.modules.name.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                            </h3>
                                                            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                                                                {permission.modules.name === 'gestionar_salida' ? 'Administrar y auditar salidas' :
                                                                    permission.modules.name === 'solicitar_salida' ? 'Crear nuevas solicitudes' :
                                                                        'Acceso al modulo del sistema'}
                                                            </p>
                                                        </div>
                                                        <div className="mt-auto pt-4 w-full flex items-center justify-between text-sm font-semibold text-primary/80 group-hover:text-primary">
                                                            <span>Ingresar</span>
                                                            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-2 transition-transform">
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
