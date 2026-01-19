/**
 * Hook para gestionar configuración de caja diaria
 */

import { useState, useEffect } from 'react'
import { getConfiguracion, guardarConfiguracion } from '../services/configuracionService'

export function useConfiguracion() {
  const [configuracion, setConfiguracion] = useState({
    nombre_negocio: 'Mi Negocio'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar configuración
  const fetchConfiguracion = async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await getConfiguracion()

    if (err) {
      setError(err)
    } else {
      setConfiguracion(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchConfiguracion()
  }, [])

  // Guardar configuración
  const guardar = async (nuevaConfig) => {
    const { data, error: err } = await guardarConfiguracion(nuevaConfig)

    if (err) {
      setError(err)
      return { success: false, error: err }
    }

    setConfiguracion(data)
    return { success: true, data }
  }

  // Actualizar nombre del negocio
  const actualizarNombreNegocio = async (nombre) => {
    return guardar({ nombre_negocio: nombre })
  }

  // Actualizar URL del QR
  const actualizarQrUrl = async (qrUrl) => {
    return guardar({ qr_url: qrUrl })
  }

  return {
    configuracion,
    nombreNegocio: configuracion?.nombre_negocio || 'Mi Negocio',
    qrUrl: configuracion?.qr_url || null,
    loading,
    error,
    refresh: fetchConfiguracion,
    guardar,
    actualizarNombreNegocio,
    actualizarQrUrl
  }
}
