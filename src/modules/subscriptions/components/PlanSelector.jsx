import { useState } from 'react'
import { Check, Crown, Zap, Clock, Shield, FileText, Calculator, MessageCircle, Cloud, AlertCircle } from 'lucide-react'
import { usePlans } from '../hooks/usePlans'
import { subscriptionService } from '../services/subscriptionService'

/**
 * Componente de selección de planes de suscripción
 * Diseño violeta que coincide con el estilo del Login
 * @param {Function} onSuccess - Callback al completar selección
 * @param {boolean} isModal - Si se muestra como modal
 * @param {string} currentPlanKey - Plan actual (para renovación)
 * @param {Date} renewalFromDate - Fecha desde donde calcular renovación
 */
export function PlanSelector({ onSuccess, isModal = false, currentPlanKey, renewalFromDate }) {
  const { plans, loading, error, formatPrice } = usePlans()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  const isRenewal = Boolean(currentPlanKey || renewalFromDate)

  const handleSelectPlan = async () => {
    if (!selectedPlan) return

    setProcessing(true)
    setPaymentError(null)

    try {
      // Crear suscripción
      const subscriptionId = await subscriptionService.createSubscription(selectedPlan.plan_key)

      // Obtener URL de pago
      const paymentUrl = await subscriptionService.initiatePayment(subscriptionId, selectedPlan.plan_key)

      // Redirigir al pago
      window.location.href = paymentUrl
    } catch (err) {
      console.error('Error creating subscription:', err)
      setPaymentError(err.message || 'Error al procesar. Intentá de nuevo.')
      setProcessing(false)
    }
  }

  const features = [
    { icon: Zap, text: 'Dashboard de salud del monotributo' },
    { icon: AlertCircle, text: 'Alertas de recategorización y vencimientos' },
    { icon: Calculator, text: 'Simulador y proyección financiera' },
    { icon: Shield, text: 'Gestión completa por contadora' },
    { icon: MessageCircle, text: 'Consultas ilimitadas' },
    { icon: FileText, text: 'Resolución de problemas con ARCA' },
    { icon: Clock, text: 'Control de gastos y rentabilidad' },
    { icon: Cloud, text: 'Documentos y facturas en la nube' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-300">
        <p>Error al cargar planes: {error}</p>
      </div>
    )
  }

  const content = (
    <div className="max-w-6xl mx-auto relative">
      {/* Círculos decorativos blur */}
      {!isModal && (
        <>
          <div className="absolute top-20 -left-32 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-32 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </>
      )}

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-4">
          <Crown className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {isRenewal ? 'Renová tu plan' : 'Elegí tu plan para comenzar'}
        </h1>
        <p className="text-violet-200">
          {isRenewal
            ? 'Seleccioná el plan con el que querés continuar'
            : 'Accedé a todas las herramientas para gestionar tu monotributo'}
        </p>
      </div>

      {/* Grid de planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 relative z-10">
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id
          const isMostPopular = plan.plan_key === 'semi_annual'

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`relative p-6 rounded-2xl text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-white text-gray-900 ring-4 ring-white/50 shadow-xl scale-[1.02]'
                  : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30'
              }`}
            >
              {/* Badge más elegido */}
              {isMostPopular && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                    : 'bg-white text-violet-700'
                }`}>
                  Más elegido
                </div>
              )}

              {/* Indicador de selección */}
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isSelected
                  ? 'bg-violet-600 border-violet-600'
                  : 'border-white/40'
              }`}>
                {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={2.5} />}
              </div>

              {/* Nombre del plan */}
              <h3 className={`text-xl font-bold mb-1 ${isSelected ? 'text-gray-900' : 'text-white'}`}>
                {plan.name}
              </h3>

              {/* Duración */}
              <p className={`text-sm mb-4 ${isSelected ? 'text-gray-500' : 'text-violet-200'}`}>
                {plan.duration_months} {plan.duration_months === 1 ? 'mes' : 'meses'}
              </p>

              {/* Precio por mes */}
              <div className="mb-2">
                <span className={`text-3xl font-bold ${isSelected ? 'text-gray-900' : 'text-white'}`}>
                  {formatPrice(plan.price_per_month)}
                </span>
                <span className={`text-sm ${isSelected ? 'text-gray-500' : 'text-violet-200'}`}>/mes</span>
              </div>

              {/* Precio total */}
              <p className={`text-sm mb-2 ${isSelected ? 'text-gray-500' : 'text-violet-200'}`}>
                Total: {formatPrice(plan.total_price)}
              </p>

              {/* Ahorro */}
              {plan.savings_amount > 0 && (
                <div className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                  isSelected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-green-500/20 text-green-300'
                }`}>
                  Ahorrás {formatPrice(plan.savings_amount)}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Features (solo si no es modal) */}
      {!isModal && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8 mb-8 relative z-10">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            Todo lo que incluye tu suscripción
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-violet-200" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-violet-100 pt-2">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error de pago */}
      {paymentError && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-center relative z-10">
          {paymentError}
        </div>
      )}

      {/* Botón de acción */}
      <div className="text-center relative z-10">
        <button
          onClick={handleSelectPlan}
          disabled={!selectedPlan || processing}
          className={`w-full md:w-auto px-8 h-[52px] rounded-xl font-semibold text-lg transition-all duration-200 ${
            selectedPlan && !processing
              ? 'bg-white text-violet-700 hover:bg-gray-100 shadow-lg hover:shadow-xl'
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              Procesando...
            </span>
          ) : (
            <>
              {isRenewal ? 'Renovar suscripción' : 'Continuar al pago'}
              {selectedPlan && ` - ${formatPrice(selectedPlan.total_price)}`}
            </>
          )}
        </button>

        {/* Texto de seguridad */}
        <p className="mt-4 text-sm text-violet-200/60">
          <Shield className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
          Pago seguro con MercadoPago
        </p>
      </div>
    </div>
  )

  // Si es modal, no agregar el fondo (lo maneja RenewalModal)
  if (isModal) {
    return content
  }

  // Si es página completa, agregar el fondo violeta
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 py-8 px-4 overflow-hidden relative">
      {content}
    </div>
  )
}

export default PlanSelector
