import { useState } from 'react'
import { Edit2, Plus, Calendar, ChevronRight, Info } from 'lucide-react'
import {
  formatMonedaCompacta,
  formatNumero,
  formatFecha,
  getCategoriaColor,
  esSoloProductos,
  CATEGORIAS_SOLO_PRODUCTOS
} from '../utils/escalasUtils'
import FormCategoria from './FormCategoria'
import DetalleCategoria from './DetalleCategoria'

/**
 * Tabla de categorias vigentes del monotributo
 * Mobile: tabla simplificada con filas expandibles
 * Desktop: tabla completa con todas las columnas ARCA
 */
export function TablaCategorias({ categorias, fechaVigencia, loading, onUpdate, onNuevaEscala, canEdit }) {
  const [editingCategoria, setEditingCategoria] = useState(null)
  const [expandedCategoria, setExpandedCategoria] = useState(null)

  const handleEdit = (categoria, e) => {
    if (e) e.stopPropagation()
    if (canEdit) {
      setEditingCategoria(categoria)
    }
  }

  const handleExpand = (categoria) => {
    setExpandedCategoria(categoria)
  }

  const handleSave = async (data) => {
    await onUpdate(editingCategoria.id, data)
    setEditingCategoria(null)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header con fecha de vigencia y boton nueva escala */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Vigente desde: <strong>{formatFecha(fechaVigencia)}</strong></span>
        </div>
        {canEdit && (
          <button
            onClick={onNuevaEscala}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Cargar nueva escala
          </button>
        )}
      </div>

      {/* MOBILE: Tabla simplificada con expansion */}
      <div className="md:hidden">
        <div className="bg-gray-100 rounded-t-lg px-3 py-2 flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase">
          <div className="w-12">Cat.</div>
          <div className="flex-1">Tope Fact.</div>
          <div className="w-24 text-right">Cuota</div>
          <div className="w-6"></div>
        </div>
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-b-lg bg-white">
          {categorias.map((cat) => {
            const soloProductos = esSoloProductos(cat.categoria)
            return (
              <div
                key={cat.id}
                onClick={() => handleExpand(cat)}
                className="flex items-center gap-2 px-3 py-3 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
              >
                <div className="w-12">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${getCategoriaColor(cat.categoria)}`}>
                    {cat.categoria}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    {formatMonedaCompacta(cat.tope_facturacion_anual)}
                  </div>
                  {soloProductos && (
                    <span className="text-xs text-amber-600">Solo productos</span>
                  )}
                </div>
                <div className="w-24 text-right">
                  <div className="text-sm text-gray-700">
                    {soloProductos ? '-' : formatMonedaCompacta(cat.cuota_total_servicios)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatMonedaCompacta(cat.cuota_total_productos)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            )
          })}
        </div>
      </div>

      {/* DESKTOP: Tabla completa con todas las columnas */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-2 text-left font-semibold text-gray-600 text-xs uppercase rounded-tl-lg">Cat.</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase">Ingresos Brutos</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase">Sup.</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase">Energia</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase">Alquileres</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase">Precio Unit.</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase border-l border-gray-200">Imp. Serv.</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase">Imp. Prod.</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase border-l border-gray-200">SIPA</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase">O. Social</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase bg-violet-100 text-violet-700 border-l border-violet-200">Total Serv.</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600 text-xs uppercase bg-violet-100 text-violet-700">Total Prod.</th>
              {canEdit && (
                <th className="px-2 py-2 text-center font-semibold text-gray-600 text-xs uppercase rounded-tr-lg w-12"></th>
              )}
            </tr>
            {/* Subheader for grouping */}
            <tr className="bg-gray-50 border-b border-gray-200">
              <th colSpan="6" className="px-2 py-1 text-left text-[10px] text-gray-500">Limites</th>
              <th colSpan="2" className="px-2 py-1 text-center text-[10px] text-gray-500 border-l border-gray-200">Impuesto Integrado</th>
              <th colSpan="2" className="px-2 py-1 text-center text-[10px] text-gray-500 border-l border-gray-200">Aportes</th>
              <th colSpan="2" className="px-2 py-1 text-center text-[10px] text-violet-600 bg-violet-50 border-l border-violet-200">Cuota Total</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categorias.map((cat) => {
              const soloProductos = esSoloProductos(cat.categoria)
              return (
                <tr
                  key={cat.id}
                  className={`hover:bg-gray-50 ${canEdit ? 'cursor-pointer' : ''}`}
                  onClick={() => canEdit && handleEdit(cat)}
                >
                  <td className="px-2 py-2">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${getCategoriaColor(cat.categoria)}`}>
                      {cat.categoria}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-gray-900">
                    {formatMonedaCompacta(cat.tope_facturacion_anual)}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {formatNumero(cat.superficie_maxima)} m2
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {formatNumero(cat.energia_maxima)} kW
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {formatMonedaCompacta(cat.alquiler_maximo)}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {formatMonedaCompacta(cat.precio_unitario_maximo)}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700 border-l border-gray-100">
                    {soloProductos ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      formatMonedaCompacta(cat.impuesto_integrado_servicios)
                    )}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {formatMonedaCompacta(cat.impuesto_integrado_productos)}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700 border-l border-gray-100">
                    {formatMonedaCompacta(cat.aporte_sipa)}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {formatMonedaCompacta(cat.aporte_obra_social)}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold text-violet-700 bg-violet-50/50 border-l border-violet-100">
                    {soloProductos ? (
                      <span className="text-gray-400 font-normal">-</span>
                    ) : (
                      formatMonedaCompacta(cat.cuota_total_servicios)
                    )}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold text-violet-700 bg-violet-50/50">
                    {formatMonedaCompacta(cat.cuota_total_productos)}
                  </td>
                  {canEdit && (
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={(e) => handleEdit(cat, e)}
                        className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Valores vigentes segun ARCA. Las cuotas incluyen impuesto integrado + aportes SIPA + obra social.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-amber-600">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Categorias {CATEGORIAS_SOLO_PRODUCTOS.join(', ')} son exclusivamente para venta de productos.</span>
        </div>
      </div>

      {/* Modal de detalle mobile */}
      {expandedCategoria && (
        <DetalleCategoria
          categoria={expandedCategoria}
          onClose={() => setExpandedCategoria(null)}
        />
      )}

      {/* Modal de edicion */}
      {editingCategoria && (
        <FormCategoria
          categoria={editingCategoria}
          onClose={() => setEditingCategoria(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default TablaCategorias
