import { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, CreditCard } from 'lucide-react'
import { adminSubscriptionService } from '../services/adminSubscriptionService'

/**
 * Dashboard de métricas de suscripciones
 * Muestra KPIs principales y distribución por estado/plan
 */
export function SubscriptionMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminSubscriptionService.getSubscriptionMetrics()
      setMetrics(data)
    } catch (err) {
      console.error('Error loading metrics:', err)
      setError('Error al cargar las métricas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Grid de métricas principales skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Grid de detalles skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (!metrics) return null

  const mainMetrics = [
    {
      label: 'MRR',
      value: adminSubscriptionService.formatPrice(metrics.mrr),
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      description: 'Ingreso Mensual Recurrente'
    },
    {
      label: 'Clientes Activos',
      value: metrics.active + metrics.grace_period,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      description: `${metrics.active} activos + ${metrics.grace_period} en gracia`
    },
    {
      label: 'ARR Proyectado',
      value: adminSubscriptionService.formatPrice(metrics.arr),
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      description: 'Ingreso Anual Recurrente'
    },
    {
      label: 'Total Suscripciones',
      value: metrics.total,
      icon: CheckCircle,
      color: 'bg-gray-100 text-gray-600',
      description: 'Todas las suscripciones'
    }
  ]

  const statusItems = [
    { label: 'Activos', value: metrics.active, icon: CheckCircle, color: 'text-green-600' },
    { label: 'En período de gracia', value: metrics.grace_period, icon: Clock, color: 'text-orange-600' },
    { label: 'Pendientes de pago', value: metrics.pending_payment, icon: CreditCard, color: 'text-yellow-600' },
    { label: 'Expirados', value: metrics.expired, icon: XCircle, color: 'text-red-600' },
    { label: 'Cancelados', value: metrics.cancelled, icon: XCircle, color: 'text-gray-400' }
  ]

  const planItems = Object.values(metrics.byPlan)

  return (
    <div className="space-y-6">
      {/* Grid de métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${metric.color} flex items-center justify-center`}>
                <metric.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Grid de detalles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Por Estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Por Estado</h3>
          <div className="space-y-3">
            {statusItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por Plan (Activos) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Por Plan (Activos)</h3>
          {planItems.length > 0 ? (
            <div className="space-y-3">
              {planItems.map((plan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700">{plan.name}</p>
                    <p className="text-xs text-gray-400">
                      MRR: {adminSubscriptionService.formatPrice(plan.mrr)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-900">{plan.count}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      {plan.count === 1 ? 'cliente' : 'clientes'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay suscripciones activas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionMetrics
