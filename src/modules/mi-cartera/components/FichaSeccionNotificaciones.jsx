import { useState, useEffect } from 'react'
import {
  Bell, Plus, Trash2, AlertTriangle, AlertCircle, Info,
  Calendar, X, Check, Loader2
} from 'lucide-react'
import {
  getAllNotificationsForClient,
  createNotification,
  updateNotification,
  deleteNotification
} from '../../notificaciones/services/clientNotificationsService'
import { useAuth } from '../../../auth/hooks/useAuth'

const PRIORITY_OPTIONS = [
  {
    value: 'urgent',
    label: 'Urgente',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    selectedBg: 'bg-red-100'
  },
  {
    value: 'important',
    label: 'Importante',
    icon: AlertCircle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    selectedBg: 'bg-amber-100'
  },
  {
    value: 'normal',
    label: 'Informativo',
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    selectedBg: 'bg-blue-100'
  }
]

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function isExpired(expiresAt) {
  return new Date(expiresAt) < new Date()
}

function NotificationItem({ notification, onEdit, onDelete, deleting }) {
  const priority = PRIORITY_OPTIONS.find(p => p.value === notification.priority) || PRIORITY_OPTIONS[2]
  const Icon = priority.icon
  const expired = isExpired(notification.expires_at)

  return (
    <div className={`${priority.bgColor} ${priority.borderColor} border rounded-lg p-3 ${expired ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={priority.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase ${priority.color}`}>
              {priority.label}
            </span>
            {expired && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                Expirada
              </span>
            )}
            {!notification.is_active && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                Inactiva
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{notification.message}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Hasta {formatDate(notification.expires_at)}
            </span>
            {notification.created_by_profile && (
              <span>
                Por {notification.created_by_profile.nombre} {notification.created_by_profile.apellido}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(notification.id)}
          disabled={deleting}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  )
}

function NotificationForm({ onSave, onCancel, saving }) {
  const [priority, setPriority] = useState('normal')
  const [message, setMessage] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  // Default expiration: 7 days from now
  useEffect(() => {
    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 7)
    setExpiresAt(defaultDate.toISOString().split('T')[0])
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim() || !expiresAt) return

    onSave({
      priority,
      message: message.trim(),
      expires_at: new Date(expiresAt + 'T23:59:59').toISOString()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-4">
      {/* Priority selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prioridad
        </label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = priority === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  isSelected
                    ? `${option.selectedBg} ${option.borderColor} ${option.color}`
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe el mensaje para el cliente..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
          required
        />
      </div>

      {/* Expiration date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mostrar hasta
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          required
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !message.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check size={16} />
              Crear notificacion
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export function FichaSeccionNotificaciones({ clientId }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [isOpen, setIsOpen] = useState(true)

  const fetchNotifications = async () => {
    try {
      const data = await getAllNotificationsForClient(clientId)
      setNotifications(data)
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchNotifications()
    }
  }, [clientId])

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await createNotification({
        client_id: clientId,
        created_by: user.id,
        ...data
      })
      await fetchNotifications()
      setShowForm(false)
    } catch (err) {
      console.error('Error creating notification:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (notificationId) => {
    setDeleting(notificationId)
    try {
      await deleteNotification(notificationId)
      await fetchNotifications()
    } catch (err) {
      console.error('Error deleting notification:', err)
    } finally {
      setDeleting(null)
    }
  }

  // Separar notificaciones activas de expiradas/inactivas
  const activeNotifications = notifications.filter(n => n.is_active && !isExpired(n.expires_at))
  const inactiveNotifications = notifications.filter(n => !n.is_active || isExpired(n.expires_at))

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100">
            <Bell size={18} className="text-violet-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Notificaciones al Cliente</h3>
            <p className="text-xs text-gray-500">
              {activeNotifications.length} activa{activeNotifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowForm(true)
                setIsOpen(true)
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus size={16} />
              Nueva
            </button>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Form for new notification */}
              {showForm && (
                <NotificationForm
                  onSave={handleCreate}
                  onCancel={() => setShowForm(false)}
                  saving={saving}
                />
              )}

              {/* Active notifications */}
              {activeNotifications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-500 uppercase">Activas</h4>
                  {activeNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDelete={handleDelete}
                      deleting={deleting === notification.id}
                    />
                  ))}
                </div>
              )}

              {/* Inactive/expired notifications */}
              {inactiveNotifications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-500 uppercase">Expiradas / Inactivas</h4>
                  {inactiveNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDelete={handleDelete}
                      deleting={deleting === notification.id}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {notifications.length === 0 && !showForm && (
                <div className="text-center py-8">
                  <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No hay notificaciones para este cliente</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 text-violet-600 hover:text-violet-700 text-sm font-medium"
                  >
                    Crear la primera notificacion
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
