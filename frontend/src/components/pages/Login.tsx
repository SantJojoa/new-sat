import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { HouseWifi, UserRound, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ApiErrorPayload } from '../../types/api';
import type { RouteState } from '../../types/auth';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const redirectTo = (location.state as RouteState | null)?.from?.pathname || '/dashboard';

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, navigate, redirectTo]);

    useEffect(() => {
        const savedUserName = localStorage.getItem('rememberedUsername');
        if (savedUserName) {
            setFormData((prev) => ({ ...prev, username: savedUserName, remember: true }));
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (error) setError(null);
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            setError('El nombre de usuario es requerido');
            return false;
        }
        if (!formData.password) {
            setError('La contrasena es requerida');
            return false;
        }
        if (formData.password.length < 4) {
            setError('La contrasena debe tener al menos 4 caracteres');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (formData.remember) {
                localStorage.setItem('rememberedUsername', formData.username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }

            await login(formData.username, formData.password);
            setSuccess('Inicio de sesion exitoso');
            navigate(redirectTo, { replace: true });
        } catch (err) {
            const apiError = err as AxiosError<ApiErrorPayload>;
            const message = apiError.response?.data?.message;

            if (apiError.response?.status === 401) {
                setError('Credenciales incorrectas. Verifica tu usuario y contrasena.');
            } else if (apiError.response?.status === 404) {
                setError('Servicio no disponible. Por favor, intenta mas tarde.');
            } else if (apiError.message?.includes('Network Error')) {
                setError('Error de conexion. Verifica tu internet.');
            } else {
                setError(typeof message === 'string' ? message : apiError.message || 'Error al iniciar sesion. Intenta nuevamente.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-text-secondary">Verificando autenticacion...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light min-h-screen flex flex-col font-display">
            <main className="flex grow items-center justify-center p-4 md:p-8">
                <div className="bg-white max-w-[1000px] w-full flex flex-col md:flex-row rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden border border-border-light md:h-[650px]">
                    <div className="hidden md:flex md:w-1/2 relative min-h-[500px] bg-primary overflow-hidden h-full">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: "url('https://www.idsn.gov.co/info/idsn_se/media/galeria12605.jpg')" }}
                            role="img"
                            aria-label="Imagen institucional"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-primary/40 to-transparent" />
                        <div className="absolute bottom-10 left-10 right-10 text-white">
                            <h1 className="text-3xl font-bold mb-2">
                                SIVAC -
                                <span className="text-white/95 font-light"> Sistema de Inspeccion, Vigilancia, Asistencia y Capacitacion</span>
                            </h1>
                            <p className="text-white/90 font-light leading-relaxed">
                                Sistema que integra inspeccion, vigilancia, capacitacion y acompanamiento para fortalecer la gestion y el trabajo intersectorial del Instituto Departamental de Salud de Narino.
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center overflow-y-auto h-full">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-primary text-3xl">
                                    <HouseWifi />
                                </span>
                                <h3 className="text-2xl font-bold text-text-primary">Iniciar Sesion</h3>
                            </div>
                            <p className="text-text-secondary text-sm">Ingrese sus credenciales para acceder a la plataforma SIVAC</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-3 text-sm border border-red-100 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 text-green-600 p-3 rounded-lg flex items-center gap-3 text-sm border border-green-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                                    <p>{success}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="username" className="text-text-primary text-sm font-semibold leading-normal">
                                    Usuario
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-primary transition-colors">
                                        <UserRound />
                                    </span>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="form-input flex w-full rounded-lg text-text-primary focus:outline-0 focus:ring-1 focus:ring-primary border border-border-light bg-white focus:border-primary h-12 placeholder:text-text-secondary/50 pl-11 pr-4 text-base font-normal transition-all"
                                        placeholder="usuario123"
                                        autoComplete="username"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="text-text-primary text-sm font-semibold leading-normal">
                                        Contrasena
                                    </label>
                                    <button type="button" className="text-primary text-xs font-semibold hover:underline">
                                        Olvide mi contrasena
                                    </button>
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-primary transition-colors">
                                        <Lock />
                                    </span>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="form-input flex w-full rounded-lg text-text-primary focus:outline-0 focus:ring-1 focus:ring-primary border border-border-light bg-white focus:border-primary h-12 placeholder:text-text-secondary/50 pl-11 pr-4 text-base font-normal transition-all"
                                        placeholder="********"
                                        autoComplete="current-password"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                        aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                                        disabled={isSubmitting}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-1">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    checked={formData.remember}
                                    onChange={handleInputChange}
                                    className="rounded border-primary/30 text-primary focus:ring-primary bg-white"
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="remember" className="text-sm text-text-secondary">
                                    Recordar mi sesion
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 text-white font-bold py-3.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Ingresando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Ingresar al Sistema</span>
                                        <span className="text-xl group-hover:translate-x-1 transition-transform">
                                            <ArrowRight />
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 pt-6 border-t border-border-light flex flex-col gap-3">
                            <p className="text-center text-[11px] uppercase tracking-widest text-text-secondary font-semibold">
                                Instituto Departamental de Salud de Narino
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
