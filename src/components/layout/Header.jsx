import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, Wrench } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { RenewalBadgeCompact } from '../../modules/subscriptions/components/RenewalBadge'
import { NotificacionesDropdown, BadgeNotificaciones } from '../../modules/notificaciones/components'
import { useNotificacionesCount } from '../../modules/notificaciones/hooks'
import { DevToolsModal } from '../../modules/develop-tools/components'

const DEV_USER_EMAIL = 'agustin@ixnova.com.ar'

export function Header({ onMenuClick, title = 'Dashboard', onRenewalClick }) {
  const { user } = useAuth()
  const [showNotificaciones, setShowNotificaciones] = useState(false)
  const [showDevTools, setShowDevTools] = useState(false)
  const { count } = useNotificacionesCount()
  const dropdownRef = useRef(null)

  const isDevUser = user?.email === DEV_USER_EMAIL

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotificaciones(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Badge de renovación */}
          <RenewalBadgeCompact onClick={onRenewalClick} />

          {/* Dev Tools - Solo para agustin@ixnova.com.ar */}
          {isDevUser && (
            <button
              onClick={() => setShowDevTools(true)}
              className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
              title="Dev Tools"
            >
              <Wrench size={20} className="text-orange-500" />
            </button>
          )}

          {/* Notificaciones */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotificaciones(!showNotificaciones)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Bell size={20} className="text-gray-600" />
              <BadgeNotificaciones count={count} />
            </button>

            {showNotificaciones && (
              <NotificacionesDropdown onClose={() => setShowNotificaciones(false)} />
            )}
          </div>

          {/* User avatar */}
          <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{getUserInitial()}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal Dev Tools */}
      {isDevUser && (
        <DevToolsModal
          isOpen={showDevTools}
          onClose={() => setShowDevTools(false)}
        />
      )}
    </header>
  )
}
