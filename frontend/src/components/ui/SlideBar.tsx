import { useAuth } from "../../hooks/useAuth"
import { useLocation, Link } from "react-router-dom"

export default function SlideBar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Generate nav items from permissions
    const allNavItems = user?.user_type?.permissions
        ?.filter(p => p.can_view && p.modules.is_active)
        ?.sort((a, b) => (a.modules.order || 0) - (b.modules.order || 0))
        ?.map(p => ({
            id: p.modules.id,
            name: p.modules.name,
            label: p.modules.description || p.modules.name,
            icon: p.modules.icon,
            href: p.modules.path
        })) || [];

    // Define categories
    const categories: Record<string, string[]> = {
        'Inicio': ['dashboard'],
        'Salidas': ['solicitar_salida', 'gestionar_salida'],
        'Gestión de Dependencias': ['areas', 'subdirecciones'],
        'Usuarios': ['usuarios']
    };

    // Helper to find category for a module
    const getCategory = (moduleName: string) => {
        for (const [cat, modules] of Object.entries(categories)) {
            if (modules.includes(moduleName)) return cat;
        }
        return 'Otros';
    };

    // Group items by category
    const groupedItems = allNavItems.reduce((acc, item) => {
        const category = getCategory(item.name);
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {} as Record<string, typeof allNavItems>);

    // Order of categories to display
    const categoryOrder = ['Inicio', 'Salidas', 'Gestión de Dependencias', 'Usuarios', 'Otros'];

    return (
        <div className="w-72 bg-white border-r border-zinc-200 flex flex-col shrink-0 h-screen overflow-hidden">
            <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined">health_and_safety</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-zinc-900 text-base font-bold leading-none truncate">SIVAC - IDSN</h1>
                        <p className="text-primary text-[10px] font-medium mt-1 truncate">Sistema de Inspección, Vigilancia...</p>
                    </div>
                </div>

                {/* Navigation (Scrollable) */}
                <nav className="flex-1 overflow-y-auto mt-6 pr-2 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                    {categoryOrder.map(category => {
                        const items = groupedItems[category];
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={category}>
                                {category !== 'Inicio' && (
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3">
                                        {category}
                                    </h3>
                                )}
                                <div className="flex flex-col gap-1">
                                    {items.map((item) => {
                                        const isActive = location.pathname.startsWith(item.href);
                                        return (
                                            <Link
                                                key={item.id}
                                                to={item.href}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                            >
                                                <span className="material-symbols-outlined text-[22px] shrink-0">
                                                    {item.icon}
                                                </span>
                                                <span className={`text-sm truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                    {item.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer (User Info) */}
                <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col gap-4 shrink-0">
                    <div className="flex flex-col gap-1 px-3">
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                                {user?.names?.[0]}{user?.last_name?.[0]}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold text-zinc-900 truncate">
                                    {user?.names} {user?.last_name}
                                </span>
                                <span className="text-xs text-zinc-500 truncate">
                                    {user?.user_type?.name.toUpperCase() || 'Rol desconocido'} • {user?.area?.name || 'Sin Área'}
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

            </div>
        </div>
    )
}