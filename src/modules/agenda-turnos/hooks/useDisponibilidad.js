/**
 * Hooks para gestión de disponibilidad y profesionales
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getDisponibilidad,
  guardarDisponibilidad,
  getExcepciones,
  crearExcepcion,
  eliminarExcepcion,
  getProfesionales,
  DIAS_SEMANA
} from '../services/disponibilidadService'

export { DIAS_SEMANA }

/**
 * Hook para disponibilidad horaria de un profesional
 */
export function useDisponibilidad(profesionalId = null) {
  const [disponibilidad, setDisponibilidad] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Inicializar con todos los días
  const inicializarDisponibilidad = () => {
    return DIAS_SEMANA.map(dia => ({
      dia_semana: dia.id,
      hora_inicio: '09:00',
      hora_fin: '18:00',
      activo: dia.id >= 1 && dia.id <= 5 // Lun-Vie por defecto
    }))
  }

  const fetchDisponibilidad = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getDisponibilidad(profesionalId)

    if (fetchError) {
      setError(fetchError.message)
      setDisponibilidad(inicializarDisponibilidad())
    } else if (data && data.length > 0) {
      // Merge con días base
      const merged = DIAS_SEMANA.map(dia => {
        const encontrado = data.find(d => d.dia_semana === dia.id)
        if (encontrado) {
          // Normalizar formato de hora (de '08:00:00' a '08:00')
          return {
            ...encontrado,
            hora_inicio: encontrado.hora_inicio?.substring(0, 5) || '09:00',
            hora_fin: encontrado.hora_fin?.substring(0, 5) || '18:00'
          }
        }
        return {
          dia_semana: dia.id,
          hora_inicio: '09:00',
          hora_fin: '18:00',
          activo: false
        }
      })
      setDisponibilidad(merged)
    } else {
      setDisponibilidad(inicializarDisponibilidad())
    }

    setLoading(false)
  }, [profesionalId])

  useEffect(() => {
    fetchDisponibilidad()
  }, [fetchDisponibilidad])

  const guardar = async (nuevaDisponibilidad) => {
    const { data, error } = await guardarDisponibilidad(nuevaDisponibilidad, profesionalId)
    if (error) throw error
    await fetchDisponibilidad()
    return data
  }

  const actualizarDia = (diaSemana, cambios) => {
    setDisponibilidad(prev => prev.map(d =>
      d.dia_semana === diaSemana ? { ...d, ...cambios } : d
    ))
  }

  return {
    disponibilidad,
    loading,
    error,
    guardar,
    actualizarDia,
    recargar: fetchDisponibilidad
  }
}

/**
 * Hook para excepciones (feriados, vacaciones)
 */
export function useExcepciones(profesionalId = null, fechaInicio = null, fechaFin = null) {
  const [excepciones, setExcepciones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchExcepciones = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getExcepciones(profesionalId, fechaInicio, fechaFin)
    if (!error) {
      setExcepciones(data || [])
    }
    setLoading(false)
  }, [profesionalId, fechaInicio, fechaFin])

  useEffect(() => {
    fetchExcepciones()
  }, [fetchExcepciones])

  const agregar = async (excepcionData) => {
    const { data, error } = await crearExcepcion(excepcionData, profesionalId)
    if (error) throw error
    setExcepciones(prev => [...prev, data])
    return data
  }

  const eliminar = async (excepcionId) => {
    const { error } = await eliminarExcepcion(excepcionId)
    if (error) throw error
    setExcepciones(prev => prev.filter(e => e.id !== excepcionId))
  }

  return {
    excepciones,
    loading,
    agregar,
    eliminar,
    recargar: fetchExcepciones
  }
}

/**
 * Hook para lista de profesionales
 */
export function useProfesionales() {
  const [profesionales, setProfesionales] = useState([])
  const [loading, setLoading] = useState(true)
  const [profesionalActivo, setProfesionalActivo] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data, error } = await getProfesionales()
      if (!error && data) {
        setProfesionales(data)
        // Seleccionar el dueño por defecto
        const duenio = data.find(p => p.esDuenio)
        if (duenio) {
          setProfesionalActivo(duenio.id)
        } else if (data.length > 0) {
          setProfesionalActivo(data[0].id)
        }
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return {
    profesionales,
    loading,
    profesionalActivo,
    setProfesionalActivo,
    tieneMuchos: profesionales.length > 1
  }
}

export default useDisponibilidad
