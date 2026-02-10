import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: string[] // Changed from requiredRole (ID) to allowedRoles (names)
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth()
    const location = useLocation()

    // Si está cargando, mostrar spinner
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
        // Guardar la página actual para redirigir después del login
        return <Navigate to="/login" state={{ from: location.pathname }} replace />
    }

    // Si se requiere un rol específico y el usuario no lo tiene
    // Access user_type.name. Assuming user structure has user_type: { name: string }
    if (allowedRoles && allowedRoles.length > 0) {
        if (!user?.user_type?.name || !allowedRoles.includes(user.user_type.name)) {
            // Redirigir al dashboard si no tiene permisos
            // If already on dashboard (prevent loop), usually irrelevant as dashboard is allowed for all logged in
            return <Navigate to="/dashboard" replace />
        }
    }

    return <>{children}</>
}