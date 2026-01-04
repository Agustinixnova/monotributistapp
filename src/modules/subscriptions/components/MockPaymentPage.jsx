import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CreditCard, CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft, Shield } from 'lucide-react'
import { subscriptionService } from '../services/subscriptionService'

/**
 * Página de pago mock para desarrollo
 * Simula el flujo de MercadoPago sin integración real
 *
 * Query params esperados:
 * - subscription_id: ID de la suscripción
 * - plan_key: Key del plan seleccionado
 * - amount: Monto total
 */
export function MockPaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [status, setStatus] = useState('pending') // pending, processing, success, failure
  const [planData, setPlanData] = useState(null)
  const [error, setError] = useState(null)

  const subscriptionId = searchParams.get('subscription_id')
  const planKey = searchParams.get('plan_key')
  const amount = searchParams.get('amount')

  useEffect(() => {
    // Cargar datos del plan
    async function loadPlanData() {
      try {
        const plans = await subscriptionService.getPlans()
        const plan = plans.find(p => p.plan_key === planKey)
        if (plan) {
          setPlanData(plan)
        }
      } catch (err) {
        console.error('Error loading plan data:', err)
      }
    }

    if (planKey) {
      loadPlanData()
    }
  }, [planKey])

  const handleSimulatePayment = async (result) => {
    setStatus('processing')
    setError(null)

    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (result === 'success') {
      try {
        // Confirmar pago en backend
        await subscriptionService.confirmPayment(subscriptionId, {
          payment_id: `MOCK_${Date.now()}`,
          status: 'approved',
          payment_method: 'mock_card',
          amount: parseInt(amount) || planData?.total_price || 0
        })

        setStatus('success')

        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 3000)
      } catch (err) {
        console.error('Error confirming payment:', err)
        setError(err.message)
        setStatus('failure')
      }
    } else {
      setStatus('failure')
      setError('Pago rechazado. Fondos insuficientes.')
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  // Vista de procesamiento
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando pago...</h2>
          <p className="text-gray-600">Por favor no cierres esta ventana</p>
        </div>
      </div>
    )
  }

  // Vista de éxito
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h2>
          <p className="text-gray-600 mb-6">
            Tu suscripción ha sido activada correctamente.
          </p>
          {planData && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">Plan activado</p>
              <p className="text-lg font-bold text-gray-900">{planData.name}</p>
              <p className="text-sm text-gray-600">
                {planData.duration_months} {planData.duration_months === 1 ? 'mes' : 'meses'}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Vista de error
  if (status === 'failure') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pago rechazado</h2>
          <p className="text-gray-600 mb-6">
            {error || 'No pudimos procesar tu pago. Por favor intentá de nuevo.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setStatus('pending')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={handleGoBack}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Vista de pago pendiente (formulario mock)
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header mock de MercadoPago */}
      <div className="bg-[#009ee3] text-white py-4">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8" />
            <span className="text-xl font-bold">MercadoPago</span>
            <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded ml-2">MOCK</span>
          </div>
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Alerta de ambiente mock */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Ambiente de desarrollo
            </p>
            <p className="text-sm text-yellow-700">
              Este es un simulador de pago. No se realizarán cargos reales.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Resumen del pedido */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen del pedido</h2>

            {planData ? (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{planData.name}</p>
                  <p className="text-sm text-gray-500">
                    {planData.duration_months} {planData.duration_months === 1 ? 'mes' : 'meses'} de suscripción
                  </p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {subscriptionService.formatPrice(planData.total_price)}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Suscripción Mimonotributo</p>
                  <p className="text-sm text-gray-500">Plan seleccionado</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {amount ? subscriptionService.formatPrice(parseInt(amount)) : '-'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <p className="text-lg font-bold text-gray-900">Total</p>
              <p className="text-2xl font-bold text-[#009ee3]">
                {planData
                  ? subscriptionService.formatPrice(planData.total_price)
                  : amount
                    ? subscriptionService.formatPrice(parseInt(amount))
                    : '-'}
              </p>
            </div>
          </div>

          {/* Formulario mock de tarjeta */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Datos de la tarjeta</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre en la tarjeta
                </label>
                <input
                  type="text"
                  placeholder="JUAN PEREZ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
            </div>

            {/* Botones de simulación */}
            <div className="space-y-3">
              <p className="text-sm text-center text-gray-500 mb-4">
                Seleccioná el resultado de la simulación:
              </p>

              <button
                onClick={() => handleSimulatePayment('success')}
                className="w-full py-4 bg-[#009ee3] text-white rounded-xl font-semibold hover:bg-[#0088c8] transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Simular pago exitoso
              </button>

              <button
                onClick={() => handleSimulatePayment('failure')}
                className="w-full py-4 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Simular pago rechazado
              </button>
            </div>

            {/* Seguridad */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Tus datos están protegidos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MockPaymentPage
