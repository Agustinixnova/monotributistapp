import { useState, useEffect } from 'react'
import { FileText, Download, Upload, X, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Search, User, Plus } from 'lucide-react'
import { adminSubscriptionService } from '../services/adminSubscriptionService'
import { getUsers } from '../../../users/services/userService'
import { InvoiceUploader } from './InvoiceUploader'

/**
 * Lista de facturas con buscador de usuarios para cargar nuevas facturas
 */
export function InvoicesList() {
  // State para facturas
  const [invoices, setInvoices] = useState([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [errorInvoices, setErrorInvoices] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState(null)

  // State para búsqueda de usuarios
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)

  // State para modal de nueva factura
  const [selectedUser, setSelectedUser] = useState(null)
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false)
  const [newInvoiceData, setNewInvoiceData] = useState({
    amount: '',
    description: 'Suscripción mensual',
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [newInvoiceId, setNewInvoiceId] = useState(null)
  const [invoiceStep, setInvoiceStep] = useState('form') // 'form' | 'upload' | 'success'

  useEffect(() => {
    loadInvoices()
  }, [page])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers()
    } else {
      setUsers([])
    }
  }, [searchQuery])

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true)
      setErrorInvoices(null)
      const result = await adminSubscriptionService.getInvoices({ page, limit: 10 })
      setInvoices(result.data)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Error loading invoices:', err)
      setErrorInvoices('Error al cargar las facturas')
    } finally {
      setLoadingInvoices(false)
    }
  }

  const searchUsers = async () => {
    try {
      setLoadingUsers(true)
      const data = await getUsers({ search: searchQuery })
      setUsers(data || [])
    } catch (err) {
      console.error('Error searching users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleDownload = async (invoice) => {
    try {
      const url = await adminSubscriptionService.getInvoiceDownloadUrl(invoice.id)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error getting download URL:', err)
      alert('Error al obtener la URL de descarga')
    }
  }

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setShowUserSearch(false)
    setSearchQuery('')
    setUsers([])
    setShowNewInvoiceModal(true)
    setInvoiceStep('form')
    setNewInvoiceId(null)
    setNewInvoiceData({
      amount: '',
      description: 'Suscripción mensual',
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
  }

  const handleCreateInvoice = async () => {
    if (!newInvoiceData.amount || isNaN(Number(newInvoiceData.amount))) {
      alert('Ingresá un monto válido')
      return
    }

    setCreatingInvoice(true)
    try {
      const activeSub = selectedUser.subscription?.find(s => s.status === 'active' || s.status === 'grace_period')

      const invoice = await adminSubscriptionService.createInvoice({
        userId: selectedUser.id,
        subscriptionId: activeSub?.id || null,
        amount: Number(newInvoiceData.amount),
        description: newInvoiceData.description,
        periodStart: newInvoiceData.periodStart,
        periodEnd: newInvoiceData.periodEnd
      })

      setNewInvoiceId(invoice.id)
      setInvoiceStep('upload')
    } catch (err) {
      console.error('Error creating invoice:', err)
      alert(err.message || 'Error al crear la factura')
    } finally {
      setCreatingInvoice(false)
    }
  }

  const handleInvoiceUploadSuccess = () => {
    setInvoiceStep('success')
    setTimeout(() => {
      setShowNewInvoiceModal(false)
      setSelectedUser(null)
      loadInvoices()
    }, 1500)
  }

  const handleCloseModal = () => {
    setShowNewInvoiceModal(false)
    setSelectedUser(null)
    if (newInvoiceId) {
      loadInvoices()
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-blue-100 text-blue-700',
      viewed: 'bg-green-100 text-green-700',
      paid: 'bg-green-200 text-green-800'
    }

    const labels = {
      pending: 'Pendiente',
      sent: 'Enviada',
      viewed: 'Vista',
      paid: 'Pagada'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const formatFullName = (user) => {
    return `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || user?.email || 'Sin nombre'
  }

  return (
    <div className="space-y-6">
      {/* Header con buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Facturas</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón nueva factura */}
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Factura</span>
          </button>

          <button
            onClick={loadInvoices}
            disabled={loadingInvoices}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loadingInvoices ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Buscador de usuarios */}
      {showUserSearch && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar cliente para cargar factura
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {loadingUsers && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loadingUsers && users.length > 0 && (
            <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{formatFullName(user)}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {user.subscription?.find(s => s.status === 'active')?.plan?.name || 'Sin plan'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loadingUsers && searchQuery.length >= 2 && users.length === 0 && (
            <p className="text-center text-gray-500 py-4">No se encontraron usuarios</p>
          )}

          {searchQuery.length < 2 && (
            <p className="text-center text-gray-400 text-sm py-2">Escribí al menos 2 caracteres para buscar</p>
          )}
        </div>
      )}

      {/* Error */}
      {errorInvoices && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorInvoices}</span>
        </div>
      )}

      {/* Lista de facturas */}
      {loadingInvoices && invoices.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay facturas registradas</p>
          <p className="text-gray-400 text-sm mt-1">Usá el botón "Nueva Factura" para cargar una</p>
        </div>
      ) : (
        <>
          {/* Tabla en desktop */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Número</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Monto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Período</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900">{formatFullName(invoice.profiles)}</p>
                      <p className="text-sm text-gray-500">{invoice.profiles?.email}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {adminSubscriptionService.formatPrice(invoice.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {invoice.period_start && invoice.period_end ? (
                        <>
                          {adminSubscriptionService.formatDate(invoice.period_start)}
                          <span className="mx-1">-</span>
                          {adminSubscriptionService.formatDate(invoice.period_end)}
                        </>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-3 px-4">
                      {invoice.file_url ? (
                        <button
                          onClick={() => handleDownload(invoice)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </button>
                      ) : (
                        <button
                          onClick={() => setUploadingInvoiceId(invoice.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Subir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards en mobile */}
          <div className="md:hidden space-y-3">
            {invoices.map(invoice => (
              <div key={invoice.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-600">{formatFullName(invoice.profiles)}</p>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Monto</p>
                    <p className="font-medium text-gray-900">
                      {adminSubscriptionService.formatPrice(invoice.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Período</p>
                    <p className="font-medium text-gray-900">
                      {invoice.period_start
                        ? adminSubscriptionService.formatDate(invoice.period_start)
                        : '-'}
                    </p>
                  </div>
                </div>

                {invoice.file_url ? (
                  <button
                    onClick={() => handleDownload(invoice)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar PDF
                  </button>
                ) : (
                  <button
                    onClick={() => setUploadingInvoiceId(invoice.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Subir PDF
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="px-4 py-2 text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de subir PDF a factura existente */}
      {uploadingInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Subir factura
              </h3>
              <button
                onClick={() => setUploadingInvoiceId(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <InvoiceUploader
                invoiceId={uploadingInvoiceId}
                onSuccess={() => {
                  setUploadingInvoiceId(null)
                  loadInvoices()
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de nueva factura */}
      {showNewInvoiceModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {invoiceStep === 'form' && 'Nueva Factura'}
                {invoiceStep === 'upload' && 'Subir PDF'}
                {invoiceStep === 'success' && 'Factura Creada'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {/* Info del usuario */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{formatFullName(selectedUser)}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              {invoiceStep === 'form' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={newInvoiceData.amount}
                        onChange={(e) => setNewInvoiceData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={newInvoiceData.description}
                      onChange={(e) => setNewInvoiceData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Período desde
                      </label>
                      <input
                        type="date"
                        value={newInvoiceData.periodStart}
                        onChange={(e) => setNewInvoiceData(prev => ({ ...prev, periodStart: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Período hasta
                      </label>
                      <input
                        type="date"
                        value={newInvoiceData.periodEnd}
                        onChange={(e) => setNewInvoiceData(prev => ({ ...prev, periodEnd: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {invoiceStep === 'upload' && (
                <InvoiceUploader
                  invoiceId={newInvoiceId}
                  onSuccess={handleInvoiceUploadSuccess}
                />
              )}

              {invoiceStep === 'success' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Factura creada</h4>
                  <p className="text-gray-500">La factura se guardó correctamente</p>
                </div>
              )}
            </div>

            {invoiceStep === 'form' && (
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={creatingInvoice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creatingInvoice ? 'Creando...' : 'Continuar'}
                </button>
              </div>
            )}

            {invoiceStep === 'upload' && (
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Omitir PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoicesList
