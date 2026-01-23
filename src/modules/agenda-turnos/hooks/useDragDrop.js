/**
 * Hook para drag & drop de turnos en calendario
 */

import { useState, useCallback } from 'react'

export function useDragDrop({ onMoverTurno }) {
  const [dragging, setDragging] = useState(null) // { turnoId, turno }
  const [dragOver, setDragOver] = useState(null) // { fecha, hora }

  const handleDragStart = useCallback((e, turno) => {
    setDragging({ turnoId: turno.id, turno })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', turno.id)

    // Agregar clase visual al elemento arrastrado
    setTimeout(() => {
      e.target.classList.add('opacity-50')
    }, 0)
  }, [])

  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove('opacity-50')
    setDragging(null)
    setDragOver(null)
  }, [])

  const handleDragOver = useCallback((e, fecha, hora) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver({ fecha, hora })
  }, [])

  const handleDragLeave = useCallback((e) => {
    // Solo limpiar si realmente salimos del área
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(null)
    }
  }, [])

  const handleDrop = useCallback(async (e, fecha, hora) => {
    e.preventDefault()

    if (!dragging) return

    const { turno } = dragging

    // No hacer nada si se suelta en la misma posición
    if (turno.fecha === fecha && turno.hora_inicio.substring(0, 5) === hora) {
      setDragging(null)
      setDragOver(null)
      return
    }

    // Calcular nueva hora_fin basada en duración original
    const [horaInicio, minInicio] = hora.split(':').map(Number)
    const [horaFinOriginal, minFinOriginal] = turno.hora_fin.split(':').map(Number)
    const [horaInicioOriginal, minInicioOriginal] = turno.hora_inicio.split(':').map(Number)

    const duracionMinutos =
      (horaFinOriginal * 60 + minFinOriginal) -
      (horaInicioOriginal * 60 + minInicioOriginal)

    const nuevoFinMinutos = horaInicio * 60 + minInicio + duracionMinutos
    const nuevaHoraFin = `${String(Math.floor(nuevoFinMinutos / 60)).padStart(2, '0')}:${String(nuevoFinMinutos % 60).padStart(2, '0')}`

    // Llamar al callback para actualizar
    await onMoverTurno?.(turno.id, {
      fecha,
      hora_inicio: `${hora}:00`,
      hora_fin: `${nuevaHoraFin}:00`
    })

    setDragging(null)
    setDragOver(null)
  }, [dragging, onMoverTurno])

  return {
    dragging,
    dragOver,
    isDragging: !!dragging,
    isDragOver: (fecha, hora) => dragOver?.fecha === fecha && dragOver?.hora === hora,
    handlers: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  }
}

export default useDragDrop
