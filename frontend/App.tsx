import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './src/hooks/useAuth'
import Layout from './src/components/layout/Layout'
import Login from './src/components/pages/Login'
import Dashboard from './src/components/pages/Dashboard'
import ProtectedRoute from './src/components/common/ProtectedRoute'

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Ruta de login sin layout */}
                    <Route path="/login" element={<Login />} />

                    {/* Rutas principales con layout (navbar + footer) */}
                    <Route path="/" element={<Layout />}>
                        {/* Ruta por defecto redirige al dashboard */}
                        <Route index element={<Navigate to="/dashboard" replace />} />

                        {/* Dashboard - protegido */}
                        <Route path="dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        {/* Perfil - protegido */}


                        {/* Usuarios - protegido y solo admin */}


                        {/* Configuración - protegido */}


                        {/* 404 dentro del layout */}
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App