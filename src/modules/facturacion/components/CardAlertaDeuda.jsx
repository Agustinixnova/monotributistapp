import { useState, useEffect } from 'react'
import { AlertTriangle, DollarSign, Calendar, ExternalLink, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../auth/hooks/useAuth'
import { crearConversacion } from '../../buzon/services/buzonService'

/**
 * Card que muestra alerta de deuda de monotributo al cliente
 * Solo se muestra si el cliente tiene estado_pago_monotributo = 'con_deuda'
 */
export function CardAlertaDeuda() {
  const { user } = useAuth()
  const [deuda, setDeuda] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    const fetchDeuda = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('client_fiscal_data')
          .select('estado_pago_monotributo, monto_deuda_monotributo, cuotas_adeudadas_monotributo')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error cargando datos de deuda:', error)
        }

        if (data?.estado_pago_monotributo === 'con_deuda') {
          setDeuda({
            monto: data.monto_deuda_monotributo,
            cuotas: data.cuotas_adeudadas_monotributo
          })
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setCargando(false)
      }
    }

    fetchDeuda()
  }, [user?.id])

  // No mostrar si está cargando o no tiene deuda
  if (cargando || !deuda) {
    return null
  }

  const formatearMoneda = (monto) => {
    if (!monto) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto)
  }

  const handleRegularice = async () => {
    if (enviando || enviado) return

    setEnviando(true)
    try {
      // Enviar mensaje al buzón notificando que regularizó
      const mensaje = `Hola! Quiero informar que regularicé mi deuda de monotributo.\n\nDeuda que figuraba:\n- Monto: ${formatearMoneda(deuda.monto)}\n- Cuotas adeudadas: ${deuda.cuotas || '-'}\n\nPor favor, actualicen mi estado de pago. Gracias!`

      await crearConversacion({
        asunto: 'Regularicé mi deuda de monotributo',
        mensaje,
        prioridad: 'alta'
      })

      setEnviado(true)
    } catch (err) {
      console.error('Error enviando notificación:', err)
      alert('Error al enviar la notificación. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
      {/* Header con icono de alerta */}
      <div className="flex items-start gap-2 mb-3">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base">Deuda de Monotributo</h3>
          <p className="text-red-100 text-xs">
            Tenes una deuda pendiente que debes regularizar
          </p>
        </div>
      </div>

      {/* Detalles de la deuda */}
      <div className="bg-white/10 rounded-lg p-3 space-y-2">
        {/* Monto */}
        {deuda.monto && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-red-200" />
              <span className="text-xs text-red-100">Monto adeudado</span>
            </div>
            <span className="font-bold text-lg">
              {formatearMoneda(deuda.monto)}
            </span>
          </div>
        )}

        {/* Cuotas */}
        {deuda.cuotas && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-red-200" />
              <span className="text-xs text-red-100">Cuotas adeudadas</span>
            </div>
            <span className="font-bold text-base">
              {deuda.cuotas} {deuda.cuotas === 1 ? 'cuota' : 'cuotas'}
            </span>
          </div>
        )}
      </div>

      {/* Mensaje de ayuda */}
      <div className="mt-3 pt-3 border-t border-white/20">
        <p className="text-xs text-red-100 mb-2">
          El monto incluye intereses calculados. Regulariza tu situacion para evitar inconvenientes con ARCA.
        </p>

        {/* Botones */}
        <div className="flex flex-wrap gap-2">
          {/* Botón para ir a ARCA */}
          <a
            href="https://auth.afip.gob.ar/contribuyente_/login.xhtml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 rounded-lg font-medium text-xs hover:bg-red-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ir a ARCA
          </a>

          {/* Botón para notificar que regularizó */}
          {enviado ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg font-medium text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              Notificación enviada
            </div>
          ) : (
            <button
              onClick={handleRegularice}
              disabled={enviando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded-lg font-medium text-xs hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              {enviando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Ya regularicé mi deuda
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
