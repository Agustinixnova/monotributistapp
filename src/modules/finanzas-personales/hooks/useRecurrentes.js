/**
 * Hook para gestion de gastos recurrentes
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  getRecurrentesActivos,
  getTodosRecurrentes,
  crearRecurrente,
  actualizarRecurrente,
  eliminarRecurrente,
  cargarDesdeRecurrente
} from '../services/recurrentesService'

/**
 * Hook para manejar gastos recurrentes
 * @param {boolean} soloActivos - Si true, solo trae activos
 * @returns {Object} Estado y funciones de recurrentes
 */
export function useRecurrentes(soloActivos = true) {
  const { user } = useAuth()
  const [recurrentes, setRecurrentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar recurrentes
  const cargarRecurrentes = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const data = soloActivos
        ? await getRecurrentesActivos(user.id)
        : await getTodosRecurrentes(user.id)
      setRecurrentes(data || [])
    } catch (err) {
      console.error('Error cargando recurrentes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, soloActivos])

  // Cargar al montar
  useEffect(() => {
    cargarRecurrentes()
  }, [cargarRecurrentes])

  // Crear nuevo recurrente
  const crear = useCallback(async (datos) => {
    if (!user?.id) throw new Error('Usuario no autenticado')

    const nuevoRecurrente = await crearRecurrente({
      ...datos,
      userId: user.id
    })

    setRecurrentes(prev => [...prev, nuevoRecurrente])
    return nuevoRecurrente
  }, [user?.id])

  // Actualizar recurrente
  const actualizar = useCallback(async (id, datos) => {
    const recurrenteActualizado = await actualizarRecurrente(id, datos)

    setRecurrentes(prev =>
      prev.map(r => r.id === id ? recurrenteActualizado : r)
    )
    return recurrenteActualizado
  }, [])

  // Eliminar recurrente
  const eliminar = useCallback(async (id) => {
    await eliminarRecurrente(id)
    setRecurrentes(prev => prev.filter(r => r.id !== id))
  }, [])

  // Activar/desactivar recurrente
  const toggleActivo = useCallback(async (id, activo) => {
    return await actualizar(id, { activo })
  }, [actualizar])

  // Cargar gasto desde plantilla recurrente
  const cargarGasto = useCallback(async (recurrente, fecha) => {
    return await cargarDesdeRecurrente(recurrente, fecha)
  }, [])

  // Total mensual de recurrentes activos
  const totalMensual = recurrentes
    .filter(r => r.activo)
    .reduce((total, r) => total + Number(r.monto), 0)

  return {
    recurrentes,
    totalMensual,
    loading,
    error,
    recargar: cargarRecurrentes,
    crear,
    actualizar,
    eliminar,
    toggleActivo,
    cargarGasto
  }
}
