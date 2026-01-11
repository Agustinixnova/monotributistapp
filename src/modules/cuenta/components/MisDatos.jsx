import { useState } from 'react'
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Building2, FileText, MapPin } from 'lucide-react'
import { cuentaService } from '../services/cuentaService'

/**
 * Tab de Mis Datos - permite editar email, contraseña, teléfono
 * y ver datos precargados
 */
export function MisDatos({ profile, onProfileUpdate }) {
  const [editMode, setEditMode] = useState(null) // 'contact', 'email', 'password'
  const [loading, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Estados de formularios
  const [telefono, setTelefono] = useState(profile?.telefono || '')
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Estados de dirección
  const [direccion, setDireccion] = useState(profile?.direccion || '')
  const [localidad, setLocalidad] = useState(profile?.localidad || '')
  const [codigoPostal, setCodigoPostal] = useState(profile?.codigo_postal || '')
  const [provincia, setProvincia] = useState(profile?.provincia || '')

  const handleSaveContact = async () => {
    setSaving(true)
    setError(null)
    try {
      await cuentaService.updateProfile({ telefono, whatsapp })
      setSuccess('Datos de contacto actualizados')
      setEditMode(null)
      if (onProfileUpdate) onProfileUpdate()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async () => {
    setSaving(true)
    setError(null)
    try {
      await cuentaService.updateAddress({
        direccion,
        localidad,
        codigo_postal: codigoPostal,
        provincia
      })
      setSuccess('Dirección actualizada')
      setEditMode(null)
      if (onProfileUpdate) onProfileUpdate()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!newEmail) {
      setError('Ingresá el nuevo email')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await cuentaService.updateEmail(newEmail)
      setSuccess('Se envió un email de confirmación a tu nueva dirección')
      setEditMode(null)
      setNewEmail('')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async () => {
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await cuentaService.updatePassword(newPassword)
      setSuccess('Contraseña actualizada correctamente')
      setEditMode(null)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const fiscalData = profile?.fiscal_data?.[0] || profile?.fiscal_data

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Datos personales (solo lectura) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Datos Personales</h3>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre completo</label>
              <p className="text-gray-900 font-medium">
                {profile?.nombre} {profile?.apellido}
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">DNI</label>
              <p className="text-gray-900 font-medium">{profile?.dni || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Datos fiscales (solo lectura) */}
      {fiscalData && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Datos Fiscales</h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">CUIT</label>
                <p className="text-gray-900 font-medium">{fiscalData.cuit || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Razón Social</label>
                <p className="text-gray-900 font-medium">{fiscalData.razon_social || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Condición IVA</label>
                <p className="text-gray-900 font-medium">{fiscalData.condicion_iva || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                <p className="text-gray-900 font-medium">{fiscalData.categoria_monotributo || '-'}</p>
              </div>
            </div>
            {fiscalData.domicilio_fiscal && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Domicilio Fiscal</label>
                <p className="text-gray-900 font-medium">{fiscalData.domicilio_fiscal}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Datos de contacto (editable) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Datos de Contacto</h3>
          </div>
          {editMode !== 'contact' && (
            <button
              onClick={() => setEditMode('contact')}
              className="py-2.5 px-3 min-h-[44px] text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              Editar
            </button>
          )}
        </div>
        <div className="p-4">
          {editMode === 'contact' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 11 1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 11 1234-5678"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveContact}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setEditMode(null)
                    setTelefono(profile?.telefono || '')
                    setWhatsapp(profile?.whatsapp || '')
                  }}
                  className="px-4 py-2.5 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                <p className="text-gray-900 font-medium">{profile?.telefono || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">WhatsApp</label>
                <p className="text-gray-900 font-medium">{profile?.whatsapp || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dirección (editable) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Dirección</h3>
          </div>
          {editMode !== 'address' && (
            <button
              onClick={() => setEditMode('address')}
              className="py-2.5 px-3 min-h-[44px] text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              Editar
            </button>
          )}
        </div>
        <div className="p-4">
          {editMode === 'address' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Av. Corrientes 1234, Piso 5, Depto A"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                  <input
                    type="text"
                    value={localidad}
                    onChange={(e) => setLocalidad(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: CABA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 1043"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <select
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar provincia</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="CABA">Ciudad Autónoma de Buenos Aires</option>
                  <option value="Catamarca">Catamarca</option>
                  <option value="Chaco">Chaco</option>
                  <option value="Chubut">Chubut</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Corrientes">Corrientes</option>
                  <option value="Entre Ríos">Entre Ríos</option>
                  <option value="Formosa">Formosa</option>
                  <option value="Jujuy">Jujuy</option>
                  <option value="La Pampa">La Pampa</option>
                  <option value="La Rioja">La Rioja</option>
                  <option value="Mendoza">Mendoza</option>
                  <option value="Misiones">Misiones</option>
                  <option value="Neuquén">Neuquén</option>
                  <option value="Río Negro">Río Negro</option>
                  <option value="Salta">Salta</option>
                  <option value="San Juan">San Juan</option>
                  <option value="San Luis">San Luis</option>
                  <option value="Santa Cruz">Santa Cruz</option>
                  <option value="Santa Fe">Santa Fe</option>
                  <option value="Santiago del Estero">Santiago del Estero</option>
                  <option value="Tierra del Fuego">Tierra del Fuego</option>
                  <option value="Tucumán">Tucumán</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAddress}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setEditMode(null)
                    setDireccion(profile?.direccion || '')
                    setLocalidad(profile?.localidad || '')
                    setCodigoPostal(profile?.codigo_postal || '')
                    setProvincia(profile?.provincia || '')
                  }}
                  className="px-4 py-2.5 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {profile?.direccion || profile?.localidad || profile?.codigo_postal || profile?.provincia ? (
                <>
                  {profile?.direccion && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Dirección</label>
                      <p className="text-gray-900 font-medium">{profile.direccion}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Localidad</label>
                      <p className="text-gray-900 font-medium">{profile?.localidad || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Código Postal</label>
                      <p className="text-gray-900 font-medium">{profile?.codigo_postal || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Provincia</label>
                      <p className="text-gray-900 font-medium">{profile?.provincia || '-'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm">No hay dirección cargada. Hacé clic en "Editar" para agregar tu dirección.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Email</h3>
          </div>
          {editMode !== 'email' && (
            <button
              onClick={() => setEditMode('email')}
              className="py-2.5 px-3 min-h-[44px] text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              Cambiar
            </button>
          )}
        </div>
        <div className="p-4">
          {editMode === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email actual</label>
                <p className="text-gray-600">{profile?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="nuevo@email.com"
                />
              </div>
              <p className="text-sm text-gray-500">
                Se enviará un email de confirmación a la nueva dirección.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEmail}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enviar confirmación
                </button>
                <button
                  onClick={() => {
                    setEditMode(null)
                    setNewEmail('')
                  }}
                  className="px-4 py-2.5 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-900 font-medium">{profile?.email}</p>
          )}
        </div>
      </div>

      {/* Contraseña */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Contraseña</h3>
          </div>
          {editMode !== 'password' && (
            <button
              onClick={() => setEditMode('password')}
              className="py-2.5 px-3 min-h-[44px] text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              Cambiar
            </button>
          )}
        </div>
        <div className="p-4">
          {editMode === 'password' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Repetí la contraseña"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSavePassword}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setEditMode(null)
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="px-4 py-2.5 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">••••••••</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MisDatos
