import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { getCarteraClientes } from '../services/carteraService'

/**
 * Hook para gestionar la lista de clientes en Mi Cartera
 * @param {Object} initialFilters - Filtros iniciales
 */
export function useCartera(initialFilters = {}) {
  const { user } = useAuth()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
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
      console.log('Fetching cartera for role:', roleName)

      const data = await getCarteraClientes(user.id, roleName, filters)
      console.log('Cartera data:', data)
      setClientes(data)
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

  // Estadisticas de la cartera
  const stats = {
    total: clientes.length,
    conSugerencias: clientes.filter(c => c.sugerencias_pendientes > 0).length,
    monotributistas: clientes.filter(c => c.tipo_contribuyente === 'monotributista').length,
    responsablesInscriptos: clientes.filter(c => c.tipo_contribuyente === 'responsable_inscripto').length,
    alDia: clientes.filter(c => c.estado_pago_monotributo === 'al_dia').length,
    conDeuda: clientes.filter(c => ['debe_1_cuota', 'debe_2_mas'].includes(c.estado_pago_monotributo)).length,
    conLocales: clientes.filter(c => c.cantidad_locales > 0).length,
    conDependencia: clientes.filter(c => c.trabaja_relacion_dependencia).length
  }

  // Categorias unicas para filtro
  const categorias = [...new Set(clientes.map(c => c.categoria_monotributo).filter(Boolean))].sort()

  return {
    clientes,
    loading,
    error,
    filters,
    stats,
    categorias,
    refetch: fetchClientes,
    updateFilters,
    clearFilters
  }
}
