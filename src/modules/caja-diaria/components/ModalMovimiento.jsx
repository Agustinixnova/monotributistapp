/**
 * Modal para crear nuevo movimiento (entrada o salida)
 */

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import SelectorCategoria from './SelectorCategoria'
import InputsPago from './InputsPago'
import { validarMontosPagos } from '../utils/calculosCaja'

export default function ModalMovimiento({
  isOpen,
  onClose,
  tipo, // 'entrada' o 'salida'
  categorias,
  metodosPago,
  onGuardar
}) {
  const [categoriaId, setCategoriaId] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const [pagos, setPagos] = useState([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Resetear form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setCategoriaId(null)
      setDescripcion('')
      setPagos([])
      setError('')
    }
  }, [isOpen])

  const handleGuardar = async () => {
    // Validar categoría
    if (!categoriaId) {
      setError('Seleccioná una categoría')
      return
    }

    // Validar montos
    const validacion = validarMontosPagos(pagos)
    if (!validacion.valido) {
      setError(validacion.mensaje)
      return
    }

    setGuardando(true)
    setError('')

    try {
      await onGuardar({
        tipo,
        categoria_id: categoriaId,
        descripcion: descripcion.trim(),
        pagos
      })

      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar movimiento')
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  const esEntrada = tipo === 'entrada'
  const titulo = esEntrada ? 'Nueva Entrada' : 'Nueva Salida'
  const colorFondo = esEntrada ? 'bg-emerald-500' : 'bg-red-500'

  // Filtrar categorías según tipo
  const categoriasDisponibles = categorias.filter(
    cat => cat.tipo === tipo || cat.tipo === 'ambos'
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className={`${colorFondo} px-5 py-4 text-white flex items-center justify-between`}>
            <h3 className="font-heading font-semibold text-lg">{titulo}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Selector de categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <SelectorCategoria
                categorias={categoriasDisponibles}
                categoriaSeleccionada={categoriaId}
                onChange={setCategoriaId}
              />
            </div>

            {/* Inputs de pago */}
            <div className="border-t border-gray-200 pt-5">
              <InputsPago
                metodosPago={metodosPago}
                pagos={pagos}
                onChange={setPagos}
              />
            </div>

            {/* Descripción opcional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Zapatillas Nike"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              <Check className="w-5 h-5" />
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
