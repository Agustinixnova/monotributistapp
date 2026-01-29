/**
 * Vista de calendario semanal
 * - Mobile: Week Strip + Lista del día seleccionado
 * - Desktop: Grid tradicional con drag & drop
 */

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Loader2, Zap, Move, Clock, User, Phone, MessageCircle, Store, Car, Video } from 'lucide-react'
import { formatFechaCorta, getFechaHoyArgentina, sumarDias, restarDias, esHoy, formatDiaSemana, diferenciaMinutos, formatFechaLarga } from '../../utils/dateUtils'
import { useDragDrop } from '../../hooks/useDragDrop'
import { formatearHora, getEstadoConfig, formatearMonto } from '../../utils/formatters'
import { formatDuracion } from '../../utils/dateUtils'
import TurnoCard from '../turnos/TurnoCard'

// Horas del día a mostrar
const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

// Días de la semana abreviados
const DIAS_NOMBRES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

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
  // Estado para el día seleccionado en mobile
  const [diaSeleccionadoMobile, setDiaSeleccionadoMobile] = useState(fechaSeleccionada)

  // Actualizar día seleccionado cuando cambia la fecha
  useEffect(() => {
    if (diasSemana.includes(fechaSeleccionada)) {
      setDiaSeleccionadoMobile(fechaSeleccionada)
    } else if (diasSemana.length > 0) {
      // Si la fecha seleccionada no está en la semana, seleccionar el primer día
      const hoy = getFechaHoyArgentina()
      if (diasSemana.includes(hoy)) {
        setDiaSeleccionadoMobile(hoy)
      } else {
        setDiaSeleccionadoMobile(diasSemana[0])
      }
    }
  }, [fechaSeleccionada, diasSemana])

  // Hook para drag & drop (solo desktop)
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
    // Mínimo 40px para que quepan las 2 líneas de texto
    return Math.max((duracion / 60) * pixelesPorHora, 40)
  }

  // Detectar turnos superpuestos y calcular posiciones
  const calcularPosicionesSuperpuestos = (turnos) => {
    if (!turnos || turnos.length === 0) return {}

    // Convertir hora a minutos para comparar
    const horaAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number)
      return h * 60 + m
    }

    // Ordenar por hora de inicio
    const turnosOrdenados = [...turnos].sort((a, b) =>
      horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio)
    )

    // Encontrar grupos de turnos superpuestos
    const grupos = []
    let grupoActual = []

    turnosOrdenados.forEach((turno) => {
      const inicioTurno = horaAMinutos(turno.hora_inicio)
      const finTurno = horaAMinutos(turno.hora_fin)

      // Verificar si se superpone con alguno del grupo actual
      const seSuperpone = grupoActual.some((t) => {
        const inicioT = horaAMinutos(t.hora_inicio)
        const finT = horaAMinutos(t.hora_fin)
        return inicioTurno < finT && finTurno > inicioT
      })

      if (seSuperpone || grupoActual.length === 0) {
        grupoActual.push(turno)
      } else {
        if (grupoActual.length > 0) grupos.push([...grupoActual])
        grupoActual = [turno]
      }
    })

    if (grupoActual.length > 0) grupos.push(grupoActual)

    // Calcular posiciones para cada turno
    const posiciones = {}
    grupos.forEach((grupo) => {
      const totalEnGrupo = grupo.length
      grupo.forEach((turno, index) => {
        posiciones[turno.id] = {
          width: totalEnGrupo > 1 ? `${100 / totalEnGrupo}%` : '100%',
          left: totalEnGrupo > 1 ? `${(index * 100) / totalEnGrupo}%` : '0%',
          zIndex: 5 + index
        }
      })
    })

    return posiciones
  }

  // Total de turnos de la semana
  const totalTurnos = Object.values(turnosPorDia).flat().length

  // Turnos del día seleccionado (mobile)
  const turnosDiaSeleccionado = turnosPorDia[diaSeleccionadoMobile] || []

  // Ordenar turnos por hora
  const turnosOrdenados = [...turnosDiaSeleccionado].sort((a, b) =>
    a.hora_inicio.localeCompare(b.hora_inicio)
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* ========== HEADER COMPARTIDO ========== */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Navegación */}
          <div className="flex items-center gap-1">
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
          </div>

          {/* Info - solo desktop */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {formatFechaCorta(diasSemana[0])} - {formatFechaCorta(diasSemana[6])}
            </span>
            <span className="text-sm text-gray-500">
              {totalTurnos} turno{totalTurnos !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTurnoRapido?.(diaSeleccionadoMobile || hoy)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Rápido</span>
            </button>
            <button
              onClick={() => onNuevoTurno?.(diaSeleccionadoMobile || fechaSeleccionada)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========== VISTA MOBILE: Week Strip + Lista ========== */}
      <div className="md:hidden">
        {/* Week Strip */}
        <div className="border-b bg-white">
          <div className="flex">
            {diasSemana.map((dia) => {
              const esHoyDia = esHoy(dia)
              const esSeleccionado = dia === diaSeleccionadoMobile
              const turnosDia = turnosPorDia[dia] || []
              const tieneTurnos = turnosDia.length > 0
              const fecha = new Date(dia + 'T12:00:00')
              const diaSemana = DIAS_NOMBRES[fecha.getDay()]
              const numeroDia = fecha.getDate()

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSeleccionadoMobile(dia)}
                  className={`flex-1 py-3 px-1 text-center transition-all relative ${
                    esSeleccionado
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Nombre del día */}
                  <div className={`text-[10px] font-medium uppercase ${
                    esHoyDia ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {diaSemana}
                  </div>

                  {/* Número del día */}
                  <div className={`text-lg font-bold mt-0.5 ${
                    esSeleccionado
                      ? 'text-blue-600'
                      : esHoyDia
                        ? 'text-blue-600'
                        : 'text-gray-900'
                  }`}>
                    {numeroDia}
                  </div>

                  {/* Indicador de turnos */}
                  {tieneTurnos && (
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                      esSeleccionado ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  )}

                  {/* Línea de selección */}
                  {esSeleccionado && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Título del día seleccionado */}
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 capitalize">
              {formatFechaLarga(diaSeleccionadoMobile)}
            </h3>
            <span className="text-sm text-gray-500">
              {turnosDiaSeleccionado.length} turno{turnosDiaSeleccionado.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Lista de turnos del día */}
        <div className="divide-y divide-gray-100 max-h-[calc(100vh-380px)] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : turnosOrdenados.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No hay turnos para este día</p>
              <button
                onClick={() => onNuevoTurno?.(diaSeleccionadoMobile)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                + Agregar turno
              </button>
            </div>
          ) : (
            turnosOrdenados.map((turno) => {
              const estadoConfig = getEstadoConfig(turno.estado)
              const primerServicio = turno.servicios?.[0]?.servicio
              const colorServicio = primerServicio?.color || '#3B82F6'
              const serviciosNombres = turno.servicios?.map(s => s.servicio?.nombre).filter(Boolean).join(', ') || 'Sin servicio'
              const clienteNombre = turno.cliente
                ? `${turno.cliente.nombre} ${turno.cliente.apellido || ''}`.trim()
                : 'Cliente no asignado'
              const duracion = diferenciaMinutos(turno.hora_inicio, turno.hora_fin)
              const esCancelado = turno.estado === 'cancelado' || turno.estado === 'no_asistio'

              return (
                <div
                  key={turno.id}
                  onClick={() => onTurnoClick?.(turno)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    esCancelado ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Barra de color del servicio */}
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
                          {/* Indicador de modalidad */}
                          {turno.modalidad && (
                            <span
                              className={`flex items-center justify-center w-7 h-7 rounded-full ${
                                turno.modalidad === 'local' ? 'bg-blue-100' :
                                turno.modalidad === 'domicilio' ? 'bg-orange-100' :
                                'bg-purple-100'
                              }`}
                              title={
                                turno.modalidad === 'local' ? 'En local' :
                                turno.modalidad === 'domicilio' ? 'A domicilio' :
                                'Videollamada'
                              }
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
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ========== VISTA DESKTOP: Grid tradicional ========== */}
      <div className="hidden md:block relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Contenedor scrolleable que incluye header y body */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {/* Header de días - sticky dentro del scroll */}
          <div
            className="grid border-b sticky top-0 bg-white z-10"
            style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
          >
            <div className="w-14" />
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
          <div className="relative">
            {/* Líneas de hora */}
            {HORAS.map((hora) => (
              <div
                key={hora}
                className="grid border-b border-gray-100"
                style={{ height: '60px', gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
              >
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
              <div className="grid h-full" style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}>
                <div className="w-14" />
                {diasSemana.map((dia) => {
                  // Filtrar turnos cancelados y no asistidos del calendario
                  const turnosDia = (turnosPorDia[dia] || []).filter(t =>
                    !['cancelado', 'no_asistio'].includes(t.estado)
                  )
                  // Calcular posiciones para turnos superpuestos
                  const posiciones = calcularPosicionesSuperpuestos(turnosDia)

                  return (
                    <div key={dia} className="relative border-l">
                      {turnosDia.map((turno) => {
                        const top = calcularTopTurno(turno.hora_inicio)
                        const height = calcularAlturaTurno(turno.hora_inicio, turno.hora_fin)
                        const estaArrastrandose = dragging?.turnoId === turno.id
                        const pos = posiciones[turno.id] || { width: '100%', left: '0%', zIndex: 5 }

                        return (
                          <div
                            key={turno.id}
                            draggable={!['completado', 'cancelado'].includes(turno.estado)}
                            onDragStart={(e) => handlers.onDragStart(e, turno)}
                            onDragEnd={handlers.onDragEnd}
                            className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing px-0.5 overflow-hidden ${
                              estaArrastrandose ? 'opacity-50 ring-2 ring-blue-400' : ''
                            }`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              width: pos.width,
                              left: pos.left,
                              zIndex: estaArrastrandose ? 100 : pos.zIndex
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isDragging) onTurnoClick?.(turno)
                            }}
                          >
                            <TurnoCard
                              turno={turno}
                              compacto={true}
                              onClick={() => !isDragging && onTurnoClick?.(turno)}
                              onCambiarEstado={onCambiarEstado}
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

      {/* ========== RESUMEN DE LA SEMANA ========== */}
      {(() => {
        // Excluir cancelados y no asistidos del conteo
        const turnosActivos = Object.values(turnosPorDia).flat().filter(t =>
          !['cancelado', 'no_asistio'].includes(t.estado)
        )
        const totalActivos = turnosActivos.length
        return totalActivos > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {totalActivos} turno{totalActivos !== 1 ? 's' : ''} esta semana
              </span>
              <div className="flex gap-3 text-xs">
                <span className="text-yellow-600">
                  {turnosActivos.filter(t => t.estado === 'pendiente').length} pendientes
                </span>
                <span className="text-green-600">
                  {turnosActivos.filter(t => t.estado === 'confirmado').length} confirmados
                </span>
                <span className="hidden sm:inline text-gray-600">
                  {turnosActivos.filter(t => t.estado === 'completado').length} completados
                </span>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
