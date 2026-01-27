import React, { useState } from 'react';
import { HouseWifi, UserRound, Lock, ArrowRight } from 'lucide-react';


export default function Login() {

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        remember: false
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
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
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
                        <div className='absolute bottom-10 left-10 right-10 text-white'>
                            <h1 className='text-3xl font-bold mb-2'>
                                Sistema SAT
                            </h1>
                            <p className="text-white/90 font-light leading-relaxed">
                                No se que poner aqui              Inge tqm Lorem ipsum dolor sit, amet consectetur adipisicing elit. Et unde numquam sequi ab quasi ipsam illo optio tempora quia voluptatibus. Est similique, ipsam placeat eligendi iste dolores provident esse iure.
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
                            <p className='text-text-secondary text-sm'>Ingrese sus credenciales para acceder a la plataforma SAT
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

