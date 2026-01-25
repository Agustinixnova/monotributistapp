import { useNavigate, Link } from 'react-router-dom'
import { RegisterForm } from '../auth/components/RegisterForm'
import { LoginForm } from '../auth/components/LoginForm'
import { useAuth } from '../auth/hooks/useAuth'
import { useEffect, useState } from 'react'
import { ChartNoAxesCombined, CheckCircle2, Gift, Mail, Sparkles, LogIn, X } from 'lucide-react'

export function Register() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const handleRegisterSuccess = (needsConfirmation, message, needsManualLogin = false) => {
    if (needsManualLogin) {
      // Usuario creado pero necesita login manual
      setConfirmationText(message || 'Cuenta creada exitosamente. Por favor inicia sesión.')
      setShowConfirmationMessage(true)
    } else if (needsConfirmation) {
      setConfirmationText(message || 'Te enviamos un email para confirmar tu cuenta')
      setShowConfirmationMessage(true)
    } else {
      // Login automático exitoso
      navigate('/', { replace: true })
    }
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
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

  const beneficios = [
    'Caja Diaria para tu negocio',
    'Control de finanzas personales',
    'Indicadores económicos en tiempo real',
    'Educación impositiva gratuita',
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
          {/* Logo y Botón Próximamente */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ChartNoAxesCombined className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-xl font-bold tracking-tight font-heading">
                <span className="text-violet-300">Mi</span><span className="text-white">monotributo</span>
              </span>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Próximamente</span>
            </Link>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Gift className="w-5 h-5 text-violet-300" />
              <span className="text-white font-medium">100% Gratis</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Herramientas<br />
              para tu negocio
            </h1>
            <p className="text-lg text-violet-100/80 max-w-md">
              Registrate gratis y accedé a herramientas que te van a simplificar
              el día a día de tu emprendimiento.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {beneficios.map((beneficio, index) => (
              <li key={index} className="flex items-center gap-3 text-violet-100/90">
                <CheckCircle2 size={20} className="text-violet-300 flex-shrink-0" />
                <span>{beneficio}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 space-y-2">
          <p className="text-violet-200/60 text-sm">
            © 2026 Mimonotributo. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 text-sm">
            <Link to="/terminos" className="text-violet-300/70 hover:text-white transition-colors">
              Términos y Condiciones
            </Link>
            <Link to="/privacidad" className="text-violet-300/70 hover:text-white transition-colors">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Desktop Header - Botón Iniciar sesión */}
        <div className="hidden lg:flex justify-end p-6 pb-0">
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-lg shadow-violet-200"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar sesión</span>
          </button>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                <ChartNoAxesCombined className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-lg font-bold tracking-tight font-heading">
                <span className="text-violet-600">Mi</span><span className="text-gray-900">monotributo</span>
              </span>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar sesión</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-[420px]">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Crear cuenta gratis
              </h2>
              <p className="text-gray-500">
                Completá tus datos para acceder a las herramientas
              </p>
            </div>

            {/* Form or Confirmation Message */}
            {showConfirmationMessage ? (
              <div className="space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                    {confirmationText.includes('inicia sesión') ? (
                      <CheckCircle2 className="w-8 h-8 text-violet-600" />
                    ) : (
                      <Mail className="w-8 h-8 text-violet-600" />
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {confirmationText.includes('inicia sesión') ? '¡Cuenta creada!' : 'Revisa tu email'}
                  </h3>
                  <p className="text-gray-600">
                    {confirmationText}
                  </p>
                  {!confirmationText.includes('inicia sesión') && (
                    <p className="text-sm text-gray-500 mt-4">
                      Hacé click en el link del email para activar tu cuenta y comenzar a usar todas las herramientas.
                    </p>
                  )}
                </div>

                {/* Action */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full h-[52px] rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors flex items-center justify-center"
                  >
                    Iniciar sesión
                  </button>

                  {!confirmationText.includes('inicia sesión') && (
                    <p className="text-xs text-center text-gray-500">
                      Si no recibiste el email, revisa tu carpeta de spam
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <RegisterForm onSuccess={handleRegisterSuccess} />
            )}

            {/* Link to Login */}
            {!showConfirmationMessage && (
              <p className="mt-6 text-center text-gray-600">
                ¿Ya tenés cuenta?{' '}
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-violet-600 hover:text-violet-700 font-medium hover:underline"
                >
                  Iniciar sesión
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden p-6 pt-0 space-y-2">
          <p className="text-gray-400 text-xs text-center">
            © 2026 Mimonotributo
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <Link to="/terminos" className="text-gray-400 hover:text-gray-600">
              Términos
            </Link>
            <Link to="/privacidad" className="text-gray-400 hover:text-gray-600">
              Privacidad
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Login */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
                <p className="text-gray-500 text-sm mt-1">Ingresá tus credenciales</p>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <LoginForm onSuccess={handleLoginSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
