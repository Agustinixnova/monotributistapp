import { useState, useEffect, useCallback } from 'react'
import { getRoles, getRoleById, createRole, updateRole, deleteRole } from '../services/roleService'

/**
 * Hook para gestión de roles
 */
export function useRoles() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRoles()
      setRoles(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleCreateRole = async (roleData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await createRole(roleData)
      await fetchRoles()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (id, roleData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await updateRole(id, roleData)
      await fetchRoles()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (id) => {
    try {
      setLoading(true)
      setError(null)
      await deleteRole(id)
      await fetchRoles()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles,
    createRole: handleCreateRole,
    updateRole: handleUpdateRole,
    deleteRole: handleDeleteRole
  }
}

/**
 * Hook para obtener un rol específico
 * @param {string} roleId - UUID del rol
 */
export function useRole(roleId) {
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRole = useCallback(async () => {
    if (!roleId) {
      setRole(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getRoleById(roleId)
      setRole(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [roleId])

  useEffect(() => {
    fetchRole()
  }, [fetchRole])

  return {
    role,
    loading,
    error,
    refetch: fetchRole
  }
}
