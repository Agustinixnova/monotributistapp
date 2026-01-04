import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { validateLoginForm } from '../utils/validators'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export function LoginForm({ onSuccess }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({ email: null, password: null })
  const [serverError, setServerError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    const validation = validateLoginForm(email, password)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({ email: null, password: null })
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setServerError('Email o contraseña incorrectos')
        } else {
          setServerError('Error al iniciar sesión. Intenta nuevamente.')
        }
        return
      }

      onSuccess?.()
    } catch {
      setServerError('Error de conexión. Verifica tu internet.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <div 
          className={`
            flex items-center gap-3 h-[52px] px-4
            bg-white border rounded-xl
            transition-all duration-200
            focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20
            ${errors.email 
              ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <Mail size={20} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <div 
          className={`
            flex items-center gap-3 h-[52px] px-4
            bg-white border rounded-xl
            transition-all duration-200
            focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20
            ${errors.password 
              ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <Lock size={20} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Remember & Forgot */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
          />
          <span className="text-sm text-gray-600">Recordarme</span>
        </label>
        <a 
          href="#" 
          className="text-sm text-violet-600 hover:text-violet-700 font-medium hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 text-center font-medium">{serverError}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full h-[52px] 
          rounded-xl font-semibold text-white
          transition-all duration-200 
          flex items-center justify-center gap-2
          ${isLoading
            ? 'bg-violet-400 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]'
          }
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Ingresando...</span>
          </>
        ) : (
          <>
            <span>Iniciar sesión</span>
            <ArrowRight size={20} strokeWidth={2} />
          </>
        )}
      </button>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 pt-2">
        ¿No tienes cuenta?{' '}
        <a href="#" className="text-violet-600 hover:text-violet-700 font-medium hover:underline">
          Contacta al administrador
        </a>
      </p>
    </form>
  )
}
