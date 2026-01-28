import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: string
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
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
    if (requiredRole && user?.user_type_id !== requiredRole) {
        // Redirigir al dashboard si no tiene permisos
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}