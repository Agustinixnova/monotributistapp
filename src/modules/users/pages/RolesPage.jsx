import { useState } from 'react'
import { Plus, AlertCircle, Shield } from 'lucide-react'
import { useRoles, useRole } from '../hooks/useRoles'
import { RoleList, RoleForm } from '../components'
import { Layout } from '../../../components/layout'

/**
 * Página de gestión de roles
 */
export function RolesPage() {
  const { roles, loading, error, createRole, updateRole, deleteRole, refetch } = useRoles()

  const [showForm, setShowForm] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Obtener rol completo para editar (con módulos)
  const { role: editingRole, loading: loadingRole } = useRole(editingRoleId)

  const handleCreate = async (roleData) => {
    setFormLoading(true)
    try {
      await createRole(roleData)
      setShowForm(false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (roleData) => {
    if (!editingRoleId) return
    setFormLoading(true)
    try {
      await updateRole(editingRoleId, roleData)
      setShowForm(false)
      setEditingRoleId(null)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (role) => {
    setEditingRoleId(role.id)
    setShowForm(true)
  }

  const handleDelete = async (roleId) => {
    try {
      await deleteRole(roleId)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting role:', err)
      alert(err.message)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingRoleId(null)
  }

  return (
    <Layout title="Gestión de Roles">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Roles</h1>
          <p className="text-gray-500 mt-1">
            Configura los roles y sus permisos por defecto
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Rol</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
          <button
            onClick={refetch}
            className="ml-auto px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Info sobre roles de sistema */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Roles de sistema</p>
          <p className="mt-1">
            Los roles marcados como "Sistema" no pueden ser eliminados ya que son fundamentales para el funcionamiento de la aplicación.
            Puedes modificar sus módulos asignados, pero no su identificador.
          </p>
        </div>
      </div>

      {/* Lista de roles */}
      <RoleList
        roles={roles}
        loading={loading}
        onEdit={handleEdit}
        onDelete={(roleId) => setDeleteConfirm(roleId)}
      />

      {/* Modal de formulario */}
      {showForm && (
        <RoleForm
          role={editingRole}
          onSubmit={editingRoleId ? handleUpdate : handleCreate}
          onCancel={handleCancelForm}
          loading={formLoading || loadingRole}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default RolesPage
