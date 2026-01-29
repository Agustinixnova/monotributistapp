/**
 * Vista de calendario diario
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Loader2, Zap } from 'lucide-react'
import { formatFechaLarga, getFechaHoyArgentina, sumarDias, restarDias, esHoy, generarSlotsTiempo, diferenciaMinutos } from '../../utils/dateUtils'
import { formatearHora } from '../../utils/formatters'
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

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Header con navegación */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={irAnterior}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={irHoy}
            disabled={esHoyFecha}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              esHoyFecha
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            Hoy
          </button>

          <button
            onClick={irSiguiente}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <h2 className="font-heading font-semibold text-lg text-gray-800 capitalize">
          {formatFechaLarga(fecha)}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTurnoRapido?.(fecha)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Rápido</span>
          </button>
          <button
            onClick={() => onNuevoTurno?.(fecha)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo turno</span>
          </button>
        </div>
      </div>

      {/* Contenido del calendario */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Grid de horas */}
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {slots.map((hora, index) => (
              <div
                key={hora}
                className={`flex border-b border-gray-100 ${index === 0 ? '' : ''}`}
                style={{ minHeight: '80px' }}
              >
                {/* Columna de hora */}
                <div className="w-16 flex-shrink-0 pr-2 pt-1 text-right">
                  <span className="text-xs text-gray-400 font-medium">{hora}</span>
                </div>

                {/* Área de turnos */}
                <div
                  className="flex-1 relative border-l border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => onNuevoTurno?.(fecha, hora)}
                >
                  {/* Turnos que empiezan en esta hora */}
                  {turnosPorHora[hora]?.map((turno, i) => (
                    <div
                      key={turno.id}
                      className="absolute left-1 right-1 z-10"
                      style={{
                        ...calcularEstiloTurno(turno),
                        top: '4px', // Pequeño offset
                        marginLeft: i > 0 ? `${i * 8}px` : '0', // Stack si hay múltiples
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TurnoCard
                        turno={turno}
                        onClick={() => onTurnoClick?.(turno)}
                        onCambiarEstado={onCambiarEstado}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sin turnos */}
        {!loading && turnosActivos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No hay turnos para este día</p>
              <button
                onClick={() => onNuevoTurno?.(fecha)}
                className="mt-3 text-blue-600 hover:text-blue-700 font-medium pointer-events-auto"
              >
                + Agregar turno
              </button>
            </div>
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
            <span className="text-gray-600">
              {turnosActivos.filter(t => t.estado === 'completado').length} completados
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
