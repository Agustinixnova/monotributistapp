import { useState, useEffect } from 'react'
import { Receipt, CheckCircle, Clock, AlertTriangle, Eye, Download, Check, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../auth/hooks/useAuth'
import { formatearMoneda } from '../../facturacion/utils/formatters'
import { getComprobanteUrl } from '../../facturacion/services/cuotaService'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const ESTADO_COLORS = {
  verificada: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700', icon: CheckCircle },
  informada: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', icon: Clock },
  pendiente: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: Clock },
  vencida: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: AlertTriangle }
}

/**
 * Sección de cuotas mensuales en la ficha del cliente
 * Permite a la contadora ver y verificar pagos
 */
export function FichaSeccionCuotas({ clientId, clienteData }) {
  const { user } = useAuth()
  const [cuotas, setCuotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [verificando, setVerificando] = useState(null)
  const [mesesMostrar, setMesesMostrar] = useState(6) // Mostrar últimos 6 meses por defecto

  useEffect(() => {
    fetchCuotas()
  }, [clientId, mesesMostrar])

  const fetchCuotas = async () => {
    if (!clientId) return

    setLoading(true)
    try {
      // Calcular rango de fechas (últimos N meses)
      const ahora = new Date()
      const fechaDesde = new Date()
      fechaDesde.setMonth(fechaDesde.getMonth() - mesesMostrar)

      // Obtener información del cliente (fecha de alta, deuda inicial)
      const { data: clienteInfo, error: clienteError } = await supabase
        .from('client_fiscal_data')
        .select('fecha_alta_sistema, cuotas_adeudadas_al_alta, periodo_deuda_desde, periodo_deuda_hasta')
        .eq('id', clientId)
        .single()

      if (clienteError) throw clienteError

      const fechaAltaSistema = clienteInfo?.fecha_alta_sistema ? new Date(clienteInfo.fecha_alta_sistema) : null
      const periodoDeudaDesde = clienteInfo?.periodo_deuda_desde ? new Date(clienteInfo.periodo_deuda_desde) : null
      const periodoDeudaHasta = clienteInfo?.periodo_deuda_hasta ? new Date(clienteInfo.periodo_deuda_hasta) : null

      const { data, error } = await supabase
        .from('client_cuota_mensual')
        .select(`
          *,
          informado_por_profile:profiles!informado_por(nombre, apellido),
          verificado_por_profile:profiles!verificado_por(nombre, apellido)
        `)
        .eq('client_id', clientId)
        .gte('anio', fechaDesde.getFullYear())
        .order('anio', { ascending: false })
        .order('mes', { ascending: false })

      if (error) throw error

      // Generar lista completa de meses (incluyendo los que no tienen registro)
      const cuotasCompletas = []
      const ahora2 = new Date()

      for (let i = 0; i < mesesMostrar; i++) {
        const fecha = new Date(ahora2.getFullYear(), ahora2.getMonth() - i, 1)
        const anio = fecha.getFullYear()
        const mes = fecha.getMonth() + 1
        const fechaMes = new Date(anio, mes - 1, 1)

        const cuotaExistente = data?.find(c => c.anio === anio && c.mes === mes)

        // Si hay cuota existente, usarla
        if (cuotaExistente) {
          cuotasCompletas.push({
            anio,
            mes,
            ...cuotaExistente
          })
          continue
        }

        // Si NO hay registro, determinar el estado según contexto
        let estadoSinRegistro = 'pendiente'

        // Si es ANTES de la fecha de alta → no mostrar o marcar como "antes del alta"
        if (fechaAltaSistema && fechaMes < new Date(fechaAltaSistema.getFullYear(), fechaAltaSistema.getMonth(), 1)) {
          // Si está en el período de deuda inicial, mostrar como vencida
          if (periodoDeudaDesde && periodoDeudaHasta &&
              fechaMes >= new Date(periodoDeudaDesde.getFullYear(), periodoDeudaDesde.getMonth(), 1) &&
              fechaMes <= new Date(periodoDeudaHasta.getFullYear(), periodoDeudaHasta.getMonth(), 1)) {
            estadoSinRegistro = 'vencida'
          } else {
            // Mes antes del alta y no está en deuda inicial → NO MOSTRAR
            continue
          }
        } else {
          // Mes DESPUÉS del alta
          const hoy = new Date()
          const diaVencimiento = new Date(anio, mes - 1, 20)
          estadoSinRegistro = hoy > diaVencimiento ? 'vencida' : 'pendiente'
        }

        cuotasCompletas.push({
          anio,
          mes,
          estado: estadoSinRegistro,
          id: null
        })
      }

      setCuotas(cuotasCompletas)
    } catch (err) {
      console.error('Error cargando cuotas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerificar = async (cuotaId) => {
    if (!cuotaId) return

    setVerificando(cuotaId)
    try {
      const { error } = await supabase
        .from('client_cuota_mensual')
        .update({
          estado: 'verificada',
          verificado_por: user.id,
          verificado_at: new Date().toISOString()
        })
        .eq('id', cuotaId)

      if (error) throw error
      await fetchCuotas()
    } catch (err) {
      console.error('Error verificando cuota:', err)
      alert('Error al verificar el pago')
    } finally {
      setVerificando(null)
    }
  }

  const handleDesverificar = async (cuotaId) => {
    if (!cuotaId) return

    setVerificando(cuotaId)
    try {
      const { error } = await supabase
        .from('client_cuota_mensual')
        .update({
          estado: 'informada',
          verificado_por: null,
          verificado_at: null
        })
        .eq('id', cuotaId)

      if (error) throw error
      await fetchCuotas()
    } catch (err) {
      console.error('Error desverificando cuota:', err)
      alert('Error al desverificar el pago')
    } finally {
      setVerificando(null)
    }
  }

  const handleVerComprobante = async (comprobantePath) => {
    try {
      const url = await getComprobanteUrl(comprobantePath)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error obteniendo comprobante:', err)
      alert('Error al cargar el comprobante')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Receipt className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">Cuotas Monotributo</h3>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">Cuotas Monotributo</h3>
        </div>

        {/* Selector de meses a mostrar */}
        <select
          value={mesesMostrar}
          onChange={(e) => setMesesMostrar(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          <option value={6}>Últimos 6 meses</option>
          <option value={12}>Últimos 12 meses</option>
          <option value={24}>Últimos 24 meses</option>
        </select>
      </div>

      {/* Lista de cuotas */}
      <div className="space-y-2">
        {cuotas.map((cuota, idx) => {
          const estadoInfo = ESTADO_COLORS[cuota.estado] || ESTADO_COLORS.pendiente
          const Icon = estadoInfo.icon

          return (
            <div
              key={`${cuota.anio}-${cuota.mes}`}
              className={`${estadoInfo.bg} rounded-lg p-3 sm:p-4 border border-gray-200 transition-all`}
            >
              <div className="flex items-start gap-3">
                {/* Icono de estado */}
                <div className={`p-2 rounded-lg ${estadoInfo.badge} flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Info de la cuota */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-gray-900">
                        {MESES[cuota.mes - 1]} {cuota.anio}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 ${estadoInfo.badge} rounded text-xs font-medium`}>
                          {cuota.estado === 'verificada' ? 'Verificada' :
                           cuota.estado === 'informada' ? 'Informada' :
                           cuota.estado === 'vencida' ? 'Vencida' : 'Pendiente'}
                        </span>
                        {cuota.monto_cuota && (
                          <span className="text-sm font-medium text-gray-700">
                            {formatearMoneda(cuota.monto_cuota)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalles */}
                  {cuota.fecha_pago && (
                    <p className="text-xs text-gray-500 mt-1">
                      Fecha pago: {new Date(cuota.fecha_pago).toLocaleDateString('es-AR')}
                    </p>
                  )}

                  {cuota.informado_por_profile && (
                    <p className="text-xs text-gray-500">
                      Informado por: {cuota.informado_por_profile.nombre} {cuota.informado_por_profile.apellido}
                    </p>
                  )}

                  {cuota.verificado_por_profile && (
                    <p className="text-xs text-gray-500">
                      Verificado por: {cuota.verificado_por_profile.nombre} {cuota.verificado_por_profile.apellido}
                      {cuota.verificado_at && ` el ${new Date(cuota.verificado_at).toLocaleDateString('es-AR')}`}
                    </p>
                  )}

                  {cuota.nota && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      Nota: {cuota.nota}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Ver comprobante */}
                  {cuota.comprobante_url && (
                    <button
                      onClick={() => handleVerComprobante(cuota.comprobante_url)}
                      className="p-2 min-h-[44px] min-w-[44px] text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      title="Ver comprobante"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {/* Verificar/Desverificar */}
                  {cuota.estado === 'informada' && (
                    <button
                      onClick={() => handleVerificar(cuota.id)}
                      disabled={verificando === cuota.id}
                      className="p-2 min-h-[44px] min-w-[44px] text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Verificar pago"
                    >
                      {verificando === cuota.id ? (
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {cuota.estado === 'verificada' && (
                    <button
                      onClick={() => handleDesverificar(cuota.id)}
                      disabled={verificando === cuota.id}
                      className="p-2 min-h-[44px] min-w-[44px] text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Desverificar pago"
                    >
                      {verificando === cuota.id ? (
                        <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {cuotas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No hay cuotas registradas</p>
        </div>
      )}
    </div>
  )
}
