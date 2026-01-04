import { Menu, Bell } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { RenewalBadgeCompact } from '../../modules/subscriptions/components/RenewalBadge'

export function Header({ onMenuClick, title = 'Dashboard', onRenewalClick }) {
  const { user } = useAuth()

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

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

          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User avatar */}
          <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{getUserInitial()}</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
