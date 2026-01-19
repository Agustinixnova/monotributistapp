import { useState, useEffect } from 'react'
import { Layout } from '../components/layout'
import { useAuth } from '../auth/hooks/useAuth'
import { supabase } from '../lib/supabase'
import { User, Mail, Phone, Lock, Save, Loader2 } from 'lucide-react'

export function MiPerfil() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    whatsapp: '',
    nuevaPassword: '',
    confirmarPassword: ''
  })

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return

      // Buscar en usuarios_free
      const { data: freeUserData, error } = await supabase
        .from('usuarios_free')
        .select('nombre, apellido, email, whatsapp')
        .eq('id', user.id)
        .single()

      if (!error && freeUserData) {
        setFormData({
          nombre: freeUserData.nombre || '',
          apellido: freeUserData.apellido || '',
          email: freeUserData.email || '',
          whatsapp: freeUserData.whatsapp || '',
          nuevaPassword: '',
          confirmarPassword: ''
        })
      }

      setLoading(false)
    }

    fetchUserData()
  }, [user?.id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)

    try {
      // Validar contraseñas si se están cambiando
      if (formData.nuevaPassword) {
        if (formData.nuevaPassword.length < 6) {
          setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
          setSaving(false)
          return
        }

        if (formData.nuevaPassword !== formData.confirmarPassword) {
          setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
          setSaving(false)
          return
        }
      }

      // Actualizar datos en usuarios_free
      const { error: updateError } = await supabase
        .from('usuarios_free')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          whatsapp: formData.whatsapp
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Actualizar contraseña si se proporcionó
      if (formData.nuevaPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.nuevaPassword
        })

        if (passwordError) throw passwordError
      }

      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })

      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        nuevaPassword: '',
        confirmarPassword: ''
      }))
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      setMessage({ type: 'error', text: error.message || 'Error al actualizar el perfil' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Mi Perfil">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Mi Perfil">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">
            Actualizá tus datos personales y contraseña
          </p>
        </div>

        {/* Mensaje de éxito/error */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </h2>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                El email no puede ser modificado
              </p>
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="w-4 h-4 inline mr-1" />
                WhatsApp
              </label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                required
                placeholder="+54 11 1234-5678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Cambiar Contraseña */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Cambiar Contraseña
            </h2>

            <div>
              <label htmlFor="nuevaPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="nuevaPassword"
                name="nuevaPassword"
                value={formData.nuevaPassword}
                onChange={handleChange}
                placeholder="Dejar vacío para no cambiar"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres. Dejar vacío si no querés cambiarla.
              </p>
            </div>

            {formData.nuevaPassword && (
              <div>
                <label htmlFor="confirmarPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="confirmarPassword"
                  name="confirmarPassword"
                  value={formData.confirmarPassword}
                  onChange={handleChange}
                  placeholder="Repetir contraseña"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white
                transition-all duration-200
                ${saving
                  ? 'bg-violet-400 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 active:scale-95'
                }
              `}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
