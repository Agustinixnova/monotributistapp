import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, X, Check, Heart } from 'lucide-react'
import obrasSocialesData from '../../../utils/OBRAS_SOCIALES_MONOTRIBUTO.json'

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
 * Selector de obra social con busqueda
 * Incluye opcion "Otro" para obras sociales no listadas
 */
export function SelectorObraSocial({
  value,
  onChange,
  error,
  label = 'Obra Social'
}) {
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOtra, setIsOtra] = useState(false)
  const [otraValue, setOtraValue] = useState('')
  const inputRef = useRef(null)

  // Detectar si el valor actual es una obra social del listado o "otra"
  useEffect(() => {
    if (value) {
      const found = obrasSocialesData.obrasSociales.find(
        os => os.sigla === value || os.denominacion === value
      )
      if (found) {
        setIsOtra(false)
        setOtraValue('')
      } else {
        // Es un valor custom (otra obra social)
        setIsOtra(true)
        setOtraValue(value)
      }
    } else {
      setIsOtra(false)
      setOtraValue('')
    }
  }, [value])

  // Buscar obra social actual en el listado
  const obraSocialActual = useMemo(() => {
    if (!value || isOtra) return null
    return obrasSocialesData.obrasSociales.find(
      os => os.sigla === value || os.denominacion === value
    )
  }, [value, isOtra])

  // Buscar obras sociales
  const resultados = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return obrasSocialesData.obrasSociales.slice(0, 20)

    const termNormalizado = normalizeText(searchTerm)
    const palabras = termNormalizado.split(' ').filter(p => p.length > 1)

    if (palabras.length === 0) return obrasSocialesData.obrasSociales.slice(0, 20)

    // Buscar obras sociales que contengan todas las palabras
    const matches = obrasSocialesData.obrasSociales.filter(os => {
      return palabras.every(palabra => os.busqueda.includes(palabra))
    })

    return matches.slice(0, 30)
  }, [searchTerm])

  // Seleccionar obra social del modal
  const handleSelect = (obraSocial) => {
    onChange(obraSocial.sigla || obraSocial.denominacion)
    setShowModal(false)
    setSearchTerm('')
    setIsOtra(false)
  }

  // Seleccionar "Otra"
  const handleSelectOtra = () => {
    setIsOtra(true)
    setShowModal(false)
    setSearchTerm('')
    onChange('')
  }

  // Cambiar valor de "otra" obra social
  const handleOtraChange = (e) => {
    const val = e.target.value
    setOtraValue(val)
    onChange(val)
  }

  // Abrir modal
  const handleOpenModal = () => {
    setShowModal(true)
    setSearchTerm('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Limpiar seleccion
  const handleClear = () => {
    onChange('')
    setIsOtra(false)
    setOtraValue('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Mostrar seleccion actual o input para otra */}
      {isOtra ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={otraValue}
              onChange={handleOtraChange}
              placeholder="Nombre de la obra social..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleOpenModal}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              title="Buscar en listado"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Escribi el nombre de la obra social no listada
          </p>
        </div>
      ) : obraSocialActual ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-green-800 text-sm">
                  {obraSocialActual.sigla}
                </div>
                <div className="text-xs text-green-700 truncate">
                  {obraSocialActual.denominacion}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Quitar"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
            title="Cambiar"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpenModal}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Heart className="w-4 h-4" />
          <span>Seleccionar obra social...</span>
        </button>
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
                  Seleccionar Obra Social
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
                  placeholder="Buscar por nombre o sigla..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                  autoFocus
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {obrasSocialesData.total} obras sociales disponibles para monotributistas
              </p>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto p-2">
              {/* Opcion "Otra" siempre visible */}
              <button
                onClick={handleSelectOtra}
                className="w-full p-3 text-left rounded-lg hover:bg-amber-50 transition-colors border border-dashed border-amber-300 mb-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-amber-600 font-medium">Otra</span>
                  <span className="text-sm text-gray-500">
                    Mi obra social no esta en el listado
                  </span>
                </div>
              </button>

              {/* Lista de obras sociales */}
              <div className="space-y-1">
                {resultados.map((os) => (
                  <button
                    key={os.rnos}
                    onClick={() => handleSelect(os)}
                    className={`w-full p-3 text-left rounded-lg hover:bg-green-50 transition-colors ${
                      obraSocialActual?.rnos === os.rnos ? 'bg-green-100 ring-2 ring-green-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Heart className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {os.sigla || 'S/Sigla'}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                            RNOS {os.rnos}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {os.denominacion}
                        </div>
                      </div>
                      {obraSocialActual?.rnos === os.rnos && (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {resultados.length === 0 && searchTerm.length >= 2 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron obras sociales</p>
                  <p className="text-sm">Podes seleccionar "Otra" si no esta en el listado</p>
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

export default SelectorObraSocial
