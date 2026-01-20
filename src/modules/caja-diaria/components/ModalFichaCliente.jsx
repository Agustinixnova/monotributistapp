/**
 * Modal de ficha/perfil de cliente - Muestra info, saldo e historial
 */

import { useState, useEffect } from 'react'
import { X, User, Phone, CreditCard, Edit2, History, TrendingUp, TrendingDown, MessageSquare, Save, XCircle } from 'lucide-react'
import { useClientesFiado } from '../hooks/useClientesFiado'
import { formatearMonto, formatearFechaCorta, formatearHora } from '../utils/formatters'

export default function ModalFichaCliente({
  isOpen,
  onClose,
  cliente,
  onEditar
}) {
  const { obtenerHistorial, obtenerDeuda, actualizar } = useClientesFiado()

  const [historial, setHistorial] = useState([])
  const [deudaActual, setDeudaActual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editandoNotas, setEditandoNotas] = useState(false)
  const [notasTemp, setNotasTemp] = useState('')
  const [guardandoNotas, setGuardandoNotas] = useState(false)

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && cliente) {
      const cargarDatos = async () => {
        setLoading(true)

        // Cargar deuda actual
        const { deuda } = await obtenerDeuda(cliente.id)
        setDeudaActual(deuda || 0)

        // Cargar historial
        const { historial: data } = await obtenerHistorial(cliente.id)
        setHistorial(data || [])

        setLoading(false)
      }
      cargarDatos()

      // Resetear estados de edición
      setEditandoNotas(false)
      setNotasTemp(cliente.comentario || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cliente?.id])

  const handleGuardarNotas = async () => {
    if (!cliente) return

    setGuardandoNotas(true)
    const result = await actualizar(cliente.id, {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      limite_credito: cliente.limite_credito,
      comentario: notasTemp.trim() || null
    })
    setGuardandoNotas(false)

    if (result.success) {
      // Actualizar el cliente en el estado local
      cliente.comentario = notasTemp.trim() || null
      setEditandoNotas(false)
    }
  }

  const handleCancelarEdicion = () => {
    setNotasTemp(cliente?.comentario || '')
    setEditandoNotas(false)
  }

  if (!isOpen || !cliente) return null

  const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ''}`.trim()
  const tieneDeuda = deudaActual > 0
  const tieneSaldoFavor = deudaActual < 0

  // Calcular totales del historial
  const totalFiado = historial
    .filter(h => h.tipo === 'fiado')
    .reduce((sum, h) => sum + parseFloat(h.monto || 0), 0)
  const totalPagado = historial
    .filter(h => h.tipo === 'pago')
    .reduce((sum, h) => sum + parseFloat(h.monto || 0), 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-violet-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">Ficha de Cliente</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto">
            {/* Info del cliente */}
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-600 font-bold text-xl">
                    {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0) || ''}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{nombreCompleto}</h4>
                  {cliente.telefono && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Phone className="w-4 h-4" />
                      {cliente.telefono}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <CreditCard className="w-4 h-4" />
                    {cliente.limite_credito
                      ? `Límite: ${formatearMonto(cliente.limite_credito)}`
                      : 'Sin límite de crédito'}
                  </p>
                </div>
                {onEditar && (
                  <button
                    onClick={() => {
                      onClose()
                      onEditar(cliente)
                    }}
                    className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                    title="Editar cliente"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Comentario/notas */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <MessageSquare className="w-4 h-4" />
                    <span>Notas</span>
                  </div>
                  {!editandoNotas && (
                    <button
                      onClick={() => setEditandoNotas(true)}
                      className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                  )}
                </div>

                {editandoNotas ? (
                  <div className="space-y-2">
                    <textarea
                      value={notasTemp}
                      onChange={(e) => setNotasTemp(e.target.value)}
                      placeholder="Agregá notas sobre el cliente..."
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none text-sm"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {notasTemp.length}/500 caracteres
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelarEdicion}
                          disabled={guardandoNotas}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancelar
                        </button>
                        <button
                          onClick={handleGuardarNotas}
                          disabled={guardandoNotas}
                          className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          {guardandoNotas ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 min-h-[60px]">
                    {cliente.comentario ? (
                      <p className="text-sm text-gray-600 italic">{cliente.comentario}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Sin notas agregadas</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Saldo actual */}
            <div className="px-5 py-4 border-b border-gray-200">
              <div className={`rounded-xl p-4 ${
                tieneDeuda ? 'bg-red-50' : tieneSaldoFavor ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {tieneDeuda ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : tieneSaldoFavor ? (
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                    <span className={`text-sm font-medium ${
                      tieneDeuda ? 'text-red-700' : tieneSaldoFavor ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {tieneDeuda ? 'Deuda actual:' : tieneSaldoFavor ? 'Saldo a favor:' : 'Saldo:'}
                    </span>
                  </div>
                  <span className={`text-2xl font-bold ${
                    tieneDeuda ? 'text-red-600' : tieneSaldoFavor ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {formatearMonto(Math.abs(deudaActual))}
                  </span>
                </div>
              </div>

              {/* Resumen histórico */}
              {historial.length > 0 && (
                <div className="flex gap-4 mt-3 text-sm">
                  <div className="flex-1 text-center p-2 bg-red-50 rounded-lg">
                    <p className="text-red-600 font-medium">{formatearMonto(totalFiado)}</p>
                    <p className="text-xs text-red-500">Total vendido</p>
                  </div>
                  <div className="flex-1 text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-emerald-600 font-medium">{formatearMonto(totalPagado)}</p>
                    <p className="text-xs text-emerald-500">Total pagado</p>
                  </div>
                </div>
              )}
            </div>

            {/* Historial */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-gray-500" />
                <h5 className="font-medium text-gray-700">Historial de movimientos</h5>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full" />
                </div>
              ) : historial.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {historial.map((item, idx) => (
                    <div
                      key={`${item.tipo}-${item.id}-${idx}`}
                      className={`p-3 rounded-lg text-sm ${
                        item.tipo === 'fiado' ? 'bg-red-50' : 'bg-emerald-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${
                          item.tipo === 'fiado' ? 'text-red-700' : 'text-emerald-700'
                        }`}>
                          {item.tipo === 'fiado' ? 'Cta. Cte.' : 'Pago'}
                        </span>
                        <span className={`font-bold ${
                          item.tipo === 'fiado' ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {item.tipo === 'fiado' ? '+' : '-'}{formatearMonto(item.monto)}
                        </span>
                      </div>
                      {item.descripcion && (
                        <p className="text-gray-600 text-xs mb-1">{item.descripcion}</p>
                      )}
                      <div className="text-xs text-gray-400 flex flex-wrap gap-x-3">
                        <span>{formatearFechaCorta(item.fecha)} {formatearHora(item.hora)}</span>
                        {item.metodo_pago && <span>{item.metodo_pago}</span>}
                        {item.created_by_nombre && (
                          <span className="text-gray-500">
                            Por: {item.created_by_nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
