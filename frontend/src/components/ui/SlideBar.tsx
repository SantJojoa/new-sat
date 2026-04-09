import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "../../hooks/useAuth"
import { useLocation, Link, useNavigate } from "react-router-dom"
import { Bell, CheckCheck, Trash2, X } from "lucide-react"
import { notificationsService, type AppNotification } from "../../services/notificationsService"

const TYPE_STYLES: Record<string, { dot: string; icon: string }> = {
    salida_pendiente: { dot: 'bg-yellow-400', icon: '📋' },
    salida_aprobada: { dot: 'bg-green-500', icon: '✅' },
    salida_rechazada: { dot: 'bg-red-500', icon: '❌' },
    union_pendiente: { dot: 'bg-blue-400', icon: '👥' },
    union_aceptada: { dot: 'bg-green-500', icon: '🤝' },
    union_rechazada: { dot: 'bg-red-500', icon: '🚫' },
};

export default function SlideBar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await notificationsService.getAll();
            setNotifications(data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        void fetchNotifications();
        const interval = setInterval(() => { void fetchNotifications(); }, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setBellOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellOpen = async () => {
        setBellOpen(prev => !prev);
        if (!bellOpen) await fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        await notificationsService.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleNotificationClick = async (n: AppNotification) => {
        if (!n.read) {
            await notificationsService.markAsRead(n.id);
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
        }
        setBellOpen(false);
        if (n.link) navigate(n.link);
    };

    const handleDeleteRead = async (id: string) => {
        await notificationsService.deleteRead(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Generate nav items from permissions
    const allNavItems = user?.user_type?.permissions
        ?.filter(p => p.can_view && p.modules.is_active)
        ?.filter(p => {
            // Restriction: Only superadmin can see areas, subdirecciones, usuarios
            const restrictedModules = ['areas', 'subdirecciones', 'usuarios'];
            if (restrictedModules.includes(p.modules.name)) {
                return user?.user_type?.name === 'superadmin';
            }
            return true;
        })
        ?.sort((a, b) => (a.modules.order || 0) - (b.modules.order || 0))
        ?.map(p => ({
            id: p.modules.id,
            name: p.modules.name,
            label: p.modules.description || p.modules.name,
            icon: p.modules.icon,
            href: p.modules.path
        })) || [];

    // Inject Reportes manually
    const extraNavItems = [
        {
            id: 'reportes-salidas-module',
            name: 'reportes_salidas',
            label: 'Reportes y Estadísticas',
            icon: 'bar_chart',
            href: '/reportes-salidas'
        },
        {
            id: 'reportes-articulacion-module',
            name: 'reportes_articulacion',
            label: 'Reportes y Estadísticas',
            icon: 'bar_chart',
            href: '/reportes-articulacion'
        },
        {
            id: 'reportes-ivc-module',
            name: 'reportes_ivc',
            label: 'Reportes y Estadísticas',
            icon: 'bar_chart',
            href: '/reportes-ivc'
        }
    ];

    const allCombinedNavItems = [...allNavItems, ...extraNavItems];

    // Define categories
    const categories: Record<string, string[]> = {
        'Inicio': ['dashboard'],
        'Programaciones': ['solicitar_salida', 'gestionar_salida', 'calendario_salidas', 'reportes_salidas'],
        'Articulaciones': ['solicitar_articulacion', 'gestionar_articulacion', 'calendario_articulaciones', 'reportes_articulacion'],
        'IVC': ['solicitar_ivc', 'gestionar_ivc', 'calendario_ivc', 'reportes_ivc'],
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
    const groupedItems = allCombinedNavItems.reduce((acc, item) => {
        const category = getCategory(item.name);
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {} as Record<string, typeof allNavItems>);

    if (user?.user_type?.name === 'superadmin') {
        if (!groupedItems['Configuración']) groupedItems['Configuración'] = [];
        groupedItems['Configuración'].push({
            id: 'ventana-programacion-module',
            name: 'ventana_programacion',
            label: 'Ventana de Programación',
            icon: 'calendar_month',
            href: '/ventana-programacion',
        });
    }

    // Order of categories to display
    const categoryOrder = ['Inicio', 'Programaciones', 'Articulaciones', 'IVC', 'Gestión de Dependencias', 'Usuarios', 'Configuración', 'Otros'];

    return (
        <div className="w-72 bg-white border-r border-zinc-200 flex flex-col shrink-0 h-screen overflow-hidden">
            <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined">health_and_safety</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-zinc-900 text-base font-bold leading-none truncate">SIVAT - IDSN</h1>
                        <p className="text-primary text-[10px] font-medium mt-1 truncate">Sistema de Inspección, Vigilancia, Tecnología...</p>
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

                {/* Footer (User Info + Bell) */}
                <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col gap-3 shrink-0">
                    {/* Bell notification button */}
                    <div ref={bellRef} className="relative px-3">
                        <button
                            onClick={handleBellOpen}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${bellOpen ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'}`}
                        >
                            <div className="relative shrink-0">
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-medium">Notificaciones</span>
                            {unreadCount > 0 && (
                                <span className="ml-auto bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} nuevas</span>
                            )}
                        </button>

                        {/* Dropdown panel */}
                        {bellOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-50 max-h-96 flex flex-col">
                                <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between shrink-0">
                                    <span className="font-bold text-zinc-900 text-sm">Notificaciones</span>
                                    <div className="flex items-center gap-1">
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/5 transition-colors">
                                                <CheckCheck size={13} /> Marcar leídas
                                            </button>
                                        )}
                                        <button onClick={() => setBellOpen(false)} className="p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                                            <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                            Sin notificaciones
                                        </div>
                                    ) : (
                                        notifications.map(n => {
                                            const style = TYPE_STYLES[n.type] || { dot: 'bg-zinc-400', icon: '🔔' };
                                            return (
                                                <div
                                                    key={n.id}
                                                    className={`w-full border-b border-zinc-50 ${!n.read ? 'bg-blue-50/40' : ''}`}
                                                >
                                                    <div className="px-4 py-3 flex gap-3 items-start">
                                                        <button
                                                            onClick={() => handleNotificationClick(n)}
                                                            className="flex-1 min-w-0 text-left hover:bg-zinc-50 transition-colors rounded-md p-1 -m-1"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span className="text-base shrink-0 mt-0.5">{style.icon}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={`text-xs font-bold truncate ${!n.read ? 'text-zinc-900' : 'text-zinc-600'}`}>{n.title}</p>
                                                                        {!n.read && <span className={`shrink-0 size-2 rounded-full ${style.dot}`} />}
                                                                    </div>
                                                                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                                                                    <p className="text-[10px] text-zinc-400 mt-1">
                                                                        {new Date(n.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {n.read && (
                                                            <button
                                                                onClick={() => handleDeleteRead(n.id)}
                                                                className="shrink-0 mt-0.5 p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                aria-label="Borrar notificación leída"
                                                                title="Borrar notificación"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

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