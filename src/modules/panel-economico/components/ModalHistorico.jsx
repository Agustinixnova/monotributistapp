/**
 * Modal para mostrar historico de cotizaciones e indicadores
 */

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { getConfigCotizacion } from '../utils/coloresCotizaciones'
import { formatearMoneda, formatearFecha, formatearPorcentaje } from '../utils/formatters'
import { getHistoricoDolarUltimosDias, getInflacionMensual, getUVA } from '../services/argentinaDatosService'

// Periodos para cotizaciones (dias)
const PERIODOS_DIAS = [
  { key: 30, label: '30 dias' },
  { key: 90, label: '90 dias' },
  { key: 365, label: '1 año' },
]

// Periodos para indicadores mensuales (meses)
const PERIODOS_MESES = [
  { key: 12, label: '12 meses' },
  { key: 24, label: '24 meses' },
  { key: 36, label: '36 meses' },
]

// Configuracion de indicadores
const INDICADORES_CONFIG = {
  inflacion: {
    nombre: 'Inflacion Mensual',
    color: '#f59e0b',
    formatValue: (v) => `${v.toFixed(1)}%`,
    yAxisFormatter: (v) => `${v}%`,
    showUltimo: true // Mostrar ultimo valor en vez de promedio
  },
  inflacionInteranual: {
    nombre: 'Inflacion Interanual',
    color: '#ef4444',
    formatValue: (v) => `${v.toFixed(1)}%`,
    yAxisFormatter: (v) => `${v}%`,
    showUltimo: true
  },
  uva: {
    nombre: 'Indice UVA',
    color: '#3b82f6',
    formatValue: (v) => formatearMoneda(v, 2),
    yAxisFormatter: (v) => `$${v}`
  },
  riesgoPais: {
    nombre: 'Riesgo Pais',
    color: '#ef4444',
    formatValue: (v) => `${Math.round(v)} pts`,
    yAxisFormatter: (v) => v
  },
  tasas: {
    nombre: 'Tasa Plazo Fijo (TNA)',
    color: '#10b981',
    formatValue: (v) => `${v.toFixed(1)}%`,
    yAxisFormatter: (v) => `${v}%`
  }
}

/**
 * Tooltip personalizado
 */
const CustomTooltip = ({ active, payload, formatValue }) => {
  if (!active || !payload || !payload.length) return null

  // Obtener la fecha original del data point
  const fecha = payload[0]?.payload?.fecha

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="text-xs text-gray-500 mb-1">
        {formatearFecha(fecha, 'largo')}
      </div>
      <div className="text-lg font-bold" style={{ color: payload[0]?.stroke }}>
        {formatValue ? formatValue(payload[0]?.value) : formatearMoneda(payload[0]?.value, 2)}
      </div>
    </div>
  )
}

