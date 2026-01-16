import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, Receipt } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { formatearMoneda } from '../utils/formatters'
import {
  getCuotaMesActual,
  calcularMontoCuota,
  calcularEstadoVencimiento,
  getMesActualNombre
} from '../services/cuotaService'
import { calcularIibbEstimado, getVencimientoIibb, calcularEstadoVencimientoIibb, getFacturacionMesAnterior } from '../services/iibbService'

export function CardCuotaMonotributo() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [cliente, setCliente] = useState(null)
  const [categoriaData, setCategoriaData] = useState(null)
  const [cuotaMes, setCuotaMes] = useState(null)

  // Estados para IIBB
  const [iibbEstimado, setIibbEstimado] = useState(0)
  const [iibbDetalle, setIibbDetalle] = useState([])
  const [vencimientoIibb, setVencimientoIibb] = useState(null)
  const [tieneIibb, setTieneIibb] = useState(false)
  const [facturacionBase, setFacturacionBase] = useState(null) // Facturación del mes anterior

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

      // 4. Calcular IIBB si aplica
      const tieneIibbActivo = clienteData.regimen_iibb === 'local' || clienteData.regimen_iibb === 'convenio_multilateral'
      setTieneIibb(tieneIibbActivo)

      if (tieneIibbActivo) {
        // Obtener facturación del mes anterior
        const facMesAnterior = await getFacturacionMesAnterior(clienteData.id)

        if (facMesAnterior && facMesAnterior.monto > 0) {
          setFacturacionBase(facMesAnterior)

          // Calcular IIBB estimado basado en la facturación del mes anterior
          const { total, detalle } = await calcularIibbEstimado(clienteData.id, facMesAnterior.monto)
          setIibbEstimado(total)
          setIibbDetalle(detalle)
        }

        // Obtener vencimiento de IIBB (del mes actual)
        const ahora = new Date()
        const vencimiento = await getVencimientoIibb(
          clienteData.cuit,
          ahora.getFullYear(),
          ahora.getMonth() + 1
        )
        setVencimientoIibb(vencimiento)
      }

    } catch (err) {
      console.error('Error cargando datos de cuota:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

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

  // Determinar si ya esta pagada
  const estaPagada = cuotaMes?.estado === 'informada' || cuotaMes?.estado === 'verificada'

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

        {/* Montos */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Monto Monotributo */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Monotributo</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {formatearMoneda(montoCuota)}
            </p>
          </div>

          {/* Monto IIBB estimado */}
          {tieneIibb && iibbEstimado > 0 && (
            <div className="sm:text-right">
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-1 sm:justify-end">
                <Receipt className="w-3.5 h-3.5" />
                <span>IIBB Estimado</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-700">
                {formatearMoneda(iibbEstimado)}
              </p>
            </div>
          )}
        </div>

        {/* Info IIBB */}
        {tieneIibb && iibbEstimado > 0 && facturacionBase && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              Cálculo basado en facturación de {new Date(facturacionBase.anio, facturacionBase.mes - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}: {formatearMoneda(facturacionBase.monto)}
            </p>
            <p className="text-xs text-blue-400 mt-1 italic">
              * Estimación aproximada. El monto real puede variar. Su contador/a le va a informar el monto final que debe abonar.
            </p>
          </div>
        )}

        {/* Mensaje si no hay facturación del mes anterior */}
        {tieneIibb && iibbEstimado === 0 && !facturacionBase && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700">
              <Receipt className="w-3.5 h-3.5 inline mr-1" />
              IIBB: No hay facturación del mes anterior para calcular el estimado.
            </p>
          </div>
        )}

        {/* Barras de progreso */}
        {!estaPagada && (
          <div className="mb-4 space-y-3">
            {/* Barra Monotributo */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Monotributo</span>
                <span>Vence 20 de {mesNombre}</span>
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

            {/* Barra IIBB */}
            {tieneIibb && vencimientoIibb && (() => {
              const estadoIibb = calcularEstadoVencimientoIibb(vencimientoIibb)
              const diaVencimiento = vencimientoIibb.getDate()
              const diaActual = new Date().getDate()
              const progreso = Math.min(100, (diaActual / diaVencimiento) * 100)

              return (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3 h-3" />
                      IIBB
                    </span>
                    <span>
                      Vence {diaVencimiento} de {vencimientoIibb.toLocaleDateString('es-AR', { month: 'long' })}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        estadoIibb.color === 'green' ? 'bg-blue-500' :
                        estadoIibb.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Estado de pago si ya pagó */}
        {estaPagada && (
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
        )}
      </div>
    </>
  )
}
