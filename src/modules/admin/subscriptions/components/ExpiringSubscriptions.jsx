import { useState, useEffect } from 'react'
import { Clock, User, AlertTriangle, RefreshCw, Mail, Phone, Calendar, Filter } from 'lucide-react'
import { adminSubscriptionService } from '../services/adminSubscriptionService'

/**
 * Lista de suscripciones próximas a vencer
 * Para seguimiento y contacto proactivo
 */
export function ExpiringSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [daysFilter, setDaysFilter] = useState(7)

  useEffect(() => {
    loadSubscriptions()
  }, [daysFilter])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminSubscriptionService.getExpiringSubscriptions(daysFilter)
      setSubscriptions(data)
    } catch (err) {
      console.error('Error loading expiring subscriptions:', err)
      setError('Error al cargar los vencimientos')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calcula días restantes hasta vencimiento
   */
  const getDaysRemaining = (endsAt) => {
    const now = new Date()
    const end = new Date(endsAt)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  /**
   * Retorna clases de urgencia según días restantes
   */
  const getUrgencyClass = (daysRemaining) => {
    if (daysRemaining <= 0) return 'bg-red-100 text-red-700 border-red-200'
    if (daysRemaining <= 3) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (daysRemaining <= 7) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  /**
   * Formatea número de WhatsApp para link wa.me
   */
  const formatWhatsAppLink = (phone) => {
    if (!phone) return null
    // Remover todo excepto números
    const numbers = phone.replace(/\D/g, '')
    // Agregar código de Argentina si no está
    const fullNumber = numbers.startsWith('54') ? numbers : `54${numbers}`
    return `https://wa.me/${fullNumber}`
  }

  // Calcular resumen
  const summary = {
    total: subscriptions.length,
    expired: subscriptions.filter(s => getDaysRemaining(s.ends_at) <= 0 || s.status === 'grace_period').length,
    nextThreeDays: subscriptions.filter(s => {
      const days = getDaysRemaining(s.ends_at)
      return days > 0 && days <= 3
    }).length
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Vencimientos Próximos</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de días */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Filter className="w-4 h-4 text-gray-500 ml-2" />
            {[3, 7, 15, 30].map(days => (
              <button
                key={days}
                onClick={() => setDaysFilter(days)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  daysFilter === days
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          {/* Botón refresh */}
          <button
            onClick={loadSubscriptions}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista vacía */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No hay vencimientos en los próximos {daysFilter} días
          </p>
        </div>
      ) : (
        <>
          {/* Lista de suscripciones */}
          <div className="space-y-3">
            {subscriptions.map(sub => {
              const daysRemaining = getDaysRemaining(sub.ends_at)
              const urgencyClass = getUrgencyClass(daysRemaining)
              const isExpiredOrGrace = daysRemaining <= 0 || sub.status === 'grace_period'
              const fullName = `${sub.profiles?.nombre || ''} ${sub.profiles?.apellido || ''}`.trim()
              const phone = sub.profiles?.whatsapp || sub.profiles?.telefono

              return (
                <div
                  key={sub.id}
                  className={`p-4 rounded-xl border-2 ${urgencyClass}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Info del cliente */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isExpiredOrGrace ? 'bg-red-200' : 'bg-white'
                      }`}>
                        {isExpiredOrGrace ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : (
                          <User className="w-5 h-5 text-gray-600" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {fullName || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {sub.plan?.name || 'Plan desconocido'}
                        </p>
                      </div>
                    </div>

                    {/* Contacto */}
                    <div className="flex items-center gap-2">
                      {sub.profiles?.email && (
                        <a
                          href={`mailto:${sub.profiles.email}`}
                          className="p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors"
                          title={sub.profiles.email}
                        >
                          <Mail className="w-4 h-4 text-gray-600" />
                        </a>
                      )}
                      {phone && (
                        <a
                          href={formatWhatsAppLink(phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white hover:bg-green-100 transition-colors"
                          title={phone}
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                        </a>
                      )}
                    </div>

                    {/* Días restantes */}
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {isExpiredOrGrace ? (
                          sub.status === 'grace_period' ? 'Gracia' : 'Vencido'
                        ) : (
                          <>
                            {daysRemaining}
                            <span className="text-sm font-normal ml-1">
                              {daysRemaining === 1 ? 'día' : 'días'}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-sm flex items-center justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {adminSubscriptionService.formatDate(sub.ends_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen */}
          <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-gray-50 rounded-xl text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-gray-900">{summary.total}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Vencidos/Gracia:</span>
              <span className="font-semibold text-red-600">{summary.expired}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Próximos 3 días:</span>
              <span className="font-semibold text-orange-600">{summary.nextThreeDays}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExpiringSubscriptions
