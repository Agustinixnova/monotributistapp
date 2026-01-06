import { useState, useEffect, useCallback } from 'react'
import { getCargasMes, createCarga, createCargasMultiples, updateCarga, deleteCarga } from '../services/cargasService'

export function useCargas(clientId, anio, mes) {
  const [cargas, setCargas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCargas = useCallback(async () => {
    if (!clientId || !anio || !mes) return

    try {
      setLoading(true)
      setError(null)
      const data = await getCargasMes(clientId, anio, mes)
      setCargas(data)
    } catch (err) {
      console.error('Error cargando cargas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [clientId, anio, mes])

  useEffect(() => {
    fetchCargas()
  }, [fetchCargas])

  const agregar = async (data) => {
    const result = await createCarga({ ...data, clientId, anio, mes })
    await fetchCargas()
    return result
  }

  const agregarMultiples = async (cargasData, cargadoPor) => {
    const result = await createCargasMultiples(cargasData, clientId, cargadoPor)
    await fetchCargas()
    return result
  }

  const actualizar = async (id, data) => {
    const result = await updateCarga(id, data)
    await fetchCargas()
    return result
  }

  const eliminar = async (id) => {
    await deleteCarga(id)
    await fetchCargas()
  }

  return {
    cargas,
    loading,
    error,
    refetch: fetchCargas,
    agregar,
    agregarMultiples,
    actualizar,
    eliminar
  }
}
