import { useState, useRef, useEffect } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle, User, CreditCard, Calendar } from 'lucide-react'
import { adminSubscriptionService } from '../../admin/subscriptions/services/adminSubscriptionService'

/**
 * Modal para subir facturas de un usuario desde la gestión de usuarios
 * Autocompleta datos desde la suscripción activa del usuario
 */
export function UserInvoiceModal({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [invoiceId, setInvoiceId] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const inputRef = useRef(null)

  // Get the most recent subscription (by ends_at) - this handles renewals correctly
  // When a user renews before expiration, the new subscription has a later ends_at
  const activeSub = user.subscription
    ?.filter(s => s.status === 'active' || s.status === 'grace_period' || s.status === 'pending_payment')
    ?.sort((a, b) => new Date(b.ends_at) - new Date(a.ends_at))[0]

  // Form state - autocompletado desde la suscripción
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    periodStart: '',
    periodEnd: ''
  })

  // Autocompletar datos cuando carga el modal
  useEffect(() => {
    if (activeSub) {
      // Calcular monto total de la suscripción
      const amount = activeSub.total_amount || (activeSub.price_per_month * (activeSub.duration_months || 1))

      // Descripción con nombre del plan
      const planName = activeSub.plan?.name || activeSub.plan_name || 'Plan'
      const description = `Suscripción ${planName} - Mimonotributo`

      // Fechas de la suscripción
      const periodStart = activeSub.starts_at
        ? new Date(activeSub.starts_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]

      const periodEnd = activeSub.ends_at
        ? new Date(activeSub.ends_at).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      setFormData({
        amount: amount?.toString() || '',
        description,
        periodStart,
        periodEnd
      })
    }
  }, [activeSub])

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file) => {
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB')
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!formData.amount || isNaN(Number(formData.amount))) {
      setError('Ingresá un monto válido')
      return
    }

    if (!selectedFile) {
      setError('Seleccioná un archivo PDF')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Crear la factura
      const invoice = await adminSubscriptionService.createInvoice({
        userId: user.id,
        subscriptionId: activeSub?.id || null,
        amount: Number(formData.amount),
        description: formData.description,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd
      })

      setInvoiceId(invoice.id)

      // 2. Subir el PDF
      await adminSubscriptionService.uploadInvoiceFile(invoice.id, selectedFile)

      // 3. Mostrar éxito
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err) {
      console.error('Error creating invoice:', err)
      setError(err.message || 'Error al crear la factura')
    } finally {
      setLoading(false)
    }
  }

  const formatFullName = () => {
    return `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email
  }

  const formatPrice = (amount) => {
    if (!amount) return ''
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Si el usuario no tiene suscripción activa
  if (!activeSub) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cargar Factura</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin suscripción activa</h3>
            <p className="text-gray-500 mb-4">
              Este usuario no tiene una suscripción activa. Primero debe contratar un plan para poder cargarle una factura.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Estado de éxito
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Factura creada</h3>
          <p className="text-gray-500">La factura se guardó correctamente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Cargar Factura</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{formatFullName()}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Plan Info */}
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl mb-6 text-green-700">
            <CreditCard className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">{activeSub.plan?.name || activeSub.plan_name || 'Plan'}</p>
              <p className="text-sm text-green-600">
                {activeSub.starts_at && adminSubscriptionService.formatDate(activeSub.starts_at)} - {activeSub.ends_at && adminSubscriptionService.formatDate(activeSub.ends_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatPrice(activeSub.total_amount || activeSub.price_per_month)}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período desde
                </label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => handleFormChange('periodStart', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período hasta
                </label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => handleFormChange('periodEnd', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factura PDF <span className="text-red-500">*</span>
            </label>

            {selectedFile ? (
              // Archivo seleccionado
              <div className="p-4 border-2 border-green-300 border-dashed rounded-xl bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              // Zona de drop
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />

                <p className={`font-medium text-sm ${dragActive ? 'text-blue-700' : 'text-gray-700'}`}>
                  {dragActive ? 'Soltá el archivo aquí' : 'Arrastrá el PDF o hacé clic'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Máximo 10MB</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedFile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Guardar Factura
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserInvoiceModal
