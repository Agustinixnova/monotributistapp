import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { getAcumulado12Meses, getResumenesCliente } from '../services/resumenService'

export function useResumenClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener clientes monotributistas con sus datos
      const { data: clientesData, error: clientesError } = await supabase
        .from('client_fiscal_data')
        .select(`
          id,
          cuit,
          razon_social,
          categoria_monotributo,
          tipo_actividad,
          gestion_facturacion,
          user:profiles!user_id(id, nombre, apellido, email)
        `)
        .eq('tipo_contribuyente', 'monotributista')
        .order('razon_social')

      if (clientesError) throw clientesError

      // Obtener categorías vigentes para los topes
      const { data: categorias, error: categoriasError } = await supabase
        .from('monotributo_categorias')
        .select('categoria, tope_facturacion_anual')
        .is('vigente_hasta', null)

      if (categoriasError) throw categoriasError

      const topesPorCategoria = {}
      categorias.forEach(c => {
        topesPorCategoria[c.categoria] = parseFloat(c.tope_facturacion_anual)
      })

      // Obtener configuración de alertas
      const { data: alertasConfig } = await supabase
        .from('alertas_config')
        .select('alerta_recategorizacion_porcentaje, alerta_exclusion_porcentaje')
        .single()

      const umbralRecateg = alertasConfig?.alerta_recategorizacion_porcentaje || 80
      const umbralExclusion = alertasConfig?.alerta_exclusion_porcentaje || 90

      // Enriquecer cada cliente con su acumulado
      const clientesEnriquecidos = await Promise.all(
        clientesData.map(async (cliente) => {
          try {
            const acumulado = await getAcumulado12Meses(cliente.id)
            const resumenes = await getResumenesCliente(cliente.id, 1) // Solo el último
            const ultimoMes = resumenes.length > 0 ? resumenes[0] : null
            const tope = topesPorCategoria[cliente.categoria_monotributo] || 0
            const porcentaje = tope > 0 ? (acumulado.neto / tope) * 100 : 0

            let estadoAlerta = 'ok'
            if (porcentaje >= umbralExclusion) estadoAlerta = 'exclusion'
            else if (porcentaje >= umbralRecateg) estadoAlerta = 'recategorizacion'

            // Verificar si falta cargar mes actual
            const hoy = new Date()
            const mesActual = hoy.getMonth() + 1
            const anioActual = hoy.getFullYear()
            const faltaMesActual = !ultimoMes ||
              ultimoMes.anio !== anioActual ||
              ultimoMes.mes !== mesActual

            return {
              ...cliente,
              acumulado12Meses: acumulado.neto,
              tope,
              porcentaje,
              estadoAlerta,
              ultimoMes,
              faltaMesActual,
              nombreCompleto: cliente.user ? `${cliente.user.nombre || ''} ${cliente.user.apellido || ''}`.trim() || cliente.razon_social : cliente.razon_social || 'Sin nombre'
            }
          } catch (err) {
            // Si falla para un cliente, devolver datos básicos
            return {
              ...cliente,
              acumulado12Meses: 0,
              tope: topesPorCategoria[cliente.categoria_monotributo] || 0,
              porcentaje: 0,
              estadoAlerta: 'ok',
              ultimoMes: null,
              faltaMesActual: true,
              nombreCompleto: cliente.user ? `${cliente.user.nombre || ''} ${cliente.user.apellido || ''}`.trim() || cliente.razon_social : cliente.razon_social || 'Sin nombre'
            }
          }
        })
      )

      setClientes(clientesEnriquecidos)
    } catch (err) {
      console.error('Error cargando clientes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  return {
    clientes,
    loading,
    error,
    refetch: fetchClientes
  }
}
