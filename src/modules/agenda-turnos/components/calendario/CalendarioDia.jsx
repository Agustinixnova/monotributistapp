/**
 * Vista de calendario diario
 * - Mobile: Lista de turnos (sin horas vacías)
 * - Desktop: Grid tradicional con horas
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Loader2, Zap, Clock, Store, Car, Video } from 'lucide-react'
import { formatFechaLarga, getFechaHoyArgentina, sumarDias, restarDias, esHoy, generarSlotsTiempo, diferenciaMinutos, formatDuracion } from '../../utils/dateUtils'
import { formatearHora, getEstadoConfig } from '../../utils/formatters'
import TurnoCard from '../turnos/TurnoCard'

export default function CalendarioDia({
  fecha,
  onFechaChange,
  turnos = [],
  loading = false,
  onTurnoClick,
  onNuevoTurno,
  onTurnoRapido,
  onCambiarEstado,
  horaInicio = '08:00',
  horaFin = '20:00'
}) {
  const esHoyFecha = esHoy(fecha)

  // Generar slots de hora
  const slots = generarSlotsTiempo(horaInicio, horaFin, 60) // Cada hora

  // Filtrar turnos cancelados y no asistidos
  const turnosActivos = turnos.filter(t =>
    !['cancelado', 'no_asistio'].includes(t.estado)
  )

  // Agrupar turnos por hora de inicio (para posicionamiento)
  const turnosPorHora = {}
  turnosActivos.forEach(turno => {
    const hora = turno.hora_inicio?.substring(0, 2) + ':00'
    if (!turnosPorHora[hora]) {
      turnosPorHora[hora] = []
    }
    turnosPorHora[hora].push(turno)
  })

  // Navegar días
  const irHoy = () => onFechaChange(getFechaHoyArgentina())
  const irAnterior = () => onFechaChange(restarDias(fecha, 1))
  const irSiguiente = () => onFechaChange(sumarDias(fecha, 1))

  // Calcular posición y altura de un turno
  const calcularEstiloTurno = (turno) => {
    const [horaI, minI] = turno.hora_inicio.split(':').map(Number)
    const [horaF, minF] = turno.hora_fin.split(':').map(Number)

    const [horaBase] = horaInicio.split(':').map(Number)

    // Posición desde arriba (cada hora = 80px)
    const minutosDesdeInicio = (horaI - horaBase) * 60 + minI
    const top = (minutosDesdeInicio / 60) * 80

    // Altura basada en duración
    const duracion = diferenciaMinutos(turno.hora_inicio, turno.hora_fin)
    const height = (duracion / 60) * 80

    return {
      top: `${top}px`,
      height: `${Math.max(height, 40)}px`, // Mínimo 40px
    }
  }

  // Ordenar turnos por hora para mobile
  const turnosOrdenados = [...turnosActivos].sort((a, b) =>
    a.hora_inicio.localeCompare(b.hora_inicio)
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header con navegación */}
      <div className="px-3 sm:px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between gap-2">
          {/* Navegación */}
          <div className="flex items-center gap-1">
            <button
              onClick={irAnterior}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={irHoy}
              disabled={esHoyFecha}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                esHoyFecha
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              Hoy
            </button>

            <button
              onClick={irSiguiente}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTurnoRapido?.(fecha)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Rápido</span>
            </button>
            <button
              onClick={() => onNuevoTurno?.(fecha)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Título del día */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-gray-800 capitalize">
            {formatFechaLarga(fecha)}
          </h2>
          <span className="text-sm text-gray-500">
            {turnosActivos.length} turno{turnosActivos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ========== VISTA LISTA (Mobile y Desktop) ========== */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : turnosOrdenados.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No hay turnos para este día</p>
            <button
              onClick={() => onNuevoTurno?.(fecha)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              + Agregar turno
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {turnosOrdenados.map((turno) => {
              const estadoConfig = getEstadoConfig(turno.estado)
              const primerServicio = turno.servicios?.[0]?.servicio
              const colorServicio = primerServicio?.color || '#3B82F6'
              const clienteNombre = turno.cliente
                ? `${turno.cliente.nombre} ${turno.cliente.apellido || ''}`.trim()
                : 'Cliente no asignado'
              const duracion = diferenciaMinutos(turno.hora_inicio, turno.hora_fin)
              const esCancelado = turno.estado === 'cancelado' || turno.estado === 'no_asistio'

              // Calcular total del turno
              const totalTurno = turno.servicios?.reduce((sum, s) => sum + (s.precio || 0), 0) || 0

              return (
                <div
                  key={turno.id}
                  onClick={() => onTurnoClick?.(turno)}
                  className={`p-4 md:p-5 hover:bg-gray-50 cursor-pointer transition-colors ${
                    esCancelado ? 'opacity-60' : ''
                  }`}
                >
                  {/* Layout mobile: vertical */}
                  <div className="md:hidden flex gap-3">
                    {/* Barra de color */}
                    <div
                      className="w-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colorServicio }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Hora, modalidad y estado */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {formatearHora(turno.hora_inicio)} - {formatearHora(turno.hora_fin)}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({formatDuracion(duracion)})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {turno.modalidad && (
                            <span
                              className={`flex items-center justify-center w-7 h-7 rounded-full ${
                                turno.modalidad === 'local' ? 'bg-blue-100' :
                                turno.modalidad === 'domicilio' ? 'bg-orange-100' :
                                'bg-purple-100'
                              }`}
                            >
                              {turno.modalidad === 'local' && <Store className="w-4 h-4 text-blue-600" />}
                              {turno.modalidad === 'domicilio' && <Car className="w-4 h-4 text-orange-600" />}
                              {turno.modalidad === 'videollamada' && <Video className="w-4 h-4 text-purple-600" />}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${estadoConfig.bgClass} ${estadoConfig.textClass}`}>
                            {estadoConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                          style={{ backgroundColor: colorServicio }}
                        >
                          {turno.cliente?.nombre?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{clienteNombre}</p>
                          {turno.cliente?.whatsapp && (
                            <p className="text-xs text-gray-500">{turno.cliente.whatsapp}</p>
                          )}
                        </div>
                      </div>

                      {/* Servicios */}
                      <div className="flex flex-wrap gap-1">
                        {turno.servicios?.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${s.servicio?.color || colorServicio}20`,
                              color: s.servicio?.color || colorServicio
                            }}
                          >
                            {s.servicio?.nombre}
                          </span>
                        ))}
                      </div>

                      {/* Notas */}
                      {turno.notas && (
                        <p className="text-xs text-gray-500 italic mt-2 truncate">{turno.notas}</p>
                      )}
                    </div>
                  </div>

                  {/* Layout desktop: horizontal con más info */}
                  <div className="hidden md:flex items-center gap-4">
                    {/* Hora grande */}
                    <div className="w-28 flex-shrink-0 text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {formatearHora(turno.hora_inicio)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatearHora(turno.hora_fin)} · {formatDuracion(duracion)}
                      </div>
                    </div>

                    {/* Barra de color vertical */}
                    <div
                      className="w-1.5 h-16 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colorServicio }}
                    />

                    {/* Info del cliente */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                          style={{ backgroundColor: colorServicio }}
                        >
                          {turno.cliente?.nombre?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-base">{clienteNombre}</p>
                          {turno.cliente?.whatsapp && (
                            <p className="text-sm text-gray-500">{turno.cliente.whatsapp}</p>
                          )}
                        </div>
                      </div>

                      {/* Servicios en desktop */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {turno.servicios?.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: `${s.servicio?.color || colorServicio}15`,
                              color: s.servicio?.color || colorServicio
                            }}
                          >
                            {s.servicio?.nombre}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Modalidad */}
                    <div className="flex-shrink-0">
                      {turno.modalidad && (
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                            turno.modalidad === 'local' ? 'bg-blue-50 text-blue-700' :
                            turno.modalidad === 'domicilio' ? 'bg-orange-50 text-orange-700' :
                            'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {turno.modalidad === 'local' && <Store className="w-4 h-4" />}
                          {turno.modalidad === 'domicilio' && <Car className="w-4 h-4" />}
                          {turno.modalidad === 'videollamada' && <Video className="w-4 h-4" />}
                          <span className="hidden lg:inline">
                            {turno.modalidad === 'local' ? 'En local' :
                             turno.modalidad === 'domicilio' ? 'A domicilio' : 'Videollamada'}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Precio */}
                    {totalTurno > 0 && (
                      <div className="w-24 flex-shrink-0 text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${totalTurno.toLocaleString('es-AR')}
                        </div>
                      </div>
                    )}

                    {/* Estado */}
                    <div className="w-28 flex-shrink-0 text-right">
                      <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${estadoConfig.bgClass} ${estadoConfig.textClass}`}>
                        {estadoConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Resumen del día */}
      {turnosActivos.length > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {turnosActivos.length} turno{turnosActivos.length !== 1 ? 's' : ''} programado{turnosActivos.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-3 text-xs">
            <span className="text-yellow-600">
              {turnosActivos.filter(t => t.estado === 'pendiente').length} pendientes
            </span>
            <span className="text-green-600">
              {turnosActivos.filter(t => t.estado === 'confirmado').length} confirmados
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
