import { X, Info } from 'lucide-react'
import {
  getCategoriaColor,
  formatMonedaCompacta,
  formatSuperficie,
  formatEnergia,
  esSoloProductos,
  CATEGORIAS_SOLO_PRODUCTOS
} from '../utils/escalasUtils'

/**
 * Vista expandida de detalle de una categoria
 * Muestra todos los campos en formato card/vertical para mobile
 */
export function DetalleCategoria({ categoria, onClose }) {
  const soloProductos = esSoloProductos(categoria.categoria)

  const SeccionItem = ({ label, value, destacado = false }) => (
    <div className={`flex justify-between py-2 ${destacado ? 'bg-violet-50 -mx-4 px-4' : ''}`}>
      <span className="text-gray-600 text-sm">{label}</span>
      <span className={`font-medium ${destacado ? 'text-violet-700' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 pt-safe-top pb-safe-bottom">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold text-xl ${getCategoriaColor(categoria.categoria)}`}>
              {categoria.categoria}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Categoria {categoria.categoria}</h2>
              {soloProductos && (
                <p className="text-xs text-amber-600 font-medium">Solo venta de productos</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Limites */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Limites</h3>
            <div className="divide-y divide-gray-200">
              <SeccionItem
                label="Ingresos Brutos Anuales"
                value={formatMonedaCompacta(categoria.tope_facturacion_anual)}
              />
              <SeccionItem
                label="Superficie Afectada"
                value={formatSuperficie(categoria.superficie_maxima)}
              />
              <SeccionItem
                label="Energia Electrica Anual"
                value={formatEnergia(categoria.energia_maxima)}
              />
              <SeccionItem
                label="Alquileres Anuales"
                value={formatMonedaCompacta(categoria.alquiler_maximo)}
              />
              <SeccionItem
                label="Precio Unitario Maximo"
                value={formatMonedaCompacta(categoria.precio_unitario_maximo)}
              />
            </div>
          </div>

          {/* Impuesto Integrado */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Impuesto Integrado</h3>
            <div className="divide-y divide-gray-200">
              <SeccionItem
                label="Servicios"
                value={soloProductos ? '-' : formatMonedaCompacta(categoria.impuesto_integrado_servicios)}
              />
              <SeccionItem
                label="Productos"
                value={formatMonedaCompacta(categoria.impuesto_integrado_productos)}
              />
            </div>
          </div>

          {/* Aportes */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Aportes</h3>
            <div className="divide-y divide-gray-200">
              <SeccionItem
                label="SIPA"
                value={formatMonedaCompacta(categoria.aporte_sipa)}
              />
              <SeccionItem
                label="Obra Social"
                value={formatMonedaCompacta(categoria.aporte_obra_social)}
              />
            </div>
          </div>

          {/* Totales */}
          <div className="bg-violet-50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-violet-600 uppercase mb-2">Cuota Mensual Total</h3>
            <div className="divide-y divide-violet-200">
              <SeccionItem
                label="Servicios"
                value={soloProductos ? '-' : formatMonedaCompacta(categoria.cuota_total_servicios)}
                destacado
              />
              <SeccionItem
                label="Productos"
                value={formatMonedaCompacta(categoria.cuota_total_productos)}
                destacado
              />
            </div>
          </div>

          {/* Nota para categorias I, J, K */}
          {soloProductos && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Las categorias {CATEGORIAS_SOLO_PRODUCTOS.join(', ')} son exclusivamente para venta de productos.
                No se pueden usar para prestacion de servicios.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetalleCategoria
