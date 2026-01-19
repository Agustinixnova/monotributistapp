import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, HelpCircle } from 'lucide-react'

const ORIGENES = [
  { value: 'recomendacion', label: 'Recomendación de alguien' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google' },
  { value: 'otros', label: 'Otros' }
]

export function RegisterForm({ onSuccess }) {
  const { signUpFree } = useAuth()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
    origen: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido'
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'El WhatsApp es requerido'
    } else if (!/^[\d\s\-+()]+$/.test(formData.whatsapp)) {
      newErrors.whatsapp = 'Ingresa un número válido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (!formData.origen) {
      newErrors.origen = 'Selecciona cómo nos conociste'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const result = await signUpFree({
        email: formData.email.trim(),
        password: formData.password,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        whatsapp: formData.whatsapp.trim(),
        origen: formData.origen
      })

      if (result.error) {
        if (result.error.message?.includes('already registered') || result.error.message?.includes('already been registered')) {
          setServerError('Este email ya está registrado')
        } else if (result.error.message?.includes('weak password')) {
          setServerError('La contraseña es muy débil')
        } else {
          console.error('Signup error:', result.error)
          setServerError(result.error.message || 'Error al registrarse. Intenta nuevamente.')
        }
        return
      }

      // Si requiere confirmación de email, mostrar mensaje apropiado
      onSuccess?.(result.needsConfirmation, result.message)
    } catch (err) {
      console.error('Catch error:', err)
      setServerError('Error de conexión. Verifica tu internet.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClasses = (fieldName) => `
    flex items-center gap-3 h-[52px] px-4
    bg-white border rounded-xl
    transition-all duration-200
    focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20
    ${errors[fieldName]
      ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20'
      : 'border-gray-300 hover:border-gray-400'
    }
  `

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre y Apellido */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <div className={inputClasses('nombre')}>
            <User size={20} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan"
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
              disabled={isLoading}
            />
          </div>
          {errors.nombre && <p className="text-xs text-red-600">{errors.nombre}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
            Apellido
          </label>
          <div className={inputClasses('apellido')}>
            <input
              id="apellido"
              name="apellido"
              type="text"
              value={formData.apellido}
              onChange={handleChange}
              placeholder="Pérez"
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
              disabled={isLoading}
            />
          </div>
          {errors.apellido && <p className="text-xs text-red-600">{errors.apellido}</p>}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="space-y-1.5">
        <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
          WhatsApp
        </label>
        <div className={inputClasses('whatsapp')}>
          <Phone size={20} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            value={formData.whatsapp}
            onChange={handleChange}
            placeholder="+54 11 1234-5678"
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            disabled={isLoading}
          />
        </div>
        {errors.whatsapp && <p className="text-xs text-red-600">{errors.whatsapp}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <div className={inputClasses('email')}>
          <Mail size={20} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            disabled={isLoading}
          />
        </div>
        {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <div className={inputClasses('password')}>
          <Lock size={20} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
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
        {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
      </div>

      {/* Confirmar Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirmar contraseña
        </label>
        <div className={inputClasses('confirmPassword')}>
          <Lock size={20} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repite tu contraseña"
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            disabled={isLoading}
          />
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
      </div>

      {/* Origen */}
      <div className="space-y-1.5">
        <label htmlFor="origen" className="block text-sm font-medium text-gray-700">
          ¿Cómo nos conociste?
        </label>
        <div className={inputClasses('origen')}>
          <HelpCircle size={20} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <select
            id="origen"
            name="origen"
            value={formData.origen}
            onChange={handleChange}
            className="flex-1 bg-transparent outline-none text-gray-900 cursor-pointer"
            disabled={isLoading}
          >
            <option value="">Seleccionar...</option>
            {ORIGENES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {errors.origen && <p className="text-xs text-red-600">{errors.origen}</p>}
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
            <span>Registrando...</span>
          </>
        ) : (
          <>
            <span>Crear cuenta gratis</span>
            <ArrowRight size={20} strokeWidth={2} />
          </>
        )}
      </button>
    </form>
  )
}
