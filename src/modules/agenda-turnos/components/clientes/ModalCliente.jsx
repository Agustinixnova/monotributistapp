/**
 * Modal para crear/editar clientes de agenda
 */

import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, FileText, Loader2, Briefcase, Home } from 'lucide-react'

export default function ModalCliente({
  isOpen,
  onClose,
  onGuardar,
  cliente = null, // null = crear nuevo
  esEmpleado = false // Si el usuario actual es empleado
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    whatsapp: '',
    email: '',
    notas: '',
    esClientePropio: false // Solo para empleados: true = cliente privado
  })

  // Reset form cuando se abre/cierra o cambia el cliente
  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        setForm({
          nombre: cliente.nombre || '',
          apellido: cliente.apellido || '',
          telefono: cliente.telefono || '',
          whatsapp: cliente.whatsapp || '',
          email: cliente.email || '',
          notas: cliente.notas || '',
          esClientePropio: cliente.es_cliente_empleado || false
        })
      } else {
        setForm({
          nombre: '',
          apellido: '',
          telefono: '',
          whatsapp: '',
          email: '',
          notas: '',
          esClientePropio: false
        })
      }
      setError(null)
    }
  }, [isOpen, cliente])

  // Auto-completar WhatsApp con teléfono
  const handleTelefonoChange = (value) => {
    setForm(f => ({
      ...f,
      telefono: value,
      // Si WhatsApp está vacío, copiarlo del teléfono
      whatsapp: f.whatsapp === '' || f.whatsapp === f.telefono ? value : f.whatsapp
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onGuardar({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim() || null,
        telefono: form.telefono.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        notas: form.notas.trim() || null,
        esClientePropio: esEmpleado ? form.esClientePropio : false
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar cliente')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-lg">
                {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={form.apellido}
                  onChange={(e) => setForm(f => ({ ...f, apellido: e.target.value }))}
                  placeholder="Apellido"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                placeholder="Ej: 1155667788"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="Número de WhatsApp"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se usa para enviar recordatorios
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Notas
              </label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Preferencias, alergias, observaciones..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Tipo de cliente (solo para empleados) */}
            {esEmpleado && !cliente && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de cliente
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, esClientePropio: false }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      !form.esClientePropio
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Briefcase className={`w-5 h-5 mb-1 ${!form.esClientePropio ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${!form.esClientePropio ? 'text-emerald-700' : 'text-gray-700'}`}>
                      Del local
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Cliente del salón/negocio
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, esClientePropio: true }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      form.esClientePropio
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Home className={`w-5 h-5 mb-1 ${form.esClientePropio ? 'text-purple-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${form.esClientePropio ? 'text-purple-700' : 'text-gray-700'}`}>
                      Mi cliente
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Particular, trabajo propio
                    </p>
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                cliente ? 'Guardar cambios' : 'Crear cliente'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
