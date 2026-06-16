import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "../../hooks/useAuth"
import { useLocation, Link, useNavigate } from "react-router-dom"
import { Bell, CheckCheck, Trash2, X } from "lucide-react"
import { notificationsService, type AppNotification } from "../../services/notificationsService"
import { canAccessModule } from "../../utils/userAccess"


const getNotificationStyle = (type: string) => {
    switch (type) {
        case 'salida_pendiente':
            return { dot: 'bg-amber-400', icon: 'assignment', iconWrap: 'bg-amber-100 text-amber-700' };
        case 'salida_aprobada':
            return { dot: 'bg-emerald-500', icon: 'check_circle', iconWrap: 'bg-emerald-100 text-emerald-700' };
        case 'salida_rechazada':
            return { dot: 'bg-red-500', icon: 'cancel', iconWrap: 'bg-red-100 text-red-700' };
        case 'union_pendiente':
            return { dot: 'bg-blue-400', icon: 'group_add', iconWrap: 'bg-blue-100 text-blue-700' };
        case 'union_aceptada':
            return { dot: 'bg-emerald-500', icon: 'handshake', iconWrap: 'bg-emerald-100 text-emerald-700' };
        case 'union_rechazada':
            return { dot: 'bg-red-500', icon: 'block', iconWrap: 'bg-red-100 text-red-700' };
        default:
            return { dot: 'bg-zinc-400', icon: 'notifications', iconWrap: 'bg-zinc-100 text-zinc-600' };
    }
};

