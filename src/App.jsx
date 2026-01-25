import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRedirect } from './components/PublicRedirect'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'
import { UsersPage, RolesPage } from './modules/users/pages'
import { AdminSubscriptionsPage } from './modules/admin/subscriptions'
import { MiCuentaPage } from './modules/cuenta'
import { IdeasPage, ReportesPage } from './pages/desarrollo'
import { EscalasPage } from './modules/configuracion/escalas/components/EscalasPage'
import { FacturacionPage, ClienteFacturacionDetalle } from './modules/facturacion/components'
import { NotificacionesPage } from './modules/notificaciones/components'
import { MiCarteraPage, ClienteDetallePage } from './modules/mi-cartera/pages'
import { EducacionPage, EducacionArticuloPage, EducacionAdminPage, EducacionEditorPage } from './modules/educacion-impositiva/pages'
import { BuzonPage } from './modules/buzon/components/BuzonPage'
import { MisFinanzasPage } from './modules/finanzas-personales/components'
import { PanelEconomicoPage } from './modules/panel-economico/components'
import CajaDiariaPage from './modules/caja-diaria/components/CajaDiariaPage'
import AgendaTurnosPage from './modules/agenda-turnos/pages/AgendaTurnosPage'
import { MiPerfil } from './pages/MiPerfil'
import { PWAInstallPrompt, PWAUpdatePrompt } from './pwa'
import { TerminosPage } from './pages/TerminosPage'
import { PrivacidadPage } from './pages/PrivacidadPage'
import { DocumentosLegalesPage } from './pages/DocumentosLegalesPage'
import { CookieBanner } from './components/common/CookieBanner'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* PWA Prompts */}
        <PWAUpdatePrompt />
        <PWAInstallPrompt />

        {/* Cookie Consent Banner */}
        <CookieBanner />

        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/terminos" element={<TerminosPage />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />

          {/* Ruta principal - redirige a registro si no está autenticado */}
          <Route
            path="/"
            element={
              <PublicRedirect>
                <Dashboard />
              </PublicRedirect>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/roles"
            element={
              <ProtectedRoute>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion/suscripciones"
            element={
              <ProtectedRoute>
                <AdminSubscriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion/escalas"
            element={
              <ProtectedRoute>
                <EscalasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-cartera"
            element={
              <ProtectedRoute>
                <MiCarteraPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-cartera/:clientId"
            element={
              <ProtectedRoute>
                <ClienteDetallePage />
              </ProtectedRoute>
            }
          />
          {/* Redirect vieja ruta /clientes a /mi-cartera */}
          <Route
            path="/clientes"
            element={<Navigate to="/mi-cartera" replace />}
          />
          <Route
            path="/facturacion"
            element={
              <ProtectedRoute>
                <FacturacionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturacion/:clientId"
            element={
              <ProtectedRoute>
                <ClienteFacturacionDetalle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gastos"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mensajes"
            element={
              <ProtectedRoute>
                <BuzonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mensajes/:conversacionId"
            element={
              <ProtectedRoute>
                <BuzonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <ProtectedRoute>
                <NotificacionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/biblioteca"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/herramientas"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/herramientas/mis-finanzas"
            element={
              <ProtectedRoute>
                <MisFinanzasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/herramientas/panel-economico"
            element={
              <ProtectedRoute>
                <PanelEconomicoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/herramientas/caja-diaria"
            element={
              <ProtectedRoute>
                <CajaDiariaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/herramientas/agenda-turnos"
            element={
              <ProtectedRoute>
                <AgendaTurnosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <ConfiguracionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion/documentos-legales"
            element={
              <ProtectedRoute>
                <DocumentosLegalesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-cuenta"
            element={
              <ProtectedRoute>
                <MiCuentaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-perfil"
            element={
              <ProtectedRoute>
                <MiPerfil />
              </ProtectedRoute>
            }
          />
          {/* Rutas Desarrollo (solo socios) */}
          <Route
            path="/desarrollo"
            element={<Navigate to="/desarrollo/ideas" replace />}
          />
          <Route
            path="/desarrollo/ideas"
            element={
              <ProtectedRoute>
                <IdeasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/desarrollo/reportes"
            element={
              <ProtectedRoute>
                <ReportesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/desarrollo/reportes/:id"
            element={
              <ProtectedRoute>
                <ReportesPage />
              </ProtectedRoute>
            }
          />
          {/* Rutas Educacion Impositiva */}
          <Route
            path="/educacion"
            element={
              <ProtectedRoute>
                <EducacionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/educacion/admin"
            element={
              <ProtectedRoute>
                <EducacionAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/educacion/admin/nuevo"
            element={
              <ProtectedRoute>
                <EducacionEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/educacion/admin/editar/:id"
            element={
              <ProtectedRoute>
                <EducacionEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/educacion/:slug"
            element={
              <ProtectedRoute>
                <EducacionArticuloPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
