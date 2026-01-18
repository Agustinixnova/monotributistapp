/**
 * Grid selector de categorías
 */

import IconoDinamico from './IconoDinamico'

export default function SelectorCategoria({ categorias, categoriaSeleccionada, onChange }) {
  if (!categorias || categorias.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No hay categorías disponibles
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {categorias.map(categoria => {
        const seleccionado = categoriaSeleccionada === categoria.id

        return (
          <button
            key={categoria.id}
            type="button"
            onClick={() => onChange(categoria.id)}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all min-h-touch ${
              seleccionado
                ? 'border-violet-500 bg-violet-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <IconoDinamico
              nombre={categoria.icono}
              className={`w-8 h-8 ${seleccionado ? 'text-violet-600' : 'text-gray-600'}`}
            />
            <span className={`text-sm font-medium text-center ${
              seleccionado ? 'text-violet-700' : 'text-gray-700'
            }`}>
              {categoria.nombre}
            </span>
          </button>
        )
      })}
    </div>
  )
}
