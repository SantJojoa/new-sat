import { useAuth } from "../../hooks/useAuth"
import { useLocation, Link } from "react-router-dom"

export default function SlideBar() {
    const { user, logout } = useAuth();

    const location = useLocation();

    // Generate nav items from permissions
    const navItems = user?.user_type?.permissions
        ?.filter(p => p.can_view && p.modules.is_active)
        ?.sort((a, b) => (a.modules.order || 0) - (b.modules.order || 0))
        ?.map(p => ({
            id: p.modules.id,
            label: p.modules.description || p.modules.name,
            icon: p.modules.icon,
            href: p.modules.path
        })) || [];

    return (
        <div className="w-72 bg-white border-r border-zinc-200 flex flex-col shrink-0">
            <div className="p-6 flex-col gap-8 h-full">
                <div className="flex items-center gap-3">
                    <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">health_and_safety</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-zinc-900 text-base font-bold leading-none">SIVAC - IDSN
                        </h1>
                        <p className="text-primary text-xs font-medium mt-1">Sistema de Inspección, Vigilancia, Asistencia y Capacitación
                        </p>
                    </div>
                </div>

                <nav className="flex flex-col gap-1 flex-1 mt-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.id}
                                to={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                                <span className="material-symbols-outlined text-[22px]">
                                    {item.icon}
                                </span>
                                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-4">
                        <div className="flex flex-col gap-1 px-3">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {user?.names?.[0]}{user?.last_name?.[0]}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-bold text-zinc-900 truncate">
                                        {user?.names} {user?.last_name}
                                    </span>
                                    <span className="text-xs text-zinc-500 truncate">
                                        {user?.user_type?.name.toUpperCase() || 'Rol desconocido'} • {user?.area?.name.toUpperCase() || 'Sin Área'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                            <span className="material-symbols-outlined text-[22px]">logout</span>
                            <span className="text-sm font-medium">Cerrar Sesión</span>
                        </button>
                    </div>

                </nav>

            </div>
        </div>
    )
}