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
import GestionarSalida from './src/components/pages/GestionarSalida'
import CalendarioSalidas from './src/components/pages/CalendarioSalidas'
import ReportesSalidas from './src/components/pages/ReportesSalidas'
import SolicitarArticulacion from './src/components/pages/SolicitarArticulacion'
import SolicitarIvc from './src/components/pages/SolicitarIvc'
import GestionarArticulacion from './src/components/pages/GestionarArticulacion'
import CalendarioArticulaciones from './src/components/pages/CalendarioArticulaciones'
import GestionarIvc from './src/components/pages/GestionarIvc'
import CalendarioIvc from './src/components/pages/CalendarioIvc'
import VentanaProgramacion from './src/components/pages/admin/VentanaProgramacion'
import ReportesArticulacion from './src/components/pages/ReportesArticulacion'
import ReportesIvc from './src/components/pages/ReportesIvc'
import SeguimientoCapacitaciones from './src/components/pages/SeguimientoCapacitaciones'
import SeguimientoIVC from './src/components/pages/SeguimientoIVC'
import SeguimientoArticulacionIV from './src/components/pages/SeguimientoArticulacionIV'
import ProgramarAsesoria from './src/components/pages/ProgramarAsesoria'

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
                        <Route path="gestionar-salida" element={
                            <ProtectedRoute>
                                <GestionarSalida />
                            </ProtectedRoute>
                        } />
                        <Route path="gestionar-salida/editar/:id" element={
                            <ProtectedRoute>
                                <SolicitarSalida />
                            </ProtectedRoute>
                        } />

                        <Route path="calendario-salidas" element={
                            <ProtectedRoute>
                                <CalendarioSalidas />
                            </ProtectedRoute>
                        } />

                        <Route path="reportes-salidas" element={
                            <ProtectedRoute>
                                <ReportesSalidas />
                            </ProtectedRoute>
                        } />

                        <Route path="solicitar-articulacion" element={
                            <ProtectedRoute>
                                <SolicitarArticulacion />
                            </ProtectedRoute>
                        } />

                        <Route path="solicitar-ivc" element={
                            <ProtectedRoute>
                                <SolicitarIvc />
                            </ProtectedRoute>
                        } />

                        <Route path="gestionar-articulacion" element={
                            <ProtectedRoute>
                                <GestionarArticulacion />
                            </ProtectedRoute>
                        } />

                        <Route path="calendario-articulaciones" element={
                            <ProtectedRoute>
                                <CalendarioArticulaciones />
                            </ProtectedRoute>
                        } />

                        <Route path="gestionar-ivc" element={
                            <ProtectedRoute>
                                <GestionarIvc />
                            </ProtectedRoute>
                        } />

                        <Route path="calendario-ivc" element={
                            <ProtectedRoute>
                                <CalendarioIvc />
                            </ProtectedRoute>
                        } />

                        <Route path="reportes-articulacion" element={
                            <ProtectedRoute>
                                <ReportesArticulacion />
                            </ProtectedRoute>
                        } />

                        <Route path="reportes-ivc" element={
                            <ProtectedRoute>
                                <ReportesIvc />
                            </ProtectedRoute>
                        } />

                        <Route path="subdirecciones" element={
                            <ProtectedRoute allowedRoles={['superadmin']}>
                                <Subdirecciones />
                            </ProtectedRoute>
                        } />

                        <Route path="areas" element={
                            <ProtectedRoute allowedRoles={['superadmin']}>
                                <Areas />
                            </ProtectedRoute>
                        } />

                        <Route path="users" element={
                            <ProtectedRoute allowedRoles={['superadmin']}>
                                <Users />
                            </ProtectedRoute>
                        } />

                        <Route path="ventana-programacion" element={
                            <ProtectedRoute allowedRoles={['superadmin']}>
                                <VentanaProgramacion />
                            </ProtectedRoute>
                        } />


                        {/* Perfil - protegido */}


                        {/* Usuarios - protegido y solo admin */}


                        {/* Configuración - protegido */}


                        {/* 404 dentro del layout */}

                        <Route path="seguimiento-capacitaciones" element={
                            <ProtectedRoute>
                                <SeguimientoCapacitaciones />
                            </ProtectedRoute>
                        } />

                        <Route path="seguimiento-ivc" element={
                            <ProtectedRoute>
                                <SeguimientoIVC />
                            </ProtectedRoute>
                        } />

                        <Route path="seguimiento-articulacion-iv" element={
                            <ProtectedRoute>
                                <SeguimientoArticulacionIV />
                            </ProtectedRoute>
                        } />

                        <Route path="programar-asesoria" element={
                            <ProtectedRoute>
                                <ProgramarAsesoria />
                            </ProtectedRoute>
                        } />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App