/**
 * Modal de Reporte de Movimientos de Cuenta Corriente
 * Historial de fiados y pagos con filtros opcionales
 */

import { useState, useEffect } from 'react'
import { X, FileText, Loader2, FileDown, FileSpreadsheet, Calendar, User, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { getReporteMovimientosCuenta } from '../services/reportesCuentaCorrienteService'
import { getClientes } from '../services/clientesFiadoService'
import { formatearMonto } from '../utils/formatters'
import { getFechaHoyArgentina } from '../utils/dateUtils'
import { descargarPDFMovimientosCuenta, descargarExcelMovimientosCuenta } from '../utils/exportReporteMovimientosCuenta'

export default function ModalReporteMovimientosCuenta({ isOpen, onClose, nombreNegocio = 'Mi Negocio' }) {
  const hoy = getFechaHoyArgentina()
  const primerDiaMes = hoy.substring(0, 8) + '01'

  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [datos, setDatos] = useState(null)
  const [clientes, setClientes] = useState([])
  const [error, setError] = useState(null)

  // Filtros
  const [usarFechas, setUsarFechas] = useState(false)
  const [fechaDesde, setFechaDesde] = useState(primerDiaMes)
  const [fechaHasta, setFechaHasta] = useState(hoy)
  const [clienteId, setClienteId] = useState('')

  // Cargar clientes al abrir
  useEffect(() => {
    if (isOpen) {
      cargarClientes()
      setDatos(null)
      setUsarFechas(false)
      setFechaDesde(primerDiaMes)
      setFechaHasta(hoy)
      setClienteId('')
    }
  }, [isOpen])

  const cargarClientes = async () => {
    setLoadingClientes(true)
    const { data } = await getClientes()
    setClientes(data || [])
    setLoadingClientes(false)
  }

  const generarReporte = async () => {
    setLoading(true)
    setError(null)

    const filtros = {
      fechaDesde: usarFechas ? fechaDesde : null,
      fechaHasta: usarFechas ? fechaHasta : null,
      clienteId: clienteId || null
    }

    const { data, error: err } = await getReporteMovimientosCuenta(filtros)

    if (err) {
      setError('Error al generar el reporte')
    } else {
      // Ordenar de más antiguo a más nuevo para que el saldo acumulado sea correcto
      const datosOrdenados = (data || []).sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora || '00:00:00'}`)
        const fechaB = new Date(`${b.fecha}T${b.hora || '00:00:00'}`)
        return fechaA - fechaB
      })
      setDatos(datosOrdenados)
    }
    setLoading(false)
  }

  const handleClose = () => {
    setDatos(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  // Calcular totales
  const totalFiados = datos?.filter(m => m.tipo === 'fiado').reduce((sum, m) => sum + parseFloat(m.monto), 0) || 0
  const totalPagos = datos?.filter(m => m.tipo === 'pago').reduce((sum, m) => sum + parseFloat(m.monto), 0) || 0
  const cantFiados = datos?.filter(m => m.tipo === 'fiado').length || 0
  const cantPagos = datos?.filter(m => m.tipo === 'pago').length || 0

  // Formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  const formatHora = (hora) => {
    if (!hora) return ''
    return hora.substring(0, 5)
  }

  // Obtener nombre del cliente seleccionado
  const clienteSeleccionado = clientes.find(c => c.id === clienteId)
  const nombreClienteSeleccionado = clienteSeleccionado
    ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido || ''}`.trim()
    : null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Movimientos de Cuenta</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/80 mt-1">Historial de cuenta corriente</p>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Filtros */}
            <div className="space-y-4 mb-4">
              {/* Selector de cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Cliente (opcional)
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  disabled={loadingClientes}
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle filtro por fechas */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarFechas}
                    onChange={(e) => setUsarFechas(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Filtrar por fechas</span>
                </label>
              </div>

              {/* Selectores de fecha */}
              {usarFechas && (
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Botón generar */}
              <button
                onClick={generarReporte}
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Resultados */}
            {datos && (
              <>
                {/* Info del filtro aplicado */}
                <div className="text-center text-sm text-gray-500 mb-3">
                  {nombreClienteSeleccionado && <span className="font-medium">{nombreClienteSeleccionado} • </span>}
                  {usarFechas
                    ? `${formatFecha(fechaDesde)} - ${formatFecha(fechaHasta)}`
                    : 'Todo el historial'}
                </div>

                {/* Resumen */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                      <ArrowDownCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Debe</span>
                      <span className="text-xs text-red-400">({cantFiados})</span>
                    </div>
                    <p className="text-lg font-bold text-red-700">{formatearMonto(totalFiados)}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <ArrowUpCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Haber</span>
                      <span className="text-xs text-emerald-400">({cantPagos})</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-700">{formatearMonto(totalPagos)}</p>
                  </div>
                  <div className={`border rounded-lg p-3 ${totalFiados - totalPagos > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${totalFiados - totalPagos > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      <span className="text-sm font-medium">Saldo</span>
                    </div>
                    <p className={`text-lg font-bold ${totalFiados - totalPagos > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      {formatearMonto(totalFiados - totalPagos)}
                    </p>
                  </div>
                </div>

                {/* Detalle de movimientos - Formato contable */}
                {datos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay movimientos en este período
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Fecha</th>
                          {!clienteId && <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Cliente</th>}
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Descripción</th>
                          <th className="px-2 py-2 text-right text-xs font-medium text-red-600">Debe</th>
                          <th className="px-2 py-2 text-right text-xs font-medium text-emerald-600">Haber</th>
                          {clienteId && <th className="px-2 py-2 text-right text-xs font-medium text-gray-600">Saldo</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          let saldoAcumulado = 0
                          return datos.map((mov, index) => {
                            const esFiado = mov.tipo === 'fiado'
                            const debe = esFiado ? parseFloat(mov.monto) : 0
                            const haber = !esFiado ? parseFloat(mov.monto) : 0
                            saldoAcumulado += debe - haber

                            return (
                              <tr key={mov.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-2 py-2 text-xs text-gray-600 whitespace-nowrap">
                                  {formatFecha(mov.fecha)} {formatHora(mov.hora)}
                                </td>
                                {!clienteId && (
                                  <td className="px-2 py-2 text-xs text-gray-900 truncate max-w-[100px]">
                                    {mov.cliente_nombre} {mov.cliente_apellido || ''}
                                  </td>
                                )}
                                <td className="px-2 py-2 text-xs text-gray-600 truncate max-w-[120px]">
                                  {mov.descripcion || mov.metodo_pago || '-'}
                                </td>
                                <td className="px-2 py-2 text-right text-xs font-medium text-red-600">
                                  {debe > 0 ? formatearMonto(debe) : ''}
                                </td>
                                <td className="px-2 py-2 text-right text-xs font-medium text-emerald-600">
                                  {haber > 0 ? formatearMonto(haber) : ''}
                                </td>
                                {clienteId && (
                                  <td className={`px-2 py-2 text-right text-xs font-bold ${saldoAcumulado > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {formatearMonto(saldoAcumulado)}
                                  </td>
                                )}
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Botones de descarga */}
                {datos.length > 0 && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => descargarPDFMovimientosCuenta({
                        datos,
                        nombreNegocio,
                        nombreCliente: nombreClienteSeleccionado,
                        fechaDesde: usarFechas ? fechaDesde : null,
                        fechaHasta: usarFechas ? fechaHasta : null,
                        totalDebe: totalFiados,
                        totalHaber: totalPagos,
                        esClienteIndividual: !!clienteId
                      })}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={() => descargarExcelMovimientosCuenta({
                        datos,
                        nombreNegocio,
                        nombreCliente: nombreClienteSeleccionado,
                        fechaDesde: usarFechas ? fechaDesde : null,
                        fechaHasta: usarFechas ? fechaHasta : null,
                        totalDebe: totalFiados,
                        totalHaber: totalPagos,
                        esClienteIndividual: !!clienteId
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
