import { useState, useEffect } from 'react'
import { Check, Clock, AlertTriangle, CheckCircle, Upload, Loader2 } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { formatearMoneda } from '../utils/formatters'
import {
  getCuotaMesActual,
  calcularMontoCuota,
  calcularEstadoVencimiento,
  getMesActualNombre,
  marcarCuotaPagada
} from '../services/cuotaService'
import { ModalSubirComprobante } from './ModalSubirComprobante'

export function CardCuotaMonotributo() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [marcando, setMarcando] = useState(false)
  const [cliente, setCliente] = useState(null)
  const [categoriaData, setCategoriaData] = useState(null)
  const [cuotaMes, setCuotaMes] = useState(null)
  const [showModalComprobante, setShowModalComprobante] = useState(false)

  const fetchData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // 1. Obtener datos del cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('client_fiscal_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (clienteError) throw clienteError
      setCliente(clienteData)

      // 2. Obtener datos de la categoria
      if (clienteData.categoria_monotributo) {
        const { data: catData } = await supabase
          .from('monotributo_categorias')
          .select('*')
          .eq('categoria', clienteData.categoria_monotributo)
          .is('vigente_hasta', null)
          .single()

        setCategoriaData(catData)
      }

      // 3. Obtener cuota del mes actual
      const cuota = await getCuotaMesActual(clienteData.id)
      setCuotaMes(cuota)

    } catch (err) {
      console.error('Error cargando datos de cuota:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  const handleMarcarPagada = async () => {
    if (!cliente?.id) return

    try {
      setMarcando(true)
      const ahora = new Date()
      await marcarCuotaPagada(cliente.id, ahora.getFullYear(), ahora.getMonth() + 1, user.id)
      await fetchData()
    } catch (err) {
      console.error('Error marcando cuota:', err)
    } finally {
      setMarcando(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (!cliente || !categoriaData) {
    return null
  }

  const montoCuota = calcularMontoCuota(
    categoriaData,
    cliente.tipo_actividad,
    cliente.trabaja_relacion_dependencia
  )

  const estadoVencimiento = calcularEstadoVencimiento()
  const mesNombre = getMesActualNombre()
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1

  // Determinar si ya esta pagada
  const estaPagada = cuotaMes?.estado === 'informada' || cuotaMes?.estado === 'verificada'
  const tieneComprobante = !!cuotaMes?.comprobante_url

  // Colores segun estado
  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-500',
      badge: 'bg-green-100 text-green-700'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'text-yellow-500',
      badge: 'bg-yellow-100 text-yellow-700'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-500',
      badge: 'bg-red-100 text-red-700'
    }
  }

  const colors = estaPagada ? colorClasses.green : colorClasses[estadoVencimiento.color]

  return (
    <>
      <div className={`bg-white rounded-xl border ${estaPagada ? 'border-green-200' : 'border-gray-200'} p-4 sm:p-6 transition-all`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Cuota {mesNombre}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                Categoria {cliente.categoria_monotributo}
              </span>
              {cliente.trabaja_relacion_dependencia && (
                <span className="text-xs text-gray-500">
                  (Rel. dependencia)
                </span>
              )}
            </div>
          </div>

          {/* Estado badge */}
          {estaPagada ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              {cuotaMes?.estado === 'verificada' ? 'Verificada' : 'Pagada'}
            </div>
          ) : (
            <div className={`flex items-center gap-1 px-2 py-1 ${colors.badge} rounded-lg text-xs font-medium`}>
              {estadoVencimiento.color === 'red' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              {estadoVencimiento.mensaje}
            </div>
          )}
        </div>

        {/* Monto */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Monto a pagar</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {formatearMoneda(montoCuota)}
          </p>
        </div>

        {/* Barra de progreso del mes */}
        {!estaPagada && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>1 de {mesNombre}</span>
              <span>20 de {mesNombre}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  estadoVencimiento.color === 'green' ? 'bg-green-500' :
                  estadoVencimiento.color === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(100, ((20 - estadoVencimiento.diasRestantes) / 20) * 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Seccion de acciones */}
        {estaPagada ? (
          <div className="space-y-3">
            {/* Estado de pago */}
            <div className={`${colors.bg} rounded-lg p-3 flex items-center gap-3`}>
              <CheckCircle className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${colors.text}`}>
                  {cuotaMes?.estado === 'verificada' ? 'Pago verificado por tu contadora' : 'Pago informado'}
                </p>
                {cuotaMes?.fecha_pago && (
                  <p className="text-xs text-gray-500">
                    Fecha: {new Date(cuotaMes.fecha_pago).toLocaleDateString('es-AR')}
                  </p>
                )}
              </div>
            </div>

            {/* Boton subir comprobante si no tiene */}
            {!tieneComprobante && (
              <button
                onClick={() => setShowModalComprobante(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-violet-200 text-violet-600 hover:bg-violet-50 rounded-xl transition-colors font-medium text-sm"
              >
                <Upload className="w-4 h-4" />
                Subir comprobante
              </button>
            )}

            {/* Indicador de comprobante adjunto */}
            {tieneComprobante && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                Comprobante adjunto
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Boton marcar como pagada */}
            <button
              onClick={handleMarcarPagada}
              disabled={marcando}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl transition-colors font-medium min-h-touch"
            >
              {marcando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Marcar como pagada
                </>
              )}
            </button>

            {/* Boton subir comprobante */}
            <button
              onClick={() => setShowModalComprobante(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
            >
              <Upload className="w-4 h-4" />
              Subir comprobante
            </button>
          </div>
        )}
      </div>

      {/* Modal subir comprobante */}
      {showModalComprobante && (
        <ModalSubirComprobante
          clientId={cliente.id}
          userId={user.id}
          anio={anio}
          mes={mes}
          montoCuota={montoCuota}
          mesNombre={mesNombre}
          estaPagada={estaPagada}
          onClose={() => setShowModalComprobante(false)}
          onSuccess={fetchData}
        />
      )}
    </>
  )
}
