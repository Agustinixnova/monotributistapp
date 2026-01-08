import { useState, useMemo } from 'react'
import { BookOpen, Search as SearchIcon } from 'lucide-react'
import { ArticuloCard } from './ArticuloCard'
import { CategoryFilter } from './CategoryFilter'
import { SearchBar } from './SearchBar'

/**
 * Lista de articulos con filtros y busqueda
 */
export function ArticulosList({
  articulos,
  categorias,
  cargando,
  mostrarFiltros = true,
  mostrarBusqueda = true
}) {
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  // Filtrar articulos
  const articulosFiltrados = useMemo(() => {
    let resultado = articulos

    // Filtro por categoria
    if (categoriaActiva) {
      resultado = resultado.filter(a => a.categoria_id === categoriaActiva)
    }

    // Filtro por busqueda (local, complementa la busqueda de SearchBar)
    if (busqueda && busqueda.length >= 2) {
      const termino = busqueda.toLowerCase()
      resultado = resultado.filter(a =>
        a.titulo?.toLowerCase().includes(termino) ||
        a.resumen?.toLowerCase().includes(termino)
      )
    }

    return resultado
  }, [articulos, categoriaActiva, busqueda])

  // Separar destacados
  const destacados = articulosFiltrados.filter(a => a.destacado)
  const normales = articulosFiltrados.filter(a => !a.destacado)

  if (cargando) {
    return (
      <div className="space-y-6">
        {/* Skeleton de filtros */}
        {mostrarBusqueda && (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        )}
        {mostrarFiltros && (
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
            ))}
          </div>
        )}
        {/* Skeleton de articulos */}
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Busqueda */}
      {mostrarBusqueda && (
        <SearchBar
          onSearch={setBusqueda}
          placeholder="Buscar articulos..."
        />
      )}

      {/* Filtros de categoria */}
      {mostrarFiltros && categorias.length > 0 && (
        <CategoryFilter
          categorias={categorias}
          categoriaActiva={categoriaActiva}
          onCategoriaChange={setCategoriaActiva}
        />
      )}

      {/* Estado vacio */}
      {articulosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {busqueda || categoriaActiva
              ? 'No se encontraron articulos'
              : 'Aun no hay articulos'
            }
          </h3>
          <p className="text-gray-500">
            {busqueda || categoriaActiva
              ? 'Intenta con otros filtros o terminos de busqueda'
              : 'Los articulos apareceran aqui cuando se publiquen'
            }
          </p>
        </div>
      )}

      {/* Articulos destacados */}
      {destacados.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Destacados</h2>
          <div className="grid gap-4">
            {destacados.map(articulo => (
              <ArticuloCard
                key={articulo.id}
                articulo={articulo}
                showCategoria={!categoriaActiva}
              />
            ))}
          </div>
        </div>
      )}

      {/* Articulos normales */}
      {normales.length > 0 && (
        <div>
          {destacados.length > 0 && (
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Todos los articulos</h2>
          )}
          <div className="grid gap-4">
            {normales.map(articulo => (
              <ArticuloCard
                key={articulo.id}
                articulo={articulo}
                showCategoria={!categoriaActiva}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contador de resultados */}
      {articulosFiltrados.length > 0 && (busqueda || categoriaActiva) && (
        <p className="text-sm text-gray-500 text-center">
          {articulosFiltrados.length} articulo{articulosFiltrados.length !== 1 ? 's' : ''} encontrado{articulosFiltrados.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
