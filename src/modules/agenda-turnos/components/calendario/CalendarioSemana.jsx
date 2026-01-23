/**
 * Vista de calendario semanal con drag & drop
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Loader2, Zap, Move } from 'lucide-react'
import { formatFechaCorta, getFechaHoyArgentina, sumarDias, restarDias, esHoy, formatDiaSemana, diferenciaMinutos, getPrimerDiaSemana } from '../../utils/dateUtils'
import { useDragDrop } from '../../hooks/useDragDrop'
import TurnoCard from '../turnos/TurnoCard'

// Horas del día a mostrar (cada 30 min para más precisión en drop)
const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
const SLOTS_HORA = ['00', '30'] // Slots dentro de cada hora

export default function CalendarioSemana({
  fechaInicio,
  fechaSeleccionada,
  onFechaChange,
  turnosPorDia = {},
  diasSemana = [],
  loading = false,
  onTurnoClick,
  onNuevoTurno,
  onTurnoRapido,
  onDiaClick,
  onCambiarEstado,
  onMoverTurno
}) {
  // Hook para drag & drop
  const { dragging, isDragging, isDragOver, handlers } = useDragDrop({ onMoverTurno })
  const hoy = getFechaHoyArgentina()

  // Navegar semanas
  const irSemanaAnterior = () => {
    const nuevaFecha = restarDias(fechaInicio, 7)
    onFechaChange(nuevaFecha)
  }

  const irSemanaSiguiente = () => {
    const nuevaFecha = sumarDias(fechaInicio, 7)
    onFechaChange(nuevaFecha)
  }

  const irHoy = () => {
    onFechaChange(getFechaHoyArgentina())
  }

  // Verificar si la semana actual contiene hoy
  const semanaContieneHoy = diasSemana.includes(hoy)

  // Calcular posición vertical de un turno
  const calcularTopTurno = (horaInicio) => {
    const [hora, min] = horaInicio.split(':').map(Number)
    const horaBase = 8 // 08:00
    const pixelesPorHora = 60
    return ((hora - horaBase) * pixelesPorHora) + (min / 60 * pixelesPorHora)
  }

  // Calcular altura de un turno
  const calcularAlturaTurno = (horaInicio, horaFin) => {
    const duracion = diferenciaMinutos(horaInicio, horaFin)
    const pixelesPorHora = 60
    return Math.max((duracion / 60) * pixelesPorHora, 30) // Mínimo 30px
  }

  // Total de turnos de la semana
  const totalTurnos = Object.values(turnosPorDia).flat().length

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header con navegación */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={irSemanaAnterior}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={irHoy}
            disabled={semanaContieneHoy}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              semanaContieneHoy
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            Hoy
          </button>

          <button
            onClick={irSemanaSiguiente}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          <span className="ml-2 text-sm text-gray-600">
            {formatFechaCorta(diasSemana[0])} - {formatFechaCorta(diasSemana[6])}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {totalTurnos} turno{totalTurnos !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => onTurnoRapido?.(hoy)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Rápido</span>
          </button>
          <button
            onClick={() => onNuevoTurno?.(fechaSeleccionada)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Header de días */}
        <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
          <div className="w-14 flex-shrink-0" /> {/* Espacio para horas */}
          {diasSemana.map((dia) => {
            const esHoyDia = esHoy(dia)
            const turnosDia = turnosPorDia[dia] || []

            return (
              <div
                key={dia}
                onClick={() => onDiaClick?.(dia)}
                className={`p-2 text-center border-l cursor-pointer hover:bg-gray-50 transition-colors ${
                  esHoyDia ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`text-xs uppercase font-medium ${esHoyDia ? 'text-blue-600' : 'text-gray-500'}`}>
                  {formatDiaSemana(dia)}
                </div>
                <div className={`text-lg font-bold ${esHoyDia ? 'text-blue-600' : 'text-gray-900'}`}>
                  {new Date(dia + 'T12:00:00').getDate()}
                </div>
                {turnosDia.length > 0 && (
                  <div className="text-xs text-gray-400">
                    {turnosDia.length} turno{turnosDia.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Grid de horas y turnos */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <div className="relative">
            {/* Líneas de hora */}
            {HORAS.map((hora, index) => (
              <div key={hora} className="grid grid-cols-8 border-b border-gray-100" style={{ height: '60px' }}>
                <div className="w-14 pr-2 pt-0 text-right">
                  <span className="text-xs text-gray-400 font-medium -mt-2 block">{hora}</span>
                </div>
                {diasSemana.map((dia) => {
                  const esHoyDia = esHoy(dia)
                  const dropActivo = isDragOver(dia, hora)

                  return (
                    <div
                      key={`${dia}-${hora}`}
                      onClick={() => !isDragging && onNuevoTurno?.(dia, hora)}
                      onDragOver={(e) => handlers.onDragOver(e, dia, hora)}
                      onDragLeave={handlers.onDragLeave}
                      onDrop={(e) => handlers.onDrop(e, dia, hora)}
                      className={`border-l transition-colors ${
                        dropActivo
                          ? 'bg-blue-100 border-blue-400 border-2'
                          : esHoyDia
                            ? 'bg-blue-50/30 hover:bg-gray-50'
                            : 'hover:bg-gray-50'
                      } ${isDragging ? 'cursor-move' : 'cursor-pointer'}`}
                    />
                  )
                })}
              </div>
            ))}

            {/* Turnos posicionados absolutamente */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="grid grid-cols-8 h-full">
                <div className="w-14" /> {/* Espacio para horas */}
                {diasSemana.map((dia) => {
                  const turnosDia = turnosPorDia[dia] || []

                  return (
                    <div key={dia} className="relative border-l">
                      {turnosDia.map((turno, index) => {
                        const top = calcularTopTurno(turno.hora_inicio)
                        const height = calcularAlturaTurno(turno.hora_inicio, turno.hora_fin)
                        const estaArrastrandose = dragging?.turnoId === turno.id

                        return (
                          <div
                            key={turno.id}
                            draggable={!['completado', 'cancelado'].includes(turno.estado)}
                            onDragStart={(e) => handlers.onDragStart(e, turno)}
                            onDragEnd={handlers.onDragEnd}
                            className={`absolute left-0.5 right-0.5 pointer-events-auto cursor-grab active:cursor-grabbing ${
                              estaArrastrandose ? 'opacity-50 ring-2 ring-blue-400' : ''
                            }`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              zIndex: estaArrastrandose ? 100 : 5 + index
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isDragging) onTurnoClick?.(turno)
                            }}
                          >
                            <TurnoCard
                              turno={turno}
                              compact={true}
                              onClick={() => !isDragging && onTurnoClick?.(turno)}
                              onCambiarEstado={onCambiarEstado}
                              draggable={!['completado', 'cancelado'].includes(turno.estado)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de drag activo */}
        {isDragging && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
            <Move className="w-4 h-4" />
            <span className="text-sm font-medium">Soltá en el nuevo horario</span>
          </div>
        )}
      </div>

      {/* Resumen de la semana */}
      {totalTurnos > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {totalTurnos} turno{totalTurnos !== 1 ? 's' : ''} esta semana
          </span>
          <div className="flex gap-3 text-xs">
            <span className="text-yellow-600">
              {Object.values(turnosPorDia).flat().filter(t => t.estado === 'pendiente').length} pendientes
            </span>
            <span className="text-green-600">
              {Object.values(turnosPorDia).flat().filter(t => t.estado === 'confirmado').length} confirmados
            </span>
            <span className="text-gray-600">
              {Object.values(turnosPorDia).flat().filter(t => t.estado === 'completado').length} completados
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