export default function ModalHistorico({ isOpen, onClose, tipo, categoria = 'cotizacion' }) {
  // Determinar configuracion segun categoria
  const isCotizacion = categoria === 'cotizacion'
  const isIndicadorMensual = !isCotizacion && (tipo === 'inflacion' || tipo === 'inflacionInteranual')

  // Periodo inicial: 30 dias para cotizaciones, 12 meses para indicadores mensuales
  const [periodo, setPeriodo] = useState(isCotizacion ? 30 : 12)
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const config = isCotizacion ? getConfigCotizacion(tipo) : INDICADORES_CONFIG[tipo]
  const color = isCotizacion ? '#3b82f6' : config?.color || '#3b82f6'

  // Seleccionar periodos segun tipo
  const periodos = isIndicadorMensual ? PERIODOS_MESES : PERIODOS_DIAS

  // Fetch datos
  useEffect(() => {
    if (!isOpen || !tipo) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        let rawData = []

        if (isCotizacion) {
          // Mapear tipos de cotizacion a casa de dolar
          const casaMap = {
            blue: 'blue',
            oficial: 'oficial',
            mayorista: 'mayorista',
            tarjeta: 'tarjeta',
            mep: 'bolsa',
            cripto: 'cripto'
          }
          const casa = casaMap[tipo] || tipo
          rawData = await getHistoricoDolarUltimosDias(casa, periodo)
        } else if (tipo === 'inflacion' || tipo === 'inflacionInteranual') {
          // Inflacion es mensual, periodo ya esta en meses
          const inflacionData = await getInflacionMensual()
          rawData = inflacionData.slice(-periodo)
        } else if (tipo === 'uva') {
          const uvaData = await getUVA()
          rawData = uvaData.slice(-periodo)
        } else if (tipo === 'riesgoPais') {
          // Obtener historico de riesgo pais
          const response = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais')
          if (!response.ok) throw new Error('Error fetching riesgo pais')
          const riesgoData = await response.json()
          rawData = riesgoData.slice(-periodo)
        } else if (tipo === 'tasas') {
          // Obtener historico de tasas (depositos30Dias tiene historico diario)
          // Los valores ya vienen en porcentaje (ej: 26.04 = 26.04%)
          const response = await fetch('https://api.argentinadatos.com/v1/finanzas/tasas/depositos30Dias')
          if (!response.ok) throw new Error('Error fetching tasas')
          const tasasData = await response.json()
          rawData = tasasData.slice(-periodo)
        }

        // Formatear datos para el grafico
        const formattedData = rawData
          .filter(item => item.fecha) // Filtrar items sin fecha
          .map(item => {
            // Parsear fecha de forma segura (YYYY-MM-DD)
            const fechaStr = item.fecha.substring(0, 10)
            const [year, month, day] = fechaStr.split('-').map(Number)
            const fechaObj = new Date(year, month - 1, day)

            return {
              fecha: item.fecha,
              fechaCorta: fechaObj.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short'
              }),
              valor: item.venta || item.valor || item.compra
            }
          })

        setDatos(formattedData)
      } catch (err) {
        console.error('Error fetching historico:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, tipo, periodo, isCotizacion])

  // Calcular estadisticas
  const estadisticas = datos.length > 0 ? (() => {
    const valores = datos.map(d => d.valor).filter(v => v != null)
    if (valores.length === 0) return null

    const minimo = Math.min(...valores)
    const maximo = Math.max(...valores)
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length
    const primerValor = valores[0]
    const ultimoValor = valores[valores.length - 1]
    const variacion = primerValor ? ((ultimoValor - primerValor) / primerValor) * 100 : 0

    const itemMinimo = datos.find(d => d.valor === minimo)
    const itemMaximo = datos.find(d => d.valor === maximo)
    const itemUltimo = datos[datos.length - 1]

    return { minimo, maximo, promedio, variacion, itemMinimo, itemMaximo, ultimoValor, itemUltimo }
  })() : null

  // Determinar si mostrar ultimo valor en vez de promedio
  const showUltimo = config?.showUltimo || false

  // Icono de tendencia
  const IconoTendencia = estadisticas?.variacion > 0 ? TrendingUp :
                         estadisticas?.variacion < 0 ? TrendingDown : Minus

  const colorTendencia = estadisticas?.variacion > 0 ? 'text-red-500' :
                         estadisticas?.variacion < 0 ? 'text-emerald-500' : 'text-gray-400'

  if (!isOpen) return null

  const formatValue = isCotizacion
    ? (v) => formatearMoneda(v, 2)
    : config?.formatValue || ((v) => v.toFixed(2))

  const yAxisFormatter = isCotizacion
    ? (v) => `$${v}`
    : config?.yAxisFormatter || ((v) => v)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-heading font-semibold text-gray-900">
                Historico {config?.nombre || config?.nombreCorto || tipo}
              </h3>
              {!loading && estadisticas && (
                <div className={`flex items-center gap-1 text-sm ${colorTendencia}`}>
                  <IconoTendencia className="w-4 h-4" />
                  <span>{formatearPorcentaje(estadisticas.variacion, 1)} en el periodo</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Selector de periodo */}
              <div className="flex gap-1">
                {periodos.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPeriodo(key)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      periodo === key
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Boton cerrar */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5">
            {loading ? (
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            ) : error ? (
              <div className="h-64 flex items-center justify-center text-red-500">
                Error cargando datos
              </div>
            ) : datos.length > 0 ? (
              <>
                {/* Grafico */}
                <div style={{ width: '100%', height: 256 }}>
                  <ResponsiveContainer width="100%" height={256}>
                    <LineChart data={datos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="fechaCorta"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={yAxisFormatter}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Estadisticas */}
                {estadisticas && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm">
                    <div className="text-center">
                      <div className="text-gray-500">Minimo</div>
                      <div className="font-semibold text-emerald-600">
                        {formatValue(estadisticas.minimo)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {estadisticas.itemMinimo && formatearFecha(estadisticas.itemMinimo.fecha, 'corto')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">{showUltimo ? 'Ultimo' : 'Promedio'}</div>
                      <div className="font-semibold text-gray-700">
                        {showUltimo ? formatValue(estadisticas.ultimoValor) : formatValue(estadisticas.promedio)}
                      </div>
                      {showUltimo && estadisticas.itemUltimo && (
                        <div className="text-xs text-gray-400">
                          {formatearFecha(estadisticas.itemUltimo.fecha, 'corto')}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">Maximo</div>
                      <div className="font-semibold text-red-600">
                        {formatValue(estadisticas.maximo)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {estadisticas.itemMaximo && formatearFecha(estadisticas.itemMaximo.fecha, 'corto')}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
