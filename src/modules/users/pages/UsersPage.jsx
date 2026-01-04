import { useState, useEffect } from 'react'
import { UserPlus, AlertCircle, Users, Shield } from 'lucide-react'
import { useUsers } from '../hooks/useUsers'
import { getAvailableCounters } from '../services/userService'
import { UserList, UserFilters, UserForm, AssignCounterModal, UserDetailModal, AssignClientsModal, UserInvoiceModal, RolesTab } from '../components'
import { Layout } from '../../../components/layout'

/**
 * Página principal de gestión de usuarios
 */
export function UsersPage() {
  const [activeTab, setActiveTab] = useState('usuarios')

  const {
    users,
    loading,
    error,
    filters,
    updateFilters,
    createUser,
    updateUser,
    toggleActive,
    refetch
  } = useUsers()

  const [counters, setCounters] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedUserForAssign, setSelectedUserForAssign] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null)
  const [showAssignClientsModal, setShowAssignClientsModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedUserForInvoice, setSelectedUserForInvoice] = useState(null)

  // Cargar contadores para filtros
  useEffect(() => {
    async function loadCounters() {
      try {
        const data = await getAvailableCounters()
        setCounters(data)
      } catch (err) {
        console.error('Error loading counters:', err)
      }
    }
    loadCounters()
  }, [])

  const handleCreateUser = async (userData) => {
    setFormLoading(true)
    try {
      await createUser(userData)
      setShowForm(false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateUser = async (userData) => {
    if (!editingUser) return
    setFormLoading(true)
    try {
      await updateUser(editingUser.id, userData)
      setEditingUser(null)
      setShowForm(false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleToggleActive = async (userId, isActive) => {
    try {
      await toggleActive(userId, isActive)
    } catch (err) {
      console.error('Error toggling user active:', err)
    }
  }

  const handleViewDetails = (user) => {
    setSelectedUserForDetail(user)
  }

  const handleUploadInvoice = (user) => {
    setSelectedUserForInvoice(user)
    setShowInvoiceModal(true)
  }

  const handleAssignCounter = async (counterId) => {
    if (!selectedUserForAssign) return
    setFormLoading(true)
    try {
      await updateUser(selectedUserForAssign.id, { assignedTo: counterId })
      setShowAssignModal(false)
      setSelectedUserForAssign(null)
    } finally {
      setFormLoading(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  // Mostrar formulario
  if (showForm) {
    return (
      <Layout title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <UserForm
          user={editingUser}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          onCancel={handleCancelForm}
          loading={formLoading}
        />
      </Layout>
    )
  }

  return (
    <Layout title="Gestión de Usuarios">
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'usuarios'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'roles'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              Roles
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de Usuarios */}
      {activeTab === 'usuarios' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
              <p className="text-gray-500 mt-1">
                {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAssignClientsModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Asignar Clientes</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                <span>Nuevo Usuario</span>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <UserFilters
              filters={filters}
              onFilterChange={updateFilters}
              counters={counters}
            />
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

          {/* Lista de usuarios */}
          <div className="bg-white rounded-lg border">
            <UserList
              users={users}
              loading={loading}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onViewDetails={handleViewDetails}
              onUploadInvoice={handleUploadInvoice}
            />
          </div>
        </>
      )}

      {/* Contenido de Roles */}
      {activeTab === 'roles' && (
        <RolesTab />
      )}

      {/* Modal de asignar contador */}
      {showAssignModal && selectedUserForAssign && (
        <AssignCounterModal
          user={selectedUserForAssign}
          onAssign={handleAssignCounter}
          onCancel={() => {
            setShowAssignModal(false)
            setSelectedUserForAssign(null)
          }}
          loading={formLoading}
        />
      )}

      {/* Modal de detalle de usuario */}
      {selectedUserForDetail && (
        <UserDetailModal
          user={selectedUserForDetail}
          onClose={() => setSelectedUserForDetail(null)}
        />
      )}

      {/* Modal de asignar clientes a contador */}
      {showAssignClientsModal && (
        <AssignClientsModal
          onClose={() => setShowAssignClientsModal(false)}
          onSuccess={() => {
            refetch()
            setShowAssignClientsModal(false)
          }}
        />
      )}

      {/* Modal de subir factura */}
      {showInvoiceModal && selectedUserForInvoice && (
        <UserInvoiceModal
          user={selectedUserForInvoice}
          onClose={() => {
            setShowInvoiceModal(false)
            setSelectedUserForInvoice(null)
          }}
          onSuccess={() => {
            setShowInvoiceModal(false)
            setSelectedUserForInvoice(null)
            refetch()
          }}
        />
      )}
    </Layout>
  )
}

export default UsersPage
