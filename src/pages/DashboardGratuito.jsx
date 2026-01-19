import { Link } from 'react-router-dom'
import { Layout } from '../components/layout'
import { Wallet, TrendingUp, Wallet2, BookOpen, User, ChevronRight } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const HERRAMIENTAS = [
  {
    id: 'mis-finanzas',
    titulo: 'Mis Finanzas',
    descripcion: 'Control de gastos e ingresos personales',
    icono: Wallet,
    ruta: '/herramientas/mis-finanzas',
    color: 'violet'
  },
  {
    id: 'panel-economico',
    titulo: 'Panel Económico',
    descripcion: 'Indicadores y datos económicos actualizados',
    icono: TrendingUp,
    ruta: '/herramientas/panel-economico',
    color: 'blue'
  },
  {
    id: 'caja-diaria',
    titulo: 'Caja Diaria',
    descripcion: 'Registrá movimientos de tu negocio',
    icono: Wallet2,
    ruta: '/herramientas/caja-diaria',
    color: 'emerald'
  },
  {
    id: 'educacion',
    titulo: 'Educación Impositiva',
    descripcion: 'Aprendé sobre impuestos y monotributo',
    icono: BookOpen,
    ruta: '/educacion',
    color: 'amber'
  },
  {
    id: 'perfil',
    titulo: 'Mi Perfil',
    descripcion: 'Configurá tu perfil y preferencias',
    icono: User,
    ruta: '/mi-perfil',
    color: 'gray'
  }
]

const colorClasses = {
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    hover: 'hover:bg-violet-100',
    border: 'border-violet-200'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    hover: 'hover:bg-blue-100',
    border: 'border-blue-200'
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    hover: 'hover:bg-emerald-100',
    border: 'border-emerald-200'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    hover: 'hover:bg-amber-100',
    border: 'border-amber-200'
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    hover: 'hover:bg-gray-100',
    border: 'border-gray-200'
  }
}

export function DashboardGratuito() {
  const { user } = useAuth()
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return

      const { data } = await supabase
        .from('usuarios_free')
        .select('nombre, apellido')
        .eq('id', user.id)
        .maybeSingle()

      if (data) {
        setNombreUsuario(data.nombre || '')
      }
      setLoading(false)
    }

    fetchUserData()
  }, [user?.id])

  const getGreeting = () => {
    const hora = new Date().getHours()
    if (hora < 12) return 'Buenos días'
    if (hora < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-3 border-violet-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header de bienvenida */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {getGreeting()}{nombreUsuario && `, ${nombreUsuario}`}! 👋
          </h1>
          <p className="text-gray-600">
            Accedé rápidamente a tus herramientas y recursos
          </p>
        </div>

        {/* Grid de herramientas */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {HERRAMIENTAS.map((herramienta) => {
            const colors = colorClasses[herramienta.color]
            const Icon = herramienta.icono

            return (
              <Link
                key={herramienta.id}
                to={herramienta.ruta}
                className={`
                  group relative overflow-hidden
                  bg-white rounded-xl border-2 ${colors.border}
                  p-6 transition-all duration-200
                  hover:shadow-lg hover:scale-[1.02]
                  ${colors.hover}
                `}
              >
                {/* Icono de fondo decorativo */}
                <div className={`absolute -right-4 -top-4 w-24 h-24 ${colors.bg} rounded-full opacity-50 group-hover:scale-110 transition-transform`} />

                {/* Contenido */}
                <div className="relative z-10">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} strokeWidth={2} />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    {herramienta.titulo}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </h3>

                  <p className="text-sm text-gray-600">
                    {herramienta.descripcion}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Banner informativo */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">💡</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                ¿Sabías que podés agregar empleados?
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Si tenés un negocio, podés crear cuentas para tus empleados y que registren movimientos en tu Caja Diaria con permisos personalizados.
              </p>
              <Link
                to="/herramientas/caja-diaria"
                className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
              >
                Ir a Caja Diaria
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
