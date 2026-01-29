/**
 * Sección de Pagos para facturación
 * Muestra una tabla con los turnos de una categoría
 */

import { useState } from 'react'
import {
  Check, CheckCircle, Circle, FileText, Eye, MoreVertical,
  ChevronDown, ChevronUp, Receipt, Loader2, FileX2
} from 'lucide-react'
import { formatearMonto } from '../../utils/formatters'
import { formatFechaCorta } from '../../utils/dateUtils'
import { formatearNumeroComprobante } from '../../services/afipService'

export default function SeccionPagos({
  titulo,
  subtitulo,
  icono: Icono,
  colorIcono,
  bgIcono,
  turnos,
  seleccionados,
  onToggleSeleccion,
  onSeleccionarTodos,
  onDeseleccionarTodos,
  todosSeleccionados,
  totales,
  onFacturar,
  onVerFactura,
  onEmitirNotaCredito,
  facturando,
  puedeFacturar
}) {
  const [expandido, setExpandido] = useState(true)

  if (turnos.length === 0) {
    return null
  }

  const turnosSinFacturar = turnos.filter(t => !t.estaFacturado)
  const algunoSeleccionado = turnosSinFacturar.some(t => seleccionados.includes(t.id))

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header de sección */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${bgIcono} flex items-center justify-center`}>
            <Icono className={`w-5 h-5 ${colorIcono}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{titulo}</h3>
            <p className="text-xs text-gray-500">{subtitulo}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Resumen */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">
              {formatearMonto(totales.total)}
            </p>
            <p className="text-xs text-gray-500">
              {turnos.length} turno{turnos.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Badges de estado */}
          <div className="flex items-center gap-2">
            {totales.sinFacturar > 0 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                Pendiente: {formatearMonto(totales.sinFacturar)}
              </span>
            )}
            {totales.facturado > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hidden sm:inline-flex">
                Facturado: {formatearMonto(totales.facturado)}
              </span>
            )}
          </div>

          {expandido ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Tabla de turnos */}
      {expandido && (
        <div className="border-t border-gray-200">
          {/* Checkbox seleccionar todos (solo si puede facturar) */}
          {puedeFacturar && turnosSinFacturar.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  todosSeleccionados ? onDeseleccionarTodos() : onSeleccionarTodos()
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {todosSeleccionados ? (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                ) : algunoSeleccionado ? (
                  <div className="w-4 h-4 rounded border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-white" />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                {todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
          )}

          {/* Lista de turnos */}
          <div className="divide-y divide-gray-100">
            {turnos.map(turno => (
              <div
                key={turno.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  turno.estadoFacturacion === 'facturado' ? 'bg-green-50/50' :
                  turno.estadoFacturacion === 'anulado' ? 'bg-red-50/30' : ''
                }`}
              >
                {/* Layout Desktop */}
                <div className="hidden sm:flex items-center gap-3">
                  {/* Checkbox (solo si puede facturar) */}
                  {puedeFacturar && (
                    <div className="flex-shrink-0">
                      {turno.estadoFacturacion === 'facturado' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <button
                          onClick={() => onToggleSeleccion(turno.id)}
                          className="p-0.5"
                        >
                          {seleccionados.includes(turno.id) ? (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Datos del turno - Desktop */}
                  <div className="flex-1 min-w-0 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatFechaCorta(turno.fecha)}
                      </p>
                      <p className="text-xs text-gray-500">{turno.hora_inicio?.substring(0, 5)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 truncate">{turno.nombreCliente}</p>
                      {turno.cliente?.cuit && turno.cliente.cuit.length === 11 && (
                        <p className="text-xs text-gray-500">
                          CUIT: {turno.cliente.cuit.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3')}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 truncate">{turno.serviciosNombres}</p>
                      <p className="text-xs text-gray-400">{turno.metodoPago}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatearMonto(turno.totalPagos)}
                      </p>
                    </div>
                  </div>

                  {/* Estado y acciones - Desktop */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {turno.estadoFacturacion === 'anulado' ? (
                      <>
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          N/C Anulado
                        </span>
                        <button
                          onClick={() => onVerFactura && onVerFactura(turno)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver facturación"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {puedeFacturar && (
                          <button
                            onClick={() => onFacturar(turno)}
                            disabled={facturando}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Facturar nuevamente"
                          >
                            {facturando ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Receipt className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </>
                    ) : turno.estadoFacturacion === 'facturado' ? (
                      <>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Facturado
                        </span>
                        <button
                          onClick={() => onVerFactura && onVerFactura(turno)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver facturación"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEmitirNotaCredito && onEmitirNotaCredito(turno)}
                          disabled={facturando}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Emitir Nota de Crédito"
                        >
                          <FileX2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : puedeFacturar ? (
                      <>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          Sin facturar
                        </span>
                        <button
                          onClick={() => onFacturar(turno)}
                          disabled={facturando}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Facturar"
                        >
                          {facturando ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Receipt className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                        No facturable
                      </span>
                    )}
                  </div>
                </div>

                {/* Layout Mobile */}
                <div className="sm:hidden space-y-3">
                  {/* Fila 1: Checkbox + Cliente + Monto */}
                  <div className="flex items-start gap-3">
                    {puedeFacturar && (
                      <div className="flex-shrink-0 pt-0.5">
                        {turno.estadoFacturacion === 'facturado' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <button
                            onClick={() => onToggleSeleccion(turno.id)}
                            className="p-0.5"
                          >
                            {seleccionados.includes(turno.id) ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{turno.nombreCliente}</p>
                      <p className="text-xs text-gray-500">{turno.serviciosNombres}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {formatearMonto(turno.totalPagos)}
                      </p>
                      <p className="text-xs text-gray-400">{turno.metodoPago}</p>
                    </div>
                  </div>

                  {/* Fila 2: Fecha/Hora + Estado + Acciones */}
                  <div className="flex items-center justify-between pl-8">
                    <p className="text-xs text-gray-500">
                      {formatFechaCorta(turno.fecha)} · {turno.hora_inicio?.substring(0, 5)}
                    </p>
                    <div className="flex items-center gap-1">
                      {turno.estadoFacturacion === 'anulado' ? (
                        <>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            N/C Anulado
                          </span>
                          <button
                            onClick={() => onVerFactura && onVerFactura(turno)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {puedeFacturar && (
                            <button
                              onClick={() => onFacturar(turno)}
                              disabled={facturando}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50"
                            >
                              {facturando ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Receipt className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </>
                      ) : turno.estadoFacturacion === 'facturado' ? (
                        <>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Facturado
                          </span>
                          <button
                            onClick={() => onVerFactura && onVerFactura(turno)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEmitirNotaCredito && onEmitirNotaCredito(turno)}
                            disabled={facturando}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-50"
                          >
                            <FileX2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : puedeFacturar ? (
                        <>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            Sin facturar
                          </span>
                          <button
                            onClick={() => onFacturar(turno)}
                            disabled={facturando}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50"
                          >
                            {facturando ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Receipt className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                          No facturable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer con totales */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total {titulo.toLowerCase()}:
            </span>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-gray-900">
                {formatearMonto(totales.total)}
              </span>
              {totales.sinFacturar > 0 && (
                <span className="text-amber-600">
                  Sin facturar: {formatearMonto(totales.sinFacturar)}
                </span>
              )}
              {totales.facturado > 0 && (
                <span className="text-green-600">
                  Facturado: {formatearMonto(totales.facturado)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
