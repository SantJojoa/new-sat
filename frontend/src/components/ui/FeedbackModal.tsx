import { CheckCircle, AlertCircle } from 'lucide-react';

export interface FeedbackModalState {
    type: 'success' | 'error' | null;
    title: string;
    message: string;
    codigo?: string;
}

interface FeedbackModalProps {
    state: FeedbackModalState;
    onClose: () => void;
}

export default function FeedbackModal({ state, onClose }: FeedbackModalProps) {
    if (!state.type) return null;
    const isSuccess = state.type === 'success';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className={`p-6 border-b ${isSuccess ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {isSuccess ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>{state.title}</h3>
                            {state.codigo && (
                                <p className="text-green-700 text-sm font-semibold">Código: {state.codigo}</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6"><p className="text-zinc-700 text-sm">{state.message}</p></div>
                <div className="px-6 pb-6 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors cursor-pointer">Aceptar</button>
                </div>
            </div>
        </div>
    );
}
