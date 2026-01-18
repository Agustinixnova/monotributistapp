/**
 * Hook para gestion de gastos
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getGastosMes, crearGasto, actualizarGasto, eliminarGasto } from '../services/gastosService'
import { getPrimerDiaMes } from '../utils/formatters'

/**
 * Hook para manejar gastos del mes
 * @param {Date} fecha - Fecha del mes (opcional)
 * @returns {Object} Estado y funciones de gastos
 */
export function useGastos(fecha) {
  const { user } = useAuth()
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Convertir fecha a string para evitar loops infinitos
  const mesActual = useMemo(() => {
    const f = fecha || new Date()
    return getPrimerDiaMes(f)
  }, [fecha])

  // Cargar gastos del mes
  const cargarGastos = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const fechaActual = new Date(mesActual + 'T00:00:00')
      const data = await getGastosMes(user.id, fechaActual)
      setGastos(data)
    } catch (err) {
      console.error('Error cargando gastos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, mesActual])

  // Cargar al montar y cuando cambie la fecha
  useEffect(() => {
    cargarGastos()
  }, [cargarGastos])

  // Agregar gasto
  const agregarGasto = useCallback(async (datosGasto) => {
    if (!user?.id) throw new Error('Usuario no autenticado')

    const nuevoGasto = await crearGasto({
      ...datosGasto,
      userId: user.id
    })

    // Agregar al estado local
    setGastos(prev => [nuevoGasto, ...prev])

    return nuevoGasto
  }, [user?.id])

  // Editar gasto
  const editarGasto = useCallback(async (id, datosGasto) => {
    const gastoActualizado = await actualizarGasto(id, datosGasto)

    // Actualizar en el estado local
    setGastos(prev => prev.map(g => g.id === id ? gastoActualizado : g))

    return gastoActualizado
  }, [])

  // Borrar gasto
  const borrarGasto = useCallback(async (id) => {
    await eliminarGasto(id)

    // Remover del estado local
    setGastos(prev => prev.filter(g => g.id !== id))
  }, [])

  return {
    gastos,
    loading,
    error,
    recargar: cargarGastos,
    // Nombres completos
    agregarGasto,
    editarGasto,
    borrarGasto,
    // Aliases cortos para componentes
    agregar: agregarGasto,
    editar: editarGasto,
    eliminar: borrarGasto
  }
}
