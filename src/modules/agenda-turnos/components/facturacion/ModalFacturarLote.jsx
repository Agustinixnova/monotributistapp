/**
 * Modal de confirmación para facturar lote
 * Muestra resumen de qué se va a facturar
 */

import { X, Receipt, Users, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { formatearMonto } from '../../utils/formatters'

export default function ModalFacturarLote({
  isOpen,
  onClose,
  onConfirmar,
  turnos,
  facturando
}) {
  if (!isOpen) return null

  // Agrupar turnos por tipo de facturación
  const conCuit = turnos.filter(t => t.cliente?.cuit && t.cliente.cuit.length === 11)
  const sinCuit = turnos.filter(t => !t.cliente?.cuit || t.cliente.cuit.length !== 11)

  // Agrupar los que tienen CUIT por cliente
  const gruposPorCliente = {}
  conCuit.forEach(turno => {
    const cuit = turno.cliente.cuit
    if (!gruposPorCliente[cuit]) {
      gruposPorCliente[cuit] = {
        cliente: turno.nombreCliente,
        cuit: cuit,
        turnos: []
      }
    }
    gruposPorCliente[cuit].turnos.push(turno)
  })

  const gruposArray = Object.values(gruposPorCliente)

  // Calcular totales
  const totalMonto = turnos.reduce((sum, t) => sum + t.totalPagos, 0)
  const cantidadFacturas = gruposArray.length + sinCuit.length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  Confirmar facturación
                </h3>
                <p className="text-blue-100 text-sm">
                  {turnos.length} turno{turnos.length !== 1 ? 's' : ''} seleccionado{turnos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={facturando}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Resumen */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-blue-600 font-medium">Total a facturar</span>
                <span className="text-xl font-bold text-blue-700">
                  {formatearMonto(totalMonto)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-blue-600">
                <span>Se generarán</span>
                <span className="font-medium">{cantidadFacturas} factura{cantidadFacturas !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Explicación de agrupación */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Lógica de facturación por lote</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Clientes <strong>con CUIT</strong>: se agrupan sus turnos en 1 sola factura</li>
                    <li>Clientes <strong>sin CUIT</strong>: 1 factura individual por cada turno (Consumidor Final)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Detalle de facturación */}
            <div className="space-y-3">
              {/* Facturas agrupadas (con CUIT) */}
              {gruposArray.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Facturas agrupadas por cliente ({gruposArray.length})
                  </h4>
                  <div className="space-y-2">
                    {gruposArray.map(grupo => (
                      <div key={grupo.cuit} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{grupo.cliente}</p>
                            <p className="text-xs text-gray-500">
                              CUIT: {grupo.cuit.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3')} • {grupo.turnos.length} turno{grupo.turnos.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {formatearMonto(grupo.turnos.reduce((sum, t) => sum + t.totalPagos, 0))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facturas individuales (Consumidor Final) */}
              {sinCuit.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Facturas individuales - Consumidor Final ({sinCuit.length})
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {sinCuit.map(turno => (
                      <div key={turno.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-900">{turno.nombreCliente}</p>
                            <p className="text-xs text-gray-500">
                              {turno.serviciosNombres}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">
                            {formatearMonto(turno.totalPagos)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={facturando}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={facturando}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {facturando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Facturando...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  Facturar todo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
