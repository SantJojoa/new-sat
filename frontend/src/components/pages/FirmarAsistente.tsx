import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface FirmaInfo {
    nombre: string;
    apellido: string;
    institucion: string;
    asesoriaCodigo: string;
    firmado: boolean;
}

export default function FirmarAsistente() {
    const { token } = useParams<{ token: string }>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const drawingRef = useRef(false);

    const [info, setInfo] = useState<FirmaInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        axios.get(`${API_URL}/api/firma-asistente/${token}`)
            .then(res => setInfo(res.data))
            .catch(() => setError('No se encontró el enlace de firma o ya expiró.'))
            .finally(() => setLoading(false));
    }, [token]);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !info || info.firmado) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // El tamaño en pantalla del canvas puede no estar listo en el primer
        // render (CSS aplicándose todavía), así que esperamos con
        // ResizeObserver a que tenga un tamaño real antes de fijar su
        // resolución interna — y solo lo hacemos una vez, para no borrar
        // una firma que ya esté a medio dibujar.
        let sized = false;
        const trySize = () => {
            if (sized) return;
            const rect = canvas.getBoundingClientRect();
            if (rect.width < 10 || rect.height < 10) return;
            sized = true;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#111827';
            ctxRef.current = ctx;
            observer.disconnect();
        };

        const observer = new ResizeObserver(trySize);
        observer.observe(canvas);
        trySize();

        const getPos = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        };
        const start = (e: PointerEvent) => {
            drawingRef.current = true;
            const { x, y } = getPos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
        };
        const move = (e: PointerEvent) => {
            if (!drawingRef.current) return;
            e.preventDefault();
            const { x, y } = getPos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
            setHasDrawn(true);
        };
        const end = () => { drawingRef.current = false; };

        canvas.addEventListener('pointerdown', start);
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', end);
        canvas.addEventListener('pointerleave', end);
        return () => {
            observer.disconnect();
            canvas.removeEventListener('pointerdown', start);
            canvas.removeEventListener('pointermove', move);
            canvas.removeEventListener('pointerup', end);
            canvas.removeEventListener('pointerleave', end);
        };
    }, [info]);

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }
        setHasDrawn(false);
    };

    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return;
        setSaving(true);
        setError('');
        try {
            const dataUrl = canvas.toDataURL('image/png');
            await axios.post(`${API_URL}/api/firma-asistente/${token}`, { firma: dataUrl });
            setSaved(true);
        } catch {
            setError('No se pudo guardar la firma. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const wrapperStyle: React.CSSProperties = {
        minHeight: '100vh',
        background: '#f4f4f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
    };

    if (loading) return <div style={wrapperStyle}>Cargando...</div>;
    if (error && !info) return <div style={wrapperStyle}>{error}</div>;
    if (!info) return null;

    if (saved || info.firmado) {
        return (
            <div style={wrapperStyle}>
                <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#15803d' }}>¡Firma guardada!</p>
                    <p style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>
                        Gracias, {info.nombre}. Ya puedes cerrar esta ventana.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f4f4f5', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, fontFamily: 'Arial, sans-serif' }}>
            <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Firma de asistencia</h1>
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 16 }}>
                    {info.nombre} {info.apellido} · {info.institucion}<br />
                    Asesoría {info.asesoriaCodigo}
                </p>
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: 180, border: '2px dashed #d4d4d8', borderRadius: 8, touchAction: 'none', background: '#fafafa' }}
                />
                {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                        onClick={handleClear}
                        style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #d4d4d8', background: 'white' }}
                    >
                        Limpiar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasDrawn}
                        style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#16a34a', color: 'white', fontWeight: 600, opacity: (saving || !hasDrawn) ? 0.5 : 1 }}
                    >
                        {saving ? 'Guardando...' : 'Guardar firma'}
                    </button>
                </div>
            </div>
        </div>
    );
}