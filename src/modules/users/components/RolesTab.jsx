import { useState } from 'react'
import { Shield, Plus, Edit, Trash2, AlertCircle, Users, Lock } from 'lucide-react'
import { useRoles } from '../hooks/useRoles'
import RoleFormModal from './RoleFormModal'
import { getRoleColor } from '../../../utils/roleColors'

/**
 * Pestaña de gestión de roles
 */
export function RolesTab() {
  const { roles, loading, error, createRole, updateRole, deleteRole, refetch } = useRoles()
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [savingRole, setSavingRole] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleCreate = () => {
    setEditingRole(null)
    setShowModal(true)
  }

  const handleEdit = (role) => {
    setEditingRole(role)
    setShowModal(true)
  }

  const handleSave = async (formData) => {
    setSavingRole(true)
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData)
      } else {
        await createRole(formData)
      }
      setShowModal(false)
      setEditingRole(null)
    } finally {
      setSavingRole(false)
    }
  }

  const handleDelete = async (roleId) => {
    try {
      await deleteRole(roleId)
      setDeleteConfirm(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRole(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>{error}</p>
        <button
          onClick={refetch}
          className="ml-auto px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500">
            {roles.length} rol{roles.length !== 1 ? 'es' : ''} en el sistema
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Rol</span>
        </button>
      </div>

      {/* Lista de roles */}
      <div className="space-y-3">
        {roles.map(role => (
          <div
            key={role.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Icono */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRoleColor(role.name)}`}>
                <Shield className="w-6 h-6" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {role.display_name}
                  </h3>
                  {role.is_system && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Lock className="w-3 h-3" />
                      Sistema
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  {role.description || 'Sin descripción'}
                </p>

                {/* Módulos asignados */}
                <div className="flex flex-wrap gap-1">
                  {role.default_modules && role.default_modules.length > 0 ? (
                    role.default_modules.slice(0, 5).map(dm => (
                      <span
                        key={dm.module_id}
                        className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {dm.module?.name || 'Módulo'}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Sin módulos asignados</span>
                  )}
                  {role.default_modules && role.default_modules.length > 5 && (
                    <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                      +{role.default_modules.length - 5} más
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(role)}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {!role.is_system && (
                  <button
                    onClick={() => setDeleteConfirm(role)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Sobre los módulos por defecto</p>
            <p>
              Los módulos que asignes a un rol se aplicarán automáticamente a los nuevos usuarios creados con ese rol.
              Podés agregar módulos adicionales a usuarios específicos desde la gestión de usuarios.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <RoleFormModal
          role={editingRole}
          onSave={handleSave}
          onClose={handleCloseModal}
          loading={savingRole}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar Rol</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que querés eliminar el rol <strong>{deleteConfirm.display_name}</strong>?
              Los usuarios que tengan este rol quedarán sin rol asignado.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RolesTab