export default function SlideBar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [bellOpen, setBellOpen] = useState(false);
    const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(['Inicio']));
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
            return canAccessModule(p.modules.name, user);
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
            id: 'calendario-salidas-module',
            name: 'calendario_salidas',
            label: 'Calendario de Programación',
            icon: 'calendar_month',
            href: '/calendario-salidas'
        },
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
        },
        {
            id: 'seguimiento-capacitaciones-module',
            name: 'seguimiento_capacitaciones',
            label: 'Seguimiento de Desarrollo de Capacidades',
            icon: 'stack',
            href: '/seguimiento-capacitaciones'
        },
        {
            id: 'seguimiento-ivc-module',
            name: 'seguimiento_ivc',
            label: 'Seguimiento IVC',
            icon: 'verified_user',
            href: '/seguimiento-ivc'
        },
        {
            id: 'seguimiento-articulacion-iv-module',
            name: 'seguimiento_articulacion_iv',
            label: 'Seguimiento Inspección y Vigilancia SP',
            icon: 'hub',
            href: '/seguimiento-articulacion-iv'
        },
        {
            id: 'programar-asesoria-module',
            name: 'programar_asesoria',
            label: 'Datos Asesoria',
            icon: 'support_agent',
            href: '/programar-asesoria'
        },
        {
            id: 'gestionar-asesoria-module',
            name: 'gestionar_asesoria',
            label: 'Gestionar Asesorías',
            icon: 'manage_search',
            href: '/gestionar-asesoria'
        },
        {
            id: 'seguimiento-acompanamiento-module',
            name: 'seguimiento_acompanamiento',
            label: 'Seguimiento de Acompañamiento',
            icon: 'handshake',
            href: '/seguimiento-acompanamiento'
        }
    ];

    const allCombinedNavItems = [...allNavItems];
    for (const extra of extraNavItems) {
        if (canAccessModule(extra.name, user) && !allCombinedNavItems.some(item => item.name === extra.name)) {
            allCombinedNavItems.push(extra);
        }
    }


    // Define categories
    const categories: Record<string, string[]> = {
        'Inicio': ['dashboard'],
        'Programaciones': ['solicitar_salida', 'gestionar_salida', 'calendario_salidas', 'reportes_salidas'],
        'Articulaciones': ['solicitar_articulacion', 'gestionar_articulacion', 'calendario_articulaciones', 'reportes_articulacion'],
        'IVC': ['solicitar_ivc', 'gestionar_ivc', 'calendario_ivc', 'reportes_ivc'],
        'Asesorias': ['programar_asesoria', 'gestionar_asesoria'],
        'Seguimiento/Actas': ['seguimiento_capacitaciones', 'seguimiento_ivc', 'seguimiento_articulacion_iv', 'seguimiento_acompanamiento'],
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
    const categoryOrder = ['Inicio', 'Programaciones', 'Articulaciones', 'IVC', 'Asesorias', 'Seguimiento/Actas', 'Gestión de Dependencias', 'Usuarios', 'Configuración', 'Otros'];

    const isItemActive = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);

    useEffect(() => {
        setOpenCategories(prev => {
            const next = new Set(prev);
            next.add('Inicio');
            for (const category of categoryOrder) {
                const items = groupedItems[category];
                if (items?.some(item => isItemActive(item.href))) {
                    next.add(category);
                }
            }
            return next;
        });
    }, [location.pathname]);

    const toggleCategory = (category: string) => {
        setOpenCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) next.delete(category);
            else next.add(category);
            next.add('Inicio');
            return next;
        });
    };

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
                        const isOpen = openCategories.has(category);
                        const hasActiveItem = items.some(item => isItemActive(item.href));

                        return (
                            <div key={category}>
                                {category !== 'Inicio' && (
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        aria-expanded={isOpen}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${hasActiveItem ? 'text-primary bg-primary/5' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}`}
                                    >
                                        <span className="flex-1 text-left">{category}</span>
                                        <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                                            expand_more
                                        </span>
                                    </button>
                                )}
                                <div className={`flex-col gap-1 ${category === 'Inicio' || isOpen ? 'flex mt-1' : 'hidden'}`}>
                                    {items.map((item) => {
                                        const isActive = isItemActive(item.href);
                                        return (
                                            <Link
                                                key={item.id}
                                                to={item.href}
                                                className={`nav-item-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors overflow-hidden ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                            >
                                                <span className="material-symbols-outlined text-[22px] shrink-0">
                                                    {item.icon}
                                                </span>
                                                <span className="overflow-hidden flex-1 min-w-0">
                                                    <span className={`nav-label-text inline-block whitespace-nowrap text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                        {item.label}
                                                    </span>
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
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative border ${bellOpen ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' : 'text-zinc-600 border-transparent hover:bg-zinc-100 hover:text-zinc-900'}`}
                        >
                            <div className={`relative shrink-0 size-8 rounded-lg flex items-center justify-center ${bellOpen ? 'bg-white text-primary' : 'bg-zinc-100 text-zinc-500'}`}>
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center leading-none ring-2 ring-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-semibold">Notificaciones</span>
                            {unreadCount > 0 && (
                                <span className="ml-auto bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>
                            )}
                        </button>

                        {/* Dropdown panel */}
                        {bellOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-50 max-h-[28rem] flex flex-col">
                                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/80 flex items-start justify-between gap-3 shrink-0">
                                    <div>
                                        <span className="font-black text-zinc-900 text-sm">Notificaciones</span>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">{unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al dia'}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} className="text-xs text-primary flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors font-semibold">
                                                <CheckCheck size={13} /> Marcar leídas
                                            </button>
                                        )}
                                        <button onClick={() => setBellOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-y-auto flex-1 p-2 bg-white">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-10 text-center text-zinc-400 text-sm">
                                            <div className="mx-auto mb-3 size-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                                <Bell size={22} />
                                            </div>
                                            <p className="font-semibold text-zinc-600">Sin notificaciones</p>
                                            <p className="text-xs text-zinc-400 mt-1">Cuando haya novedades apareceran aqui.</p>
                                        </div>
                                    ) : (
                                        notifications.map(n => {
                                            const style = getNotificationStyle(n.type);
                                            return (
                                                <div
                                                    key={n.id}
                                                    className={`w-full rounded-lg border mb-2 last:mb-0 transition-colors ${!n.read ? 'bg-blue-50/60 border-blue-100' : 'bg-white border-zinc-100 hover:bg-zinc-50'}`}
                                                >
                                                    <div className="px-3 py-3 flex gap-3 items-start">
                                                        <button
                                                            onClick={() => handleNotificationClick(n)}
                                                            className="flex-1 min-w-0 text-left"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${style.iconWrap}`}>
                                                                    <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={`text-xs font-bold truncate ${!n.read ? 'text-zinc-900' : 'text-zinc-700'}`}>{n.title}</p>
                                                                        {!n.read && <span className={`shrink-0 size-2 rounded-full ${style.dot}`} />}
                                                                    </div>
                                                                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                                                    <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                                                                        {new Date(n.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {n.read && (
                                                            <button
                                                                onClick={() => handleDeleteRead(n.id)}
                                                                className="shrink-0 mt-0.5 p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
