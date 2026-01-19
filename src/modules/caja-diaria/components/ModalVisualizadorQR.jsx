/**
 * Modal para mostrar QR y alias de pago a clientes
 * Diseñado para mostrarse en pantalla completa cuando un cliente quiere pagar
 */

import { useState } from 'react'
import { X, Copy, Check, QrCode, CreditCard, ChevronLeft, ChevronRight, FileText } from 'lucide-react'

export default function ModalVisualizadorQR({ isOpen, onClose, qrUrl, alias, nombreNegocio }) {
  const [copiadoIndex, setCopiadoIndex] = useState(null)
  const [aliasActivo, setAliasActivo] = useState(0)

  // Detectar si el QR es un PDF
  const esPdf = qrUrl && (qrUrl.toLowerCase().endsWith('.pdf') || qrUrl.includes('.pdf?'))

  const copiarAlias = async (texto, index) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiadoIndex(index)
      setTimeout(() => setCopiadoIndex(null), 2000)
    } catch (err) {
      console.error('Error copiando:', err)
    }
  }

  const siguienteAlias = () => {
    setAliasActivo((prev) => (prev + 1) % alias.length)
  }

  const anteriorAlias = () => {
    setAliasActivo((prev) => (prev - 1 + alias.length) % alias.length)
  }

  if (!isOpen) return null

  const tieneQR = !!qrUrl
  const tieneAlias = alias && alias.length > 0
  const sinDatos = !tieneQR && !tieneAlias

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg">{nombreNegocio || 'Mi Negocio'}</h2>
              <p className="text-violet-100 text-sm">Datos de pago</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
        {sinDatos ? (
          <div className="text-center text-gray-500 py-8">
            <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2 text-gray-700">No hay QR ni alias configurados</p>
            <p className="text-sm">
              Configurá tus datos de pago desde el menú de configuración
            </p>
          </div>
        ) : (
          <>
            {/* QR */}
            {tieneQR && (
              <div className="flex flex-col items-center">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-violet-600" />
                  Código QR
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  {esPdf ? (
                    <div className="w-64 h-64 flex flex-col items-center justify-center gap-4">
                      <FileText className="w-16 h-16 text-violet-600" />
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Ver QR (PDF)
                      </a>
                    </div>
                  ) : (
                    <img
                      src={qrUrl}
                      alt="QR de pago"
                      className="w-64 h-64 object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Alias */}
            {tieneAlias && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                  Alias de pago
                </h3>
                {alias.length === 1 ? (
                  // Un solo alias
                  <div className="bg-violet-50 rounded-xl p-4 border-2 border-violet-200">
                    <div className="flex items-center gap-2 mb-2 text-violet-700">
                      <span className="font-medium">{alias[0].nombre}</span>
                    </div>
                    <button
                      onClick={() => copiarAlias(alias[0].alias, 0)}
                      className="w-full flex items-center justify-between p-3 bg-white hover:bg-violet-100 rounded-lg transition-colors border border-violet-200"
                    >
                      <span className="font-mono text-lg text-gray-900">{alias[0].alias}</span>
                      {copiadoIndex === 0 ? (
                        <Check className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-violet-600" />
                      )}
                    </button>
                    {alias[0].banco && (
                      <p className="text-violet-700 text-sm mt-2">{alias[0].banco}</p>
                    )}
                  </div>
                ) : (
                  // Múltiples alias - carrusel
                  <div className="bg-violet-50 rounded-xl p-4 border-2 border-violet-200">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={anteriorAlias}
                        className="p-2 hover:bg-violet-200 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-violet-700" />
                      </button>
                      <div className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-medium text-violet-700">{alias[aliasActivo].nombre}</span>
                        </div>
                        <span className="text-xs text-violet-600">
                          {aliasActivo + 1} de {alias.length}
                        </span>
                      </div>
                      <button
                        onClick={siguienteAlias}
                        className="p-2 hover:bg-violet-200 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-violet-700" />
                      </button>
                    </div>
                    <button
                      onClick={() => copiarAlias(alias[aliasActivo].alias, aliasActivo)}
                      className="w-full flex items-center justify-between p-3 bg-white hover:bg-violet-100 rounded-lg transition-colors border border-violet-200"
                    >
                      <span className="font-mono text-lg text-gray-900">{alias[aliasActivo].alias}</span>
                      {copiadoIndex === aliasActivo ? (
                        <Check className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-violet-600" />
                      )}
                    </button>
                    {alias[aliasActivo].banco && (
                      <p className="text-violet-700 text-sm mt-2 text-center">
                        {alias[aliasActivo].banco}
                      </p>
                    )}
                    {/* Indicadores */}
                    <div className="flex justify-center gap-1 mt-3">
                      {alias.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setAliasActivo(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === aliasActivo ? 'bg-violet-600' : 'bg-violet-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
