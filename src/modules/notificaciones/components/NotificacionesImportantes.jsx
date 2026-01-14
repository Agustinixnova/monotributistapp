import { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { getMyNotifications } from '../services/clientNotificationsService'
import { useAuth } from '../../../auth/hooks/useAuth'

const PRIORITY_CONFIG = {
  urgent: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
    label: 'Urgente'
  },
  important: {
    icon: AlertCircle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
    label: 'Importante'
  },
  normal: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
    label: 'Informativo'
  }
}

function NotificationCard({ notification, onDismiss }) {
  const config = PRIORITY_CONFIG[notification.priority] || PRIORITY_CONFIG.normal
  const Icon = config.icon

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 relative`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5`}>
          <Icon size={20} className={config.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase ${config.titleColor}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              hasta {formatDate(notification.expires_at)}
            </span>
          </div>
          <p className={`text-sm ${config.textColor} whitespace-pre-wrap`}>
            {notification.message}
          </p>
          {notification.created_by_profile && (
            <p className="text-xs text-gray-500 mt-2">
              - {notification.created_by_profile.nombre} {notification.created_by_profile.apellido}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/50 transition-colors"
            title="Ocultar"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}

export function NotificacionesImportantes() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(() => {
    // Cargar notificaciones descartadas del localStorage
    const stored = localStorage.getItem('dismissedNotifications')
    return stored ? JSON.parse(stored) : []
  })

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return

      try {
        const data = await getMyNotifications(user.id)
        setNotifications(data)
      } catch (err) {
        console.error('Error loading notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user?.id])

  const handleDismiss = (notificationId) => {
    const newDismissed = [...dismissed, notificationId]
    setDismissed(newDismissed)
    localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed))
  }

  // Filtrar notificaciones descartadas
  const visibleNotifications = notifications.filter(n => !dismissed.includes(n.id))

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {visibleNotifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  )
}
