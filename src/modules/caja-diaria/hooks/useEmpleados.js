/**
 * Hook para gestionar empleados de caja
 */

import { useState, useEffect } from 'react'
import {
  getEmpleados,
  crearEmpleado,
  actualizarPermisos,
  actualizarHorarios,
  toggleEmpleadoActivo,
  eliminarEmpleado
} from '../services/empleadosService'

export function useEmpleados() {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar empleados
  const fetchEmpleados = async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await getEmpleados()

    if (err) {
      setError(err)
    } else {
      setEmpleados(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchEmpleados()
  }, [])

  // Crear empleado
  const crear = async (empleadoData) => {
    const { data, error: err } = await crearEmpleado(empleadoData)

    if (err) {
      return { success: false, error: err }
    }

    // Agregar al estado local
    setEmpleados(prev => [data, ...prev])
    return { success: true, data }
  }

  // Actualizar permisos
  const actualizarPermisosEmpleado = async (id, permisos) => {
    const { data, error: err } = await actualizarPermisos(id, permisos)

    if (err) {
      return { success: false, error: err }
    }

    // Actualizar en estado local
    setEmpleados(prev => prev.map(emp =>
      emp.id === id ? { ...emp, permisos: data.permisos } : emp
    ))
    return { success: true, data }
  }

  // Activar/desactivar empleado
  const toggleActivo = async (id, activo) => {
    const { data, error: err } = await toggleEmpleadoActivo(id, activo)

    if (err) {
      return { success: false, error: err }
    }

    // Actualizar en estado local
    setEmpleados(prev => prev.map(emp =>
      emp.id === id ? { ...emp, activo: data.activo } : emp
    ))
    return { success: true }
  }

  // Eliminar empleado
  const eliminar = async (id) => {
    const { success, error: err } = await eliminarEmpleado(id)

    if (!success) {
      return { success: false, error: err }
    }

    // Remover del estado local
    setEmpleados(prev => prev.filter(emp => emp.id !== id))
    return { success: true }
  }

  // Actualizar horarios de acceso
  const actualizarHorariosEmpleado = async (id, horarios) => {
    const { data, error: err } = await actualizarHorarios(id, horarios)

    if (err) {
      return { success: false, error: err }
    }

    // Actualizar en estado local
    setEmpleados(prev => prev.map(emp =>
      emp.id === id ? { ...emp, horarios_acceso: data.horarios_acceso } : emp
    ))
    return { success: true, data }
  }

  return {
    empleados,
    loading,
    error,
    refresh: fetchEmpleados,
    crear,
    actualizarPermisos: actualizarPermisosEmpleado,
    actualizarHorarios: actualizarHorariosEmpleado,
    toggleActivo,
    eliminar
  }
}
