import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/hooks/useAuth'

/**
 * Componente que redirige a /registro si el usuario no está autenticado
 * Si está autenticado, muestra los children (normalmente el Dashboard)
 */
export function PublicRedirect({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/registro" replace />
  }

  return children
}
