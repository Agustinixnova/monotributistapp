import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { PlaceholderPage } from './pages/PlaceholderPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturacion"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
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
                <PlaceholderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
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
            path="/configuracion"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
