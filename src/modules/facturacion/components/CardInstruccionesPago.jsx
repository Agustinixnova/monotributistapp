import { useState, useEffect } from 'react'
import {
  CreditCard,
  Building,
  Copy,
  Check,
  Receipt,
  Banknote,
  CircleDollarSign,
  Info,
  FileText,
  Eye,
  Download,
  X,
  AlertCircle,
  MessageSquareWarning
} from 'lucide-react'
import { getInstruccionesCliente, METODOS_PAGO } from '../services/instruccionesPagoService'
import { formatearMoneda } from '../utils/formatters'
import { crearConversacionConDestinatarios } from '../../buzon/services/buzonService'
import { supabase } from '../../../lib/supabase'

const ICONOS_METODO = {
  debito_automatico: Building,
  vep: CreditCard,
  mercado_pago: CircleDollarSign,
  efectivo: Banknote
}

const COLORES_METODO = {
  debito_automatico: 'bg-blue-50 text-blue-700 border-blue-200',
  vep: 'bg-violet-50 text-violet-700 border-violet-200',
  mercado_pago: 'bg-sky-50 text-sky-700 border-sky-200',
  efectivo: 'bg-green-50 text-green-700 border-green-200'
}

// Modal para reportar problema
function ModalReportarProblema({ isOpen, onClose, tipoInstruccion }) {
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!isOpen) return null

  const handleEnviar = async () => {
    if (!mensaje.trim()) return

    try {
      setEnviando(true)

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      // Obtener perfil del usuario con contador asignado
      const { data: perfil } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, assigned_to')
        .eq('id', user.id)
        .single()

      // Obtener usuarios de roles específicos
      const { data: roles } = await supabase
        .from('roles')
        .select('id, name')
        .in('name', ['contadora_principal', 'desarrollo', 'comunicadora'])

      const rolesMap = {}
      roles?.forEach(r => { rolesMap[r.name] = r.id })

      const { data: usuariosDestino } = await supabase
        .from('profiles')
        .select('id, role_id')
        .in('role_id', Object.values(rolesMap))

      // Construir lista de destinatarios
      const destinatarios = []

      // Agregar contador asignado si existe
      if (perfil?.assigned_to) {
        destinatarios.push(perfil.assigned_to)
      }

      // Agregar contadora_principal, desarrollo y comunicadora
      usuariosDestino?.forEach(u => {
        if (!destinatarios.includes(u.id)) {
          destinatarios.push(u.id)
        }
      })

      // Crear conversación
      const asunto = `Problema con instrucciones de pago - ${tipoInstruccion}`
      const contenido = mensaje

      await crearConversacionConDestinatarios(
        user.id,
        asunto,
        contenido,
        destinatarios,
        'instrucciones_pago',
        null,
        []
      )

      // Cerrar modal y limpiar
      setMensaje('')
      onClose()
      alert('Tu reporte ha sido enviado correctamente')
    } catch (error) {
      console.error('Error enviando reporte:', error)
      alert('Hubo un error al enviar el reporte. Por favor intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-amber-600" />
            Reportar problema o cambio
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3">
            Describe el problema o cambio que necesitas reportar sobre las instrucciones de pago de <strong>{tipoInstruccion}</strong>:
          </p>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Ejemplo: El número de VEP no funciona, necesito cambiar el método de pago, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={5}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onClose}
            disabled={enviando}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={!mensaje.trim() || enviando}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Enviando...' : 'Enviar reporte'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal para visualizar boleta
function ModalVisualizarBoleta({ isOpen, onClose, url }) {
  if (!isOpen || !url) return null

  const isPdf = url.toLowerCase().includes('.pdf')

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = 'boleta_pago'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Boleta de pago
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {isPdf ? (
            <iframe
              src={url}
              className="w-full h-[60vh] rounded-lg border border-gray-200"
              title="Boleta de pago"
            />
          ) : (
            <img
              src={url}
              alt="Boleta de pago"
              className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Descargar boleta
          </button>
        </div>
      </div>
    </div>
  )
}

function SeccionPago({ titulo, instrucciones, tipo }) {
  const [copiado, setCopiado] = useState(null)
  const [modalBoletaOpen, setModalBoletaOpen] = useState(false)
  const [modalReporteOpen, setModalReporteOpen] = useState(false)

  if (!instrucciones) return null

  const Icono = ICONOS_METODO[instrucciones.metodo_pago] || CreditCard
  const colores = COLORES_METODO[instrucciones.metodo_pago] || COLORES_METODO.vep
  const metodo = METODOS_PAGO[instrucciones.metodo_pago]

  const copiarAlPortapapeles = async (texto, campo) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(campo)
      setTimeout(() => setCopiado(null), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const renderContenido = () => {
    switch (instrucciones.metodo_pago) {
      case 'debito_automatico':
        return (
          <div className="text-sm text-gray-600">
            <p>Asegurate de tener saldo en tu cuenta para que se debite correctamente.</p>
            <p className="text-amber-600 mt-1">En caso de no contar con saldo, se generara una deuda y se sumaran intereses.</p>
          </div>
        )

      case 'vep':
        return (
          <div className="space-y-3">
            {instrucciones.vep_monto && (
              <div className="p-3 bg-white/60 rounded-lg">
                <p className="text-xs text-gray-500">Monto a pagar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearMoneda(instrucciones.vep_monto)}
                </p>
              </div>
            )}
            {instrucciones.vep_numero && (
              <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-gray-500">Numero de VEP</p>
                  <p className="font-mono font-semibold text-gray-900 tracking-wider">
                    {instrucciones.vep_numero}
                  </p>
                </div>
                <button
                  onClick={() => copiarAlPortapapeles(instrucciones.vep_numero, 'vep')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiado === 'vep' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
            {instrucciones.vep_vencimiento && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-red-600 font-medium">Vencimiento</p>
                  <p className="text-sm font-bold text-red-700">
                    {new Date(instrucciones.vep_vencimiento).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case 'mercado_pago':
        return (
          <div className="space-y-3">
            {instrucciones.mercadopago_numero && (
              <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-gray-500">Numero de Mercado Pago</p>
                  <p className="font-mono font-semibold text-gray-900 tracking-wider">
                    {instrucciones.mercadopago_numero}
                  </p>
                </div>
                <button
                  onClick={() => copiarAlPortapapeles(instrucciones.mercadopago_numero, 'mp')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiado === 'mp' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
            {instrucciones.mercadopago_vencimiento && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-red-600 font-medium">Vencimiento</p>
                  <p className="text-sm font-bold text-red-700">
                    {new Date(instrucciones.mercadopago_vencimiento).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case 'efectivo':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Paga en Rapipago, PagoFacil u otros puntos de pago:
            </p>
            {instrucciones.cpe_codigo && (
              <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-gray-500">Codigo de pago</p>
                  <p className="font-mono font-semibold text-gray-900">
                    {instrucciones.cpe_codigo}
                  </p>
                </div>
                <button
                  onClick={() => copiarAlPortapapeles(instrucciones.cpe_codigo, 'cpe')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiado === 'cpe' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Botón ver boleta */}
            {instrucciones.efectivo_boleta_url && (
              <button
                onClick={() => setModalBoletaOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver boleta de pago
              </button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <div className={`rounded-lg border p-4 ${colores}`}>
        <div className="flex items-center gap-2 mb-3">
          {tipo === 'iibb' ? (
            <Receipt className="w-4 h-4" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          <span className="font-medium text-sm">{titulo}</span>
          <span className="ml-auto px-2 py-0.5 bg-white/60 rounded text-xs">
            {metodo?.label || instrucciones.metodo_pago}
          </span>
        </div>
        {renderContenido()}
        {instrucciones.notas && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <p className="text-xs text-current/80 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {instrucciones.notas}
            </p>
          </div>
        )}

        {/* Botón reportar problema */}
        <div className="mt-3 pt-3 border-t border-current/10">
          <button
            onClick={() => setModalReporteOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/80 hover:bg-white border border-current/20 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageSquareWarning className="w-4 h-4" />
            Reportar problema o cambio
          </button>
        </div>
      </div>

      {/* Modal visualizar boleta */}
      <ModalVisualizarBoleta
        isOpen={modalBoletaOpen}
        onClose={() => setModalBoletaOpen(false)}
        url={instrucciones.efectivo_boleta_url}
      />

      {/* Modal reportar problema */}
      <ModalReportarProblema
        isOpen={modalReporteOpen}
        onClose={() => setModalReporteOpen(false)}
        tipoInstruccion={titulo}
      />
    </>
  )
}

export function CardInstruccionesPago() {
  const [loading, setLoading] = useState(true)
  const [instrucciones, setInstrucciones] = useState({ monotributo: null, iibb: null })

  useEffect(() => {
    const cargarInstrucciones = async () => {
      try {
        const data = await getInstruccionesCliente()
        setInstrucciones(data)
      } catch (err) {
        console.error('Error cargando instrucciones:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarInstrucciones()
  }, [])

  // Si no hay instrucciones, no mostrar nada
  if (!loading && !instrucciones.monotributo && !instrucciones.iibb) {
    return null
  }

  const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long' })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <>
          <h3 className="font-semibold text-gray-900 mb-4">
            Instrucciones de pago - {mesActual.charAt(0).toUpperCase() + mesActual.slice(1)}
          </h3>

          <div className="space-y-3">
            {instrucciones.monotributo && (
              <SeccionPago
                titulo="Monotributo"
                instrucciones={instrucciones.monotributo}
                tipo="monotributo"
              />
            )}

            {instrucciones.iibb && (
              <SeccionPago
                titulo="Ingresos Brutos"
                instrucciones={instrucciones.iibb}
                tipo="iibb"
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
