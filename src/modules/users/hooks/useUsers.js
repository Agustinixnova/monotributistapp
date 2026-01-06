import { useState, useEffect, useCallback } from 'react'
import { getUsers, getUserById, createUser, updateUser, toggleUserActive } from '../services/userService'
import { getFiscalDataByUserId } from '../services/fiscalDataService'
import { createHistoricalBilling } from '../../facturacion/services/cargasService'

/**
 * Hook para gestión de usuarios
 * @param {Object} initialFilters - Filtros iniciales
 */
export function useUsers(initialFilters = {}) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUsers(filters)
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await createUser(userData)

      // Si hay datos historicos de facturacion, crearlos
      if (userData.historicalBilling && !userData.historicalBilling.omitirHistorico) {
        try {
          // Obtener el ID del client_fiscal_data recien creado
          const fiscalData = await getFiscalDataByUserId(result.userId)
          if (fiscalData) {
            await createHistoricalBilling(
              fiscalData.id,
              userData.historicalBilling,
              result.userId // El usuario recien creado como "cargado por" (o podria ser el admin actual)
            )
          }
        } catch (histErr) {
          console.error('Error creando facturacion historica:', histErr)
          // No lanzar error para no bloquear la creacion del usuario
        }
      }

      await fetchUsers()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (id, userData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await updateUser(id, userData)
      await fetchUsers()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id, isActive) => {
    try {
      setLoading(true)
      setError(null)
      const result = await toggleUserActive(id, isActive)
      await fetchUsers()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  return {
    users,
    loading,
    error,
    filters,
    refetch: fetchUsers,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    toggleActive: handleToggleActive,
    updateFilters,
    clearFilters
  }
}

/**
 * Hook para obtener un usuario específico
 * @param {string} userId - UUID del usuario
 */
export function useUser(userId) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getUserById(userId)
      setUser(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return {
    user,
    loading,
    error,
    refetch: fetchUser
  }
}
