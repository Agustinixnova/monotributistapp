import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, MessageCircle, CreditCard, Building2, MapPin, Calendar, UserCheck, UserX, UserCog, Loader2, AlertCircle } from 'lucide-react'
import { formatFullName, formatCUIT, formatPhone, formatDateTime } from '../utils/formatters'
import { getRoleBadgeColor } from '../../../utils/roleColors'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'

/**
 * Modal para ver detalles completos de un usuario
 */
export function UserDetailModal({ user, onClose }) {
  const { user: currentUser, impersonateUser } = useAuth()
  const [puedeImpersonar, setPuedeImpersonar] = useState(false)
  const [impersonando, setImpersonando] = useState(false)
  const [errorImpersonar, setErrorImpersonar] = useState(null)

  // Verificar si el usuario actual tiene rol "desarrollo"
  useEffect(() => {
    const checkRolDesarrollo = async () => {
      if (!currentUser) {
        setPuedeImpersonar(false)
        return
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('roles(name)')
          .eq('id', currentUser.id)
          .single()

        setPuedeImpersonar(profile?.roles?.name === 'desarrollo')
      } catch {
        setPuedeImpersonar(false)
      }
    }

    if (user) {
      checkRolDesarrollo()
    }
  }, [currentUser, user])

  const handleImpersonar = async () => {
    setImpersonando(true)
    setErrorImpersonar(null)

    const result = await impersonateUser(user.id)

    if (!result.success) {
      setErrorImpersonar(result.error)
      setImpersonando(false)
    }
    // Si es exitoso, la página se recargará automáticamente
  }

  if (!user) return null

  const isMonotributista = user.role?.name === 'monotributista'
  const isRI = user.role?.name === 'responsable_inscripto'
  const hasFiscalData = user.fiscal_data?.cuit

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Detalle del Usuario</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Principal */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={formatFullName(user)}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{formatFullName(user)}</h3>
              <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role?.name)}`}>
                {user.role?.display_name}
              </span>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  user.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {user.is_active ? (
                    <>
                      <UserCheck className="w-3 h-3" />
                      Activo
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3" />
                      Inactivo
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Datos de Contacto */}
          <Section title="Datos de Contacto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataItem icon={Mail} label="Email" value={user.email} />
              <DataItem icon={Phone} label="Teléfono" value={user.telefono ? formatPhone(user.telefono) : null} />
              <DataItem icon={MessageCircle} label="WhatsApp" value={user.whatsapp ? formatPhone(user.whatsapp) : null} />
              <DataItem icon={CreditCard} label="DNI" value={user.dni} />
            </div>
          </Section>

          {/* Contador Asignado */}
          {user.assigned_counter && (
            <Section title="Contador Asignado">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user.assigned_counter.nombre} {user.assigned_counter.apellido}
                  </p>
                  <p className="text-sm text-gray-500">{user.assigned_counter.email}</p>
                </div>
              </div>
            </Section>
          )}

          {/* Datos Fiscales */}
          {hasFiscalData && (
            <Section title="Datos Fiscales">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataItem icon={Building2} label="CUIT" value={formatCUIT(user.fiscal_data.cuit)} />
                <DataItem label="Razón Social" value={user.fiscal_data.razon_social} />
                <DataItem
                  label="Tipo de Contribuyente"
                  value={user.fiscal_data.tipo_contribuyente === 'monotributista' ? 'Monotributista' : 'Responsable Inscripto'}
                />
                {user.fiscal_data.categoria_monotributo && (
                  <DataItem label="Categoría" value={`Categoría ${user.fiscal_data.categoria_monotributo}`} />
                )}
                <DataItem
                  label="Tipo de Actividad"
                  value={user.fiscal_data.tipo_actividad ? capitalizeFirst(user.fiscal_data.tipo_actividad) : null}
                />
                <DataItem label="Régimen IIBB" value={formatRegimenIIBB(user.fiscal_data.regimen_iibb)} />
              </div>

              {/* Domicilio Fiscal */}
              {(user.fiscal_data.domicilio_fiscal || user.fiscal_data.localidad) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm">
                      {user.fiscal_data.domicilio_fiscal && (
                        <p className="text-gray-900">{user.fiscal_data.domicilio_fiscal}</p>
                      )}
                      <p className="text-gray-500">
                        {[
                          user.fiscal_data.localidad,
                          user.fiscal_data.codigo_postal && `CP ${user.fiscal_data.codigo_postal}`,
                          user.fiscal_data.provincia
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Información del Sistema */}
          <Section title="Información del Sistema">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataItem icon={Calendar} label="Fecha de Creación" value={formatDateTime(user.created_at)} />
              <DataItem icon={Calendar} label="Última Actualización" value={formatDateTime(user.updated_at)} />
            </div>
          </Section>

          {/* Notas Internas */}
          {user.notas_internas && (
            <Section title="Notas Internas">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{user.notas_internas}</p>
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 space-y-3">
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
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

function DataItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5" />}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || <span className="text-gray-300">-</span>}</p>
      </div>
    </div>
  )
}

function capitalizeFirst(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatRegimenIIBB(regimen) {
  const regimenes = {
    simplificado: 'Simplificado',
    general: 'Régimen General',
    convenio_multilateral: 'Convenio Multilateral',
    exento: 'Exento'
  }
  return regimenes[regimen] || regimen
}

export default UserDetailModal
