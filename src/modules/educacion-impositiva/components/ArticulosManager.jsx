import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Settings, BookOpen, Loader2, AlertCircle, Filter, ArrowLeft } from 'lucide-react'
import { SortableArticleList } from './SortableArticleList'
import { CategoriasList } from './CategoriasList'
import { useArticulos } from '../hooks/useArticulos'
import { useCategorias } from '../hooks/useCategorias'

/**
 * Panel de administracion de articulos
 */
export function ArticulosManager() {
  const [tab, setTab] = useState('articulos') // 'articulos' | 'categorias'
  const [filtroCategoria, setFiltroCategoria] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState(null)

  const {
    articulos,
    cargando,
    error,
    cambiarEstado,
    toggleDestacado,
    eliminar,
    reordenar
  } = useArticulos({ soloPublicados: false })

  const { categorias, cargando: cargandoCategorias } = useCategorias()

  // Filtrar articulos
  const articulosFiltrados = useMemo(() => {
    let resultado = articulos

    if (filtroCategoria) {
      resultado = resultado.filter(a => a.categoria_id === filtroCategoria)
    }

    if (filtroEstado) {
      resultado = resultado.filter(a => a.estado === filtroEstado)
    }

    return resultado
  }, [articulos, filtroCategoria, filtroEstado])

  // Estadisticas
  const stats = useMemo(() => ({
    total: articulos.length,
    publicados: articulos.filter(a => a.estado === 'publicado').length,
    borradores: articulos.filter(a => a.estado === 'borrador').length,
    destacados: articulos.filter(a => a.destacado).length
  }), [articulos])

  const handleToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'publicado' ? 'borrador' : 'publicado'
    await cambiarEstado(id, nuevoEstado)
  }

  if (cargando || cargandoCategorias) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Botón Volver */}
          <Link
            to="/educacion"
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Volver a Educación Impositiva"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Educacion Impositiva</h1>
            <p className="text-gray-600 mt-1">Administra articulos y categorias</p>
          </div>
        </div>

        <Link
          to="/educacion/admin/nuevo"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo articulo
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Publicados</p>
          <p className="text-2xl font-bold text-green-600">{stats.publicados}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Borradores</p>
          <p className="text-2xl font-bold text-amber-600">{stats.borradores}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Destacados</p>
          <p className="text-2xl font-bold text-violet-600">{stats.destacados}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('articulos')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            tab === 'articulos'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Articulos
        </button>
        <button
          onClick={() => setTab('categorias')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            tab === 'categorias'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Categorias
        </button>
      </div>

      {/* Contenido */}
      {tab === 'articulos' ? (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Filter className="w-4 h-4 text-gray-500" />

            {/* Filtro categoria */}
            <select
              value={filtroCategoria || ''}
              onChange={(e) => setFiltroCategoria(e.target.value || null)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todas las categorias</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>

            {/* Filtro estado */}
            <select
              value={filtroEstado || ''}
              onChange={(e) => setFiltroEstado(e.target.value || null)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todos los estados</option>
              <option value="publicado">Publicados</option>
              <option value="borrador">Borradores</option>
            </select>

            {/* Limpiar filtros */}
            {(filtroCategoria || filtroEstado) && (
              <button
                onClick={() => {
                  setFiltroCategoria(null)
                  setFiltroEstado(null)
                }}
                className="text-sm text-violet-600 hover:text-violet-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Lista de articulos */}
          {articulosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {articulos.length === 0 ? 'No hay articulos' : 'No hay resultados'}
              </h3>
              <p className="text-gray-500 mb-4">
                {articulos.length === 0
                  ? 'Crea tu primer articulo para empezar'
                  : 'Intenta con otros filtros'
                }
              </p>
              {articulos.length === 0 && (
                <Link
                  to="/educacion/admin/nuevo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  <Plus className="w-4 h-4" />
                  Crear articulo
                </Link>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {articulosFiltrados.length} articulo{articulosFiltrados.length !== 1 ? 's' : ''}
                {filtroCategoria || filtroEstado ? ' encontrados' : ''}
              </p>
              <SortableArticleList
                articulos={articulosFiltrados}
                onReorder={reordenar}
                onToggleEstado={handleToggleEstado}
                onToggleDestacado={toggleDestacado}
                onEliminar={eliminar}
              />
              <p className="text-xs text-gray-400 text-center">
                Arrastra los articulos para cambiar su orden
              </p>
            </>
          )}
        </div>
      ) : (
        <CategoriasList />
      )}
    </div>
  )
}
