import { href } from "react-router-dom"

export default function SlideBar({ activeItem = 'solicitar-salida' }) {

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
        { id: 'solicitar-salida', label: 'Solicitar Salida', icon: 'outbox', href: '/solicitar-salida' },
        { id: 'mis-salidas', label: 'Mis Salidas', icon: 'outbox', href: '/mis-salidas' },
        { id: 'reportes', label: 'Reportes', icon: 'outbox', href: '/reportes' },
        { id: 'configuracion', label: 'Configuración', icon: 'outbox', href: '/configuracion' },
    ]
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
                    {navItems.map((item) => (
                        <a
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeItem === item.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                            <span className="material-symbols-outlined text-[22px]">
                                {item.icon}
                            </span>
                            <span className={`text-sm ${activeItem === item.id ? 'font-bold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </a>
                    ))}

                    <div className="mt-auto pt-4 border-t border-zinc-100">
                        <a
                            href="/configuracion"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[22px]">settings</span>
                            <span className="text-sm font-medium">Configuración</span>
                        </a>
                    </div>

                </nav>

            </div>
        </div>
    )
}