import { useState, useEffect } from 'react'
import { Crown, Calendar, Clock, FileText, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import { cuentaService } from '../services/cuentaService'

/**
 * Tab de Mi Suscripción - muestra vigencia del plan y facturas
 */
export function MiSuscripcion() {
  const [subscription, setSubscription] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [subData, invData] = await Promise.all([
        cuentaService.getMySubscription(),
        cuentaService.getMyInvoices()
      ])
      setSubscription(subData)
      setInvoices(invData)
    } catch (err) {
      console.error('Error loading subscription data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (invoice) => {
    try {
      setDownloadingId(invoice.id)
      const url = await cuentaService.getInvoiceDownloadUrl(invoice.id)

      // TODO: Cuando se agregue Capacitor, usar Browser plugin:
      // import { Browser } from '@capacitor/browser'
      // await Browser.open({ url })
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error downloading invoice:', err)
      alert('Error al descargar la factura')
    } finally {
      setDownloadingId(null)
    }
  }

  const getDaysRemaining = () => {
    if (!subscription?.ends_at) return 0
    const now = new Date()
    const end = new Date(subscription.ends_at)
    const diffTime = end.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusInfo = () => {
    const days = getDaysRemaining()
    if (subscription?.status === 'grace_period') {
      return {
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertTriangle,
        text: 'Período de gracia',
        bgColor: 'bg-red-50'
      }
    }
    if (days <= 7) {
      return {
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: Clock,
        text: 'Por vencer',
        bgColor: 'bg-orange-50'
      }
    }
    return {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      text: 'Activa',
      bgColor: 'bg-green-50'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertTriangle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    )
  }

  const statusInfo = getStatusInfo()
  const daysRemaining = getDaysRemaining()

  return (
    <div className="space-y-6">
      {/* Estado de suscripción */}
      {subscription ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {subscription.plan?.name || 'Plan Premium'}
                  </h2>
                  <p className="text-blue-100">
                    {subscription.plan?.duration_months || 1} {(subscription.plan?.duration_months || 1) === 1 ? 'mes' : 'meses'}
                  </p>
                </div>
              </div>

              {/* Badge estado */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                <statusInfo.icon className="w-4 h-4" />
                <span>{statusInfo.text}</span>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fecha inicio */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Inicio</p>
                  <p className="font-semibold text-gray-900">
                    {cuentaService.formatDate(subscription.starts_at)}
                  </p>
                </div>
              </div>

              {/* Fecha vencimiento */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Vencimiento</p>
                  <p className="font-semibold text-gray-900">
                    {cuentaService.formatDate(subscription.ends_at)}
                  </p>
                </div>
              </div>

              {/* Días restantes */}
              <div className={`p-4 rounded-xl ${statusInfo.bgColor}`}>
                <p className="text-xs text-gray-600 mb-1">
                  {subscription.status === 'grace_period' ? 'Días de gracia' : 'Días restantes'}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.max(0, daysRemaining)}
                  <span className="text-sm font-normal ml-1">días</span>
                </p>
              </div>
            </div>

            {/* Alerta si está por vencer o en gracia */}
            {(daysRemaining <= 7 || subscription.status === 'grace_period') && (
              <div className={`mt-6 p-4 rounded-xl ${
                subscription.status === 'grace_period'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                    subscription.status === 'grace_period' ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      subscription.status === 'grace_period' ? 'text-red-700' : 'text-orange-700'
                    }`}>
                      {subscription.status === 'grace_period'
                        ? 'Tu suscripción venció'
                        : 'Tu suscripción está por vencer'}
                    </p>
                    <p className={`text-sm ${
                      subscription.status === 'grace_period' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {subscription.status === 'grace_period'
                        ? 'Renová para no perder el acceso a la aplicación.'
                        : 'Renová antes del vencimiento para mantener tu acceso.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin suscripción activa</h3>
          <p className="text-gray-500">No tenés una suscripción vigente actualmente.</p>
        </div>
      )}

      {/* Facturas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Mis Facturas</h3>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p>No tenés facturas disponibles</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map(invoice => (
              <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-500">
                      {cuentaService.formatDate(invoice.created_at)}
                      {invoice.amount && (
                        <span className="ml-2">{cuentaService.formatPrice(invoice.amount)}</span>
                      )}
                    </p>
                  </div>
                </div>

                {invoice.file_url ? (
                  <button
                    onClick={() => handleDownload(invoice)}
                    disabled={downloadingId === invoice.id}
                    className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {downloadingId === invoice.id ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Descargar
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">No disponible</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MiSuscripcion
