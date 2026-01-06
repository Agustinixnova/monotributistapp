import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export function useClienteFiscal(clientId) {
  const [cliente, setCliente] = useState(null)
  const [tope, setTope] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!clientId) return

    const fetchCliente = async () => {
      try {
        setLoading(true)

        // Obtener datos del cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('client_fiscal_data')
          .select(`
            *,
            user:profiles!user_id(id, nombre, apellido, email)
          `)
          .eq('id', clientId)
          .single()

        if (clienteError) throw clienteError

        // Obtener tope de su categoría
        const { data: categoria, error: categoriaError } = await supabase
          .from('monotributo_categorias')
          .select('tope_facturacion_anual, cuota_total_servicios, cuota_total_productos')
          .eq('categoria', clienteData.categoria_monotributo)
          .is('vigente_hasta', null)
          .single()

        if (categoriaError && categoriaError.code !== 'PGRST116') throw categoriaError

        setCliente(clienteData)
        setTope(categoria ? parseFloat(categoria.tope_facturacion_anual) : 0)
      } catch (err) {
        console.error('Error cargando cliente:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCliente()
  }, [clientId])

  return { cliente, tope, loading, error }
}
