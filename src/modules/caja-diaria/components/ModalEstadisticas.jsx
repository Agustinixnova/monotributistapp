/**
 * Modal de Estadísticas de Caja Diaria
 * Muestra gráficos y métricas del negocio con filtros de período
 */

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Calendar, BarChart3, Loader2 } from 'lucide-react'
import { useEstadisticas } from '../hooks/useEstadisticas'
import { getFechaHoyArgentina } from '../utils/dateUtils'
import { formatearMonto } from '../utils/formatters'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORES_CATEGORIAS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1'  // indigo
]

export default function ModalEstadisticas({ isOpen, onClose, nombreNegocio = 'Mi Negocio' }) {
  const hoy = getFechaHoyArgentina()
  const { loading, datos, cargarEstadisticas } = useEstadisticas()

  const [filtroActivo, setFiltroActivo] = useState('hoy')
  const [fechaDesde, setFechaDesde] = useState(hoy)
  const [fechaHasta, setFechaHasta] = useState(hoy)

  // Calcular fechas según filtro
  const calcularFechas = (filtro) => {
    const fecha = new Date(hoy + 'T12:00:00')
    let desde, hasta

    switch (filtro) {
      case 'hoy':
        desde = hasta = hoy
        break
      case 'ayer': {
        const ayer = new Date(fecha)
        ayer.setDate(fecha.getDate() - 1)
        desde = hasta = ayer.toISOString().split('T')[0]
        break
      }
      case 'semana': {
        const diaSemana = fecha.getDay()
        const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1
        const lunes = new Date(fecha)
        lunes.setDate(fecha.getDate() - diffLunes)
        desde = lunes.toISOString().split('T')[0]
        hasta = hoy
        break
      }
      case 'mes':
        desde = hoy.substring(0, 8) + '01'
        hasta = hoy
        break
      case 'año':
        desde = hoy.substring(0, 5) + '01-01'
        hasta = hoy
        break
      case 'personalizado':
        desde = fechaDesde
        hasta = fechaHasta
        break
      default:
        desde = hasta = hoy
    }

    return { desde, hasta }
  }

  const generarEstadisticas = async (filtro = filtroActivo) => {
    setFiltroActivo(filtro)
    const { desde, hasta } = calcularFechas(filtro)
    await cargarEstadisticas({ fechaDesde: desde, fechaHasta: hasta })
  }

  // Cargar estadísticas de "Hoy" al abrir
  useEffect(() => {
    if (isOpen) {
      generarEstadisticas('hoy')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const resumen = datos?.resumen || {}
  const evolucion = datos?.evolucion || []
  const ingresosCateg = datos?.ingresosCateg || []
  const egresosCateg = datos?.egresosCateg || []
  const metodosPago = datos?.metodosPago || []
  const diasSemana = datos?.diasSemana || []
  const cuentaCorriente = datos?.cuentaCorriente || {}

  const balance = parseFloat(resumen.balance || 0)

  // Preparar datos para gráfico de torta (top 5)
  const topIngresosCateg = ingresosCateg.slice(0, 5).map((cat, idx) => ({
    name: cat.categoria_nombre,
    value: parseFloat(cat.total),
    porcentaje: parseFloat(cat.porcentaje || 0)
  }))

  const topEgresosCateg = egresosCateg.slice(0, 5).map((cat, idx) => ({
    name: cat.categoria_nombre,
    value: parseFloat(cat.total),
    porcentaje: parseFloat(cat.porcentaje || 0)
  }))

  const topMetodosPago = metodosPago.slice(0, 5).map(m => ({
    name: m.metodo_nombre,
    value: parseFloat(m.total),
    porcentaje: parseFloat(m.porcentaje || 0)
  }))

  // Preparar datos para evolución (formatear fechas)
  const evolucionFormateada = evolucion.map(e => ({
    fecha: new Date(e.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    Ingresos: parseFloat(e.ingresos),
    Egresos: parseFloat(e.egresos)
  }))

  // Preparar días de semana (ordenar Lun-Dom)
  const ordenDias = [1, 2, 3, 4, 5, 6, 0] // Lunes a Domingo
  const diasSemanaOrdenados = ordenDias
    .map(dia => diasSemana.find(d => d.dia_semana === dia))
    .filter(Boolean)
    .map(d => ({
      dia: d.dia_nombre,
      Ingresos: parseFloat(d.ingresos),
      Egresos: parseFloat(d.egresos)
    }))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-start justify-center p-2 sm:p-4 pt-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                <div>
                  <h3 className="font-heading font-semibold text-base sm:text-lg">Estadísticas</h3>
                  <p className="text-xs sm:text-sm text-white/80 hidden sm:block">{nombreNegocio}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros de período */}
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 sticky top-[72px] sm:top-[76px] z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  { id: 'hoy', label: 'Hoy' },
                  { id: 'ayer', label: 'Ayer' },
                  { id: 'semana', label: 'Semana' },
                  { id: 'mes', label: 'Mes' },
                  { id: 'año', label: 'Año' },
                  { id: 'personalizado', label: 'Personalizado' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFiltroActivo(f.id)
                      if (f.id !== 'personalizado') generarEstadisticas(f.id)
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-full transition-colors ${
                      filtroActivo === f.id
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Fechas personalizadas */}
              {filtroActivo === 'personalizado' && (
                <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => generarEstadisticas('personalizado')}
                    disabled={loading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Generar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                {/* Cards de resumen */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Ingresos */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 sm:p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      <span className="text-xs sm:text-sm text-emerald-700 font-medium">Ingresos</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-700">
                      {formatearMonto(resumen.total_ingresos || 0)}
                    </p>
                  </div>

                  {/* Egresos */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 sm:p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      <span className="text-xs sm:text-sm text-red-700 font-medium">Egresos</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-700">
                      {formatearMonto(resumen.total_egresos || 0)}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className={`bg-gradient-to-br rounded-xl p-3 sm:p-4 border ${
                    balance >= 0
                      ? 'from-blue-50 to-blue-100 border-blue-200'
                      : 'from-orange-50 to-orange-100 border-orange-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                      <span className={`text-xs sm:text-sm font-medium ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                        Balance
                      </span>
                    </div>
                    <p className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {formatearMonto(balance)}
                    </p>
                  </div>

                  {/* Operaciones */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      <span className="text-xs sm:text-sm text-purple-700 font-medium">Operaciones</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-purple-700">
                      {resumen.cantidad_operaciones || 0}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Ticket: {formatearMonto(resumen.ticket_promedio || 0)}
                    </p>
                  </div>
                </div>

                {/* Evolución Temporal */}
                {evolucionFormateada.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <h4 className="font-heading font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">
                      Evolución Temporal
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={evolucionFormateada}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatearMonto(value)} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Egresos" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gráficos de Torta: Categorías y Métodos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Ingresos por Categoría */}
                  {topIngresosCateg.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                      <h4 className="font-heading font-semibold text-sm sm:text-base text-gray-900 mb-3">
                        Ingresos por Categoría (Top 5)
                      </h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={topIngresosCateg}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, porcentaje }) => `${name} ${porcentaje.toFixed(1)}%`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {topIngresosCateg.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatearMonto(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Métodos de Pago */}
                  {topMetodosPago.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                      <h4 className="font-heading font-semibold text-sm sm:text-base text-gray-900 mb-3">
                        Métodos de Pago
                      </h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={topMetodosPago}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, porcentaje }) => `${name} ${porcentaje.toFixed(1)}%`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {topMetodosPago.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORES_CATEGORIAS[index % COLORES_CATEGORIAS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatearMonto(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Días de la Semana */}
                {diasSemanaOrdenados.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                    <h4 className="font-heading font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">
                      Ventas por Día de la Semana
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={diasSemanaOrdenados}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatearMonto(value)} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Ingresos" fill="#10b981" />
                        <Bar dataKey="Egresos" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Cuenta Corriente */}
                {cuentaCorriente && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-3 sm:p-4">
                    <h4 className="font-heading font-semibold text-sm sm:text-base text-amber-900 mb-3">
                      Cuenta Corriente
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-amber-700">Nuevas Deudas</p>
                        <p className="text-base sm:text-lg font-bold text-amber-900">
                          {formatearMonto(cuentaCorriente.nuevas_deudas || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-700">Cobros</p>
                        <p className="text-base sm:text-lg font-bold text-emerald-700">
                          {formatearMonto(cuentaCorriente.cobros_realizados || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-700">Deuda Total</p>
                        <p className="text-base sm:text-lg font-bold text-red-700">
                          {formatearMonto(cuentaCorriente.deuda_total_actual || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-700">Clientes</p>
                        <p className="text-base sm:text-lg font-bold text-amber-900">
                          {cuentaCorriente.clientes_con_deuda || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="w-full py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm sm:text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
