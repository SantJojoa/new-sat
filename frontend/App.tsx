import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './src/hooks/useAuth'
import Layout from './src/components/layout/Layout'
import Login from './src/components/pages/Login'
import ProtectedRoute from './src/components/common/ProtectedRoute'
import SolicitarSalida from './src/components/pages/SolicitarSalida'
import Dashboard from './src/components/pages/Dashboard'
import Subdirecciones from './src/components/pages/admin/Subdirecciones'
import Areas from './src/components/pages/admin/Areas'
import Users from './src/components/pages/admin/Users'
import ModificarSalida from './src/components/pages/ModificarSalida'
function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Ruta de login sin layout */}
                    <Route path="/login" element={<Login />} />


                    {/* Rutas principales con layout (navbar + footer) */}
                    <Route path="/" element={<Layout />}>
                        {/* Ruta de login */}

                        {/* Ruta por defecto redirige al dashboard */}
                        <Route index element={<Navigate to="/dashboard" replace />} />

                        {/* Dashboard - protegido */}
                        <Route path="dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="solicitar-salida" element={
                            <ProtectedRoute>
                                <SolicitarSalida />
                            </ProtectedRoute>
                        } />

                        {/* Rutas para nuevos módulos */}
                        <Route path="modificar-salida" element={
                            <ProtectedRoute>
                                <ModificarSalida />
                            </ProtectedRoute>
                        } />

                        <Route path="subdirecciones" element={
                            <ProtectedRoute>
                                <Subdirecciones />
                            </ProtectedRoute>
                        } />

                        <Route path="areas" element={
                            <ProtectedRoute>
                                <Areas />
                            </ProtectedRoute>
                        } />

                        <Route path="users" element={
                            <ProtectedRoute>
                                <Users />
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