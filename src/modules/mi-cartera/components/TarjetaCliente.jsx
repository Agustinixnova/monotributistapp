import { Link } from 'react-router-dom'
import { Phone, MessageCircle, Mail, ChevronRight, AlertCircle, Building2, Briefcase } from 'lucide-react'

const ESTADO_PAGO_COLORS = {
  al_dia: 'bg-green-100 text-green-700',
  debe_1_cuota: 'bg-yellow-100 text-yellow-700',
  debe_2_mas: 'bg-red-100 text-red-700',
  desconocido: 'bg-gray-100 text-gray-600'
}

const ESTADO_PAGO_LABELS = {
  al_dia: 'Al dia',
  debe_1_cuota: 'Debe 1 cuota',
  debe_2_mas: 'Debe 2+ cuotas',
  desconocido: 'Sin info'
}

/**
 * Tarjeta de cliente para vista mobile
 */
export function TarjetaCliente({ cliente }) {
  const formatCuit = (cuit) => {
    if (!cuit) return '-'
    return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <Link
        to={`/mi-cartera/${cliente.client_id}`}
        className="block p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {cliente.full_name || cliente.razon_social || 'Sin nombre'}
            </h3>
            <p className="text-sm text-gray-500 font-mono">
              {formatCuit(cliente.cuit)}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Categoria */}
            {cliente.categoria_monotributo && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                {cliente.categoria_monotributo}
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {/* Tipo contribuyente */}
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            cliente.tipo_contribuyente === 'monotributista'
              ? 'bg-violet-100 text-violet-700'
              : 'bg-indigo-100 text-indigo-700'
          }`}>
            {cliente.tipo_contribuyente === 'monotributista' ? 'Mono' : 'RI'}
          </span>

          {/* Estado pago */}
          {cliente.estado_pago_monotributo && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              ESTADO_PAGO_COLORS[cliente.estado_pago_monotributo] || ESTADO_PAGO_COLORS.desconocido
            }`}>
              {ESTADO_PAGO_LABELS[cliente.estado_pago_monotributo] || 'Sin info'}
            </span>
          )}

          {/* Servicios delegados */}
          {cliente.servicios_delegados && (
            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
              Delegado
            </span>
          )}

          {/* Tiene locales */}
          {cliente.cantidad_locales > 0 && (
            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {cliente.cantidad_locales}
            </span>
          )}

          {/* Trabaja en dependencia */}
          {cliente.trabaja_relacion_dependencia && (
            <span className="px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded-full flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              Dep.
            </span>
          )}

          {/* Sugerencias pendientes */}
          {cliente.sugerencias_pendientes > 0 && (
            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {cliente.sugerencias_pendientes}
            </span>
          )}
        </div>

        {/* Contador asignado */}
        {cliente.contador_nombre && (
          <p className="text-xs text-gray-400 mt-2">
            Asignado a: {cliente.contador_nombre} {cliente.contador_apellido}
          </p>
        )}
      </Link>

      {/* Acciones rapidas */}
      <div className="border-t border-gray-100 px-4 py-2 flex gap-4 bg-gray-50">
        {cliente.telefono && (
          <a
            href={`tel:${cliente.telefono}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-violet-600"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Llamar</span>
          </a>
        )}

        {cliente.whatsapp && (
          <a
            href={`https://wa.me/54${cliente.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        )}

        {cliente.email && (
          <a
            href={`mailto:${cliente.email}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </a>
        )}
      </div>
    </div>
  )
}
