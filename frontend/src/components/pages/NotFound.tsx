import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg-light font-display text-center p-8">
            <span className="material-symbols-outlined text-primary text-[64px]">search_off</span>
            <h1 className="text-3xl font-black text-zinc-900">Página no encontrada</h1>
            <p className="text-zinc-500 max-w-md">La página que buscas no existe o fue movida.</p>
            <Link
                to="/dashboard"
                className="mt-2 px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors"
            >
                Volver al Dashboard
            </Link>
        </div>
    );
}
