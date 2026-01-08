import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import {
  crearSugerencia,
  getMisSugerencias,
  getSugerenciasPendientes,
  procesarSugerencia,
  getSugerenciasCliente
} from '../services/sugerenciasService'

/**
 * Hook para el CLIENTE - sus propias sugerencias
 */
export function useMisSugerencias() {
  const { user } = useAuth()
  const [sugerencias, setSugerencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const fetchSugerencias = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const data = await getMisSugerencias(user.id)
      setSugerencias(data)
    } catch (err) {
      console.error('Error cargando sugerencias:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSugerencias()
  }, [fetchSugerencias])

  const enviarSugerencia = async (params) => {
    if (!user) return null
    try {
      setEnviando(true)
      const id = await crearSugerencia({ ...params, userId: user.id })
      await fetchSugerencias()
      return id
    } catch (err) {
      console.error('Error enviando sugerencia:', err)
      setError(err.message)
      return null
    } finally {
      setEnviando(false)
    }
  }

  const pendientes = sugerencias.filter(s => s.estado === 'pendiente')
  const procesadas = sugerencias.filter(s => s.estado !== 'pendiente')

  return {
    sugerencias,
    pendientes,
    procesadas,
    loading,
    error,
    enviando,
    enviarSugerencia,
    refetch: fetchSugerencias
  }
}

/**
 * Hook para la CONTADORA - sugerencias pendientes de sus clientes
 */
export function useSugerenciasPendientes() {
  const { user } = useAuth()
  const [sugerencias, setSugerencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [roleName, setRoleName] = useState(null)

  // Obtener rol del usuario
  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('profiles')
        .select('roles(name)')
        .eq('id', user.id)
        .single()
      setRoleName(data?.roles?.name || null)
    }
    fetchRole()
  }, [user?.id])

  const fetchSugerencias = useCallback(async () => {
    if (!user || !roleName) return
    try {
      setLoading(true)
      // Si es contador_secundario, pasar su ID para filtrar
      const contadorId = roleName === 'contador_secundario' ? user.id : null
      const data = await getSugerenciasPendientes(contadorId)
      setSugerencias(data)
    } catch (err) {
      console.error('Error cargando sugerencias pendientes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, roleName])

  useEffect(() => {
    if (roleName) {
      fetchSugerencias()
    }
  }, [fetchSugerencias, roleName])

  const procesar = async (sugerenciaId, estado, valorAplicado = null, nota = null) => {
    if (!user) return false
    try {
      setProcesando(true)
      await procesarSugerencia(sugerenciaId, estado, user.id, valorAplicado, nota)
      await fetchSugerencias()
      return true
    } catch (err) {
      console.error('Error procesando sugerencia:', err)
      setError(err.message)
      return false
    } finally {
      setProcesando(false)
    }
  }

  const aceptar = (sugerenciaId, valorAplicado = null) =>
    procesar(sugerenciaId, valorAplicado ? 'aceptada_modificada' : 'aceptada', valorAplicado)

  const rechazar = (sugerenciaId, nota = null) =>
    procesar(sugerenciaId, 'rechazada', null, nota)

  return {
    sugerencias,
    loading,
    error,
    procesando,
    procesar,
    aceptar,
    rechazar,
    refetch: fetchSugerencias,
    cantidad: sugerencias.length
  }
}

/**
 * Hook para sugerencias de un cliente especifico (vista contadora)
 */
export function useSugerenciasCliente(clientId) {
  const [sugerencias, setSugerencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSugerencias = useCallback(async () => {
    if (!clientId) return
    try {
      setLoading(true)
      const data = await getSugerenciasCliente(clientId, true)
      setSugerencias(data)
    } catch (err) {
      console.error('Error cargando sugerencias del cliente:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchSugerencias()
  }, [fetchSugerencias])

  const pendientes = sugerencias.filter(s => s.estado === 'pendiente')
  const procesadas = sugerencias.filter(s => s.estado !== 'pendiente')

  return {
    sugerencias,
    pendientes,
    procesadas,
    loading,
    error,
    refetch: fetchSugerencias
  }
}
