/**
 * Modal para crear/editar clientes con cuenta corriente
 */

import { useState, useEffect } from 'react'
import { X, Check, User, Phone, CreditCard, MessageSquare, Wallet } from 'lucide-react'
import InputMonto from './InputMonto'
import { formatearMonto } from '../utils/formatters'

export default function ModalClienteFiado({ isOpen, onClose, onGuardar, cliente = null }) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [limiteCredito, setLimiteCredito] = useState(0)
  const [sinLimite, setSinLimite] = useState(true)
  const [comentario, setComentario] = useState('')
  const [saldoInicial, setSaldoInicial] = useState(0)
  const [tipoSaldo, setTipoSaldo] = useState('deuda') // 'deuda' o 'favor'
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = !!cliente

  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        setNombre(cliente.nombre || '')
        setApellido(cliente.apellido || '')
        setTelefono(cliente.telefono || '')
        setLimiteCredito(cliente.limite_credito || 0)
        setSinLimite(!cliente.limite_credito)
        setComentario(cliente.comentario || '')
      } else {
        setNombre('')
        setApellido('')
        setTelefono('')
        setLimiteCredito(0)
        setSinLimite(true)
        setComentario('')
        setSaldoInicial(0)
        setTipoSaldo('deuda')
      }
      setError('')
    }
  }, [isOpen, cliente])

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setGuardando(true)
    setError('')

    try {
      await onGuardar({
        nombre: nombre.trim(),
        apellido: apellido.trim() || null,
        telefono: telefono.trim() || null,
        limite_credito: sinLimite ? null : limiteCredito,
        comentario: comentario.trim() || null,
        // Solo para clientes nuevos
        saldo_inicial: !esEdicion && saldoInicial > 0 ? saldoInicial : null,
        tipo_saldo: !esEdicion && saldoInicial > 0 ? tipoSaldo : null
      })
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
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">
                {esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan"
                  maxLength={100}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido (opcional)
              </label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej: Perez"
                maxLength={100}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono (opcional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 11 2345-6789"
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>

            {/* Límite de crédito */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Límite de crédito
              </label>

              {/* Toggle sin límite */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSinLimite(!sinLimite)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    sinLimite ? 'bg-violet-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      sinLimite ? 'left-5' : 'left-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600">
                  Sin límite de crédito
                </span>
              </div>

              {!sinLimite && (
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <InputMonto
                    value={limiteCredito}
                    onChange={setLimiteCredito}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {sinLimite
                  ? 'El cliente puede tener cuenta corriente sin restricción de monto'
                  : `Se mostrará un aviso si supera ${formatearMonto(limiteCredito) || '$0'}`}
              </p>
            </div>

            {/* Saldo inicial - Solo para clientes nuevos */}
            {!esEdicion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo inicial (opcional)
                </label>

                {/* Tipo de saldo */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setTipoSaldo('deuda')}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors ${
                      tipoSaldo === 'deuda'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Debe (deuda)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoSaldo('favor')}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors ${
                      tipoSaldo === 'favor'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    A favor
                  </button>
                </div>

                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <InputMonto
                    value={saldoInicial}
                    onChange={setSaldoInicial}
                    placeholder="0"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 ${
                      tipoSaldo === 'deuda'
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {saldoInicial > 0
                    ? tipoSaldo === 'deuda'
                      ? `El cliente empezará con una deuda de ${formatearMonto(saldoInicial)}`
                      : `El cliente empezará con ${formatearMonto(saldoInicial)} a favor`
                    : 'Dejá en 0 si el cliente empieza sin saldo'}
                </p>
              </div>
            )}

            {/* Comentario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ej: Cliente frecuente, paga los viernes..."
                  maxLength={500}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {comentario.length}/500 caracteres
              </p>
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
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg"
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
