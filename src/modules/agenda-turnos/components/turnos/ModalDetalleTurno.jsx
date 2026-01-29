/**
 * Modal de detalle de turno con pagos
 */

import { useState, useEffect } from 'react'
import {
  X, Calendar, Clock, User, Scissors, DollarSign, CreditCard,
  Check, AlertCircle, Loader2, Phone, MessageCircle, Edit2,
  Wallet, Undo2, CheckCircle2, XCircle, Ban, Send, History,
  Banknote, Smartphone, QrCode, RotateCcw, Store, Car, Video, MapPin, ExternalLink, Navigation, Trash2
} from 'lucide-react'
import { formatearMonto, formatearHora, ESTADOS_TURNO } from '../../utils/formatters'
import { formatFechaLarga, formatDuracion, getFechaHoyArgentina, generarSlotsTiempo } from '../../utils/dateUtils'
import { usePagosTurno, useSenaRequerida } from '../../hooks/usePagos'
import { useNegocio } from '../../hooks/useNegocio'
import { generarLinkRecordatorio, generarLinkConfirmacion, abrirWhatsApp } from '../../utils/whatsappUtils'
import { createTurno, getTurnosDia } from '../../services/turnosService'
import ModalPago from '../pagos/ModalPago'

// Métodos de pago para el modal de finalizar
const METODOS_PAGO = [
  { id: 'efectivo', nombre: 'Efectivo', icono: Banknote, color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'transferencia', nombre: 'Transferencia', icono: CreditCard, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'mercadopago', nombre: 'MercadoPago', icono: Smartphone, color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { id: 'qr', nombre: 'QR', icono: QrCode, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'canje', nombre: 'Canje/Gratis', icono: Wallet, color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { id: 'otro', nombre: 'Otro', icono: Wallet, color: 'bg-gray-100 text-gray-700 border-gray-300' }
]

export default function ModalDetalleTurno({
  isOpen,
  onClose,
  turno,
  onEditar,
  onCambiarEstado,
  onVerHistorial,
  onMarcarRecordatorio
}) {
  const [modalPago, setModalPago] = useState({ abierto: false, tipo: null })
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState(false)
  const [modalFinalizar, setModalFinalizar] = useState(false)
  const [metodoPagoFinal, setMetodoPagoFinal] = useState(null)
  const [finalizando, setFinalizando] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [menuNavegacion, setMenuNavegacion] = useState(false)
  const [opcionNavegacion, setOpcionNavegacion] = useState(null) // 'solo_ir' o 'ir_avisar'
  const [alertaTiempoNavegacion, setAlertaTiempoNavegacion] = useState(false)
  const [accionPendienteNavegacion, setAccionPendienteNavegacion] = useState(null)

  // Estados para reprogramación
  const [pasoReprogramar, setPasoReprogramar] = useState(false)
  const [modalReprogramarDirecto, setModalReprogramarDirecto] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevaHora, setNuevaHora] = useState('')
  const [errorReprogramar, setErrorReprogramar] = useState(null)
  const [turnosDelDia, setTurnosDelDia] = useState([])

  // Estado para eliminar pago
  const [pagoAEliminar, setPagoAEliminar] = useState(null)
  const [eliminandoPago, setEliminandoPago] = useState(false)

  const {
    pagos,
    loading: loadingPagos,
    resumen,
    agregarPago,
    enviarACaja,
    anularPagosSena,
    eliminarPago
  } = usePagosTurno(turno?.id, turno)

  // Obtener datos del negocio para plantillas de WhatsApp
  const { negocio } = useNegocio()

  // Calcular seña requerida
  const servicios = turno?.agenda_turno_servicios || turno?.servicios || []
  const { requiereSena, montoSena } = useSenaRequerida(servicios)

  if (!isOpen || !turno) return null

  const cliente = turno.cliente || turno.agenda_clientes
  const estadoConfig = ESTADOS_TURNO[turno.estado] || ESTADOS_TURNO.pendiente

  // Handler para confirmar eliminación de pago
  const handleConfirmarEliminarPago = async () => {
    if (!pagoAEliminar) return

    setEliminandoPago(true)
    try {
      await eliminarPago(pagoAEliminar.id)
      setPagoAEliminar(null)
    } catch (error) {
      console.error('Error eliminando pago:', error)
    } finally {
      setEliminandoPago(false)
    }
  }

  // Handler para enviar recordatorio WhatsApp
  const handleEnviarRecordatorio = () => {
    const serviciosInfo = servicios.map(s => ({
      nombre: s.servicio?.nombre || s.agenda_servicios?.nombre || 'Servicio',
      instrucciones_previas: s.servicio?.instrucciones_previas || s.agenda_servicios?.instrucciones_previas || null,
      requiere_sena: s.servicio?.requiere_sena || s.agenda_servicios?.requiere_sena || false,
      porcentaje_sena: s.servicio?.porcentaje_sena || s.agenda_servicios?.porcentaje_sena || 0,
      precio: s.precio || s.servicio?.precio || 0
    }))

    const link = generarLinkRecordatorio(turno, cliente, serviciosInfo, negocio)
    if (link) {
      abrirWhatsApp(link)
      // Marcar como enviado
      if (onMarcarRecordatorio) {
        onMarcarRecordatorio(turno.id)
      }
    }
  }

  // Info para pasar a ModalPago
  const turnoInfo = {
    cliente_nombre: cliente ? `${cliente.nombre} ${cliente.apellido || ''}` : 'Cliente',
    cliente_whatsapp: cliente?.whatsapp || cliente?.telefono || null,
    servicios_nombres: servicios.map(s => s.servicio?.nombre || s.agenda_servicios?.nombre || 'Servicio').join(', ')
  }

  // Handler para guardar pago
  const handleGuardarPago = async (pagoData) => {
    const pago = await agregarPago(pagoData)

    // Si quiere registrar en caja, hacerlo
    if (pagoData.registrarEnCaja) {
      await enviarACaja(pago.id, turnoInfo)
    }
  }

  // Handler para finalizar turno con pago
  const handleFinalizarTurno = async () => {
    // Si hay saldo pendiente, mostrar modal de pago
    if (resumen?.saldoPendiente > 0) {
      setModalFinalizar(true)
      return
    }
    // Si no hay saldo pendiente, finalizar directamente y cerrar
    onCambiarEstado?.(turno.id, 'completado')
    onClose?.()
  }

  // Handler para confirmar finalización con pago
  const handleConfirmarFinalizacion = async () => {
    if (!metodoPagoFinal) return

    setFinalizando(true)
    try {
      // Si es canje/gratis, no registrar pago
      if (metodoPagoFinal !== 'canje' && resumen?.saldoPendiente > 0) {
        await agregarPago({
          tipo: 'pago_final',
          monto: resumen.saldoPendiente,
          metodo_pago_id: null,
          fecha_pago: getFechaHoyArgentina(),
          notas: `Pago: ${METODOS_PAGO.find(m => m.id === metodoPagoFinal)?.nombre || metodoPagoFinal}`
        })
      }

      // Cambiar estado, cerrar modales
      setModalFinalizar(false)
      setMetodoPagoFinal(null)
      onCambiarEstado?.(turno.id, 'completado')
      onClose?.() // Cerrar modal principal
    } catch (error) {
      console.error('Error al finalizar turno:', error)
    } finally {
      setFinalizando(false)
    }
  }

  // Handler para finalizar sin cobrar
  const handleFinalizarSinCobrar = () => {
    setModalFinalizar(false)
    setMetodoPagoFinal(null)
    onCambiarEstado?.(turno.id, 'completado')
    onClose?.() // Cerrar modal principal
  }

  // Handler para cancelar turno
  const handleCancelarTurno = () => {
    // Si tiene seña pagada, mostrar modal de opciones
    const tieneSenaPagada = pagos.some(p => p.tipo === 'sena')
    if (tieneSenaPagada) {
      setModalCancelar(true)
    } else {
      // Cancelar directamente y cerrar modal
      onCambiarEstado?.(turno.id, 'cancelado')
      onClose?.()
    }
  }

  // Cancelar y devolver seña (anula los registros de seña)
  const handleCancelarConDevolucion = async () => {
    setCancelando(true)
    try {
      // Anular/eliminar los registros de seña
      await anularPagosSena()

      // Cancelar turno y cerrar modales
      setModalCancelar(false)
      onCambiarEstado?.(turno.id, 'cancelado')
      onClose?.() // Cerrar modal principal
    } catch (error) {
      console.error('Error al devolver seña:', error)
    } finally {
      setCancelando(false)
    }
  }

  // Cancelar sin devolver seña (la seña queda como ingreso)
  const handleCancelarSinDevolucion = () => {
    // Solo cancelar el turno, no tocar los registros de seña
    setModalCancelar(false)
    onCambiarEstado?.(turno.id, 'cancelado')
    onClose?.()
  }

  // Mostrar paso de reprogramación (mantener seña)
  const handleMantenerSena = () => {
    setPasoReprogramar(true)
    setNuevaFecha('')
    setNuevaHora('')
    setErrorReprogramar(null)
    setTurnosDelDia([])
  }

  // Cargar turnos del día seleccionado para verificar solapamiento
  const handleFechaChange = async (fecha) => {
    setNuevaFecha(fecha)
    setNuevaHora('')
    setErrorReprogramar(null)

    if (!fecha) {
      setTurnosDelDia([])
      return
    }

    // Obtener turnos del día
    const { data: turnos } = await getTurnosDia(fecha)
    // Excluir el turno actual y los cancelados
    const turnosActivos = (turnos || []).filter(t =>
      t.id !== turno.id && !['cancelado', 'completado', 'no_asistio'].includes(t.estado)
    )
    setTurnosDelDia(turnosActivos)
  }

  // Calcular hora de fin basada en duración del turno original
  const calcularHoraFin = (horaInicio) => {
    if (!horaInicio || !turno.hora_inicio || !turno.hora_fin) return null

    // Calcular duración original en minutos
    const [hIni, mIni] = turno.hora_inicio.split(':').map(Number)
    const [hFin, mFin] = turno.hora_fin.split(':').map(Number)
    const duracionMinutos = (hFin * 60 + mFin) - (hIni * 60 + mIni)

    // Aplicar a nueva hora
    const [h, m] = horaInicio.split(':').map(Number)
    const totalMinutos = h * 60 + m + duracionMinutos
    const nuevaH = Math.floor(totalMinutos / 60)
    const nuevaM = totalMinutos % 60
    return `${String(nuevaH).padStart(2, '0')}:${String(nuevaM).padStart(2, '0')}`
  }

  // Verificar si hay solapamiento
  const verificarSolapamiento = (horaInicio) => {
    const horaFin = calcularHoraFin(horaInicio)
    if (!horaFin) return null

    const nuevaIni = horaInicio.replace(':', '')
    const nuevaFin = horaFin.replace(':', '')

    for (const t of turnosDelDia) {
      const tIni = t.hora_inicio?.substring(0, 5).replace(':', '') || '0000'
      const tFin = t.hora_fin?.substring(0, 5).replace(':', '') || '2359'

      // Hay solapamiento si: nuevaIni < tFin Y nuevaFin > tIni
      if (nuevaIni < tFin && nuevaFin > tIni) {
        const clienteNombre = t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim() : 'otro turno'
        return `Se superpone con ${clienteNombre} (${formatearHora(t.hora_inicio)} - ${formatearHora(t.hora_fin)})`
      }
    }
    return null
  }

  // Generar slots disponibles considerando la duración del turno y turnos existentes
  const generarSlotsDisponibles = () => {
    const todosLosSlots = generarSlotsTiempo('08:00', '21:00', 30)

    // Si no hay fecha seleccionada o no hay turnos del día, mostrar todos
    if (!nuevaFecha || turnosDelDia.length === 0) {
      return todosLosSlots
    }

    // Filtrar slots que no se solapan con turnos existentes
    return todosLosSlots.filter(slot => {
      const horaFin = calcularHoraFin(slot)
      if (!horaFin) return true

      const slotIni = slot.replace(':', '')
      const slotFin = horaFin.replace(':', '')

      // Verificar que no se solape con ningún turno existente
      for (const t of turnosDelDia) {
        const tIni = t.hora_inicio?.substring(0, 5).replace(':', '') || '0000'
        const tFin = t.hora_fin?.substring(0, 5).replace(':', '') || '2359'

        // Hay solapamiento si: slotIni < tFin Y slotFin > tIni
        if (slotIni < tFin && slotFin > tIni) {
          return false // Este slot no está disponible
        }
      }
      return true // Este slot está disponible
    })
  }

  // Validar hora seleccionada
  const handleHoraChange = (hora) => {
    setNuevaHora(hora)
    if (hora) {
      const solapamiento = verificarSolapamiento(hora)
      setErrorReprogramar(solapamiento)
    } else {
      setErrorReprogramar(null)
    }
  }

  // Confirmar reprogramación
  const handleConfirmarReprogramacion = async () => {
    if (!nuevaFecha || !nuevaHora) {
      setErrorReprogramar('Seleccioná fecha y hora')
      return
    }

    const solapamiento = verificarSolapamiento(nuevaHora)
    if (solapamiento) {
      setErrorReprogramar(solapamiento)
      return
    }

    setCancelando(true)
    setErrorReprogramar(null)

    try {
      const horaFin = calcularHoraFin(nuevaHora)

      // Preparar servicios para el nuevo turno
      const serviciosData = servicios.map(s => ({
        servicio_id: s.servicio?.id || s.agenda_servicios?.id || s.servicio_id,
        precio: s.precio,
        duracion: s.duracion || s.servicio?.duracion_minutos || s.agenda_servicios?.duracion_minutos
      }))

      // Crear nuevo turno con transferencia de seña
      const { data: nuevoTurno, error: errorNuevo } = await createTurno({
        cliente_id: turno.cliente_id,
        profesional_id: turno.profesional_id,
        fecha: nuevaFecha,
        hora_inicio: nuevaHora,
        hora_fin: horaFin,
        notas: turno.notas,
        notas_internas: turno.notas_internas,
        servicios: serviciosData,
        transferirSenaDe: turno.id // Esto transfiere la seña automáticamente
      })

      if (errorNuevo) throw errorNuevo

      // Cancelar turno original
      onCambiarEstado?.(turno.id, 'cancelado')

      // Cerrar modales
      setModalCancelar(false)
      setPasoReprogramar(false)
      onClose?.()

    } catch (error) {
      console.error('Error reprogramando turno:', error)
      setErrorReprogramar('Error al reprogramar. Intentá de nuevo.')
    } finally {
      setCancelando(false)
    }
  }

  // Volver al paso anterior
  const handleVolverPasoAnterior = () => {
    setPasoReprogramar(false)
    setErrorReprogramar(null)
  }

  // Verificar si falta más de 1 hora para el turno
  const calcularMinutosParaTurno = () => {
    if (!turno?.fecha || !turno?.hora_inicio) return 0

    const ahora = new Date()
    const [hora, minuto] = turno.hora_inicio.split(':').map(Number)
    const fechaTurno = new Date(turno.fecha + 'T00:00:00')
    fechaTurno.setHours(hora, minuto, 0, 0)

    const diferencia = fechaTurno - ahora
    return Math.floor(diferencia / 60000) // minutos
  }

  const faltaMasDeUnaHora = () => calcularMinutosParaTurno() > 60

  // Verificar si el turno es del futuro (fecha mayor a hoy)
  const esTurnoFuturo = () => {
    if (!turno?.fecha) return false
    const hoy = getFechaHoyArgentina()
    return turno.fecha > hoy
  }

  // Handler para abrir modal de reprogramación directa
  const handleAbrirReprogramar = () => {
    setModalReprogramarDirecto(true)
    setNuevaFecha('')
    setNuevaHora('')
    setErrorReprogramar(null)
    setTurnosDelDia([])
  }

  // Confirmar reprogramación directa (sin cancelar)
  const handleConfirmarReprogramacionDirecta = async () => {
    if (!nuevaFecha || !nuevaHora) {
      setErrorReprogramar('Seleccioná fecha y hora')
      return
    }

    const solapamiento = verificarSolapamiento(nuevaHora)
    if (solapamiento) {
      setErrorReprogramar(solapamiento)
      return
    }

    setCancelando(true)
    setErrorReprogramar(null)

    try {
      const horaFin = calcularHoraFin(nuevaHora)

      // Preparar servicios para el nuevo turno
      const serviciosData = servicios.map(s => ({
        servicio_id: s.servicio?.id || s.agenda_servicios?.id || s.servicio_id,
        precio: s.precio,
        duracion: s.duracion || s.servicio?.duracion_minutos || s.agenda_servicios?.duracion_minutos
      }))

      // Verificar si tiene seña para transferir
      const tieneSena = pagos.some(p => p.tipo === 'sena')

      // Crear nuevo turno
      const { data: nuevoTurno, error: errorNuevo } = await createTurno({
        cliente_id: turno.cliente_id,
        profesional_id: turno.profesional_id,
        fecha: nuevaFecha,
        hora_inicio: nuevaHora,
        hora_fin: horaFin,
        notas: turno.notas,
        notas_internas: turno.notas_internas,
        modalidad: turno.modalidad,
        servicios: serviciosData,
        transferirSenaDe: tieneSena ? turno.id : null // Solo transferir si tiene seña
      })

      if (errorNuevo) throw errorNuevo

      // Cancelar turno original
      onCambiarEstado?.(turno.id, 'cancelado')

      // Cerrar modales
      setModalReprogramarDirecto(false)
      onClose?.()

    } catch (error) {
      console.error('Error reprogramando turno:', error)
      setErrorReprogramar('Error al reprogramar. Intentá de nuevo.')
    } finally {
      setCancelando(false)
    }
  }

  const formatearTiempoRestante = () => {
    const minutos = calcularMinutosParaTurno()
    if (minutos < 0) return 'El turno ya pasó'
    if (minutos < 60) return `${minutos} minutos`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    if (mins === 0) return `${horas} hora${horas > 1 ? 's' : ''}`
    return `${horas}h ${mins}min`
  }

  // Ejecutar acción de navegación (después de confirmar si es necesario)
  const ejecutarAccionNavegacion = (accion) => {
    if (faltaMasDeUnaHora()) {
      setAccionPendienteNavegacion(accion)
      setAlertaTiempoNavegacion(true)
    } else {
      procesarAccionNavegacion(accion)
    }
  }

  // Procesar la acción de navegación
  const procesarAccionNavegacion = (accion) => {
    const direccionCompleta = `${cliente.direccion}, ${cliente.localidad}, ${cliente.provincia || ''}, Argentina`
    const plantilla = negocio?.plantilla_en_camino || '¡Hola {nombre}! 🚗\n\nEstoy saliendo para tu turno de las {hora} hs.\n¡Ya voy en camino!\n\nCualquier cosa me avisás 😊'
    const mensaje = plantilla
      .replace(/{nombre}/g, cliente.nombre || 'cliente')
      .replace(/{hora}/g, formatearHora(turno.hora_inicio))
    const telefono = (cliente.whatsapp || cliente.telefono || '').replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

    if (accion.tipo === 'solo_avisar') {
      window.open(whatsappUrl, '_blank')
    } else {
      const navUrl = accion.app === 'waze'
        ? `https://waze.com/ul?q=${encodeURIComponent(direccionCompleta)}&navigate=yes`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccionCompleta)}`

      if (accion.tipo === 'ir_avisar') {
        window.open(whatsappUrl, '_blank')
        setTimeout(() => window.open(navUrl, '_blank'), 500)
      } else {
        window.open(navUrl, '_blank')
      }
    }

    setMenuNavegacion(false)
    setOpcionNavegacion(null)
    setAlertaTiempoNavegacion(false)
    setAccionPendienteNavegacion(null)
  }

  // Botones de acción rápida según estado
  const renderAccionesEstado = () => {
    const turnoEsFuturo = esTurnoFuturo()

    // Para turnos pendientes: mostrar botón de confirmar prominente
    if (turno.estado === 'pendiente') {
      // Si es turno futuro, solo mostrar Confirmar y Cancelar
      if (turnoEsFuturo) {
        return (
          <div className="space-y-3">
            {/* Botón principal: Confirmar */}
            <button
              onClick={() => setModalConfirmar(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              <Check className="w-5 h-5" />
              Confirmar turno
            </button>
            {/* Solo cancelar para turnos futuros */}
            <button
              onClick={handleCancelarTurno}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
            >
              <Ban className="w-4 h-4" />
              Cancelar turno
            </button>
          </div>
        )
      }

      // Turno de hoy o pasado: mostrar todas las acciones
      return (
        <div className="space-y-3">
          {/* Botón principal: Confirmar */}
          <button
            onClick={() => setModalConfirmar(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Check className="w-5 h-5" />
            Confirmar turno
          </button>
          {/* Acciones secundarias */}
          <div className="flex gap-2">
            <button
              onClick={handleFinalizarTurno}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar
            </button>
            <button
              onClick={() => {
                onCambiarEstado?.(turno.id, 'no_asistio')
                onClose?.()
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm"
            >
              <XCircle className="w-4 h-4" />
              No asistió
            </button>
            <button
              onClick={handleCancelarTurno}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }

    // Para confirmado y en_curso
    if (['confirmado', 'en_curso'].includes(turno.estado)) {
      // Si es turno futuro confirmado: mostrar Reprogramar en lugar de Finalizar
      if (turnoEsFuturo) {
        return (
          <div className="flex gap-2">
            <button
              onClick={handleAbrirReprogramar}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
            >
              <Calendar className="w-4 h-4" />
              Reprogramar
            </button>
            <button
              onClick={handleCancelarTurno}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        )
      }

      // Turno de hoy o pasado: acciones normales
      return (
        <div className="flex gap-2">
          <button
            onClick={handleFinalizarTurno}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Finalizar
          </button>
          <button
            onClick={() => {
              onCambiarEstado?.(turno.id, 'no_asistio')
              onClose?.()
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
          >
            <XCircle className="w-4 h-4" />
            No asistió
          </button>
          <button
            onClick={handleCancelarTurno}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg md:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`px-4 py-2.5 flex items-center justify-between ${estadoConfig.bgClass}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ${estadoConfig.textClass}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-heading font-semibold ${estadoConfig.textClass}`}>
                    Detalle del Turno
                  </h3>
                  <span className={`text-xs ${estadoConfig.textClass} opacity-80`}>
                    {estadoConfig.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditar?.(turno)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Edit2 className={`w-5 h-5 ${estadoConfig.textClass}`} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X className={`w-5 h-5 ${estadoConfig.textClass}`} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Fecha y hora */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatFechaLarga(turno.fecha)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatearHora(turno.hora_inicio)} - {formatearHora(turno.hora_fin)}</span>
                </div>
              </div>

              {/* Banner de modalidad */}
              {turno.modalidad && (
                <div className={`rounded-lg p-3 ${
                  turno.modalidad === 'local' ? 'bg-blue-50 border border-blue-200' :
                  turno.modalidad === 'domicilio' ? 'bg-orange-50 border border-orange-200' :
                  'bg-purple-50 border border-purple-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      turno.modalidad === 'local' ? 'bg-blue-100' :
                      turno.modalidad === 'domicilio' ? 'bg-orange-100' :
                      'bg-purple-100'
                    }`}>
                      {turno.modalidad === 'local' && <Store className="w-5 h-5 text-blue-600" />}
                      {turno.modalidad === 'domicilio' && <Car className="w-5 h-5 text-orange-600" />}
                      {turno.modalidad === 'videollamada' && <Video className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${
                        turno.modalidad === 'local' ? 'text-blue-800' :
                        turno.modalidad === 'domicilio' ? 'text-orange-800' :
                        'text-purple-800'
                      }`}>
                        {turno.modalidad === 'local' && 'En local'}
                        {turno.modalidad === 'domicilio' && 'A domicilio'}
                        {turno.modalidad === 'videollamada' && 'Videollamada'}
                      </p>

                      {/* Dirección para domicilio */}
                      {turno.modalidad === 'domicilio' && cliente && (
                        cliente.direccion ? (
                          <div className="mt-1">
                            <p className="text-sm text-orange-700">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {cliente.direccion}
                              {cliente.piso && `, Piso ${cliente.piso}`}
                              {cliente.departamento && ` ${cliente.departamento}`}
                            </p>
                            {cliente.localidad && (
                              <p className="text-xs text-orange-600 ml-4">
                                {cliente.localidad}
                                {cliente.provincia && `, ${cliente.provincia}`}
                              </p>
                            )}
                            {cliente.indicaciones_ubicacion && (
                              <p className="text-xs text-orange-600 ml-4 italic mt-1">
                                "{cliente.indicaciones_ubicacion}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            Sin dirección cargada
                          </p>
                        )
                      )}

                      {/* Link para videollamada */}
                      {turno.modalidad === 'videollamada' && turno.link_videollamada && (
                        <a
                          href={turno.link_videollamada}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-purple-700 hover:text-purple-800 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir videollamada
                        </a>
                      )}
                    </div>

                    {/* Botones de navegación para domicilio */}
                    {turno.modalidad === 'domicilio' && cliente?.direccion && cliente?.localidad && (
                      <div className="flex items-center gap-2">
                        {/* Botón Ir - abre modal de navegación */}
                        <button
                          onClick={() => setMenuNavegacion(true)}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          <Navigation className="w-4 h-4" />
                          Ir
                        </button>

                        {/* Botón ver en mapa */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${cliente.direccion}, ${cliente.localidad}, ${cliente.provincia || ''}, Argentina`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          <MapPin className="w-4 h-4" />
                          Ver mapa
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Badge de seña */}
              {!loadingPagos && !pagos.some(p => p.tipo === 'sena') && !['cancelado', 'completado'].includes(turno.estado) && (
                <div className={`flex items-center justify-between rounded-lg p-2.5 ${
                  requiereSena
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Wallet className={`w-5 h-5 ${requiereSena ? 'text-amber-600' : 'text-gray-500'}`} />
                    <div>
                      <p className={`font-medium text-sm ${requiereSena ? 'text-amber-800' : 'text-gray-700'}`}>
                        {requiereSena ? 'Seña pendiente' : 'Sin seña'}
                        {requiereSena && montoSena > 0 && <span className="text-xs ml-1">({formatearMonto(montoSena)})</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalPago({ abierto: true, tipo: 'sena' })}
                    className={`px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                      requiereSena
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Cobrar
                  </button>
                </div>
              )}

              {/* Cliente */}
              {cliente && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                      {cliente.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {cliente.nombre} {cliente.apellido || ''}
                      </p>
                      {(cliente.whatsapp || cliente.telefono) && (
                        <p className="text-xs text-gray-500">{cliente.whatsapp || cliente.telefono}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {onVerHistorial && (
                        <button
                          onClick={() => onVerHistorial(cliente.id)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                          title="Ver historial"
                        >
                          <History className="w-5 h-5" />
                        </button>
                      )}
                      {(cliente.whatsapp || cliente.telefono) && (
                        <a
                          href={`https://wa.me/${(cliente.whatsapp || cliente.telefono).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Botón enviar recordatorio */}
                  {['pendiente', 'confirmado'].includes(turno.estado) && (cliente.whatsapp || cliente.telefono) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={handleEnviarRecordatorio}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs ${
                          turno.recordatorio_enviado
                            ? 'bg-green-100 text-green-700'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        {turno.recordatorio_enviado ? 'Recordatorio enviado ✓' : 'Enviar recordatorio'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Servicios */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                  <Scissors className="w-3 h-3" />
                  Servicios
                </h4>
                <div className="space-y-1">
                  {servicios.map((s, i) => {
                    const servicio = s.servicio || s.agenda_servicios || s
                    return (
                      <div key={i} className="flex items-center justify-between bg-white border rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-6 rounded-full"
                            style={{ backgroundColor: servicio.color || '#6366F1' }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{servicio.nombre}</p>
                            <p className="text-xs text-gray-500">{formatDuracion(s.duracion || servicio.duracion_minutos)}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{formatearMonto(s.precio)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cobros - Flujo simplificado */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Cobros
                </h4>

                {loadingPagos ? (
                  <div className="text-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin inline text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* Card de Seña */}
                    {(montoSena > 0 || pagos.some(p => p.tipo === 'sena')) && (
                      <div className={`rounded-lg p-2.5 ${
                        pagos.some(p => p.tipo === 'sena')
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className={`w-4 h-4 ${pagos.some(p => p.tipo === 'sena') ? 'text-amber-600' : 'text-gray-500'}`} />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">Seña</p>
                              {pagos.some(p => p.tipo === 'sena') ? (
                                <p className="text-xs text-amber-600">
                                  {pagos.find(p => p.tipo === 'sena')?.notas?.replace('Pago: ', '') || 'Cobrada'}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-500">Sugerido: {formatearMonto(montoSena)}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {pagos.some(p => p.tipo === 'sena') ? (
                              <p className="font-bold text-amber-700 text-sm">
                                {formatearMonto(pagos.filter(p => p.tipo === 'sena').reduce((sum, p) => sum + p.monto, 0))}
                                <Check className="w-3 h-3 inline ml-1 text-green-600" />
                              </p>
                            ) : turno.estado !== 'cancelado' ? (
                              <button
                                onClick={() => setModalPago({ abierto: true, tipo: 'sena' })}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-xs"
                              >
                                Registrar
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card de Saldo / Pago final */}
                    <div className={`rounded-lg p-2.5 ${
                      resumen?.estaPagado
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className={`w-4 h-4 ${resumen?.estaPagado ? 'text-green-600' : 'text-gray-500'}`} />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {resumen?.estaPagado ? 'Pagado' : 'Saldo pendiente'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Total: {formatearMonto(resumen?.precioTotal || 0)}
                              {resumen?.totalSenas > 0 && ` - Seña: ${formatearMonto(resumen.totalSenas)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {resumen?.estaPagado ? (
                            <p className="font-bold text-green-700 text-sm">
                              {formatearMonto(resumen?.precioTotal || 0)}
                              <CheckCircle2 className="w-3 h-3 inline ml-1" />
                            </p>
                          ) : (
                            <>
                              <p className="font-bold text-gray-900 text-sm">
                                {formatearMonto(resumen?.saldoPendiente || resumen?.precioTotal || 0)}
                              </p>
                              {turno.estado !== 'cancelado' && (
                                <button
                                  onClick={() => setModalPago({ abierto: true, tipo: 'pago_final' })}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-xs mt-1"
                                >
                                  Cobrar
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Historial de pagos (colapsable si hay) */}
                    {pagos.length > 0 && (
                      <details className="bg-gray-50 rounded-lg text-xs">
                        <summary className="px-3 py-1.5 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg">
                          Historial ({pagos.length})
                        </summary>
                        <div className="px-3 pb-2 space-y-1">
                          {pagos.map(pago => {
                            const fechaPago = pago.fecha_pago || pago.created_at?.split('T')[0]
                            // Formatear fecha de YYYY-MM-DD a DD/MM/YYYY
                            const [year, month, day] = fechaPago.split('-')
                            const fechaFormateada = `${day}/${month}/${year}`
                            const horaPago = pago.hora_pago ? pago.hora_pago.substring(0, 5) : null
                            return (
                              <div key={pago.id} className="flex items-center justify-between py-1.5 border-b border-gray-200 last:border-0">
                                <div className="flex-1">
                                  <span className={`font-medium ${
                                    pago.tipo === 'sena' ? 'text-amber-700' :
                                    pago.tipo === 'devolucion' ? 'text-red-700' : 'text-green-700'
                                  }`}>
                                    {pago.tipo === 'sena' ? 'Seña' : pago.tipo === 'devolucion' ? 'Dev.' : 'Pago'}
                                  </span>
                                  <span className="text-gray-400 ml-1">
                                    {fechaFormateada}
                                    {horaPago && ` ${horaPago}hs`}
                                  </span>
                                  {pago.notas && (
                                    <span className="text-gray-400 ml-1">- {pago.notas.replace('Pago: ', '')}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${pago.tipo === 'devolucion' ? 'text-red-600' : ''}`}>
                                    {pago.tipo === 'devolucion' ? '-' : ''}{formatearMonto(pago.monto)}
                                  </span>
                                  {/* Botón eliminar */}
                                  <button
                                    onClick={() => setPagoAEliminar(pago)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar movimiento"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
                  </>
                )}
              </div>

              {/* Notas */}
              {turno.notas && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Notas</p>
                  <p className="text-gray-700 text-sm">{turno.notas}</p>
                </div>
              )}
            </div>

            {/* Footer - Acciones de estado */}
            {['pendiente', 'confirmado', 'en_curso'].includes(turno.estado) && (
              <div className="border-t p-3">
                {renderAccionesEstado()}
              </div>
            )}

            {/* Footer para turnos cancelados - Retomar turno */}
            {turno.estado === 'cancelado' && (
              <div className="border-t p-3">
                <button
                  onClick={() => {
                    onCambiarEstado?.(turno.id, 'pendiente')
                    onClose?.()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retomar turno
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      <ModalPago
        isOpen={modalPago.abierto}
        onClose={() => setModalPago({ abierto: false, tipo: null })}
        onGuardar={handleGuardarPago}
        tipo={modalPago.tipo}
        montoSugerido={montoSena}
        saldoPendiente={resumen?.saldoPendiente || 0}
        turnoInfo={turnoInfo}
      />

      {/* Modal de finalizar turno con cobro */}
      {modalFinalizar && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => !finalizando && setModalFinalizar(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      Cobrar y finalizar
                    </h3>
                    <p className="text-sm text-gray-600">
                      Saldo pendiente: <span className="font-semibold text-emerald-600">{formatearMonto(resumen?.saldoPendiente || 0)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-4">¿Cómo pagó el cliente?</p>

                <div className="grid grid-cols-2 gap-2">
                  {METODOS_PAGO.map(metodo => {
                    const Icono = metodo.icono
                    const seleccionado = metodoPagoFinal === metodo.id
                    return (
                      <button
                        key={metodo.id}
                        onClick={() => setMetodoPagoFinal(metodo.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          seleccionado
                            ? metodo.color + ' border-current'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icono className="w-5 h-5" />
                        <span className="text-sm font-medium">{metodo.nombre}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50 flex gap-2">
                <button
                  onClick={handleFinalizarSinCobrar}
                  disabled={finalizando}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm"
                >
                  Sin cobrar
                </button>
                <button
                  onClick={handleConfirmarFinalizacion}
                  disabled={!metodoPagoFinal || finalizando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  {finalizando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Cobrar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cancelar turno con seña */}
      {modalCancelar && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => {
            if (!cancelando) {
              setModalCancelar(false)
              setPasoReprogramar(false)
            }
          }} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      Cancelar turno
                    </h3>
                    <p className="text-sm text-gray-600">
                      Este turno tiene seña de <span className="font-semibold text-amber-600">
                        {formatearMonto(pagos.filter(p => p.tipo === 'sena').reduce((sum, p) => sum + p.monto, 0))}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {!pasoReprogramar ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">¿Qué hacemos con la seña?</p>

                    <div className="space-y-3">
                      <button
                        onClick={handleCancelarConDevolucion}
                        disabled={cancelando}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                          <Undo2 className="w-5 h-5 text-red-700" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Devolver seña</p>
                          <p className="text-xs text-gray-500">El cliente no reprogramará</p>
                        </div>
                      </button>

                      <button
                        onClick={handleMantenerSena}
                        disabled={cancelando}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Reprogramar turno</p>
                          <p className="text-xs text-gray-500">Elegir nueva fecha y mantener la seña</p>
                        </div>
                      </button>

                      <button
                        onClick={handleCancelarSinDevolucion}
                        disabled={cancelando}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Cancelar sin devolver</p>
                          <p className="text-xs text-gray-500">La seña queda como ingreso</p>
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">Elegí la nueva fecha y horario:</p>

                    {/* Fecha y Hora - mismo formato que ModalTurno */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={nuevaFecha}
                          onChange={(e) => handleFechaChange(e.target.value)}
                          min={getFechaHoyArgentina()}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Hora
                        </label>
                        <select
                          value={nuevaHora}
                          onChange={(e) => handleHoraChange(e.target.value)}
                          disabled={!nuevaFecha}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
                        >
                          <option value="">Seleccionar</option>
                          {generarSlotsDisponibles().map(hora => (
                            <option key={hora} value={hora}>{hora}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Horario calculado */}
                    {nuevaHora && calcularHoraFin(nuevaHora) && (
                      <p className="text-sm text-gray-600 mb-4">
                        Nuevo horario: <span className="font-medium">{nuevaHora} - {calcularHoraFin(nuevaHora)}</span>
                      </p>
                    )}

                    {/* Info de duración del turno */}
                    {turno?.hora_inicio && turno?.hora_fin && (
                      <p className="text-xs text-gray-500 mb-3">
                        Duración del turno: {formatDuracion(
                          ((parseInt(turno.hora_fin.split(':')[0]) * 60 + parseInt(turno.hora_fin.split(':')[1])) -
                           (parseInt(turno.hora_inicio.split(':')[0]) * 60 + parseInt(turno.hora_inicio.split(':')[1])))
                        )}
                      </p>
                    )}

                    {/* Turnos del día (para referencia) */}
                    {nuevaFecha && turnosDelDia.length > 0 && (
                      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-2">Turnos ocupados ese día:</p>
                        <div className="space-y-1">
                          {turnosDelDia.map(t => (
                            <div key={t.id} className="text-xs text-blue-600 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span className="font-medium">{formatearHora(t.hora_inicio)} - {formatearHora(t.hora_fin)}</span>
                              <span className="text-blue-500">
                                {t.cliente ? `${t.cliente.nombre}` : 'Sin cliente'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error de solapamiento */}
                    {errorReprogramar && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {errorReprogramar}
                      </div>
                    )}

                    {/* Info de la seña que se mantiene */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-amber-600" />
                      <div className="text-sm">
                        <span className="text-amber-800">Seña de </span>
                        <span className="font-semibold text-amber-700">
                          {formatearMonto(pagos.filter(p => p.tipo === 'sena').reduce((sum, p) => sum + p.monto, 0))}
                        </span>
                        <span className="text-amber-800"> se transfiere al nuevo turno</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50">
                {!pasoReprogramar ? (
                  <button
                    onClick={() => {
                      setModalCancelar(false)
                      setPasoReprogramar(false)
                    }}
                    disabled={cancelando}
                    className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                  >
                    Volver
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleVolverPasoAnterior}
                      disabled={cancelando}
                      className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleConfirmarReprogramacion}
                      disabled={cancelando || !nuevaFecha || !nuevaHora || !!errorReprogramar}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
                    >
                      {cancelando ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Reprogramar
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {cancelando && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmar turno */}
      {modalConfirmar && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalConfirmar(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      Confirmar turno
                    </h3>
                    <p className="text-sm text-gray-600">
                      {cliente?.nombre} {cliente?.apellido || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-4">
                  ¿Querés enviarle la confirmación por WhatsApp?
                </p>

                <div className="space-y-3">
                  {/* Confirmar y enviar WhatsApp */}
                  {(cliente?.whatsapp || cliente?.telefono) && (
                    <button
                      onClick={() => {
                        // Primero confirmar el turno y cerrar modales
                        onCambiarEstado?.(turno.id, 'confirmado')
                        setModalConfirmar(false)
                        onClose?.()

                        // Luego abrir WhatsApp (después de cerrar para evitar problemas de foco)
                        const serviciosInfo = servicios.map(s => ({
                          nombre: s.servicio?.nombre || s.agenda_servicios?.nombre || 'Servicio',
                          instrucciones_previas: s.servicio?.instrucciones_previas || s.agenda_servicios?.instrucciones_previas || null,
                          requiere_sena: s.servicio?.requiere_sena || s.agenda_servicios?.requiere_sena || false,
                          porcentaje_sena: s.servicio?.porcentaje_sena || s.agenda_servicios?.porcentaje_sena || 0,
                          precio: s.precio || s.servicio?.precio || 0
                        }))
                        const link = generarLinkConfirmacion(turno, cliente, serviciosInfo, negocio)
                        if (link) {
                          abrirWhatsApp(link)
                        }
                      }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Confirmar y enviar WhatsApp</p>
                        <p className="text-xs text-gray-500">Se abrirá WhatsApp con el mensaje</p>
                      </div>
                    </button>
                  )}

                  {/* Solo confirmar */}
                  <button
                    onClick={() => {
                      onCambiarEstado?.(turno.id, 'confirmado')
                      setModalConfirmar(false)
                      onClose?.()
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Solo confirmar</p>
                      <p className="text-xs text-gray-500">Sin enviar mensaje</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50">
                <button
                  onClick={() => setModalConfirmar(false)}
                  className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de navegación - Ir al domicilio */}
      {menuNavegacion && turno?.modalidad === 'domicilio' && cliente && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => {
            setMenuNavegacion(false)
            setOpcionNavegacion(null)
          }} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      Ir al turno
                    </h3>
                    <p className="text-sm text-gray-600">
                      {cliente.nombre} - {formatearHora(turno.hora_inicio)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {!opcionNavegacion ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">¿Qué querés hacer?</p>

                    <div className="space-y-3">
                      {/* Ir y avisar */}
                      <button
                        onClick={() => setOpcionNavegacion('ir_avisar')}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Ir y avisar por WhatsApp</p>
                          <p className="text-xs text-gray-500">Abrir navegación + enviar mensaje</p>
                        </div>
                      </button>

                      {/* Solo ir */}
                      <button
                        onClick={() => setOpcionNavegacion('solo_ir')}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Navigation className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Solo ir</p>
                          <p className="text-xs text-gray-500">Abrir navegación sin avisar</p>
                        </div>
                      </button>

                      {/* Solo avisar */}
                      <button
                        onClick={() => ejecutarAccionNavegacion({ tipo: 'solo_avisar' })}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Solo avisar por WhatsApp</p>
                          <p className="text-xs text-gray-500">Enviar mensaje sin abrir navegación</p>
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      {opcionNavegacion === 'ir_avisar'
                        ? '¿Con qué app querés navegar?'
                        : 'Elegí tu navegador:'
                      }
                    </p>

                    <div className="space-y-3">
                      {/* Waze */}
                      <button
                        onClick={() => ejecutarAccionNavegacion({ tipo: opcionNavegacion, app: 'waze' })}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#33CCFF] flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">W</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Waze</p>
                          <p className="text-xs text-gray-500">Navegación con tráfico en tiempo real</p>
                        </div>
                      </button>

                      {/* Google Maps */}
                      <button
                        onClick={() => ejecutarAccionNavegacion({ tipo: opcionNavegacion, app: 'maps' })}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#4285F4] flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Google Maps</p>
                          <p className="text-xs text-gray-500">Navegación de Google</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50">
                <button
                  onClick={() => {
                    if (opcionNavegacion) {
                      setOpcionNavegacion(null)
                    } else {
                      setMenuNavegacion(false)
                    }
                  }}
                  className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  {opcionNavegacion ? 'Atrás' : 'Cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de alerta - Falta más de 1 hora */}
      {alertaTiempoNavegacion && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => {
            setAlertaTiempoNavegacion(false)
            setAccionPendienteNavegacion(null)
          }} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      ¿Estás seguro?
                    </h3>
                    <p className="text-sm text-amber-700">
                      Faltan <strong>{formatearTiempoRestante()}</strong> para el turno
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-600">
                  El turno es a las <strong>{formatearHora(turno?.hora_inicio)}</strong>. ¿Querés continuar de todas formas?
                </p>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50 flex gap-2">
                <button
                  onClick={() => {
                    setAlertaTiempoNavegacion(false)
                    setAccionPendienteNavegacion(null)
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (accionPendienteNavegacion) {
                      procesarAccionNavegacion(accionPendienteNavegacion)
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
                >
                  Sí, continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reprogramación directa */}
      {modalReprogramarDirecto && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => !cancelando && setModalReprogramarDirecto(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      Reprogramar turno
                    </h3>
                    <p className="text-sm text-gray-600">
                      {cliente?.nombre} {cliente?.apellido || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-4">Elegí la nueva fecha y horario:</p>

                {/* Fecha y Hora */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={nuevaFecha}
                      onChange={(e) => handleFechaChange(e.target.value)}
                      min={getFechaHoyArgentina()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Hora
                    </label>
                    <select
                      value={nuevaHora}
                      onChange={(e) => handleHoraChange(e.target.value)}
                      disabled={!nuevaFecha}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
                    >
                      <option value="">Seleccionar</option>
                      {generarSlotsDisponibles().map(hora => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Horario calculado */}
                {nuevaHora && calcularHoraFin(nuevaHora) && (
                  <p className="text-sm text-gray-600 mb-4">
                    Nuevo horario: <span className="font-medium">{nuevaHora} - {calcularHoraFin(nuevaHora)}</span>
                  </p>
                )}

                {/* Info de duración del turno */}
                {turno?.hora_inicio && turno?.hora_fin && (
                  <p className="text-xs text-gray-500 mb-3">
                    Duración del turno: {formatDuracion(
                      ((parseInt(turno.hora_fin.split(':')[0]) * 60 + parseInt(turno.hora_fin.split(':')[1])) -
                       (parseInt(turno.hora_inicio.split(':')[0]) * 60 + parseInt(turno.hora_inicio.split(':')[1])))
                    )}
                  </p>
                )}

                {/* Turnos del día (para referencia) */}
                {nuevaFecha && turnosDelDia.length > 0 && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-700 mb-2">Turnos ocupados ese día:</p>
                    <div className="space-y-1">
                      {turnosDelDia.map(t => (
                        <div key={t.id} className="text-xs text-blue-600 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{formatearHora(t.hora_inicio)} - {formatearHora(t.hora_fin)}</span>
                          <span className="text-blue-500">
                            {t.cliente ? `${t.cliente.nombre}` : 'Sin cliente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error de solapamiento */}
                {errorReprogramar && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {errorReprogramar}
                  </div>
                )}

                {/* Info de seña si tiene */}
                {pagos.some(p => p.tipo === 'sena') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-amber-600" />
                    <div className="text-sm">
                      <span className="text-amber-800">Seña de </span>
                      <span className="font-semibold text-amber-700">
                        {formatearMonto(pagos.filter(p => p.tipo === 'sena').reduce((sum, p) => sum + p.monto, 0))}
                      </span>
                      <span className="text-amber-800"> se transfiere al nuevo turno</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50 flex gap-2">
                <button
                  onClick={() => setModalReprogramarDirecto(false)}
                  disabled={cancelando}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarReprogramacionDirecta}
                  disabled={cancelando || !nuevaFecha || !nuevaHora || !!errorReprogramar}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  {cancelando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Reprogramar
                    </>
                  )}
                </button>
              </div>

              {cancelando && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar pago */}
      {pagoAEliminar && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => !eliminandoPago && setPagoAEliminar(null)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      Eliminar movimiento
                    </h3>
                    <p className="text-sm text-red-700">
                      {pagoAEliminar.tipo === 'sena' ? 'Seña' : pagoAEliminar.tipo === 'devolucion' ? 'Devolución' : 'Pago'} de {formatearMonto(pagoAEliminar.monto)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-2">
                  ¿Estás seguro de eliminar este movimiento?
                </p>
                <p className="text-sm text-gray-500">
                  El saldo pendiente del turno se recalculará automáticamente.
                </p>
                {pagoAEliminar.registrado_en_caja && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700">
                      Este movimiento también se eliminará de la caja diaria.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50 flex gap-2">
                <button
                  onClick={() => setPagoAEliminar(null)}
                  disabled={eliminandoPago}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarEliminarPago}
                  disabled={eliminandoPago}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  {eliminandoPago ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
