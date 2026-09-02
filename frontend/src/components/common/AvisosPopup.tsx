import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { avisosService } from '../../services/avisosService';
import type { ActiveAviso } from '../../types/avisos';

const STORAGE_PREFIX = 'sivat_seen_avisos_';

function getSeenIds(userId: string): string[] {
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function markSeen(userId: string, avisoId: string) {
    const seen = new Set(getSeenIds(userId));
    seen.add(avisoId);
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(Array.from(seen)));
}

export default function AvisosPopup() {
    const { user } = useAuth();
    const [queue, setQueue] = useState<ActiveAviso[]>([]);

    useEffect(() => {
        if (!user) return;
        avisosService.getActive()
            .then(avisos => {
                const seen = new Set(getSeenIds(user.id));
                setQueue(avisos.filter(a => !seen.has(a.id)));
            })
            .catch(() => { });
    }, [user]);

    if (!user || queue.length === 0) return null;

    const current = queue[0];

    const dismiss = () => {
        markSeen(user.id, current.id);
        setQueue(prev => prev.slice(1));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center size-9 rounded-full bg-primary/10 text-primary shrink-0">
                        <Megaphone size={18} />
                    </span>
                    <div>
                        <p className="text-[11px] uppercase tracking-widest text-text-secondary font-semibold">
                            Aviso
                        </p>
                        <h2 className="text-lg font-bold text-text-primary leading-tight">
                            {current.titulo}
                        </h2>
                    </div>
                </div>

                <p className="text-sm text-text-secondary whitespace-pre-line mb-6">{current.mensaje}</p>

                <button
                    type="button"
                    onClick={dismiss}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all cursor-pointer"
                >
                    {queue.length > 1 ? 'Entendido, siguiente' : 'Entendido'}
                </button>
            </div>
        </div>
    );
}
