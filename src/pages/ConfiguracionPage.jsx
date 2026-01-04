import { NavLink } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Settings, CreditCard, User, Bell, Shield, Palette } from 'lucide-react'

const configItems = [
  {
    name: 'Suscripciones',
    description: 'Gestión de planes, pagos y facturación',
    icon: CreditCard,
    path: '/configuracion/suscripciones',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Mi Perfil',
    description: 'Datos personales y contraseña',
    icon: User,
    path: '/configuracion/perfil',
    color: 'bg-violet-100 text-violet-600',
    disabled: true
  },
  {
    name: 'Notificaciones',
    description: 'Preferencias de alertas y emails',
    icon: Bell,
    path: '/configuracion/notificaciones',
    color: 'bg-orange-100 text-orange-600',
    disabled: true
  },
  {
    name: 'Seguridad',
    description: 'Autenticación y sesiones',
    icon: Shield,
    path: '/configuracion/seguridad',
    color: 'bg-green-100 text-green-600',
    disabled: true
  },
  {
    name: 'Apariencia',
    description: 'Tema y personalización visual',
    icon: Palette,
    path: '/configuracion/apariencia',
    color: 'bg-pink-100 text-pink-600',
    disabled: true
  }
]

export function ConfiguracionPage() {
  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-500">Administrá tu cuenta y preferencias</p>
          </div>
        </div>

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configItems.map((item) => (
            item.disabled ? (
              <div
                key={item.path}
                className="p-5 rounded-xl border-2 border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <span className="inline-block mt-2 text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                      Próximamente
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className="p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              </NavLink>
            )
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default ConfiguracionPage
