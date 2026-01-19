/**
 * Modal para crear un nuevo empleado
 */

import { useState } from 'react'
import { X, User, Mail, Phone, Lock, Eye, EyeOff, UserPlus } from 'lucide-react'

export default function ModalEmpleado({ isOpen, onClose, onGuardar }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [guardando, setGuardando] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) newErrors.nombre = 'Requerido'
    if (!formData.apellido.trim()) newErrors.apellido = 'Requerido'
    if (!formData.email.trim()) {
      newErrors.email = 'Requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'Requerido'
    if (!formData.password) {
      newErrors.password = 'Requerido'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'No coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setGuardando(true)
    try {
      const result = await onGuardar({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.trim(),
        password: formData.password
      })

      if (result.success) {
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          whatsapp: '',
          password: '',
          confirmPassword: ''
        })
        onClose()
      } else {
        setErrors({ general: result.error?.message || 'Error al crear empleado' })
      }
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="bg-violet-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">Nuevo Empleado</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Error general */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`}>
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Juan"
                    required
                    className="flex-1 outline-none text-sm"
                    disabled={guardando}
                  />
                </div>
                {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${errors.apellido ? 'border-red-400' : 'border-gray-300'}`}>
                  <input
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    placeholder="Pérez"
                    required
                    className="flex-1 outline-none text-sm"
                    disabled={guardando}
                  />
                </div>
                {errors.apellido && <p className="text-xs text-red-600 mt-1">{errors.apellido}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${errors.email ? 'border-red-400' : 'border-gray-300'}`}>
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="empleado@email.com"
                  required
                  className="flex-1 outline-none text-sm"
                  disabled={guardando}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${errors.whatsapp ? 'border-red-400' : 'border-gray-300'}`}>
                <Phone className="w-4 h-4 text-gray-400" />
                <input
                  name="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+54 11 1234-5678"
                  required
                  className="flex-1 outline-none text-sm"
                  disabled={guardando}
                />
              </div>
              {errors.whatsapp && <p className="text-xs text-red-600 mt-1">{errors.whatsapp}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${errors.password ? 'border-red-400' : 'border-gray-300'}`}>
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="flex-1 outline-none text-sm"
                  disabled={guardando}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* Confirmar Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}>
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repetir contraseña"
                  required
                  minLength={6}
                  className="flex-1 outline-none text-sm"
                  disabled={guardando}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              El empleado podrá acceder a la caja con estas credenciales. Los permisos se configuran después de crearlo.
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium disabled:bg-violet-400"
              >
                {guardando ? 'Creando...' : 'Crear Empleado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
