import { useState } from 'react'
import { Edit2, Plus, Calendar } from 'lucide-react'
import { formatMoneda, formatFecha, getCategoriaColor, COLUMNAS_TABLA } from '../utils/escalasUtils'
import FormCategoria from './FormCategoria'

/**
 * Tabla de categorias vigentes del monotributo
 */
export function TablaCategorias({ categorias, fechaVigencia, loading, onUpdate, onNuevaEscala, canEdit }) {
  const [editingCategoria, setEditingCategoria] = useState(null)

  const handleEdit = (categoria) => {
    if (canEdit) {
      setEditingCategoria(categoria)
    }
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

      {/* Tabla - scrolleable en mobile */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[500px] px-4 sm:px-0">
          {/* Header de tabla */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-t-lg text-xs font-semibold text-gray-600 uppercase">
            {COLUMNAS_TABLA.map(col => (
              <div key={col.key} className={col.width}>
                {col.label}
              </div>
            ))}
            {canEdit && <div className="w-16 text-center">Editar</div>}
          </div>

          {/* Filas */}
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-b-lg bg-white">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleEdit(cat)}
                className={`flex items-center gap-2 px-3 py-3 transition-colors ${
                  canEdit ? 'hover:bg-gray-50 cursor-pointer' : ''
                }`}
              >
                {/* Categoria */}
                <div className="w-16">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${getCategoriaColor(cat.categoria)}`}>
                    {cat.categoria}
                  </span>
                </div>

                {/* Tope facturacion */}
                <div className="flex-1 font-medium text-gray-900">
                  {formatMoneda(cat.tope_facturacion_anual)}
                </div>

                {/* Cuota servicios */}
                <div className="w-28 text-gray-700">
                  {formatMoneda(cat.cuota_total_servicios)}
                </div>

                {/* Cuota productos */}
                <div className="w-28 text-gray-700">
                  {formatMoneda(cat.cuota_total_productos)}
                </div>

                {/* Boton editar */}
                {canEdit && (
                  <div className="w-16 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(cat)
                      }}
                      className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <p className="mt-4 text-xs text-gray-500">
        Valores vigentes segun AFIP. Las cuotas incluyen impuesto integrado + aportes SIPA + obra social.
      </p>

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
