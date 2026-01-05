import { Crown, Lock, AlertTriangle, RefreshCw, ChartNoAxesCombined } from 'lucide-react'
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess'
import { PlanSelector } from './PlanSelector'

/**
 * Componente gate que controla acceso basado en suscripción
 * Envuelve contenido protegido y muestra paywall si es necesario
 * Diseño violeta que coincide con el estilo del Login
 * @param {React.ReactNode} children - Contenido a mostrar si tiene acceso
 * @param {React.ReactNode} loadingComponent - Componente de carga personalizado
 */
export function SubscriptionGate({ children, loadingComponent }) {
  const {
    loading,
    hasAccess,
    showPaywall,
    isNewUser,
    isExpired,
    isInGracePeriod
  } = useSubscriptionAccess()

  // Estado de carga
  if (loading) {
    if (loadingComponent) {
      return loadingComponent
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-violet-200">Verificando suscripción...</p>
        </div>
      </div>
    )
  }

  // Usuario tiene acceso - mostrar contenido
  if (hasAccess) {
    return children
  }

  // Usuario sin acceso - mostrar paywall
  if (showPaywall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 relative overflow-hidden">
        {/* Círculos decorativos blur */}
        <div className="absolute top-20 -left-32 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-32 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl" />

        {/* Header del paywall */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <ChartNoAxesCombined className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-xl font-bold font-heading"><span className="text-violet-300">Mi</span><span className="text-white">monotributo</span></span>
            </div>
          </div>
        </div>

        {/* Contenido del paywall */}
        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          {/* Mensaje según estado */}
          <div className="text-center mb-8">
            {isNewUser ? (
              <>
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-6">
                  <Crown className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  ¡Bienvenido a Mimonotributo!
                </h1>
                <p className="text-lg text-violet-200 max-w-xl mx-auto">
                  Para acceder a todas las herramientas de gestión de tu monotributo,
                  elegí el plan que mejor se adapte a tus necesidades.
                </p>
              </>
            ) : isExpired ? (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10 text-red-300" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  Tu suscripción ha expirado
                </h1>
                <p className="text-lg text-violet-200 max-w-xl mx-auto">
                  El período de gracia finalizó. Renová tu suscripción para
                  recuperar el acceso a todas las funcionalidades.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-orange-500/20 border border-orange-400/30 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-orange-300" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  Suscripción requerida
                </h1>
                <p className="text-lg text-violet-200 max-w-xl mx-auto">
                  Necesitás una suscripción activa para acceder a la aplicación.
                </p>
              </>
            )}
          </div>

          {/* Selector de planes */}
          <PlanSelector
            isModal={true}
            currentPlanKey={null}
            renewalFromDate={null}
          />
        </div>
      </div>
    )
  }

  // Fallback (no debería llegar aquí)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-400/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-300" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Error de acceso
        </h2>
        <p className="text-violet-200 mb-4">
          No pudimos verificar tu suscripción.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-violet-700 rounded-lg hover:bg-gray-100 font-medium"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          Reintentar
        </button>
      </div>
    </div>
  )
}

export default SubscriptionGate
