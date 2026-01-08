import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  getClienteDetalle,
  actualizarCamposCliente,
  getAuditoriaCliente,
  guardarLocalesCliente,
  guardarGrupoFamiliar
} from '../services/carteraService'

/**
 * Hook para gestionar el detalle y edicion de un cliente
 * @param {string} clientId - ID del cliente (client_fiscal_data.id)
 */
export function useClienteDetalle(clientId) {
  const { user } = useAuth()
  const [cliente, setCliente] = useState(null)
  const [auditoria, setAuditoria] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchCliente = useCallback(async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)
      const data = await getClienteDetalle(clientId)
      setCliente(data)
      const audit = await getAuditoriaCliente(clientId)
      setAuditoria(audit)
    } catch (err) {
      console.error('Error cargando cliente:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchCliente()
  }, [fetchCliente])

  /**
   * Actualizar campos del cliente con auditoria
   * @param {Object} cambios - Campos a actualizar (snake_case)
   * @param {string} motivo - Motivo del cambio (opcional)
   */
  const actualizarCampos = async (cambios, motivo = null) => {
    if (!cliente || !user) return false

    try {
      setSaving(true)

      // Preparar valores anteriores para auditoria
      const valoresAnteriores = {}
      for (const campo of Object.keys(cambios)) {
        valoresAnteriores[campo] = cliente[campo]
      }

      await actualizarCamposCliente(clientId, cambios, valoresAnteriores, user.id, motivo)
      await fetchCliente()
      return true
    } catch (err) {
      console.error('Error actualizando cliente:', err)
      setError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  /**
   * Guardar locales del cliente
   * @param {Array} locales - Array de locales
   */
  const guardarLocales = async (locales) => {
    if (!cliente || !user) return false

    try {
      setSaving(true)
      await guardarLocalesCliente(clientId, locales)
      await fetchCliente()
      return true
    } catch (err) {
      console.error('Error guardando locales:', err)
      setError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  /**
   * Guardar grupo familiar del cliente
   * @param {Array} grupo - Array de integrantes
   */
  const guardarGrupo = async (grupo) => {
    if (!cliente || !user) return false

    try {
      setSaving(true)
      await guardarGrupoFamiliar(clientId, grupo)
      await fetchCliente()
      return true
    } catch (err) {
      console.error('Error guardando grupo familiar:', err)
      setError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  // Calcular porcentaje del tope de facturacion
  const porcentajeTope = cliente?.categoriaInfo?.tope_facturacion_anual
    ? Math.round((cliente.facturacion_acumulada_12_meses || 0) / cliente.categoriaInfo.tope_facturacion_anual * 100)
    : 0

  // Datos del perfil del cliente
  const perfil = cliente?.user || null

  // Datos del contador asignado
  const contador = perfil?.contador || null

  // Historial de categorias
  const historialCategorias = cliente?.historialCategorias || []

  // Locales comerciales
  const locales = cliente?.locales || []

  // Grupo familiar
  const grupoFamiliar = cliente?.grupoFamiliar || []

  return {
    cliente,
    perfil,
    contador,
    auditoria,
    historialCategorias,
    locales,
    grupoFamiliar,
    loading,
    saving,
    error,
    porcentajeTope,
    refetch: fetchCliente,
    actualizarCampos,
    guardarLocales,
    guardarGrupo
  }
}
