import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import actividadesData from '../../../utils/actividadesAfip.json'

/**
 * Normaliza texto para busqueda (sin tildes, minusculas)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Selector de actividad economica AFIP con busqueda
 */
export function SelectorActividadAFIP({
  codigo,
  descripcion,
  onSelect,
  error
}) {
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [codigoInput, setCodigoInput] = useState(codigo || '')
  const inputRef = useRef(null)

  // Buscar actividad por codigo
  const actividadActual = useMemo(() => {
    if (!codigoInput) return null
    return actividadesData.actividades.find(a => a.codigo === codigoInput)
  }, [codigoInput])

  // Validar codigo cuando cambia
  useEffect(() => {
    if (codigo !== codigoInput) {
      setCodigoInput(codigo || '')
    }
  }, [codigo])

  // Buscar actividades
  const resultados = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return []

    const termNormalizado = normalizeText(searchTerm)
    const palabras = termNormalizado.split(' ').filter(p => p.length > 1)

    if (palabras.length === 0) return []

    // Buscar actividades que contengan todas las palabras
    const matches = actividadesData.actividades.filter(actividad => {
      return palabras.every(palabra =>
        actividad.busqueda.includes(palabra) ||
        actividad.codigo.includes(palabra)
      )
    })

    // Ordenar por relevancia (codigo exacto primero, luego por match)
    return matches.slice(0, 50).sort((a, b) => {
      // Codigo exacto primero
      if (a.codigo === searchTerm) return -1
      if (b.codigo === searchTerm) return 1

      // Luego por si el codigo empieza con el termino
      if (a.codigo.startsWith(searchTerm) && !b.codigo.startsWith(searchTerm)) return -1
      if (b.codigo.startsWith(searchTerm) && !a.codigo.startsWith(searchTerm)) return 1

      return 0
    })
  }, [searchTerm])

  // Manejar cambio de codigo directo
  const handleCodigoChange = (e) => {
    const valor = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
    setCodigoInput(valor)

    // Buscar si existe
    const actividad = actividadesData.actividades.find(a => a.codigo === valor)
    if (actividad) {
      onSelect(actividad.codigo, actividad.descripcion)
    } else if (valor === '') {
      onSelect('', '')
    }
  }

  // Seleccionar actividad del modal
  const handleSelect = (actividad) => {
    setCodigoInput(actividad.codigo)
    onSelect(actividad.codigo, actividad.descripcion)
    setShowModal(false)
    setSearchTerm('')
  }

  // Abrir modal
  const handleOpenModal = () => {
    setShowModal(true)
    setSearchTerm('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const isValid = codigoInput === '' || actividadActual !== null

  return (
    <div className="space-y-2">
      {/* Input de codigo + boton buscar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Codigo actividad ARCA
          </label>
          <div className="relative">
            <input
              type="text"
              value={codigoInput}
              onChange={handleCodigoChange}
              placeholder="Ej: 620100"
              maxLength={10}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono pr-10 ${
                !isValid ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {codigoInput && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {actividadActual ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>
      </div>

      {/* Descripcion (auto-completada o manual) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripcion actividad
        </label>
        {actividadActual ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            {actividadActual.descripcion}
          </div>
        ) : (
          <input
            type="text"
            value={descripcion || ''}
            onChange={(e) => onSelect(codigoInput, e.target.value)}
            placeholder="Descripcion de la actividad"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Mensaje de error */}
      {!isValid && codigoInput && (
        <p className="text-sm text-red-600">
          Codigo no encontrado en el nomenclador ARCA
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Modal de busqueda */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  Buscar actividad ARCA
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por codigo o descripcion..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                  autoFocus
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {actividadesData.total} actividades disponibles - Escribi al menos 2 caracteres
              </p>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto p-2">
              {searchTerm.length < 2 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Escribi para buscar actividades</p>
                  <p className="text-sm">Ej: "consultoria informatica", "620100", "transporte"</p>
                </div>
              ) : resultados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron actividades</p>
                  <p className="text-sm">Proba con otras palabras</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {resultados.map((actividad) => (
                    <button
                      key={actividad.codigo}
                      onClick={() => handleSelect(actividad)}
                      className={`w-full p-3 text-left rounded-lg hover:bg-violet-50 transition-colors ${
                        actividad.codigo === codigoInput ? 'bg-violet-100 ring-2 ring-violet-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 flex-shrink-0">
                          {actividad.codigo}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {actividad.descripcion}
                          </div>
                          {actividad.descripcionLarga !== actividad.descripcion && (
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {actividad.descripcionLarga}
                            </div>
                          )}
                        </div>
                        {actividad.codigo === codigoInput && (
                          <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
