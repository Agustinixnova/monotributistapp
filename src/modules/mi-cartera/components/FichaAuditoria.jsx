import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

// Mapeo de nombres de campos a labels legibles
const CAMPO_LABELS = {
  categoria_monotributo: 'Categoria',
  tipo_contribuyente: 'Tipo contribuyente',
  tipo_actividad: 'Tipo actividad',
  gestion_facturacion: 'Gestion facturacion',
  estado_pago_monotributo: 'Estado de pago',
  cuit: 'CUIT',
  razon_social: 'Razon social',
  domicilio_fiscal: 'Domicilio fiscal',
  codigo_postal: 'Codigo postal',
  localidad: 'Localidad',
  provincia: 'Provincia',
  obra_social: 'Obra social',
  obra_social_tipo_cobertura: 'Cobertura OS',
  obra_social_adicional: 'OS adicional',
  trabaja_relacion_dependencia: 'Relacion dependencia',
  empleador_cuit: 'CUIT empleador',
  empleador_razon_social: 'Empleador',
  sueldo_bruto: 'Sueldo bruto',
  tiene_local: 'Tiene local',
  metodo_pago_monotributo: 'Metodo pago',
  cbu_debito: 'CBU debito',
  nivel_clave_fiscal: 'Nivel clave fiscal',
  servicios_delegados: 'Servicios delegados',
  factura_electronica_habilitada: 'Factura electronica',
  regimen_iibb: 'Regimen IIBB',
  numero_iibb: 'Numero IIBB',
  codigo_actividad_afip: 'Codigo actividad ARCA',
  descripcion_actividad_afip: 'Actividad ARCA',
  punto_venta_afip: 'Punto venta',
  notas_internas_fiscales: 'Notas fiscales'
}

/**
 * Panel de historial de auditoria de cambios
 */
export function FichaAuditoria({ auditoria = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  if (!auditoria || auditoria.length === 0) {
    return null
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '(vacio)'
    if (value === 'true') return 'Si'
    if (value === 'false') return 'No'
    return value
  }

  const getCampoLabel = (campo) => {
    return CAMPO_LABELS[campo] || campo.replace(/_/g, ' ')
  }

  const itemsToShow = showAll ? auditoria : auditoria.slice(0, 5)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Historial de cambios</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            {auditoria.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Contenido */}
      {expanded && (
        <div className="border-t border-gray-100">
          <div className="divide-y divide-gray-100">
            {itemsToShow.map((item) => (
              <div key={item.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">
                        {getCampoLabel(item.campo)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(item.modified_at)}
                      </span>
                    </div>

                    {/* Cambio de valor */}
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      <span className="text-gray-500 line-through max-w-[120px] truncate" title={item.valor_anterior}>
                        {formatValue(item.valor_anterior)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-900 font-medium max-w-[200px] truncate" title={item.valor_nuevo}>
                        {formatValue(item.valor_nuevo)}
                      </span>
                    </div>

                    {/* Motivo */}
                    {item.motivo && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        "{item.motivo}"
                      </p>
                    )}
                  </div>

                  {/* Usuario que hizo el cambio */}
                  <div className="text-right text-xs text-gray-400">
                    {item.modified_by_profile
                      ? `${item.modified_by_profile.nombre} ${item.modified_by_profile.apellido || ''}`
                      : 'Sistema'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ver mas / menos */}
          {auditoria.length > 5 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-violet-600 hover:text-violet-700"
              >
                {showAll ? 'Ver menos' : `Ver todos (${auditoria.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
