/**
 * Modal para crear/editar categorías personalizadas
 */

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import IconoDinamico from './IconoDinamico'

// Iconos disponibles para elegir
const ICONOS_DISPONIBLES = [
  { nombre: 'Store', label: 'Tienda' },
  { nombre: 'ShoppingCart', label: 'Carrito' },
  { nombre: 'DollarSign', label: 'Dólar' },
  { nombre: 'ArrowDownCircle', label: 'Entrada' },
  { nombre: 'Truck', label: 'Camión' },
  { nombre: 'Receipt', label: 'Recibo' },
  { nombre: 'UserMinus', label: 'Retiro' },
  { nombre: 'Briefcase', label: 'Maletín' },
  { nombre: 'ArrowUpCircle', label: 'Salida' },
  { nombre: 'RefreshCw', label: 'Ajuste' },
  { nombre: 'Package', label: 'Paquete' },
  { nombre: 'Wallet', label: 'Billetera' },
  { nombre: 'HandCoins', label: 'Monedas' },
  { nombre: 'PiggyBank', label: 'Alcancía' },
  { nombre: 'Building2', label: 'Edificio' },
  { nombre: 'Coins', label: 'Monedas' },
  { nombre: 'BadgeDollarSign', label: 'Etiqueta' },
  { nombre: 'List', label: 'Lista' }
]

export default function ModalCategoria({ isOpen, onClose, onGuardar, categoria = null }) {
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState('List')
  const [tipo, setTipo] = useState('entrada')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = !!categoria

  useEffect(() => {
    if (isOpen) {
      if (categoria) {
        setNombre(categoria.nombre)
        setIcono(categoria.icono)
        setTipo(categoria.tipo)
      } else {
        setNombre('')
        setIcono('List')
        setTipo('entrada')
      }
      setError('')
    }
  }, [isOpen, categoria])

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError('Ingresá un nombre')
      return
    }

    setGuardando(true)
    setError('')

    try {
      await onGuardar({ nombre: nombre.trim(), icono, tipo })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="bg-violet-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
            <h3 className="font-heading font-semibold text-lg">
              {esEdicion ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Ventas por delivery"
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    tipo === 'entrada'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('salida')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    tipo === 'salida'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Salida
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('ambos')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    tipo === 'ambos'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Ambos
                </button>
              </div>
            </div>

            {/* Icono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icono
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {ICONOS_DISPONIBLES.map(({ nombre: nombreIcono, label }) => (
                  <button
                    key={nombreIcono}
                    type="button"
                    onClick={() => setIcono(nombreIcono)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                      icono === nombreIcono
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={label}
                  >
                    <IconoDinamico
                      nombre={nombreIcono}
                      className={`w-6 h-6 ${icono === nombreIcono ? 'text-violet-600' : 'text-gray-600'}`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Seleccionado: {icono}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg"
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
