import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../auth/components/LoginForm'
import { useAuth } from '../auth/hooks/useAuth'
import { useEffect } from 'react'
import { ChartNoAxesCombined, CheckCircle2 } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const handleLoginSuccess = () => {
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-3 border-violet-600 border-t-transparent rounded-full" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  const features = [
    'Control total de tus clientes',
    'Facturación rápida y sencilla',
    'Alertas de vencimientos',
    'Reportes automáticos',
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <ChartNoAxesCombined className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <span className="text-white text-xl font-bold tracking-tight font-heading">
              Mimonotributo
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Gestión simple<br />
              para monotributistas
            </h1>
            <p className="text-lg text-violet-100/80 max-w-md">
              Administra tus clientes, facturas y gastos en un solo lugar. 
              Simplifica tu trabajo y ahorra tiempo.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-violet-100/90">
                <CheckCircle2 size={20} className="text-violet-300 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-violet-200/60 text-sm">
            © 2026 Mimonotributo. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <ChartNoAxesCombined className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-gray-900 text-lg font-bold tracking-tight font-heading">
              Mimonotributo
            </span>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-[400px]">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Iniciar sesión
              </h2>
              <p className="text-gray-500">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Form */}
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden p-6 pt-0">
          <p className="text-gray-400 text-xs text-center">
            © 2026 Mimonotributo
          </p>
        </div>
      </div>
    </div>
  )
}
