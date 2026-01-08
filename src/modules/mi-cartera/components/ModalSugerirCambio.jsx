import { useState } from 'react'
import { X, Send, AlertCircle, Check } from 'lucide-react'
import { useMisSugerencias } from '../hooks/useSugerencias'

/**
 * Modal para que el cliente sugiera un cambio en sus datos
 */
export function ModalSugerirCambio({
  clientId,
  campo,
  campoLabel,
  valorActual,
  tabla = 'client_fiscal_data',
  tipo = 'text',
  opciones = [],
  descripcion,
  onClose,
  onSuccess
}) {
  const { enviarSugerencia, enviando } = useMisSugerencias()
  const [valorSugerido, setValorSugerido] = useState('')
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState(null)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validar que hay un valor
    if (!valorSugerido && tipo !== 'boolean') {
      setError('Debes ingresar el valor correcto')
      return
    }

    // Si es booleano, convertir
    let valorFinal = valorSugerido
    if (tipo === 'boolean') {
      valorFinal = valorSugerido === 'true' ? 'true' : 'false'
    }

    try {
      const result = await enviarSugerencia({
        clientId,
        campo,
        campoLabel,
        valorActual: valorActual != null ? String(valorActual) : null,
        valorSugerido: valorFinal,
        tabla,
        comentario: comentario.trim() || null
      })

      if (result) {
        setEnviado(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } else {
        setError('No se pudo enviar la sugerencia')
      }
    } catch (err) {
      setError(err.message || 'Error al enviar sugerencia')
    }
  }

  const formatearValorActual = () => {
    if (valorActual === null || valorActual === undefined || valorActual === '') {
      return 'Sin datos'
    }
    if (tipo === 'boolean') {
      return valorActual ? 'Si' : 'No'
    }
    if (tipo === 'select' && opciones.length > 0) {
      const opcion = opciones.find(o => o.value === valorActual)
      return opcion?.label || valorActual
    }
    if (tipo === 'currency') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
      }).format(valorActual)
    }
    return String(valorActual)
  }

  const renderInput = () => {
    switch (tipo) {
      case 'boolean':
        return (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="valorBooleano"
                value="true"
                checked={valorSugerido === 'true'}
                onChange={(e) => setValorSugerido(e.target.value)}
                className="w-4 h-4 text-violet-600"
              />
              <span>Si</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="valorBooleano"
                value="false"
                checked={valorSugerido === 'false'}
                onChange={(e) => setValorSugerido(e.target.value)}
                className="w-4 h-4 text-violet-600"
              />
              <span>No</span>
            </label>
          </div>
        )

      case 'select':
        return (
          <select
            value={valorSugerido}
            onChange={(e) => setValorSugerido(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="">Seleccionar...</option>
            {opciones.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        )

      case 'number':
      case 'currency':
        return (
          <input
            type="number"
            value={valorSugerido}
            onChange={(e) => setValorSugerido(e.target.value)}
            placeholder="Ingresa el valor correcto"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        )

      case 'tel':
        return (
          <input
            type="tel"
            value={valorSugerido}
            onChange={(e) => setValorSugerido(e.target.value)}
            placeholder="Ej: 11 1234-5678"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        )

      case 'email':
        return (
          <input
            type="email"
            value={valorSugerido}
            onChange={(e) => setValorSugerido(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        )

      default:
        return (
          <input
            type="text"
            value={valorSugerido}
            onChange={(e) => setValorSugerido(e.target.value)}
            placeholder="Ingresa el valor correcto"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        )
    }
  }

  // Vista de exito
  if (enviado) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sugerencia enviada
          </h3>
          <p className="text-gray-600">
            Tu contadora revisara la sugerencia y te notificara cuando sea procesada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Sugerir cambio
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Campo que se quiere cambiar */}
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500 block mb-1">Campo</span>
            <span className="font-medium text-gray-900">{campoLabel}</span>
            {descripcion && (
              <p className="text-xs text-gray-500 mt-1">{descripcion}</p>
            )}
          </div>

          {/* Valor actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor actual
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600">
              {formatearValorActual()}
            </div>
          </div>

          {/* Valor sugerido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor correcto
            </label>
            {renderInput()}
          </div>

          {/* Comentario opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Podes agregar una explicacion..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {enviando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
