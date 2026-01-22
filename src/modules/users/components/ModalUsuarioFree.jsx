import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Calendar, Tag, Key, Eye, EyeOff, Users, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Loader2, UserCog } from 'lucide-react'
import { getEmpleadosDeUsuario, resetUserPassword } from '../services/userService'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'

/**
 * Formatea fecha a DD/MM/YYYY HH:MM
 */
function formatearFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Badge de origen con colores
 */
function OrigenBadge({ origen }) {
  const colores = {
    recomendacion: 'bg-green-100 text-green-700',
    instagram: 'bg-pink-100 text-pink-700',
    tiktok: 'bg-gray-800 text-white',
    google: 'bg-blue-100 text-blue-700',
    otros: 'bg-gray-100 text-gray-700'
  }

  const labels = {
    recomendacion: 'Recomendación',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    google: 'Google',
    otros: 'Otros'
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${colores[origen] || colores.otros}`}>
      <Tag className="w-3 h-3" />
      {labels[origen] || origen}
    </span>
  )
}

/**
 * Componente para cambiar contraseña
 */
function CambiarPassword({ userId, userName, onSuccess }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    setLoading(true)
    setMensaje(null)

    try {
      await resetUserPassword(userId, password)
      setMensaje({ tipo: 'success', texto: 'Contraseña actualizada correctamente' })
      setPassword('')
      if (onSuccess) onSuccess()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cambiar la contraseña' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña..."
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || password.length < 6}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          Cambiar
        </button>
      </div>

      {mensaje && (
        <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {mensaje.texto}
        </div>
      )}
    </form>
  )
}

/**
 * Card de empleado
 */
function EmpleadoCard({ empleado }) {
  const [expandido, setExpandido] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <span className="text-violet-700 font-medium text-xs">
            {empleado.nombre?.charAt(0)?.toUpperCase() || '?'}
            {empleado.apellido?.charAt(0)?.toUpperCase() || ''}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">
              {empleado.nombre} {empleado.apellido}
            </span>
            {!empleado.activo_en_caja && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                Inactivo
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">{empleado.email}</span>
        </div>

        {expandido ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expandido && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100 bg-gray-50">
          <div className="space-y-3 pt-3">
            {/* Info del empleado */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {empleado.whatsapp && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Phone className="w-3 h-3" />
                  {empleado.whatsapp}
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-3 h-3" />
                {formatearFecha(empleado.created_at)}
              </div>
            </div>

            {/* Cambiar contraseña */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Cambiar contraseña del empleado:</p>
              <CambiarPassword userId={empleado.empleado_id} userName={empleado.nombre} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Modal para ver detalles de usuario free y gestionar empleados
 */
export function ModalUsuarioFree({ isOpen, onClose, usuario }) {
  const { user, impersonateUser } = useAuth()
  const [empleados, setEmpleados] = useState([])
  const [loadingEmpleados, setLoadingEmpleados] = useState(false)
  const [mostrarEmpleados, setMostrarEmpleados] = useState(true)
  const [puedeImpersonar, setPuedeImpersonar] = useState(false)
  const [impersonando, setImpersonando] = useState(false)
  const [errorImpersonar, setErrorImpersonar] = useState(null)

  // Determinar si es dueño (operador_gastos) o empleado
  const esDuenio = usuario?.role?.name === 'operador_gastos'

  // Verificar si el usuario actual tiene rol "desarrollo"
  useEffect(() => {
    const checkRolDesarrollo = async () => {
      if (!user) {
        setPuedeImpersonar(false)
        return
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('roles(name)')
          .eq('id', user.id)
          .single()

        setPuedeImpersonar(profile?.roles?.name === 'desarrollo')
      } catch {
        setPuedeImpersonar(false)
      }
    }

    if (isOpen) {
      checkRolDesarrollo()
    }
  }, [user, isOpen])

  useEffect(() => {
    if (isOpen && usuario && esDuenio) {
      fetchEmpleados()
    }
  }, [isOpen, usuario, esDuenio])

  const fetchEmpleados = async () => {
    setLoadingEmpleados(true)
    try {
      const data = await getEmpleadosDeUsuario(usuario.id)
      setEmpleados(data)
    } catch (err) {
      console.error('Error fetching empleados:', err)
    } finally {
      setLoadingEmpleados(false)
    }
  }

  const handleImpersonar = async () => {
    setImpersonando(true)
    setErrorImpersonar(null)

    const result = await impersonateUser(usuario.id)

    if (!result.success) {
      setErrorImpersonar(result.error)
      setImpersonando(false)
    }
    // Si es exitoso, la página se recargará automáticamente
  }

  if (!isOpen || !usuario) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  {usuario.nombre} {usuario.apellido}
                </h3>
                <p className="text-emerald-100 text-sm">
                  {usuario.role?.display_name || usuario.role?.name || 'Usuario Free'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Información del usuario */}
            <section>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Información de registro
              </h4>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nombre completo</p>
                    <p className="text-sm font-medium text-gray-900">
                      {usuario.nombre} {usuario.apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estado</p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${
                      usuario.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {usuario.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {usuario.email}
                  </p>
                </div>

                {usuario.whatsapp && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {usuario.whatsapp}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Origen</p>
                    <OrigenBadge origen={usuario.origen} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de registro</p>
                    <p className="text-sm text-gray-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatearFecha(usuario.created_at)}
                    </p>
                  </div>
                </div>

                {usuario.origen_detalle && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Detalle de origen</p>
                    <p className="text-sm text-gray-600 italic">{usuario.origen_detalle}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Cambiar contraseña */}
            <section>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-400" />
                Cambiar contraseña
              </h4>
              <CambiarPassword userId={usuario.id} userName={usuario.nombre} />
            </section>

            {/* Empleados (solo si es dueño) */}
            {esDuenio && (
              <section>
                <button
                  onClick={() => setMostrarEmpleados(!mostrarEmpleados)}
                  className="w-full flex items-center justify-between font-medium text-gray-900 mb-3"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    Empleados ({empleados.length})
                  </span>
                  {mostrarEmpleados ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {mostrarEmpleados && (
                  <>
                    {loadingEmpleados ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                      </div>
                    ) : empleados.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Este usuario no tiene empleados</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {empleados.map(empleado => (
                          <EmpleadoCard key={empleado.id} empleado={empleado} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-3 flex-shrink-0 space-y-3">
            {/* Error de impersonación */}
            {errorImpersonar && (
              <div className="flex items-center gap-2 text-sm p-2 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {errorImpersonar}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>

              {/* Botón de impersonar - solo visible para rol desarrollo */}
              {puedeImpersonar && (
                <button
                  onClick={handleImpersonar}
                  disabled={impersonando}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:bg-amber-300 flex items-center justify-center gap-2"
                >
                  {impersonando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      <UserCog className="w-4 h-4" />
                      Impersonar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalUsuarioFree
