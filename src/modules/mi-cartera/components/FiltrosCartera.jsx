import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'

const TIPOS_CONTRIBUYENTE = [
  { value: 'monotributista', label: 'Monotributista' },
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' }
]

const ESTADOS_PAGO = [
  { value: 'al_dia', label: 'Al dia', color: 'green' },
  { value: 'debe_1_cuota', label: 'Debe 1 cuota', color: 'yellow' },
  { value: 'debe_2_mas', label: 'Debe 2+ cuotas', color: 'red' }
]

const GESTION_FACTURACION = [
  { value: 'contadora', label: 'Contadora' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'mixta', label: 'Mixta' }
]

/**
 * Panel de filtros para la cartera de clientes
 */
export function FiltrosCartera({ filters, onFilterChange, categorias = [], stats }) {
  const [expanded, setExpanded] = useState(false)

  const activeFiltersCount = Object.values(filters).filter(v => v).length

  const handleClear = () => {
    onFilterChange({
      categoria: '',
      tipoContribuyente: '',
      estadoPago: '',
      gestionFacturacion: '',
      conSugerencias: false
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
              {activeFiltersCount} activos
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Filtros */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 space-y-4">
          {/* Tipo de contribuyente */}
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Tipo de contribuyente
            </label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_CONTRIBUYENTE.map(tipo => (
                <button
                  key={tipo.value}
                  onClick={() => onFilterChange({
                    tipoContribuyente: filters.tipoContribuyente === tipo.value ? '' : tipo.value
                  })}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    filters.tipoContribuyente === tipo.value
                      ? 'bg-violet-100 border-violet-300 text-violet-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria */}
          {categorias.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                {categorias.map(cat => (
                  <button
                    key={cat}
                    onClick={() => onFilterChange({
                      categoria: filters.categoria === cat ? '' : cat
                    })}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      filters.categoria === cat
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Cat. {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estado de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Estado de pago
            </label>
            <div className="flex flex-wrap gap-2">
              {ESTADOS_PAGO.map(estado => (
                <button
                  key={estado.value}
                  onClick={() => onFilterChange({
                    estadoPago: filters.estadoPago === estado.value ? '' : estado.value
                  })}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    filters.estadoPago === estado.value
                      ? `bg-${estado.color}-100 border-${estado.color}-300 text-${estado.color}-700`
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {estado.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gestion facturacion */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Gestion de facturacion
            </label>
            <div className="flex flex-wrap gap-2">
              {GESTION_FACTURACION.map(gestion => (
                <button
                  key={gestion.value}
                  onClick={() => onFilterChange({
                    gestionFacturacion: filters.gestionFacturacion === gestion.value ? '' : gestion.value
                  })}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    filters.gestionFacturacion === gestion.value
                      ? 'bg-teal-100 border-teal-300 text-teal-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {gestion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sugerencias pendientes */}
          {stats?.conSugerencias > 0 && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.conSugerencias || false}
                  onChange={(e) => onFilterChange({ conSugerencias: e.target.checked })}
                  className="w-4 h-4 text-violet-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Solo con sugerencias pendientes
                  <span className="ml-1 text-amber-600 font-medium">({stats.conSugerencias})</span>
                </span>
              </label>
            </div>
          )}

          {/* Boton limpiar */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
