import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  MessageSquare, 
  Bell, 
  BookOpen, 
  Calculator, 
  Settings,
  LogOut,
  X,
  ChevronDown
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Gestión de Usuarios', icon: Users, path: '/usuarios' },
  { name: 'Clientes', icon: Briefcase, path: '/clientes' },
  { name: 'Facturación', icon: FileText, path: '/facturacion' },
  { name: 'Gastos', icon: Receipt, path: '/gastos' },
  { name: 'Mensajes', icon: MessageSquare, path: '/mensajes' },
  { name: 'Notificaciones', icon: Bell, path: '/notificaciones' },
  { name: 'Biblioteca', icon: BookOpen, path: '/biblioteca' },
  { name: 'Herramientas', icon: Calculator, path: '/herramientas' },
  { name: 'Configuración', icon: Settings, path: '/configuracion' },
]

export function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-gray-900">MonotributistApp</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group
                    ${isActive 
                      ? 'bg-violet-50 text-violet-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon 
                        size={20} 
                        strokeWidth={1.5}
                        className={isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'}
                      />
                      <span className="font-medium text-sm">{item.name}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50">
            <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">{getUserInitial()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span className="font-medium text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
