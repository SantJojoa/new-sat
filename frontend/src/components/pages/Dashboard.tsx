import { useAuth } from "../../hooks/useAuth"
import SlideBar from "../ui/SlideBar"
import { Link } from "react-router-dom"

export default function Dashboard() {
    const { user } = useAuth();

    // Filter permissions where can_view is true AND module is not dashboard
    const allowedModules = user?.user_type?.permissions?.filter(
        permission =>
            permission.can_view &&
            permission.modules.is_active &&
            permission.modules.name !== 'dashboard'
    )
        .filter(p => {
            // Restriction: Only superadmin can see areas, subdirecciones, usuarios
            const restrictedModules = ['areas', 'subdirecciones', 'usuarios'];
            if (restrictedModules.includes(p.modules.name)) {
                return user?.user_type?.name === 'superadmin';
            }
            return true;
        })
        .sort((a, b) => (a.modules.order || 0) - (b.modules.order || 0)) || [];

    // Helper to format date
    const today = new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Categories Logic
    const categories: Record<string, string[]> = {
        'Salidas': ['solicitar_salida', 'gestionar_salida'],
        'Gestión de Dependencias': ['areas', 'subdirecciones'],
        'Usuarios': ['usuarios']
    };

    const getCategory = (moduleName: string) => {
        for (const [cat, modules] of Object.entries(categories)) {
            if (modules.includes(moduleName)) return cat;
        }
        return 'Otras Funciones';
    };

    const groupedModules = allowedModules.reduce((acc, perm) => {
        const cat = getCategory(perm.modules.name);
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(perm);
        return acc;
    }, {} as Record<string, typeof allowedModules>);

    const categoryOrder = ['Salidas', 'Gestión de Dependencias', 'Usuarios', 'Otras Funciones'];

    return (
        <div className="bg-bg-light font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <SlideBar />

                <main className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/50">
                    {/* Header Section */}
                    <div className="bg-white border-b border-zinc-200 px-8 py-8">
                        <div className="max-w-6xl mx-auto">
                            <p className="text-zinc-500 font-medium mb-2 capitalize">
                                {today}
                            </p>
                            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                                Hola, <span className="text-primary">{user?.names?.split(' ')[0]}</span>
                            </h1>
                            <p className="text-zinc-600 mt-2 max-w-2xl text-lg">
                                Bienvenido al Sistema de Inspección, Vigilancia, Asistencia y Capacitación.
                                Selecciona un módulo para comenzar.
                            </p>
                        </div>
                    </div>

                    {/* Modules Grid */}
                    <div className="p-8">
                        <div className="max-w-6xl mx-auto space-y-12">
                            {allowedModules.length > 0 ? (
                                categoryOrder.map(category => {
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
                                                                {permission.modules.description || permission.modules.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                            </h3>
                                                            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                                                                {permission.modules.name === 'gestionar_salida' ? 'Administrar y auditar salidas' :
                                                                    permission.modules.name === 'solicitar_salida' ? 'Crear nuevas solicitudes' :
                                                                        'Acceso al módulo del sistema'}
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
                                    <h3 className="text-xl font-bold text-zinc-900">
                                        Sin accesos asignados
                                    </h3>
                                    <p className="text-zinc-500 mt-2 text-center max-w-md">
                                        Tu usuario no tiene módulos asignados actualmente.
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
