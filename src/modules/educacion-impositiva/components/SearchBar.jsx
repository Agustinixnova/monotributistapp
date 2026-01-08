import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import { useArticuloSearch } from '../hooks/useArticuloSearch'

/**
 * Barra de busqueda de articulos
 */
export function SearchBar({ onSearch, placeholder = 'Buscar articulos...' }) {
  const [inputValue, setInputValue] = useState('')
  const [showResults, setShowResults] = useState(false)
  const { resultados, buscando, buscar, limpiar } = useArticuloSearch()
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  // Debounce de busqueda
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      buscar(inputValue)
      if (inputValue.length >= 2) {
        setShowResults(true)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue, buscar])

  // Click outside para cerrar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    setInputValue('')
    limpiar()
    setShowResults(false)
    onSearch?.('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowResults(false)
    onSearch?.(inputValue)
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => inputValue.length >= 2 && setShowResults(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          {buscando && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Resultados de busqueda rapida */}
      {showResults && resultados.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {resultados.map((articulo) => (
            <Link
              key={articulo.id}
              to={`/educacion/${articulo.slug}`}
              onClick={() => setShowResults(false)}
              className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {articulo.titulo}
                  </h4>
                  {articulo.resumen && (
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                      {articulo.resumen}
                    </p>
                  )}
                </div>
                {articulo.categoria && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex-shrink-0">
                    {articulo.categoria.nombre}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showResults && inputValue.length >= 2 && resultados.length === 0 && !buscando && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
          No se encontraron articulos
        </div>
      )}
    </div>
  )
}
