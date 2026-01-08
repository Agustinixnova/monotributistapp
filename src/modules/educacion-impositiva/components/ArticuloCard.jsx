import { Link } from 'react-router-dom'
import { Clock, Star, ChevronRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { estimarTiempoLectura, truncarTexto } from '../utils/formatters'

/**
 * Tarjeta de preview de articulo
 */
export function ArticuloCard({ articulo, showCategoria = true }) {
  const tiempoLectura = estimarTiempoLectura(articulo.contenido)

  // Obtener icono de categoria dinamicamente
  const CategoriaIcon = articulo.categoria?.icono
    ? LucideIcons[articulo.categoria.icono] || LucideIcons.BookOpen
    : LucideIcons.BookOpen

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      amber: 'bg-amber-100 text-amber-700',
      purple: 'bg-purple-100 text-purple-700',
      red: 'bg-red-100 text-red-700',
      violet: 'bg-violet-100 text-violet-700',
      pink: 'bg-pink-100 text-pink-700',
      teal: 'bg-teal-100 text-teal-700'
    }
    return colors[color] || colors.violet
  }

  return (
    <Link
      to={`/educacion/${articulo.slug}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-violet-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header con categoria y destacado */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {articulo.destacado && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                <Star className="w-3 h-3 fill-current" />
                Destacado
              </span>
            )}
            {showCategoria && articulo.categoria && (
              <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getColorClasses(articulo.categoria.color)}`}>
                <CategoriaIcon className="w-3 h-3" />
                {articulo.categoria.nombre}
              </span>
            )}
          </div>

          {/* Titulo */}
          <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors mb-1">
            {articulo.titulo}
          </h3>

          {/* Resumen */}
          {articulo.resumen && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {truncarTexto(articulo.resumen, 120)}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {tiempoLectura}
            </span>
          </div>
        </div>

        {/* Flecha */}
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors flex-shrink-0" />
      </div>
    </Link>
  )
}
