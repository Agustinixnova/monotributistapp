/**
 * Modal para crear/editar métodos de pago personalizados
 */

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import IconoDinamico from './IconoDinamico'

// Iconos disponibles para métodos de pago
const ICONOS_DISPONIBLES = [
  { nombre: 'Banknote', label: 'Billete' },
  { nombre: 'Smartphone', label: 'Celular' },
  { nombre: 'CreditCard', label: 'Tarjeta' },
  { nombre: 'QrCode', label: 'QR' },
  { nombre: 'ArrowLeftRight', label: 'Transferencia' },
  { nombre: 'Wallet', label: 'Billetera' },
  { nombre: 'Wallet2', label: 'Billetera 2' },
  { nombre: 'Package', label: 'Paquete' },
  { nombre: 'HandCoins', label: 'Monedas' },
  { nombre: 'Coins', label: 'Monedas' },
  { nombre: 'DollarSign', label: 'Dólar' },
  { nombre: 'CircleDollarSign', label: 'Dólar círculo' },
  { nombre: 'BadgeDollarSign', label: 'Etiqueta' },
  { nombre: 'List', label: 'Lista' }
]

export default function ModalMetodoPago({ isOpen, onClose, onGuardar, metodo = null }) {
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState('Wallet')
  const [esEfectivo, setEsEfectivo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = !!metodo

  useEffect(() => {
    if (isOpen) {
      if (metodo) {
        setNombre(metodo.nombre)
        setIcono(metodo.icono)
        setEsEfectivo(metodo.es_efectivo)
      } else {
        setNombre('')
        setIcono('Wallet')
        setEsEfectivo(false)
      }
      setError('')
    }
  }, [isOpen, metodo])

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError('Ingresá un nombre')
      return
    }

    setGuardando(true)
    setError('')

    try {
      await onGuardar({ nombre: nombre.trim(), icono, es_efectivo: esEfectivo })
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
              {esEdicion ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
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
                placeholder="Ej: Cuenta DNI, Ualá, etc."
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Es efectivo */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esEfectivo}
                  onChange={(e) => setEsEfectivo(e.target.checked)}
                  className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                />
                <div>
                  <div className="font-medium text-gray-900">¿Es efectivo?</div>
                  <div className="text-sm text-gray-600">
                    Si está tildado, se sumará al efectivo en caja
                  </div>
                </div>
              </label>
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
