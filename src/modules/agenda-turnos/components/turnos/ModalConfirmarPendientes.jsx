/**
 * Modal para ver turnos pendientes de confirmar
 * Al tocar un turno, abre el modal de detalle
 */

import { X, Check, Clock, User, Scissors, Calendar, AlertCircle, Store, Car, Video, ChevronRight } from 'lucide-react'
import { formatFechaCorta } from '../../utils/dateUtils'
import { formatearHora } from '../../utils/formatters'

export default function ModalConfirmarPendientes({
  isOpen,
  onClose,
  turnosPendientes = [],
  onVerTurno
}) {
  if (!isOpen) return null

  // Agrupar turnos por fecha
  const turnosPorFecha = turnosPendientes.reduce((acc, turno) => {
    const fecha = turno.fecha
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(turno)
    return acc
  }, {})

  // Ordenar fechas
  const fechasOrdenadas = Object.keys(turnosPorFecha).sort()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  Turnos Pendientes
                </h3>
                <p className="text-amber-100 text-sm">
                  {turnosPendientes.length} turno{turnosPendientes.length !== 1 ? 's' : ''} por confirmar
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {turnosPendientes.length === 0 ? (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No hay turnos pendientes de confirmar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fechasOrdenadas.map(fecha => (
                  <div key={fecha}>
                    {/* Header de fecha */}
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {formatFechaCorta(fecha)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({turnosPorFecha[fecha].length})
                      </span>
                    </div>

                    {/* Lista de turnos de esa fecha */}
                    <div className="space-y-2">
                      {turnosPorFecha[fecha].map(turno => {
                        const cliente = turno.cliente || turno.agenda_clientes
                        const servicios = turno.servicios || turno.agenda_turno_servicios || []
                        const servicioNombre = servicios.map(s =>
                          s.servicio?.nombre || s.agenda_servicios?.nombre || 'Servicio'
                        ).join(', ')
                        const colorServicio = servicios[0]?.servicio?.color || servicios[0]?.agenda_servicios?.color || '#6B7280'

                        // Configuración de modalidad
                        const modalidadConfig = {
                          local: { icon: Store, label: 'En local', color: 'text-blue-600', bgColor: 'bg-blue-100' },
                          domicilio: { icon: Car, label: 'A domicilio', color: 'text-orange-600', bgColor: 'bg-orange-100' },
                          videollamada: { icon: Video, label: 'Videollamada', color: 'text-purple-600', bgColor: 'bg-purple-100' }
                        }
                        const modalidad = modalidadConfig[turno.modalidad] || null
                        const ModalidadIcon = modalidad?.icon

                        return (
                          <button
                            key={turno.id}
                            onClick={() => onVerTurno?.(turno)}
                            className="w-full bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all text-left"
                          >
                            <div className="p-3">
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-1 h-14 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: colorServicio }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="font-medium text-gray-900">
                                      {formatearHora(turno.hora_inicio)} - {formatearHora(turno.hora_fin)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="truncate">
                                      {cliente?.nombre} {cliente?.apellido || ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Scissors className="w-3 h-3" />
                                    <span className="truncate">{servicioNombre}</span>
                                  </div>
                                  {/* Indicador de modalidad */}
                                  {modalidad && ModalidadIcon && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <span className={`flex items-center justify-center w-5 h-5 rounded-full ${modalidad.bgColor}`}>
                                        <ModalidadIcon className={`w-3 h-3 ${modalidad.color}`} />
                                      </span>
                                      <span className={`text-xs font-medium ${modalidad.color}`}>
                                        {modalidad.label}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Flecha para indicar que es clickeable */}
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 flex-shrink-0">
                                  <ChevronRight className="w-5 h-5 text-blue-600" />
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-5 py-4 bg-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
