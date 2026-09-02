import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { APP_VERSION, CHANGELOG } from '../../version';

const STORAGE_PREFIX = 'sivat_last_seen_version_';

export default function WhatsNewModal() {
    const { user } = useAuth();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!user || user.user_type?.name !== 'superadmin') return;
        const lastSeen = localStorage.getItem(`${STORAGE_PREFIX}${user.id}`);
        if (lastSeen !== APP_VERSION) {
            setVisible(true);
        }
    }, [user]);

    if (!visible || !user) return null;

    const latest = CHANGELOG[0];

    const dismiss = () => {
        localStorage.setItem(`${STORAGE_PREFIX}${user.id}`, APP_VERSION);
        setVisible(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center size-9 rounded-full bg-primary/10 text-primary shrink-0">
                            <Sparkles size={18} />
                        </span>
                        <div>
                            <p className="text-[11px] uppercase tracking-widest text-text-secondary font-semibold">
                                Novedades
                            </p>
                            <h2 className="text-lg font-bold text-text-primary leading-tight">
                                Versión {latest.version}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Cerrar"
                        className="text-text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <ul className="space-y-2 mb-6 text-sm text-text-secondary list-disc list-inside">
                    {latest.changes.map((change) => (
                        <li key={change}>{change}</li>
                    ))}
                </ul>

                <button
                    type="button"
                    onClick={dismiss}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all cursor-pointer"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
}
