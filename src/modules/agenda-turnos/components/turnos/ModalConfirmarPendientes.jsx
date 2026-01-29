/**
 * Modal para confirmar múltiples turnos pendientes
 */

import { useState } from 'react'
import { X, Check, Clock, User, Scissors, MessageCircle, Calendar, AlertCircle, Loader2 } from 'lucide-react'
import { formatFechaCorta, formatDuracion } from '../../utils/dateUtils'
import { formatearHora } from '../../utils/formatters'
import { generarLinkConfirmacion, abrirWhatsApp } from '../../utils/whatsappUtils'
import { useNegocio } from '../../hooks/useNegocio'

export default function ModalConfirmarPendientes({
  isOpen,
  onClose,
  turnosPendientes = [],
  onConfirmarTurno
}) {
  const [turnoConfirmando, setTurnoConfirmando] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  // Obtener datos del negocio para plantillas de WhatsApp
  const { negocio } = useNegocio()

  if (!isOpen) return null

  const handleConfirmarConWhatsApp = async (turno) => {
    setConfirmando(true)
    try {
      const cliente = turno.cliente || turno.agenda_clientes
      const servicios = turno.servicios || turno.agenda_turno_servicios || []
      const serviciosInfo = servicios.map(s => ({
        nombre: s.servicio?.nombre || s.agenda_servicios?.nombre || 'Servicio',
        instrucciones_previas: s.servicio?.instrucciones_previas || s.agenda_servicios?.instrucciones_previas || null,
        requiere_sena: s.servicio?.requiere_sena || s.agenda_servicios?.requiere_sena || false,
        porcentaje_sena: s.servicio?.porcentaje_sena || s.agenda_servicios?.porcentaje_sena || 0,
        precio: s.precio || s.servicio?.precio || 0
      }))

      const link = generarLinkConfirmacion(turno, cliente, serviciosInfo, negocio)
      if (link) {
        abrirWhatsApp(link)
      }

      await onConfirmarTurno?.(turno.id, 'confirmado')
      setTurnoConfirmando(null)
    } catch (error) {
      console.error('Error confirmando turno:', error)
    }
    setConfirmando(false)
  }

  const handleSoloConfirmar = async (turno) => {
    setConfirmando(true)
    try {
      await onConfirmarTurno?.(turno.id, 'confirmado')
      setTurnoConfirmando(null)
    } catch (error) {
      console.error('Error confirmando turno:', error)
    }
    setConfirmando(false)
  }

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
                        const tieneWhatsApp = cliente?.whatsapp || cliente?.telefono

                        return (
                          <div
                            key={turno.id}
                            className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                          >
                            {/* Info del turno */}
                            <div className="p-3">
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-1 h-12 rounded-full flex-shrink-0"
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
                                </div>

                                {/* Botón confirmar */}
                                <button
                                  onClick={() => setTurnoConfirmando(turno)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 flex-shrink-0"
                                >
                                  <Check className="w-4 h-4" />
                                  Confirmar
                                </button>
                              </div>
                            </div>

                            {/* Modal inline de confirmación */}
                            {turnoConfirmando?.id === turno.id && (
                              <div className="border-t bg-white p-3 space-y-2">
                                <p className="text-xs text-gray-500 mb-2">
                                  ¿Cómo querés confirmar?
                                </p>

                                {tieneWhatsApp && (
                                  <button
                                    onClick={() => handleConfirmarConWhatsApp(turno)}
                                    disabled={confirmando}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-left disabled:opacity-50"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      {confirmando ? (
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                      ) : (
                                        <MessageCircle className="w-4 h-4 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Confirmar y enviar WhatsApp</p>
                                    </div>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleSoloConfirmar(turno)}
                                  disabled={confirmando}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                                >
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    {confirmando ? (
                                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Solo confirmar</p>
                                  </div>
                                </button>

                                <button
                                  onClick={() => setTurnoConfirmando(null)}
                                  disabled={confirmando}
                                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-1"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </div>
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
