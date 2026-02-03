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
    ).sort((a, b) => (a.modules.order || 0) - (b.modules.order || 0)) || [];

    // Helper to format date
    const today = new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

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
                        <div className="max-w-6xl mx-auto">
                            {allowedModules.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {allowedModules.map((permission) => (
                                        <Link
                                            key={permission.id}
                                            to={permission.modules.path || '#'}
                                            className="group bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col items-start gap-4"
                                        >
                                            <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <span className="material-symbols-outlined text-[32px]">
                                                    {permission.modules.icon || 'grid_view'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-zinc-900 group-hover:text-primary transition-colors">
                                                    {permission.modules.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                </h3>
                                                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                                                    {permission.modules.description || 'Acceso al módulo del sistema'}
                                                </p>
                                            </div>
                                            <div className="mt-auto pt-4 w-full flex items-center justify-between text-sm font-semibold text-primary/80 group-hover:text-primary">
                                                <span>Ingresar</span>
                                                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                                                    arrow_forward
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
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
