/**
 * Hook para verificar días anteriores sin cerrar
 */

import { useState, useEffect, useCallback } from 'react'
import { getDiasSinCerrar } from '../services/cierresService'

export function useDiasSinCerrar() {
  const [diasSinCerrar, setDiasSinCerrar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDiasSinCerrar = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await getDiasSinCerrar()

    if (err) {
      setError(err)
    } else {
      setDiasSinCerrar(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDiasSinCerrar()
  }, [fetchDiasSinCerrar])

  return {
    diasSinCerrar,
    hayDiasSinCerrar: diasSinCerrar.length > 0,
    cantidadDiasSinCerrar: diasSinCerrar.length,
    loading,
    error,
    refresh: fetchDiasSinCerrar
  }
}
