import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar, User, Star, Edit } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { TipTapViewer } from './TipTapEditor'
import { AdjuntosLista } from './AdjuntosLista'
import { formatFecha, estimarTiempoLectura, formatNombreAutor } from '../utils/formatters'

/**
 * Vista completa de un articulo
 */
export function ArticuloViewer({ articulo, canEdit = false }) {
  if (!articulo) return null

  const tiempoLectura = estimarTiempoLectura(articulo.contenido)

  // Obtener icono de categoria
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
    <article className="max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        {/* Navegacion */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/educacion"
            className="flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </Link>

          {canEdit && (
            <Link
              to={`/educacion/admin/editar/${articulo.id}`}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {articulo.destacado && (
            <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
              <Star className="w-4 h-4 fill-current" />
              Destacado
            </span>
          )}
          {articulo.categoria && (
            <span className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full ${getColorClasses(articulo.categoria.color)}`}>
              <CategoriaIcon className="w-4 h-4" />
              {articulo.categoria.nombre}
            </span>
          )}
          {articulo.estado === 'borrador' && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
              Borrador
            </span>
          )}
        </div>

        {/* Titulo */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {articulo.titulo}
        </h1>

        {/* Resumen */}
        {articulo.resumen && (
          <p className="text-lg text-gray-600 mb-6">
            {articulo.resumen}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 pb-6 border-b border-gray-200">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {tiempoLectura} de lectura
          </span>

          {articulo.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatFecha(articulo.published_at)}
            </span>
          )}

          {articulo.autor && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {formatNombreAutor(articulo.autor)}
            </span>
          )}
        </div>
      </header>

      {/* Contenido */}
      <div className="mb-8">
        <TipTapViewer content={articulo.contenido} />
      </div>

      {/* Adjuntos descargables */}
      <AdjuntosLista adjuntos={articulo.adjuntos} />

      {/* Footer con info de actualizacion */}
      <footer className="pt-6 border-t border-gray-200 text-sm text-gray-500">
        {articulo.updated_at && articulo.editor && (
          <p>
            Ultima actualizacion: {formatFecha(articulo.updated_at)} por {formatNombreAutor(articulo.editor)}
          </p>
        )}
      </footer>
    </article>
  )
}
