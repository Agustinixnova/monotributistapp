/**
 * Modal para crear/editar proveedores
 */

import { useState, useEffect } from 'react'
import { X, Check, Truck, Phone, Mail, MapPin, MessageSquare, AlertTriangle } from 'lucide-react'

// Validar CUIT argentino (algoritmo módulo 11)
function validarCuit(cuit) {
  if (!cuit) return { valido: true, mensaje: '' }

  // Limpiar: solo dígitos
  const limpio = cuit.replace(/[^0-9]/g, '')
  if (limpio.length !== 11) return { valido: false, mensaje: 'El CUIT debe tener 11 dígitos' }

  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let suma = 0
  for (let i = 0; i < 10; i++) {
    suma += parseInt(limpio[i]) * multiplicadores[i]
  }
  const resto = suma % 11
  const verificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto

  if (parseInt(limpio[10]) !== verificador) {
    return { valido: false, mensaje: 'El dígito verificador del CUIT no es válido' }
  }

  return { valido: true, mensaje: '' }
}

// Formatear CUIT: XX-XXXXXXXX-X
function formatearCuit(value) {
  const limpio = value.replace(/[^0-9]/g, '').slice(0, 11)
  if (limpio.length <= 2) return limpio
  if (limpio.length <= 10) return `${limpio.slice(0, 2)}-${limpio.slice(2)}`
  return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`
}

export default function ModalProveedor({ isOpen, onClose, onGuardar, proveedor = null }) {
  const [razonSocial, setRazonSocial] = useState('')
  const [cuit, setCuit] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [comentario, setComentario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [cuitWarning, setCuitWarning] = useState('')

  const esEdicion = !!proveedor

  useEffect(() => {
    if (isOpen) {
      if (proveedor) {
        setRazonSocial(proveedor.razon_social || '')
        setCuit(proveedor.cuit || '')
        setTelefono(proveedor.telefono || '')
        setEmail(proveedor.email || '')
        setDireccion(proveedor.direccion || '')
        setComentario(proveedor.comentario || '')
      } else {
        setRazonSocial('')
        setCuit('')
        setTelefono('')
        setEmail('')
        setDireccion('')
        setComentario('')
      }
      setError('')
      setCuitWarning('')
    }
  }, [isOpen, proveedor])

  // Validar CUIT en tiempo real
  const handleCuitChange = (e) => {
    const formatted = formatearCuit(e.target.value)
    setCuit(formatted)

    const limpio = formatted.replace(/[^0-9]/g, '')
    if (limpio.length === 11) {
      const { valido, mensaje } = validarCuit(formatted)
      setCuitWarning(valido ? '' : mensaje)
    } else {
      setCuitWarning('')
    }
  }

  const handleGuardar = async () => {
    if (!razonSocial.trim()) {
      setError('La razón social es obligatoria')
      return
    }

    setGuardando(true)
    setError('')

    try {
      await onGuardar({
        razon_social: razonSocial.trim(),
        cuit: cuit.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        direccion: direccion.trim() || null,
        comentario: comentario.trim() || null
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
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-sky-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">
                {esEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Razón Social */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón Social / Nombre *
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej: Distribuidora Norte SRL"
                  maxLength={200}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            {/* CUIT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CUIT (opcional)
              </label>
              <input
                type="text"
                value={cuit}
                onChange={handleCuitChange}
                placeholder="XX-XXXXXXXX-X"
                maxLength={13}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
                  cuitWarning ? 'border-orange-300' : 'border-gray-300'
                }`}
              />
              {cuitWarning && (
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                  <AlertTriangle className="w-3 h-3" />
                  {cuitWarning}
                </div>
              )}
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (opcional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="proveedor@ejemplo.com"
                  maxLength={150}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección (opcional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  maxLength={300}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

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
                  placeholder="Ej: Entrega los martes, pedir con anticipación..."
                  maxLength={500}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
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
              className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg"
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
