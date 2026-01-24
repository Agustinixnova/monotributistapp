/**
 * Hook para gestión de turnos de agenda
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getTurnos,
  getTurnosDia,
  getTurnoById,
  createTurno,
  createTurnosRecurrentes,
  updateTurno,
  deleteTurno,
  cambiarEstadoTurno,
  verificarDisponibilidad
} from '../services/turnosService'
import { getFechaHoyArgentina, getDiasSemana, getPrimerDiaMes, getUltimoDiaMes } from '../utils/dateUtils'

/**
 * Hook para turnos de un día específico
 */
export function useTurnosDia(fecha = null, options = {}) {
  const fechaActual = fecha || getFechaHoyArgentina()

  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTurnos = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getTurnosDia(fechaActual, options)

    if (fetchError) {
      setError(fetchError.message || 'Error al cargar turnos')
    } else {
      setTurnos(data || [])
    }

    setLoading(false)
  }, [fechaActual, options.profesionalId, options.estado])

  useEffect(() => {
    fetchTurnos()
  }, [fetchTurnos])

  const agregar = async (turnoData) => {
    // Si es recurrente, crear múltiples turnos
    if (turnoData.es_recurrente && turnoData.recurrencia) {
      const { data, error: createError } = await createTurnosRecurrentes(
        {
          ...turnoData,
          fecha: turnoData.fecha || fechaActual
        },
        turnoData.recurrencia
      )
      if (createError) {
        throw createError
      }
      // Solo agregar al estado los turnos que coinciden con la fecha actual
      const turnosEnFecha = data.filter(t => t.fecha === fechaActual)
      setTurnos(prev => [...prev, ...turnosEnFecha].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)))
      return data
    }

    // Turno normal
    const { data, error: createError } = await createTurno({
      ...turnoData,
      fecha: turnoData.fecha || fechaActual
    })
    if (createError) {
      throw createError
    }
    setTurnos(prev => [...prev, data].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)))
    return data
  }

  const actualizar = async (id, turnoData) => {
    const { data, error: updateError } = await updateTurno(id, turnoData)
    if (updateError) {
      throw updateError
    }
    setTurnos(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  const eliminar = async (id) => {
    const { error: deleteError } = await deleteTurno(id)
    if (deleteError) {
      throw deleteError
    }
    setTurnos(prev => prev.filter(t => t.id !== id))
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    const { data, error: updateError } = await cambiarEstadoTurno(id, nuevoEstado)
    if (updateError) {
      throw updateError
    }
    setTurnos(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  const recargar = () => {
    fetchTurnos()
  }

  return {
    turnos,
    loading,
    error,
    agregar,
    actualizar,
    eliminar,
    cambiarEstado,
    recargar
  }
}

/**
 * Hook para turnos de una semana
 */
export function useTurnosSemana(fechaBase = null, options = {}) {
  const fechaActual = fechaBase || getFechaHoyArgentina()

  const [turnosPorDia, setTurnosPorDia] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [diasSemanaState, setDiasSemanaState] = useState([])

  const fetchTurnos = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Calcular días de la semana dentro del callback para evitar stale closures
    const diasSemana = getDiasSemana(fechaActual)

    // Validar que diasSemana sea un array válido
    if (!Array.isArray(diasSemana) || diasSemana.length !== 7) {
      console.error('getDiasSemana returned invalid value:', diasSemana, 'fechaActual:', fechaActual)
      setError('Error al calcular días de la semana')
      setLoading(false)
      return
    }

    setDiasSemanaState(diasSemana)

    const fechaInicio = diasSemana[0]
    const fechaFin = diasSemana[6]

    const { data, error: fetchError } = await getTurnos(fechaInicio, fechaFin, options)

    if (fetchError) {
      setError(fetchError.message || 'Error al cargar turnos')
      setTurnosPorDia({})
    } else {
      // Agrupar por fecha
      const agrupados = {}
      diasSemana.forEach(dia => {
        agrupados[dia] = []
      })

      ;(data || []).forEach(turno => {
        if (agrupados[turno.fecha]) {
          agrupados[turno.fecha].push(turno)
        }
      })

      setTurnosPorDia(agrupados)
    }

    setLoading(false)
  }, [fechaActual, options.profesionalId, options.estado])

  useEffect(() => {
    fetchTurnos()
  }, [fetchTurnos])

  const recargar = () => {
    fetchTurnos()
  }

  // Total de turnos de la semana (array plano)
  const turnos = Object.values(turnosPorDia).flat()
  const totalTurnos = turnos.length

  return {
    turnos,
    turnosPorDia,
    diasSemana: diasSemanaState,
    loading,
    error,
    totalTurnos,
    recargar
  }
}

/**
 * Hook para turnos de un mes completo
 */
export function useTurnosMes(fechaBase = null, options = {}) {
  const fechaActual = fechaBase || getFechaHoyArgentina()

  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTurnos = useCallback(async () => {
    setLoading(true)
    setError(null)

    const fechaInicio = getPrimerDiaMes(fechaActual)
    const fechaFin = getUltimoDiaMes(fechaActual)

    const { data, error: fetchError } = await getTurnos(fechaInicio, fechaFin, options)

    if (fetchError) {
      setError(fetchError.message || 'Error al cargar turnos del mes')
      setTurnos([])
    } else {
      setTurnos(data || [])
    }

    setLoading(false)
  }, [fechaActual, options.profesionalId, options.estado])

  useEffect(() => {
    fetchTurnos()
  }, [fetchTurnos])

  const recargar = () => {
    fetchTurnos()
  }

  return {
    turnos,
    loading,
    error,
    recargar
  }
}

/**
 * Hook para un turno específico
 */
export function useTurno(turnoId) {
  const [turno, setTurno] = useState(null)
  const [loading, setLoading] = useState(!!turnoId)
  const [error, setError] = useState(null)

  const fetchTurno = useCallback(async () => {
    if (!turnoId) {
      setTurno(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getTurnoById(turnoId)

    if (fetchError) {
      setError(fetchError.message || 'Error al cargar turno')
    } else {
      setTurno(data)
    }

    setLoading(false)
  }, [turnoId])

  useEffect(() => {
    fetchTurno()
  }, [fetchTurno])

  const actualizar = async (turnoData) => {
    const { data, error: updateError } = await updateTurno(turnoId, turnoData)
    if (updateError) {
      throw updateError
    }
    setTurno(data)
    return data
  }

  const cambiarEstado = async (nuevoEstado) => {
    const { data, error: updateError } = await cambiarEstadoTurno(turnoId, nuevoEstado)
    if (updateError) {
      throw updateError
    }
    setTurno(data)
    return data
  }

  return {
    turno,
    loading,
    error,
    actualizar,
    cambiarEstado,
    recargar: fetchTurno
  }
}

/**
 * Hook para verificar disponibilidad
 */
export function useVerificarDisponibilidad() {
  const [checking, setChecking] = useState(false)

  const verificar = async (profesionalId, fecha, horaInicio, horaFin, turnoExcluirId = null) => {
    setChecking(true)
    const { disponible, error } = await verificarDisponibilidad(
      profesionalId,
      fecha,
      horaInicio,
      horaFin,
      turnoExcluirId
    )
    setChecking(false)
    return { disponible, error }
  }

  return { verificar, checking }
}

export default useTurnosDia
