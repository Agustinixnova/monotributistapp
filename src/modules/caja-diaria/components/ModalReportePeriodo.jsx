/**
 * Modal para generar reporte de caja por período
 */

import { useState } from 'react'
import { X, TrendingUp, TrendingDown, FileText, Loader2, FileDown, FileSpreadsheet } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'
import { getReportePeriodo } from '../services/movimientosService'
import { getFechaHoyArgentina } from '../utils/dateUtils'
import { descargarPDFReportePeriodo, descargarExcelReportePeriodo } from '../utils/exportReportePeriodo'
import IconoDinamico from './IconoDinamico'

export default function ModalReportePeriodo({ isOpen, onClose, nombreNegocio = 'Mi Negocio' }) {
  const hoy = getFechaHoyArgentina()

  // Calcular primer día del mes actual
  const primerDiaMes = hoy.substring(0, 8) + '01'

  const [fechaDesde, setFechaDesde] = useState(primerDiaMes)
  const [fechaHasta, setFechaHasta] = useState(hoy)
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerarReporte = async () => {
    if (!fechaDesde || !fechaHasta) {
      setError('Selecciona ambas fechas')
      return
    }

    if (fechaDesde > fechaHasta) {
      setError('La fecha desde no puede ser mayor a la fecha hasta')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: err } = await getReportePeriodo(fechaDesde, fechaHasta)

    if (err) {
      setError('Error al generar el reporte')
      console.error(err)
    } else {
      setDatos(data || [])
    }

    setLoading(false)
  }

  const handleClose = () => {
    setDatos(null)
    setError(null)
    onClose()
  }

  // Calcular totales generales
  const totalEntradas = datos?.reduce((sum, m) => sum + parseFloat(m.total_entradas || 0), 0) || 0
  const totalSalidas = datos?.reduce((sum, m) => sum + parseFloat(m.total_salidas || 0), 0) || 0
  const saldo = totalEntradas - totalSalidas

  // Formatear fecha para mostrar
  const formatearFechaCorta = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Reporte por Período</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Selectores de fecha */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Botón generar */}
            <button
              onClick={handleGenerarReporte}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generar Reporte
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
            )}

            {/* Resultados */}
            {datos && (
              <div className="mt-5 space-y-4">
                {/* Período seleccionado */}
                <div className="text-center text-sm text-gray-500">
                  {formatearFechaCorta(fechaDesde)} - {formatearFechaCorta(fechaHasta)}
                </div>

                {datos.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No hay movimientos en este período
                  </p>
                ) : (
                  <>
                    {/* Detalle por método de pago */}
                    <div className="space-y-2">
                      {datos.map(metodo => (
                        <div
                          key={metodo.metodo_id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                        >
                          {/* Nombre del método */}
                          <div className="flex items-center gap-2 mb-2">
                            <IconoDinamico
                              nombre={metodo.metodo_icono}
                              className="w-5 h-5 text-gray-600"
                            />
                            <span className="font-medium text-gray-900">
                              {metodo.metodo_nombre}
                            </span>
                            {metodo.es_efectivo && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                Efectivo
                              </span>
                            )}
                          </div>

                          {/* Entradas y salidas */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Entradas */}
                            <div className="bg-emerald-50 rounded-lg p-2">
                              <div className="flex items-center gap-1 text-emerald-600 mb-1">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-xs font-medium">Entradas</span>
                                <span className="text-xs text-emerald-500">
                                  ({metodo.cantidad_entradas})
                                </span>
                              </div>
                              <p className="text-lg font-bold text-emerald-700">
                                {formatearMonto(metodo.total_entradas)}
                              </p>
                            </div>

                            {/* Salidas */}
                            <div className="bg-red-50 rounded-lg p-2">
                              <div className="flex items-center gap-1 text-red-600 mb-1">
                                <TrendingDown className="w-3 h-3" />
                                <span className="text-xs font-medium">Salidas</span>
                                <span className="text-xs text-red-500">
                                  ({metodo.cantidad_salidas})
                                </span>
                              </div>
                              <p className="text-lg font-bold text-red-700">
                                {formatearMonto(metodo.total_salidas)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totales generales */}
                    <div className="border-t-2 border-gray-300 pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Entradas</span>
                        <span className="text-lg font-bold text-emerald-600">
                          {formatearMonto(totalEntradas)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Salidas</span>
                        <span className="text-lg font-bold text-red-600">
                          {formatearMonto(totalSalidas)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Saldo del Período</span>
                        <span className={`text-xl font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatearMonto(saldo)}
                        </span>
                      </div>
                    </div>

                    {/* Botones de descarga */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => descargarPDFReportePeriodo({
                          fechaDesde,
                          fechaHasta,
                          datos,
                          nombreNegocio
                        })}
                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        Descargar PDF
                      </button>
                      <button
                        onClick={() => descargarExcelReportePeriodo({
                          fechaDesde,
                          fechaHasta,
                          datos,
                          nombreNegocio
                        })}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Descargar Excel
                      </button>
                    </div>
                  </>
                )}
              </div>
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
