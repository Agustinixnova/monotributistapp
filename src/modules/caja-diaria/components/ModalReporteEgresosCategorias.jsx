/**
 * Modal de Reporte de Egresos por Categoría
 * Estadísticas de gastos/egresos agrupados por categoría
 */

import { useState, useEffect } from 'react'
import { X, TrendingDown, Loader2, FileDown, FileSpreadsheet, Calendar, AlertCircle } from 'lucide-react'
import { getReporteEgresosPorCategoria, getDetalleMovimientosCategoria } from '../services/reporteCategoriasService'
import { getArqueosConDiferencia } from '../services/arqueosService'
import { formatearMonto } from '../utils/formatters'
import { getFechaHoyArgentina } from '../utils/dateUtils'
import IconoDinamico from './IconoDinamico'
import { descargarPDFReporteCategorias, descargarExcelReporteCategorias } from '../utils/exportReporteCategorias'

export default function ModalReporteEgresosCategorias({ isOpen, onClose, nombreNegocio = 'Mi Negocio' }) {
  const hoy = getFechaHoyArgentina()

  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState(null)
  const [ajustesArqueo, setAjustesArqueo] = useState([])
  const [error, setError] = useState(null)
  const [filtroActivo, setFiltroActivo] = useState('hoy')
  const [fechaDesde, setFechaDesde] = useState(hoy)
  const [fechaHasta, setFechaHasta] = useState(hoy)
  const [incluirDesglose, setIncluirDesglose] = useState(false)
  const [exportando, setExportando] = useState(false)

  // Calcular fechas según filtro
  const calcularFechas = (filtro) => {
    const fecha = new Date(hoy + 'T12:00:00')
    let desde, hasta

    switch (filtro) {
      case 'hoy':
        desde = hasta = hoy
        break
      case 'semana':
        const diaSemana = fecha.getDay()
        const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1
        const lunes = new Date(fecha)
        lunes.setDate(fecha.getDate() - diffLunes)
        desde = lunes.toISOString().split('T')[0]
        hasta = hoy
        break
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

  const generarReporte = async (filtro = filtroActivo) => {
    setLoading(true)
    setError(null)
    setFiltroActivo(filtro)

    const { desde, hasta } = calcularFechas(filtro)

    const { data, error: err } = await getReporteEgresosPorCategoria({
      fechaDesde: desde,
      fechaHasta: hasta
    })

    // Obtener ajustes de arqueo negativos (faltantes)
    const { data: ajustes } = await getArqueosConDiferencia({
      fechaDesde: desde,
      fechaHasta: hasta,
      tipo: 'negativo'
    })

    if (err) {
      setError('Error al generar el reporte')
    } else {
      setDatos(data)
      setAjustesArqueo(ajustes || [])
    }
    setLoading(false)
  }

  // Obtener desglose de todas las categorías para exportación
  const obtenerDesglose = async () => {
    if (!datos || datos.length === 0) return []

    const { desde, hasta } = calcularFechas(filtroActivo)
    const desglose = []

    for (const cat of datos) {
      const { data } = await getDetalleMovimientosCategoria({
        categoriaId: cat.categoria_id,
        tipo: 'salida',
        fechaDesde: desde,
        fechaHasta: hasta
      })
      desglose.push({
        categoria_id: cat.categoria_id,
        categoria_nombre: cat.categoria_nombre,
        movimientos: data || []
      })
    }

    return desglose
  }

  // Exportar PDF
  const handleExportarPDF = async () => {
    setExportando(true)
    let desglose = null
    if (incluirDesglose) {
      desglose = await obtenerDesglose()
    }
    descargarPDFReporteCategorias({
      datos,
      nombreNegocio,
      tipo: 'egresos',
      periodo: getPeriodoLabel(),
      total: totalCategorias,
      cantidadTotal,
      desglose,
      ajustesArqueo,
      totalConAjustes: total
    })
    setExportando(false)
  }

  // Exportar Excel
  const handleExportarExcel = async () => {
    setExportando(true)
    let desglose = null
    if (incluirDesglose) {
      desglose = await obtenerDesglose()
    }
    descargarExcelReporteCategorias({
      datos,
      nombreNegocio,
      tipo: 'egresos',
      periodo: getPeriodoLabel(),
      total: totalCategorias,
      cantidadTotal,
      desglose,
      ajustesArqueo,
      totalConAjustes: total
    })
    setExportando(false)
  }

  const handleClose = () => {
    setDatos(null)
    setAjustesArqueo([])
    setError(null)
    setFiltroActivo('hoy')
    setIncluirDesglose(false)
    onClose()
  }

  // Cargar reporte de "Hoy" automáticamente al abrir
  useEffect(() => {
    if (isOpen && !datos && !loading) {
      generarReporte('hoy')
    }
  }, [isOpen])

  if (!isOpen) return null

  // Calcular total de categorías
  const totalCategorias = datos?.reduce((sum, cat) => sum + parseFloat(cat.total), 0) || 0
  const cantidadTotal = datos?.reduce((sum, cat) => sum + cat.cantidad, 0) || 0

  // Calcular total de ajustes de arqueo (faltantes - valores negativos convertidos a positivos)
  const totalAjustesArqueo = ajustesArqueo?.reduce((sum, arq) => sum + Math.abs(parseFloat(arq.diferencia)), 0) || 0

  // Total general
  const total = totalCategorias + totalAjustesArqueo

  // Formatear fecha para mostrar
  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  // Obtener label del período
  const getPeriodoLabel = () => {
    const { desde, hasta } = calcularFechas(filtroActivo)
    if (desde === hasta) return formatFecha(desde)
    return `${formatFecha(desde)} - ${formatFecha(hasta)}`
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Egresos por Categoría</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/80 mt-1">Estadísticas de gastos y salidas</p>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Filtros de período */}
            <div className="space-y-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'hoy', label: 'Hoy' },
                  { id: 'semana', label: 'Semana' },
                  { id: 'mes', label: 'Mes' },
                  { id: 'año', label: 'Año' },
                  { id: 'personalizado', label: 'Personalizado' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFiltroActivo(f.id)
                      if (f.id !== 'personalizado') generarReporte(f.id)
                    }}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      filtroActivo === f.id
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Fechas personalizadas */}
              {filtroActivo === 'personalizado' && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <button
                    onClick={() => generarReporte('personalizado')}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium rounded-lg transition-colors"
                  >
                    Generar
                  </button>
                </div>
              )}

              {/* Checkbox incluir desglose */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirDesglose}
                  onChange={(e) => setIncluirDesglose(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Incluir desglose de movimientos en exportación</span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            )}

            {/* Resultados */}
            {!loading && datos && (
              <>
                {/* Período */}
                <div className="text-center text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {getPeriodoLabel()}
                </div>

                {/* Resumen */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600">Total Egresos</p>
                      <p className="text-2xl font-bold text-red-700">{formatearMonto(total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600">Operaciones</p>
                      <p className="text-2xl font-bold text-red-700">{cantidadTotal}</p>
                    </div>
                  </div>
                </div>

                {/* Detalle por categoría */}
                {datos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay egresos en este período
                  </div>
                ) : (
                  <div className="space-y-2">
                    {datos.map((cat) => {
                      const porcentaje = total > 0 ? (parseFloat(cat.total) / total * 100) : 0
                      return (
                        <div
                          key={cat.categoria_id}
                          className="border border-gray-200 rounded-lg p-3 bg-white"
                        >
                          <div className="flex items-center gap-3">
                            {/* Icono */}
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                              <IconoDinamico nombre={cat.categoria_icono} className="w-5 h-5 text-red-600" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{cat.categoria_nombre}</span>
                                <span className="font-bold text-red-600">{formatearMonto(cat.total)}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-500">{cat.cantidad} operaciones</span>
                                <span className="text-xs text-gray-500">{porcentaje.toFixed(1)}%</span>
                              </div>
                              {/* Barra de progreso */}
                              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-500 rounded-full transition-all"
                                  style={{ width: `${porcentaje}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Sección de Ajustes por Arqueo (faltantes) */}
                {ajustesArqueo && ajustesArqueo.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <h4 className="font-medium text-gray-700">Ajustes por Arqueo (Faltantes)</h4>
                    </div>
                    <div className="space-y-2">
                      {ajustesArqueo.map((arq) => (
                        <div
                          key={arq.id}
                          className="border border-orange-200 rounded-lg p-3 bg-orange-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-gray-600">
                                {formatFecha(arq.fecha)} - {arq.hora?.substring(0, 5)}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">({arq.creador_nombre || 'Usuario'})</span>
                            </div>
                            <span className="font-bold text-orange-600">
                              {formatearMonto(Math.abs(arq.diferencia))}
                            </span>
                          </div>
                          {arq.motivo_diferencia && (
                            <p className="text-xs text-gray-500 mt-1">{arq.motivo_diferencia}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-orange-200">
                      <span className="text-sm font-medium text-orange-700">Subtotal Faltantes</span>
                      <span className="font-bold text-orange-600">{formatearMonto(totalAjustesArqueo)}</span>
                    </div>
                  </div>
                )}

                {/* Total con ajustes */}
                {ajustesArqueo && ajustesArqueo.length > 0 && (
                  <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-700">TOTAL EGRESOS (con ajustes)</span>
                      <span className="text-xl font-bold text-red-700">{formatearMonto(total)}</span>
                    </div>
                  </div>
                )}

                {/* Botones de descarga */}
                {(datos.length > 0 || ajustesArqueo.length > 0) && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleExportarPDF}
                      disabled={exportando}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                      PDF
                    </button>
                    <button
                      onClick={handleExportarExcel}
                      disabled={exportando}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                      Excel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
