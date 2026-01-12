import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { getCarteraClientes } from '../services/carteraService'
import { calcularEstadosFiscalesBatch } from '../../facturacion/services/estadoFiscalService'

/**
 * Hook para gestionar la lista de clientes en Mi Cartera
 * @param {Object} initialFilters - Filtros iniciales
 */
export function useCartera(initialFilters = {}) {
  const { user } = useAuth()
  const [clientes, setClientes] = useState([])
  const [estadosFiscales, setEstadosFiscales] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingEstados, setLoadingEstados] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)

  const fetchClientes = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Obtener el rol del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const roleName = profile.roles?.name

      const data = await getCarteraClientes(user.id, roleName, filters)
      setClientes(data)

      // Calcular estados fiscales en background
      if (data.length > 0) {
        setLoadingEstados(true)
        const clientIds = data.map(c => c.client_id).filter(Boolean)
        const estados = await calcularEstadosFiscalesBatch(clientIds)
        setEstadosFiscales(estados)
        setLoadingEstados(false)
      }
    } catch (err) {
      console.error('Error cargando cartera:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  // Filtrar clientes por estado fiscal si esta activo
  const clientesFiltrados = filters.estadoFiscal
    ? clientes.filter(c => {
        const estado = estadosFiscales[c.client_id]
        return estado?.estado === filters.estadoFiscal
      })
    : clientes

  // Estadisticas de la cartera (usando clientes sin filtrar para mostrar totales)
  const stats = {
    total: clientes.length,
    conSugerencias: clientes.filter(c => c.sugerencias_pendientes > 0).length,
    monotributistas: clientes.filter(c => c.tipo_contribuyente === 'monotributista').length,
    responsablesInscriptos: clientes.filter(c => c.tipo_contribuyente === 'responsable_inscripto').length,
    alDia: clientes.filter(c => c.estado_pago_monotributo === 'al_dia').length,
    conDeuda: clientes.filter(c => ['debe_1_cuota', 'debe_2_mas'].includes(c.estado_pago_monotributo)).length,
    conLocales: clientes.filter(c => c.cantidad_locales > 0).length,
    conDependencia: clientes.filter(c => c.trabaja_relacion_dependencia).length,
    // Estadisticas de estado fiscal
    estadoFiscalOk: Object.values(estadosFiscales).filter(e => e?.estado === 'ok').length,
    estadoFiscalAtencion: Object.values(estadosFiscales).filter(e => e?.estado === 'atencion').length,
    estadoFiscalRiesgo: Object.values(estadosFiscales).filter(e => e?.estado === 'riesgo').length,
    // Clientes con datos incompletos (sin CUIT)
    datosIncompletos: clientes.filter(c => c.datos_incompletos).length
  }

  // Categorias unicas para filtro
  const categorias = [...new Set(clientes.map(c => c.categoria_monotributo).filter(Boolean))].sort()

  return {
    clientes: clientesFiltrados,
    estadosFiscales,
    loading,
    loadingEstados,
    error,
    filters,
    stats,
    categorias,
    refetch: fetchClientes,
    updateFilters,
    clearFilters
  }
}
