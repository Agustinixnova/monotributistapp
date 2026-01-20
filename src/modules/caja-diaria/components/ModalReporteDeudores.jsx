/**
 * Modal de Reporte de Deudores - Estado actual de cuentas corrientes
 */

import { useState, useEffect } from 'react'
import { X, Users, TrendingUp, TrendingDown, Loader2, FileDown, FileSpreadsheet, Phone, Clock, AlertTriangle } from 'lucide-react'
import { getReporteDeudores } from '../services/reportesCuentaCorrienteService'
import { formatearMonto } from '../utils/formatters'
import { descargarPDFReporteDeudores, descargarExcelReporteDeudores } from '../utils/exportReporteDeudores'

export default function ModalReporteDeudores({ isOpen, onClose, nombreNegocio = 'Mi Negocio' }) {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos') // 'todos', 'deuda', 'favor'

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      cargarDatos()
    }
  }, [isOpen])

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getReporteDeudores()
    if (err) {
      setError('Error al cargar el reporte')
    } else {
      setDatos(data)
    }
    setLoading(false)
  }

  const handleClose = () => {
    setDatos(null)
    setError(null)
    setFiltro('todos')
    onClose()
  }

  if (!isOpen) return null

  // Calcular totales
  const clientesConDeuda = datos?.filter(c => c.saldo > 0) || []
  const clientesAFavor = datos?.filter(c => c.saldo < 0) || []
  const totalDeuda = clientesConDeuda.reduce((sum, c) => sum + parseFloat(c.saldo), 0)
  const totalAFavor = clientesAFavor.reduce((sum, c) => sum + Math.abs(parseFloat(c.saldo)), 0)
  const saldoNeto = totalDeuda - totalAFavor

  // Filtrar datos
  const datosFiltrados = datos?.filter(c => {
    if (filtro === 'deuda') return c.saldo > 0
    if (filtro === 'favor') return c.saldo < 0
    return true
  }) || []

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Reporte de Deudores</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/80 mt-1">Estado actual de cuentas corrientes</p>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={cargarDatos}
                  className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Reintentar
                </button>
              </div>
            ) : datos && (
              <>
                {/* Resumen consolidado */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {/* Total deuda */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm font-medium">Deben</span>
                    </div>
                    <p className="text-xl font-bold text-red-700">{formatearMonto(totalDeuda)}</p>
                    <p className="text-xs text-red-500">{clientesConDeuda.length} clientes</p>
                  </div>

                  {/* Total a favor */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">A favor</span>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{formatearMonto(totalAFavor)}</p>
                    <p className="text-xs text-blue-500">{clientesAFavor.length} clientes</p>
                  </div>

                  {/* Saldo neto */}
                  <div className={`border rounded-lg p-3 ${saldoNeto >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${saldoNeto >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      <span className="text-sm font-medium">Neto a cobrar</span>
                    </div>
                    <p className={`text-xl font-bold ${saldoNeto >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {formatearMonto(saldoNeto)}
                    </p>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFiltro('todos')}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      filtro === 'todos'
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Todos ({datos.length})
                  </button>
                  <button
                    onClick={() => setFiltro('deuda')}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      filtro === 'deuda'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Deben ({clientesConDeuda.length})
                  </button>
                  <button
                    onClick={() => setFiltro('favor')}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      filtro === 'favor'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    A favor ({clientesAFavor.length})
                  </button>
                </div>

                {/* Detalle */}
                {datosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay clientes con saldo pendiente
                  </div>
                ) : (
                  <div className="space-y-2">
                    {datosFiltrados.map((cliente) => {
                      const tieneDeuda = cliente.saldo > 0
                      const superaLimite = cliente.limite_credito && cliente.saldo > cliente.limite_credito

                      return (
                        <div
                          key={cliente.id}
                          className={`border rounded-lg p-3 ${
                            tieneDeuda
                              ? superaLimite ? 'border-orange-300 bg-orange-50' : 'border-red-200 bg-red-50/50'
                              : 'border-blue-200 bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Info cliente */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate">
                                  {cliente.nombre} {cliente.apellido || ''}
                                </span>
                                {superaLimite && (
                                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" title="Supera límite de crédito" />
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                                {cliente.telefono && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {cliente.telefono}
                                  </span>
                                )}
                                {cliente.limite_credito && (
                                  <span>
                                    Límite: {formatearMonto(cliente.limite_credito)}
                                  </span>
                                )}
                                {cliente.ultima_actividad && (
                                  <span>
                                    Últ. mov: {new Date(cliente.ultima_actividad + 'T00:00:00').toLocaleDateString('es-AR')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Saldo y días */}
                            <div className="text-right flex-shrink-0">
                              <p className={`text-lg font-bold ${tieneDeuda ? 'text-red-600' : 'text-blue-600'}`}>
                                {tieneDeuda ? '' : '-'}{formatearMonto(Math.abs(cliente.saldo))}
                              </p>
                              {tieneDeuda && cliente.dias_deuda > 0 && (
                                <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                  <Clock className="w-3 h-3" />
                                  {cliente.dias_deuda} días
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Botones de descarga */}
                {datos.length > 0 && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => descargarPDFReporteDeudores({
                        datos,
                        nombreNegocio,
                        totalDeuda,
                        totalAFavor,
                        saldoNeto
                      })}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={() => descargarExcelReporteDeudores({
                        datos,
                        nombreNegocio,
                        totalDeuda,
                        totalAFavor,
                        saldoNeto
                      })}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
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
