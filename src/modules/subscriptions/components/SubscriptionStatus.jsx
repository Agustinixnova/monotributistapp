import { useState } from 'react'
import { Crown, Calendar, Clock, AlertTriangle, RefreshCw, CreditCard, CheckCircle, XCircle } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'
import { subscriptionService } from '../services/subscriptionService'
import { RenewalModal } from './RenewalModal'

/**
 * Tarjeta de estado de suscripción
 * Muestra información completa del plan actual
 */
export function SubscriptionStatus() {
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false)

  const {
    subscription,
    status,
    loading,
    hasActiveSubscription,
    isInGracePeriod,
    daysRemaining,
    graceDaysRemaining,
    showRenewalBanner
  } = useSubscription()

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    )
  }

  if (!hasActiveSubscription && !isInGracePeriod) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sin suscripción activa</h3>
            <p className="text-sm text-gray-500">No tenés una suscripción vigente</p>
          </div>
        </div>
        <button
          onClick={() => setIsRenewalModalOpen(true)}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          Elegir plan
        </button>

        <RenewalModal
          isOpen={isRenewalModalOpen}
          onClose={() => setIsRenewalModalOpen(false)}
        />
      </div>
    )
  }

  // Determinar color de estado
  const getStatusColor = () => {
    if (isInGracePeriod) return 'bg-red-100 text-red-700 border-red-200'
    if (daysRemaining <= 7) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  const getStatusText = () => {
    if (isInGracePeriod) return 'En período de gracia'
    if (daysRemaining <= 0) return 'Vencida'
    return 'Activa'
  }

  const getStatusIcon = () => {
    if (isInGracePeriod) return <AlertTriangle className="w-4 h-4" />
    if (daysRemaining <= 7) return <Clock className="w-4 h-4" />
    return <CheckCircle className="w-4 h-4" />
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {subscription?.plan_name || 'Plan Premium'}
              </h3>
              <p className="text-sm text-blue-100">
                {subscription?.duration_months || 1} {(subscription?.duration_months || 1) === 1 ? 'mes' : 'meses'}
              </p>
            </div>
          </div>

          {/* Badge de estado */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Información de fechas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Inicio</p>
              <p className="text-sm font-semibold text-gray-900">
                {subscription?.start_date
                  ? subscriptionService.formatDate(subscription.start_date)
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Vencimiento</p>
              <p className="text-sm font-semibold text-gray-900">
                {subscription?.end_date
                  ? subscriptionService.formatDate(subscription.end_date)
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Días restantes / gracia */}
        {(daysRemaining > 0 || isInGracePeriod) && (
          <div className={`p-4 rounded-xl mb-6 ${
            isInGracePeriod
              ? 'bg-red-50 border border-red-200'
              : daysRemaining <= 7
                ? 'bg-orange-50 border border-orange-200'
                : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  isInGracePeriod
                    ? 'text-red-700'
                    : daysRemaining <= 7
                      ? 'text-orange-700'
                      : 'text-blue-700'
                }`}>
                  {isInGracePeriod
                    ? 'Período de gracia'
                    : 'Días restantes'}
                </p>
                <p className={`text-2xl font-bold ${
                  isInGracePeriod
                    ? 'text-red-800'
                    : daysRemaining <= 7
                      ? 'text-orange-800'
                      : 'text-blue-800'
                }`}>
                  {isInGracePeriod ? graceDaysRemaining : daysRemaining}
                  <span className="text-sm font-normal ml-1">
                    {(isInGracePeriod ? graceDaysRemaining : daysRemaining) === 1 ? 'día' : 'días'}
                  </span>
                </p>
              </div>

              {isInGracePeriod && (
                <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
              )}
            </div>

            {/* Barra de progreso para gracia */}
            {isInGracePeriod && (
              <div className="mt-3">
                <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${(graceDaysRemaining / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información de pago */}
        {subscription?.last_payment_date && (
          <div className="flex items-center gap-3 py-3 border-t border-gray-100">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Último pago</p>
              <p className="text-sm font-medium text-gray-700">
                {subscriptionService.formatDate(subscription.last_payment_date)}
                {subscription.amount_paid && (
                  <span className="ml-2 text-gray-500">
                    ({subscriptionService.formatPrice(subscription.amount_paid)})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Botón de renovación */}
        {showRenewalBanner && (
          <button
            onClick={() => setIsRenewalModalOpen(true)}
            className={`w-full mt-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              isInGracePeriod
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            Renovar ahora
          </button>
        )}
      </div>

      {/* Modal de renovación */}
      <RenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
      />
    </div>
  )
}

export default SubscriptionStatus
