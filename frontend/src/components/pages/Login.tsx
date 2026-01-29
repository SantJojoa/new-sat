import React, { useState, useEffect } from 'react';
import { HouseWifi, UserRound, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

import { useNavigate, useLocation, Link } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

interface LoginFormData {
    username: string;
    password: string;
    remember: boolean;
}

interface ApiError {
    message: string;
    status?: number;
}


export default function Login() {

    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        remember: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);


    useEffect(() => {
        if (isAuthenticated) {
            const form = (location.state as any)?.from?.pathname || '/dashboard';
            navigate(form, { replace: true });
        }
    }, [isAuthenticated, navigate, location])


    useEffect(() => {
        const savedUserName = localStorage.getItem('rememberedUsername');
        if (savedUserName) {
            setFormData(prev => ({ ...prev, username: savedUserName, remember: true }));
        }
    }, [])



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (error) setError(null);
    };


    const validateForm = (): boolean => {

        if (!formData.username.trim()) {
            setError('El nombre de usuario es requerido');
            return false;
        }

        if (!formData.password) {
            setError('La contraseña es requerida');
            return false;
        }

        if (formData.password.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres');
            return false;
        }

        return true;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;


        setIsSubmitting(true);
        setError(null)
        setSuccess(null)


        try {
            if (formData.remember) {
                localStorage.setItem('rememberedUsername', formData.username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }

            await login(formData.username, formData.password)

            setSuccess('Inicio de sesión exitoso');
            console.log('Form submitted:', formData);

            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1000);

        } catch (err: any) {
            console.error('Login error:', err);

            if (err.response?.status === 401) {
                setError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
            } else if (err.response?.status === 404) {
                setError('Servicio no disponible. Por favor, intenta más tarde.');
            } else if (err.message?.includes('Network Error')) {
                setError('Error de conexión. Verifica tu internet.');
            } else {
                setError(err.message || 'Error al iniciar sesión. Intenta nuevamente.');
            }
        } finally {
            setIsSubmitting(false);
        }

    }


    const handleForgotPassword = (e: React.MouseEvent) => {
        e.preventDefault();
        // Aquí puedes implementar la lógica para recuperar contraseña
        navigate('/forgot-password');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-text-secondary">Verificando autenticación...</p>
                </div>
            </div>
        );
    }




    return (
        <div className='bg-background-light min-h-screen flex flex-col font-display'>
            <main className='flex grow items-center justify-center p-4 md:p-8'>
                <div className='bg-white max-w-[1000px] w-full flex flex-col md:flex-row rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden border border-border-light'>
                    <div className='hidden md:flex md:w-1/2 relative min-h-[500px] bg-primary overflow-hidden'>
                        <div className='absolute inset-0 bg-cover bg-center'
                            style={{
                                backgroundImage: "url('https://www.idsn.gov.co/info/idsn_se/media/galeria12605.jpg')"
                            }}
                            role='img'
                            aria-label='IDSN Logo'
                        >
                        </div>
                        <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-primary/40 to-transparent" />
                        <div className='absolute bottom-10 left-10 right-10 text-white'>
                            <h1 className='text-3xl font-bold mb-2'>
                                SIVAC -
                                <span className='text-white/95 font-light'> Sistema de Inspección, Vigilancia, Asistencia y Capacitación</span>
                            </h1>
                            <p className="text-white/90 font-light leading-relaxed">
                                Sistema que integra inspección, vigilancia, capacitación y acompañamiento para fortalecer la gestion y el trabajo intersectorial del Instituto Departamental de Salud de Narño.
                            </p>
                        </div>
                    </div>


                    <div className='w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center'>
                        <div className='mb-8'>
                            <div className='flex items-center gap-2 mb-2'>
                                <span className='text-primary text-3xl'>
                                    <HouseWifi />
                                </span>
                                <h3 className='text-2xl font-bold text-text-primary'> Iniciar Sesión</h3>
                            </div>
                            <p className='text-text-secondary text-sm'>Ingrese sus credenciales para acceder a la plataforma SIVAC
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-6'>
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="username"
                                    className="text-text-primary text-sm font-semibold leading-normal"
                                >
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
                                    />
                                </div>
                            </div>

                            <div className='flex flex-col gap-1.5'>
                                <div className='flex justify-between items-center'>
                                    <label
                                        htmlFor='password'
                                        className='text-text-primary text-sm font-semibold leading-normal'
                                    >
                                        Contraseña
                                    </label>
                                    <a href="#"
                                        className="text-primary text-xs font-semibold hover:underline"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </a>
                                </div>
                                <div className='relative group'>
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] group-focus-within:text-primary transition-colors">
                                        <Lock />
                                    </span>
                                    <input
                                        id='password'
                                        name='password'
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className='form-input flex w-full rounded-lg text-text-primary focus:outline-0 focus:ring-1 focus:ring-primary border border-border-light bg-white focus:border-primary h-12 placeholder:text-text-secondary/50 pl-11 pr-4 text-base font-normal transition-all'
                                        placeholder=' ••••••••'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center gap-2 px-1'>
                                <input
                                    id='remember'
                                    name='remember'
                                    type="checkbox"
                                    checked={formData.remember}
                                    onChange={handleInputChange}
                                    className='rounded border-primary/30 text-primary focus:ring-primary bg-white'
                                />
                                <label
                                    htmlFor="remember"
                                    className='text-sm text-text-secondary '
                                >
                                    Recordar mi sesión
                                </label>
                            </div>

                            <button
                                type='submit'
                                className='w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group cursor-pointer'
                            >
                                <span>Ingresar al Sistema</span>
                                <span className="text-xl group-hover:translate-x-1 transition-transform">
                                    <ArrowRight />
                                </span>
                            </button>
                        </form>

                        <div className='mt-12 pt-6 border-t border-border-light flex flex-col gap-3'>
                            <p className='text-center text-[11px] uppercase tracking-widest text-text-secondary  font-semibold'>Instituto Departamental de Salud de Nariño

                            </p>

                        </div>

                    </div>

                </div>
            </main>
        </div>
    )
}

