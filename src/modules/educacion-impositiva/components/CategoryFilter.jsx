import * as LucideIcons from 'lucide-react'

/**
 * Filtro de categorias para articulos
 */
export function CategoryFilter({ categorias, categoriaActiva, onCategoriaChange }) {
  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: isActive
        ? 'bg-green-600 text-white border-green-600'
        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      amber: isActive
        ? 'bg-amber-600 text-white border-amber-600'
        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      purple: isActive
        ? 'bg-purple-600 text-white border-purple-600'
        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      red: isActive
        ? 'bg-red-600 text-white border-red-600'
        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      violet: isActive
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
      pink: isActive
        ? 'bg-pink-600 text-white border-pink-600'
        : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
      teal: isActive
        ? 'bg-teal-600 text-white border-teal-600'
        : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
    }
    return colors[color] || colors.violet
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Boton "Todos" */}
      <button
        onClick={() => onCategoriaChange(null)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          categoriaActiva === null
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
        }`}
      >
        <LucideIcons.LayoutGrid className="w-4 h-4" />
        Todos
      </button>

      {/* Botones de categorias */}
      {categorias.map((categoria) => {
        const Icon = categoria.icono
          ? LucideIcons[categoria.icono] || LucideIcons.BookOpen
          : LucideIcons.BookOpen
        const isActive = categoriaActiva === categoria.id

        return (
          <button
            key={categoria.id}
            onClick={() => onCategoriaChange(categoria.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              getColorClasses(categoria.color, isActive)
            }`}
          >
            <Icon className="w-4 h-4" />
            {categoria.nombre}
          </button>
        )
      })}
    </div>
  )
}
