import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { getAcumulado12Meses, getResumenesCliente } from '../services/resumenService'
import { getCargasCliente } from '../services/cargasService'

/**
 * Hook completo para la vista del cliente
 */
export function useFacturacionCliente(userId) {
  const [clientId, setClientId] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [tope, setTope] = useState(0)
  const [acumulado, setAcumulado] = useState(null)
  const [resumenes, setResumenes] = useState([])
  const [cargas, setCargas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // 1. Obtener client_fiscal_data del usuario
      const { data: clienteData, error: clienteError } = await supabase
        .from('client_fiscal_data')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (clienteError) throw clienteError
      setCliente(clienteData)
      setClientId(clienteData.id)

      // 2. Obtener tope de la categoria
      const { data: categoriaData } = await supabase
        .from('monotributo_categorias')
        .select('tope_facturacion_anual')
        .eq('categoria', clienteData.categoria_monotributo)
        .is('vigente_hasta', null)
        .single()

      setTope(categoriaData ? parseFloat(categoriaData.tope_facturacion_anual) : 0)

      // 3. Obtener acumulado 12 meses
      const acumuladoData = await getAcumulado12Meses(clienteData.id)
      setAcumulado(acumuladoData)

      // 4. Obtener resumenes mensuales
      const resumenesData = await getResumenesCliente(clienteData.id, 12)
      setResumenes(resumenesData)

      // 5. Obtener todas las cargas
      const cargasData = await getCargasCliente(clienteData.id, 12)
      setCargas(cargasData)

    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Agrupar cargas por mes
  const cargasPorMes = cargas.reduce((acc, carga) => {
    const key = `${carga.anio}-${carga.mes}`
    if (!acc[key]) acc[key] = []
    acc[key].push(carga)
    return acc
  }, {})

  return {
    clientId,
    cliente,
    tope,
    acumulado,
    resumenes,
    cargas,
    cargasPorMes,
    loading,
    error,
    refetch: fetchData
  }
}
