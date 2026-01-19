/**
 * Hook para gestionar arqueos de caja
 */

import { useState, useEffect } from 'react'
import {
  getEfectivoEsperado,
  getArqueosByFecha,
  createArqueo,
  deleteArqueo
} from '../services/arqueosService'
import { getFechaHoy } from '../utils/formatters'

export function useArqueos(fecha = null) {
  const [arqueos, setArqueos] = useState([])
  const [efectivoEsperado, setEfectivoEsperado] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fechaActual = fecha || getFechaHoy()

  // Cargar arqueos y efectivo esperado
  const fetchData = async () => {
    setLoading(true)
    setError(null)

    // Obtener efectivo esperado
    const { data: dataEfectivo, error: errEfectivo } = await getEfectivoEsperado(fechaActual)

    if (errEfectivo) {
      console.error('Error obteniendo efectivo esperado:', errEfectivo)
    } else {
      setEfectivoEsperado(parseFloat(dataEfectivo || 0))
    }

    // Obtener arqueos del día
    const { data: dataArqueos, error: errArqueos } = await getArqueosByFecha(fechaActual)

    if (errArqueos) {
      setError(errArqueos)
    } else {
      setArqueos(dataArqueos || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [fechaActual])

  // Crear nuevo arqueo
  const crear = async (arqueoData) => {
    const { data, error: err } = await createArqueo({
      fecha: fechaActual,
      ...arqueoData
    })

    if (err) {
      setError(err)
      return { success: false, error: err }
    }

    await fetchData()
    return { success: true, data }
  }

  // Eliminar arqueo
  const eliminar = async (id) => {
    const { success, error: err } = await deleteArqueo(id)

    if (!success) {
      setError(err)
      return { success: false, error: err }
    }

    await fetchData()
    return { success: true }
  }

  // Obtener último arqueo del día
  const ultimoArqueo = arqueos.length > 0 ? arqueos[0] : null

  return {
    arqueos,
    efectivoEsperado,
    ultimoArqueo,
    loading,
    error,
    refresh: fetchData,
    crear,
    eliminar
  }
}
