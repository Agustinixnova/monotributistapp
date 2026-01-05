import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useSidebarModules } from '../../modules/users/hooks/useSidebarModules'
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
  HelpCircle,
  CreditCard,
  UserCircle,
  Code2,
  Lightbulb,
  Bug,
  ChevronDown,
  ChevronRight,
  Ticket,
  ChartNoAxesCombined
} from 'lucide-react'

// Mapeo de nombres de iconos a componentes de Lucide
const iconMap = {
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
  HelpCircle,
  CreditCard,
  UserCircle,
  Code2,
  Lightbulb,
  Bug,
  Ticket
}

// Items estáticos como fallback (fuente de verdad para sincronizar)
const staticMenuItems = [
  { name: 'Dashboard', icon: 'LayoutDashboard', path: '/', slug: 'dashboard' },
  { name: 'Gestión de Usuarios', icon: 'Users', path: '/usuarios', slug: 'usuarios' },
  { name: 'Clientes', icon: 'Briefcase', path: '/clientes', slug: 'clientes' },
  { name: 'Facturación', icon: 'FileText', path: '/facturacion', slug: 'facturacion' },
  { name: 'Gastos', icon: 'Receipt', path: '/gastos', slug: 'gastos' },
  { name: 'Mensajes', icon: 'MessageSquare', path: '/mensajes', slug: 'mensajes' },
  { name: 'Notificaciones', icon: 'Bell', path: '/notificaciones', slug: 'notificaciones' },
  { name: 'Biblioteca', icon: 'BookOpen', path: '/biblioteca', slug: 'biblioteca' },
  { name: 'Herramientas', icon: 'Calculator', path: '/herramientas', slug: 'herramientas' },
  { name: 'Configuración', icon: 'Settings', path: '/configuracion', slug: 'configuracion' },
]

export function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth()
  const { modules, loading: loadingModules } = useSidebarModules()
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})

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

  // Obtener el icono del componente
  const getIcon = (iconName) => {
    return iconMap[iconName] || HelpCircle
  }

  // Toggle expandir/colapsar submenú
  const toggleExpand = (slug) => {
    setExpandedMenus(prev => ({
      ...prev,
      [slug]: !prev[slug]
    }))
  }

  // Organizar módulos en estructura jerárquica
  const organizeModules = (modulesList) => {
    const parents = modulesList.filter(m => !m.parent_id)
    const children = modulesList.filter(m => m.parent_id)

    return parents.map(parent => ({
      ...parent,
      children: children.filter(child => child.parent_id === parent.id)
    }))
  }

  // Construir items del menú desde los módulos del usuario
  const rawModules = modules.length > 0
    ? modules.map(module => ({
        id: module.id,
        name: module.name,
        icon: module.icon,
        path: module.route,
        slug: module.slug,
        parent_id: module.parent_id
      }))
    : staticMenuItems

  const menuItems = modules.length > 0 ? organizeModules(rawModules) : rawModules

  // Verificar si una ruta está activa (incluyendo hijos)
  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Auto-expandir menús si estamos en una ruta hija
  useState(() => {
    menuItems.forEach(item => {
      if (item.children?.length > 0 && isPathActive(item.path)) {
        setExpandedMenus(prev => ({ ...prev, [item.slug]: true }))
      }
    })
  }, [location.pathname])

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
              <ChartNoAxesCombined className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="font-bold font-heading"><span className="text-violet-600">Mi</span><span className="text-gray-900">monotributo</span></span>
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
          {loadingModules ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = getIcon(item.icon)
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedMenus[item.slug]
                const isActive = isPathActive(item.path)

                // Item con hijos (expandible)
                if (hasChildren) {
                  return (
                    <li key={item.slug}>
                      {/* Botón padre */}
                      <button
                        onClick={() => toggleExpand(item.slug)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                          transition-all duration-200 group
                          ${isActive
                            ? 'bg-violet-50 text-violet-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent
                            size={20}
                            strokeWidth={1.5}
                            className={isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'}
                          />
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                      </button>

                      {/* Submódulos */}
                      {isExpanded && (
                        <ul className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                          {item.children.map(child => {
                            const ChildIcon = getIcon(child.icon)
                            return (
                              <li key={child.slug}>
                                <NavLink
                                  to={child.path}
                                  onClick={onClose}
                                  className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2 rounded-lg
                                    transition-all duration-200 group
                                    ${isActive
                                      ? 'bg-violet-50 text-violet-700'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                  `}
                                >
                                  {({ isActive }) => (
                                    <>
                                      <ChildIcon
                                        size={18}
                                        strokeWidth={1.5}
                                        className={isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'}
                                      />
                                      <span className="font-medium text-sm">{child.name}</span>
                                    </>
                                  )}
                                </NavLink>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                }

                // Item simple (sin hijos)
                return (
                  <li key={item.path || item.slug}>
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
                          <IconComponent
                            size={20}
                            strokeWidth={1.5}
                            className={isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'}
                          />
                          <span className="font-medium text-sm">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          )}
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
              <p className="text-xs text-gray-500">
                {user?.user_metadata?.role || 'Usuario'}
              </p>
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

// Exportar items estáticos para sincronización
export { staticMenuItems }
