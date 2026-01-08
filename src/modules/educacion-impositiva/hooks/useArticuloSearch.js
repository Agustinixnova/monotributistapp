import { useState, useCallback } from 'react'
import { buscarArticulos } from '../services/articulosService'

/**
 * Hook para busqueda de articulos
 */
export function useArticuloSearch() {
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState(null)
  const [termino, setTermino] = useState('')

  const buscar = useCallback(async (texto) => {
    setTermino(texto)

    if (!texto || texto.length < 2) {
      setResultados([])
      return
    }

    try {
      setBuscando(true)
      setError(null)
      const data = await buscarArticulos(texto)
      setResultados(data)
    } catch (err) {
      console.error('Error buscando articulos:', err)
      setError(err.message)
      setResultados([])
    } finally {
      setBuscando(false)
    }
  }, [])

  const limpiar = useCallback(() => {
    setTermino('')
    setResultados([])
  }, [])

  return {
    resultados,
    buscando,
    error,
    termino,
    buscar,
    limpiar
  }
}
