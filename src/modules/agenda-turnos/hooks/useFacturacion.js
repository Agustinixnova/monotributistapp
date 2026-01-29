/**
 * Hook para gestionar facturación electrónica
 *
 * Verifica si el usuario tiene:
 * 1. Acceso al módulo premium 'facturacion-afip' (habilitado manualmente)
 * 2. Configuración completa de AFIP (certificados, punto de venta, etc.)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { getConfiguracionAfip } from '../services/afipService'

export function useFacturacion() {
  const [config, setConfig] = useState(null)
  const [tieneModulo, setTieneModulo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar configuración de facturación y verificar acceso al módulo
  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setConfig(null)
        setTieneModulo(false)
        return
      }

      // Verificar si tiene acceso al módulo premium 'facturacion-afip'
      const { data: moduleAccess } = await supabase
        .from('user_module_access')
        .select(`
          module:modules!inner(slug)
        `)
        .eq('user_id', user.id)
        .eq('modules.slug', 'facturacion-afip')
        .maybeSingle()

      setTieneModulo(!!moduleAccess)

      // Solo cargar config si tiene el módulo
      if (moduleAccess) {
        const data = await getConfiguracionAfip(user.id)
        setConfig(data)
      } else {
        setConfig(null)
      }
    } catch (err) {
      console.error('Error cargando config facturación:', err)
      setError(err.message)
      setConfig(null)
      setTieneModulo(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar al montar
  useEffect(() => {
    cargar()
  }, [cargar])

  // Tiene el módulo premium habilitado
  const tieneModuloPremium = tieneModulo

  // Facturación habilitada = tiene módulo + tiene config + activo + tiene certificados + tiene punto de venta
  const facturacionHabilitada = Boolean(
    tieneModulo &&
    config &&
    config.activo &&
    config.certificado_crt &&
    config.clave_privada_key &&
    config.punto_venta
  )

  // Solo tiene config básica (sin certificados completos)
  const tieneConfigBasica = Boolean(config && config.cuit && config.razon_social)

  return {
    config,
    loading,
    error,
    recargar: cargar,
    // Helpers
    tieneModuloPremium,      // Tiene el módulo premium habilitado (puede ver la pestaña)
    facturacionHabilitada,   // Config completa lista para facturar
    tieneConfigBasica        // Tiene config básica pero incompleta
  }
}

export default useFacturacion
