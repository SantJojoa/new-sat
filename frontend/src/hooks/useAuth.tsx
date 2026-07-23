import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { api } from '../services/api';
import type { AuthUser } from '../types/auth';

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Cargar usuario y token del localStorage al iniciar
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Restaurar sesión desde localStorage
                    // Nota: Podríamos validar el token aquí si tuvieramos un endpoint ligero,
                    // por ahora confiamos en el localStorage hasta que una petición falle con 401.
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } catch {
                    // Error al parsear o validar
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await api.post('/auth/login', {
                username,
                password,
            });

            const { access_token, user: userData } = response.data;

            // Guardar en estado
            setToken(access_token);
            setUser(userData);

            // Guardar en localStorage
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));

            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    };

    const logout = () => {
        // Limpiar estado
        setUser(null);
        setToken(null);

        // Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberedUsername');

        // Redirigir a login
        window.location.href = '/login';
    };

    const updateUser = (userData: Partial<AuthUser>) => {
        if (user) {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    const value = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
