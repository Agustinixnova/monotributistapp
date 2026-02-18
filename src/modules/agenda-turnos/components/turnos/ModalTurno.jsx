/**
 * Modal para crear/editar turnos
 * Con soporte para precios editables y seña opcional
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Calendar, Clock, User, Scissors, Search, Plus, Loader2, Check, Repeat, DollarSign, AlertCircle, CreditCard, Banknote, Smartphone, QrCode, Wallet, XCircle, Car, Store, Video, MapPin, ExternalLink, ChevronDown, ChevronUp, DoorOpen } from 'lucide-react'
import { formatearMonto, formatearHora } from '../../utils/formatters'
import { useNegocio } from '../../hooks/useNegocio'
import { formatDuracion, sumarMinutosAHora, getFechaHoyArgentina, getHoraActualArgentina, formatFechaLarga, generarSlotsTiempo } from '../../utils/dateUtils'
import { TIPOS_RECURRENCIA, generarFechasRecurrentes, TURNOS_INDETERMINADO } from '../../utils/recurrenciaUtils'
import useServicios from '../../hooks/useServicios'
import useClientes from '../../hooks/useClientes'
import ModalCliente from '../clientes/ModalCliente'
import ModalEditarRecurrente from './ModalEditarRecurrente'
import { getSenaDisponibleCliente } from '../../services/pagosService'
import { createCliente, updateCliente } from '../../services/clientesService'
import { getTurnosFuturosDeSerie } from '../../services/turnosService'

// Provincias de Argentina para el selector
const PROVINCIAS_ARGENTINA = [
  { value: '', label: 'Seleccionar...' },
  { value: 'Buenos Aires', label: 'Buenos Aires' },
  { value: 'CABA', label: 'Ciudad Autónoma de Buenos Aires' },
  { value: 'Catamarca', label: 'Catamarca' },
  { value: 'Chaco', label: 'Chaco' },
  { value: 'Chubut', label: 'Chubut' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Corrientes', label: 'Corrientes' },
  { value: 'Entre Ríos', label: 'Entre Ríos' },
  { value: 'Formosa', label: 'Formosa' },
  { value: 'Jujuy', label: 'Jujuy' },
  { value: 'La Pampa', label: 'La Pampa' },
  { value: 'La Rioja', label: 'La Rioja' },
  { value: 'Mendoza', label: 'Mendoza' },
  { value: 'Misiones', label: 'Misiones' },
  { value: 'Neuquén', label: 'Neuquén' },
  { value: 'Río Negro', label: 'Río Negro' },
  { value: 'Salta', label: 'Salta' },
  { value: 'San Juan', label: 'San Juan' },
  { value: 'San Luis', label: 'San Luis' },
  { value: 'Santa Cruz', label: 'Santa Cruz' },
  { value: 'Santa Fe', label: 'Santa Fe' },
  { value: 'Santiago del Estero', label: 'Santiago del Estero' },
  { value: 'Tierra del Fuego', label: 'Tierra del Fuego' },
  { value: 'Tucumán', label: 'Tucumán' }
]

// Métodos de pago para seña (simplificado, no usa caja_metodos_pago)
const METODOS_PAGO_SENA = [
  { id: 'efectivo', nombre: 'Efectivo', icono: Banknote, color: 'bg-green-100 text-green-700' },
  { id: 'transferencia', nombre: 'Transferencia', icono: CreditCard, color: 'bg-blue-100 text-blue-700' },
  { id: 'mercadopago', nombre: 'MercadoPago', icono: Smartphone, color: 'bg-sky-100 text-sky-700' },
  { id: 'qr', nombre: 'QR', icono: QrCode, color: 'bg-purple-100 text-purple-700' },
  { id: 'canje', nombre: 'Canje/Gratis', icono: Wallet, color: 'bg-amber-100 text-amber-700' },
  { id: 'otro', nombre: 'Otro', icono: Wallet, color: 'bg-gray-100 text-gray-700' }
]

export default function ModalTurno({
  isOpen,
  onClose,
  onGuardar,
  turno = null, // null = crear nuevo
  fechaInicial = null,
  horaInicial = null,
  espacioIdInicial = null, // Para modo espacios
  espacios = [], // Lista de espacios disponibles (modo espacios)
  servicios: serviciosProp = null,
  clientes: clientesProp = null,
  onNuevoCliente = null,
  turnosExistentes = [], // Turnos del día para verificar superposiciones
  onIrAServicios = null // Callback para ir a la pestaña de servicios
}) {
  // Usar props si están disponibles, sino cargar internamente
  const { servicios: serviciosInterno, loading: loadingServiciosInterno } = useServicios()
  const { clientes: clientesInterno, buscar: buscarClientes } = useClientes({ autoLoad: false })
  const { modalidades, requiereSeleccionModalidad, modalidadDefault, tieneDomicilio, tieneVideollamada } = useNegocio()

  const servicios = serviciosProp || serviciosInterno
  const loadingServicios = serviciosProp ? false : loadingServiciosInterno

  const [loading, setLoading] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clientesBuscados, setClientesBuscados] = useState([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)
  const [mostrarMapaCliente, setMostrarMapaCliente] = useState(false)
  const [direccionExpanded, setDireccionExpanded] = useState(false)
  const [alertaFaltaDireccion, setAlertaFaltaDireccion] = useState({ mostrar: false, datosParaGuardar: null })

  // Dirección temporal (cuando el cliente no tiene y se ingresa manualmente)
  const [direccionTemporal, setDireccionTemporal] = useState({
    direccion: '',
    piso: '',
    departamento: '',
    localidad: '',
    provincia: '',
    indicaciones_ubicacion: ''
  })

  const [form, setForm] = useState({
    fecha: getFechaHoyArgentina(),
    hora_inicio: '09:00',
    cliente_id: null,
    cliente: null,
    servicios_seleccionados: [],
    notas: '',
    estado: 'pendiente',
    modalidad: 'local',
    link_videollamada: '',
    espacio_id: null // Para modo espacios
  })

  // Estado de seña
  const [sena, setSena] = useState({
    pedir: false,
    cobrada: false,
    monto: 0,
    metodo_pago: null
  })

  // Seña disponible de turno cancelado
  const [senaDisponible, setSenaDisponible] = useState(null)
  const [usarSenaExistente, setUsarSenaExistente] = useState(true)

  // Configuración de recurrencia (solo para nuevos turnos)
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [recurrencia, setRecurrencia] = useState({
    tipo: 'semanal',
    cantidad: 4
  })

  // Modal de alerta de superposición
  const [alertaSuperposicion, setAlertaSuperposicion] = useState({
    mostrar: false,
    turnosSuperpuestos: [],
    datosParaGuardar: null,
    horariosDisponibles: []
  })

  // Modal de edición recurrente (propagación)
  const [modalPropagacion, setModalPropagacion] = useState({
    mostrar: false,
    datosParaGuardar: null,
    cantidadFuturos: 0,
    cambioFecha: false,
    fechaOriginal: null
  })

  // Reset form cuando se abre/cierra o cambia el turno
  useEffect(() => {
    if (isOpen) {
      if (turno) {
        // Editar turno existente
        setForm({
          fecha: turno.fecha,
          hora_inicio: turno.hora_inicio?.substring(0, 5) || '09:00',
          cliente_id: turno.cliente_id,
          cliente: turno.cliente,
          servicios_seleccionados: turno.servicios?.map(s => ({
            servicio_id: s.servicio_id || s.servicio?.id,
            servicio: s.servicio,
            precio: s.precio,
            duracion: s.duracion
          })) || [],
          notas: turno.notas || '',
          estado: turno.estado || 'pendiente',
          modalidad: turno.modalidad || modalidadDefault,
          link_videollamada: turno.link_videollamada || '',
          espacio_id: turno.espacio_id || null
        })
        // Reset seña al editar
        setSena({ pedir: false, cobrada: false, monto: 0, metodo_pago: null })
      } else {
        // Nuevo turno
        setForm({
          fecha: fechaInicial || getFechaHoyArgentina(),
          hora_inicio: horaInicial || '09:00',
          cliente_id: null,
          cliente: null,
          servicios_seleccionados: [],
          notas: '',
          estado: 'pendiente',
          modalidad: modalidadDefault,
          link_videollamada: '',
          espacio_id: espacioIdInicial || (espacios.length > 0 ? espacios[0].id : null)
        })
        setSena({ pedir: false, cobrada: false, monto: 0, metodo_pago: null })
        setEsRecurrente(false)
        setRecurrencia({ tipo: 'semanal', cantidad: 4 })
        setSenaDisponible(null)
        setUsarSenaExistente(true)
      }
      setError(null)
      setBusquedaCliente('')
      setClientesBuscados([])
      setDireccionExpanded(false)
      setMostrarMapaCliente(false)
      setDireccionTemporal({
        direccion: '',
        piso: '',
        departamento: '',
        localidad: '',
        provincia: '',
        indicaciones_ubicacion: ''
      })
      setAlertaFaltaDireccion({ mostrar: false, datosParaGuardar: null })
    }
  }, [isOpen, turno, fechaInicial, horaInicial, modalidadDefault, espacioIdInicial, espacios])

  // Buscar clientes cuando cambia el texto
  useEffect(() => {
    const buscar = async () => {
      if (busquedaCliente.length < 2) {
        setClientesBuscados([])
        return
      }

      setBuscandoClientes(true)
      try {
        if (clientesProp) {
          const filtrados = clientesProp.filter(c => {
            const nombre = `${c.nombre} ${c.apellido || ''}`.toLowerCase()
            return nombre.includes(busquedaCliente.toLowerCase())
          }).slice(0, 6)
          setClientesBuscados(filtrados)
        } else {
          const resultados = await buscarClientes(busquedaCliente)
          setClientesBuscados(resultados)
        }
      } catch (err) {
        console.error('Error buscando clientes:', err)
      }
      setBuscandoClientes(false)
    }

    const timeout = setTimeout(buscar, 300)
    return () => clearTimeout(timeout)
  }, [busquedaCliente, clientesProp])

  // Helper: obtener precio del servicio según modalidad
  const getPrecioServicio = useCallback((servicio, modalidad) => {
    if (!servicio) return 0
    if (!modalidad) return servicio.precio || 0
    const keyPrecio = `precio_${modalidad}`
    return servicio[keyPrecio] ?? servicio.precio ?? 0
  }, [])

  // Helper: verificar si servicio está disponible para la modalidad
  const servicioDisponibleParaModalidad = useCallback((servicio, modalidad) => {
    if (!servicio || !modalidad) return true
    const keyDisponible = `disponible_${modalidad}`
    return servicio[keyDisponible] !== false
  }, [])

  // Filtrar servicios según modalidad seleccionada
  const serviciosFiltrados = useMemo(() => {
    if (!servicios || servicios.length === 0) return []
    return servicios.filter(s => servicioDisponibleParaModalidad(s, form.modalidad))
  }, [servicios, form.modalidad, servicioDisponibleParaModalidad])

  // Efecto: cuando cambia la modalidad, actualizar precios y quitar servicios no disponibles
  useEffect(() => {
    if (!form.modalidad || form.servicios_seleccionados.length === 0) return

    setForm(f => {
      // Filtrar servicios que ya no están disponibles para la nueva modalidad
      const serviciosActualizados = f.servicios_seleccionados
        .filter(s => servicioDisponibleParaModalidad(s.servicio, f.modalidad))
        .map(s => ({
          ...s,
          // Actualizar el precio según la nueva modalidad
          precio: getPrecioServicio(s.servicio, f.modalidad)
        }))

      // Solo actualizar si hay cambios
      if (serviciosActualizados.length !== f.servicios_seleccionados.length ||
          serviciosActualizados.some((s, i) => s.precio !== f.servicios_seleccionados[i]?.precio)) {
        return { ...f, servicios_seleccionados: serviciosActualizados }
      }
      return f
    })
  }, [form.modalidad, getPrecioServicio, servicioDisponibleParaModalidad])

  // Calcular totales
  const duracionTotal = form.servicios_seleccionados.reduce((sum, s) => sum + (s.duracion || 0), 0)
  const horaFin = sumarMinutosAHora(form.hora_inicio, duracionTotal)
  const precioTotal = form.servicios_seleccionados.reduce((sum, s) => sum + (s.precio || 0), 0)

  // Calcular seña sugerida basada en servicios seleccionados
  const senaSugerida = form.servicios_seleccionados.reduce((sum, s) => {
    const servicio = s.servicio
    if (servicio?.requiere_sena && servicio?.porcentaje_sena > 0) {
      return sum + Math.round((s.precio * servicio.porcentaje_sena) / 100)
    }
    return sum
  }, 0)

  // Verificar si algún servicio sugiere seña
  const algunServicioRequiereSena = form.servicios_seleccionados.some(
    s => s.servicio?.requiere_sena
  )

  // Actualizar monto de seña cuando cambian los servicios
  useEffect(() => {
    if (senaSugerida > 0 && !sena.pedir) {
      setSena(prev => ({ ...prev, monto: senaSugerida }))
    }
  }, [senaSugerida])

  // Seleccionar cliente
  const handleSelectCliente = async (cliente) => {
    setForm(f => ({ ...f, cliente_id: cliente.id, cliente }))
    setBusquedaCliente('')
    setClientesBuscados([])

    // Verificar si el cliente tiene seña disponible de turno cancelado (solo para nuevos turnos)
    if (!turno && cliente.id) {
      const { data: sena } = await getSenaDisponibleCliente(cliente.id)
      setSenaDisponible(sena)
      setUsarSenaExistente(!!sena)
    }
  }

  // Quitar cliente
  const handleQuitarCliente = () => {
    setForm(f => ({ ...f, cliente_id: null, cliente: null }))
    setSenaDisponible(null)
    setUsarSenaExistente(true)
  }

  // Toggle servicio
  const handleToggleServicio = (servicio) => {
    setForm(f => {
      const yaSeleccionado = f.servicios_seleccionados.find(s => s.servicio_id === servicio.id)
      if (yaSeleccionado) {
        return {
          ...f,
          servicios_seleccionados: f.servicios_seleccionados.filter(s => s.servicio_id !== servicio.id)
        }
      } else {
        // Usar el precio según la modalidad seleccionada
        const precioModalidad = getPrecioServicio(servicio, f.modalidad)
        return {
          ...f,
          servicios_seleccionados: [...f.servicios_seleccionados, {
            servicio_id: servicio.id,
            servicio,
            precio: precioModalidad,
            duracion: servicio.duracion_minutos
          }]
        }
      }
    })
  }

  // Actualizar precio de un servicio seleccionado
  const handlePrecioChange = (servicioId, valor) => {
    // Solo permitir números
    const soloNumeros = valor.replace(/[^0-9]/g, '')
    const nuevoPrecio = soloNumeros === '' ? 0 : parseInt(soloNumeros, 10)

    setForm(f => ({
      ...f,
      servicios_seleccionados: f.servicios_seleccionados.map(s =>
        s.servicio_id === servicioId
          ? { ...s, precio: nuevoPrecio }
          : s
      )
    }))
  }

  // Crear nuevo cliente desde el modal
  const handleNuevoCliente = async (clienteData) => {
    try {
      // Guardar el cliente en la base de datos
      const { data: clienteGuardado, error } = await createCliente(clienteData)

      if (error) {
        console.error('Error guardando cliente:', error)
        setError('Error al crear el cliente')
        return
      }

      setForm(f => ({
        ...f,
        cliente_id: clienteGuardado.id,
        cliente: clienteGuardado
      }))
      setMostrarNuevoCliente(false)
    } catch (err) {
      console.error('Error creando cliente:', err)
      setError('Error al crear el cliente')
    }
  }

  // Convertir hora a minutos para comparar
  const horaAMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
  }

  // Convertir minutos a formato hora HH:MM
  const minutosAHora = (minutos) => {
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  // Verificar superposición de turnos
  const verificarSuperposicion = (horaInicioNuevo, horaFinNuevo, fechaNueva) => {
    const inicioNuevo = horaAMinutos(horaInicioNuevo)
    const finNuevo = horaAMinutos(horaFinNuevo)

    // Filtrar turnos del mismo día y que no sean el turno que estamos editando
    const turnosDelDia = turnosExistentes.filter(t => {
      if (turno && t.id === turno.id) return false // Excluir el turno actual si estamos editando
      if (t.fecha !== fechaNueva) return false // Solo turnos del mismo día
      if (t.estado === 'cancelado' || t.estado === 'no_asistio') return false // Excluir cancelados
      return true
    })

    // Buscar superposiciones
    const superpuestos = turnosDelDia.filter(t => {
      const inicioExistente = horaAMinutos(t.hora_inicio)
      const finExistente = horaAMinutos(t.hora_fin)
      // Hay superposición si el nuevo turno empieza antes de que termine el existente
      // Y termina después de que empiece el existente
      return inicioNuevo < finExistente && finNuevo > inicioExistente
    })

    return superpuestos
  }

  // Obtener horarios disponibles para sugerir
  const obtenerHorariosDisponibles = (duracionMinutos, fechaNueva) => {
    const INICIO_DIA = 8 * 60  // 08:00
    const FIN_DIA = 21 * 60    // 21:00

    // Filtrar turnos del mismo día
    const turnosDelDia = turnosExistentes.filter(t => {
      if (turno && t.id === turno.id) return false
      if (t.fecha !== fechaNueva) return false
      if (t.estado === 'cancelado' || t.estado === 'no_asistio') return false
      return true
    })

    // Ordenar turnos por hora de inicio
    const turnosOrdenados = [...turnosDelDia].sort((a, b) =>
      horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio)
    )

    const horariosDisponibles = []

    // Si es hoy, empezar desde la hora actual + 30 min
    let inicioDisponible = INICIO_DIA
    const hoy = getFechaHoyArgentina()
    if (fechaNueva === hoy) {
      const horaActual = getHoraActualArgentina() // formato "HH:MM"
      const minutosActuales = horaAMinutos(horaActual)
      // Redondear al próximo slot de 30 min (mínimo 30 min desde ahora)
      inicioDisponible = Math.max(INICIO_DIA, Math.ceil((minutosActuales + 30) / 30) * 30)
    }

    // Buscar huecos entre turnos
    for (const t of turnosOrdenados) {
      const inicioTurno = horaAMinutos(t.hora_inicio)
      const finTurno = horaAMinutos(t.hora_fin)

      // Hay hueco antes de este turno?
      if (inicioDisponible + duracionMinutos <= inicioTurno) {
        // Agregar slots en este hueco (en intervalos de 30 min)
        let slot = inicioDisponible
        while (slot + duracionMinutos <= inicioTurno && horariosDisponibles.length < 6) {
          horariosDisponibles.push(minutosAHora(slot))
          slot += 30
        }
      }

      // Actualizar inicio disponible al fin de este turno
      inicioDisponible = Math.max(inicioDisponible, finTurno)
    }

    // Buscar huecos después del último turno hasta el fin del día
    if (inicioDisponible < FIN_DIA) {
      let slot = inicioDisponible
      while (slot + duracionMinutos <= FIN_DIA && horariosDisponibles.length < 6) {
        horariosDisponibles.push(minutosAHora(slot))
        slot += 30
      }
    }

    return horariosDisponibles.slice(0, 4) // Máximo 4 sugerencias
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.cliente_id) {
      setError('Seleccioná o creá un cliente')
      return
    }

    if (form.servicios_seleccionados.length === 0) {
      setError('Seleccioná al menos un servicio')
      return
    }

    if (sena.pedir && sena.cobrada && !sena.metodo_pago) {
      setError('Seleccioná el método de pago de la seña')
      return
    }

    // Validar que la fecha no sea anterior a hoy
    const hoy = getFechaHoyArgentina()
    if (form.fecha < hoy) {
      setError('No podés agendar un turno en una fecha pasada')
      return
    }

    // Si es hoy, validar que la hora no sea anterior a 2 horas antes de ahora
    if (form.fecha === hoy) {
      const ahora = new Date()
      const horaArgentina = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000) + (-3 * 3600000))
      const horaActual = horaArgentina.getHours()
      const minutosActuales = horaArgentina.getMinutes()
      const [h, m] = form.hora_inicio.split(':').map(Number)

      // Convertir a minutos totales para comparar
      const minutosDelTurno = h * 60 + m
      const minutosLimite = (horaActual * 60 + minutosActuales) - 120 // 2 horas = 120 minutos antes

      if (minutosDelTurno < minutosLimite) {
        setError('No podés agendar un turno con más de 2 horas de anterioridad a la hora actual')
        return
      }
    }

    // Verificar si falta dirección para domicilio
    const clienteTieneDireccion = form.cliente?.direccion && form.cliente?.localidad && form.cliente?.provincia
    const direccionTemporalCompleta = direccionTemporal.direccion && direccionTemporal.localidad && direccionTemporal.provincia
    const faltaDireccionDomicilio = form.modalidad === 'domicilio' && !clienteTieneDireccion && !direccionTemporalCompleta

    // Preparar notas con dirección temporal si se ingresó
    let notasConDireccion = form.notas || ''
    if (form.modalidad === 'domicilio' && !clienteTieneDireccion && (direccionTemporal.direccion || direccionTemporal.localidad)) {
      const partesDireccion = []
      if (direccionTemporal.direccion) partesDireccion.push(direccionTemporal.direccion)
      if (direccionTemporal.piso) partesDireccion.push(`Piso ${direccionTemporal.piso}`)
      if (direccionTemporal.departamento) partesDireccion.push(direccionTemporal.departamento)
      if (direccionTemporal.localidad) partesDireccion.push(direccionTemporal.localidad)
      if (direccionTemporal.provincia) partesDireccion.push(direccionTemporal.provincia)
      if (direccionTemporal.indicaciones_ubicacion) partesDireccion.push(`(${direccionTemporal.indicaciones_ubicacion})`)

      const direccionTexto = `DIRECCIÓN: ${partesDireccion.join(', ')}`
      notasConDireccion = notasConDireccion ? `${direccionTexto}\n\n${notasConDireccion}` : direccionTexto
    }

    // Preparar datos del turno
    const turnoData = {
      fecha: form.fecha,
      hora_inicio: form.hora_inicio + ':00',
      hora_fin: horaFin + ':00',
      cliente_id: form.cliente_id,
      servicios: form.servicios_seleccionados.map(s => ({
        servicio_id: s.servicio_id,
        precio: s.precio,
        duracion: s.duracion
      })),
      notas: notasConDireccion || null,
      estado: form.estado,
      precio_total: precioTotal,
      // Modalidad de atención
      modalidad: form.modalidad,
      link_videollamada: form.modalidad === 'videollamada' ? form.link_videollamada : null,
      // Espacio/Salón (modo espacios)
      espacio_id: form.espacio_id || null,
      // Si hay seña disponible de turno cancelado y el usuario quiere usarla
      transferirSenaDe: (senaDisponible && usarSenaExistente) ? senaDisponible.turnoId : null
    }

    // Agregar datos de seña si se cobró (excepto si es canje/gratis)
    // IMPORTANTE: La fecha de pago es HOY (cuando se cobra la seña), no la fecha del turno
    if (sena.pedir && sena.cobrada && sena.monto > 0 && sena.metodo_pago !== 'canje') {
      turnoData.sena = {
        monto: sena.monto,
        metodo_pago: sena.metodo_pago,
        fecha_pago: getFechaHoyArgentina() // La seña se cobra HOY, no en la fecha del turno
      }
    }

    // Agregar datos de recurrencia si aplica (solo para nuevo turno)
    if (esRecurrente && !turno) {
      turnoData.es_recurrente = true
      turnoData.recurrencia = {
        tipo: recurrencia.tipo,
        cantidad: recurrencia.cantidad // Puede ser número o 'indeterminado'
      }
      // Si es indeterminado, marcarlo
      if (recurrencia.cantidad === 'indeterminado') {
        turnoData.es_indeterminado = true
      }
    }

    // Si estamos EDITANDO un turno recurrente, mostrar modal de propagación
    const esEdicionRecurrente = turno && (turno.es_recurrente || turno.turno_padre_id)
    if (esEdicionRecurrente) {
      // Verificar si hubo cambio de fecha (día de la semana)
      const cambioFecha = turno.fecha !== form.fecha

      // Obtener cantidad de turnos futuros
      const { cantidadFuturos } = await getTurnosFuturosDeSerie(turno.id, form.fecha, false)

      // Mostrar modal de propagación
      setModalPropagacion({
        mostrar: true,
        datosParaGuardar: turnoData,
        cantidadFuturos: cantidadFuturos || 0,
        cambioFecha,
        fechaOriginal: turno.fecha
      })
      return // No continuar, esperar confirmación del modal
    }

    // Verificar superposiciones
    const superpuestos = verificarSuperposicion(form.hora_inicio, horaFin, form.fecha)

    if (superpuestos.length > 0) {
      // Calcular horarios disponibles para sugerir
      const horariosLibres = obtenerHorariosDisponibles(duracionTotal, form.fecha)

      // Mostrar alerta de superposición con sugerencias
      setAlertaSuperposicion({
        mostrar: true,
        turnosSuperpuestos: superpuestos,
        datosParaGuardar: turnoData,
        horariosDisponibles: horariosLibres
      })
      return
    }

    // Verificar si falta dirección y mostrar alerta
    if (faltaDireccionDomicilio) {
      setAlertaFaltaDireccion({
        mostrar: true,
        datosParaGuardar: turnoData
      })
      return
    }

    // Si no hay superposición ni falta dirección, guardar directamente
    await guardarTurno(turnoData)
  }

  // Función para guardar el turno (llamada después de verificar superposición o falta de dirección)
  const guardarTurno = async (turnoData) => {
    setLoading(true)
    setError(null)

    try {
      // Si se ingresó dirección temporal y el cliente no tenía, actualizar la ficha del cliente
      const clienteNecesitaActualizarDireccion = form.modalidad === 'domicilio' &&
        form.cliente_id &&
        !form.cliente?.direccion &&
        direccionTemporal.direccion

      if (clienteNecesitaActualizarDireccion) {
        const datosActualizacion = {
          direccion: direccionTemporal.direccion,
          piso: direccionTemporal.piso || null,
          departamento: direccionTemporal.departamento || null,
          localidad: direccionTemporal.localidad || null,
          provincia: direccionTemporal.provincia || null,
          indicaciones_ubicacion: direccionTemporal.indicaciones_ubicacion || null
        }

        const { error: errorCliente } = await updateCliente(form.cliente_id, datosActualizacion)
        if (errorCliente) {
          console.error('Error actualizando dirección del cliente:', errorCliente)
          // No interrumpimos el flujo, solo logueamos el error
        }
      }

      await onGuardar(turnoData)
      setAlertaSuperposicion({ mostrar: false, turnosSuperpuestos: [], datosParaGuardar: null })
      setAlertaFaltaDireccion({ mostrar: false, datosParaGuardar: null })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar turno')
    } finally {
      setLoading(false)
    }
  }

  // Confirmar guardar a pesar de superposición
  const handleConfirmarSuperposicion = () => {
    if (alertaSuperposicion.datosParaGuardar) {
      guardarTurno(alertaSuperposicion.datosParaGuardar)
    }
  }

  // Seleccionar un horario sugerido
  const handleSeleccionarHorarioSugerido = (nuevaHora) => {
    // Actualizar el formulario con la nueva hora
    setForm(f => ({ ...f, hora_inicio: nuevaHora }))
    // Cerrar el modal de superposición
    setAlertaSuperposicion({ mostrar: false, turnosSuperpuestos: [], datosParaGuardar: null, horariosDisponibles: [] })
  }

  // Cancelar y cerrar alerta de superposición
  const handleCancelarSuperposicion = () => {
    setAlertaSuperposicion({ mostrar: false, turnosSuperpuestos: [], datosParaGuardar: null, horariosDisponibles: [] })
  }

  // Confirmar guardar a pesar de falta de dirección
  const handleConfirmarSinDireccion = () => {
    if (alertaFaltaDireccion.datosParaGuardar) {
      guardarTurno(alertaFaltaDireccion.datosParaGuardar)
    }
  }

  // Cancelar y cerrar alerta de falta de dirección (para completar datos)
  const handleCancelarFaltaDireccion = () => {
    setAlertaFaltaDireccion({ mostrar: false, datosParaGuardar: null })
    setDireccionExpanded(true) // Expandir la sección de dirección para que complete los datos
  }

  // Confirmar propagación de cambios en turno recurrente
  const handleConfirmarPropagacion = async ({ propagarAFuturos, cambioFecha }) => {
    if (!modalPropagacion.datosParaGuardar) return

    // Agregar opciones de propagación al turnoData
    const turnoData = {
      ...modalPropagacion.datosParaGuardar,
      _propagacion: {
        propagarAFuturos,
        cambioFecha,
        fechaOriginal: modalPropagacion.fechaOriginal
      }
    }

    // Cerrar modal de propagación
    setModalPropagacion({
      mostrar: false,
      datosParaGuardar: null,
      cantidadFuturos: 0,
      cambioFecha: false,
      fechaOriginal: null
    })

    // Continuar con la verificación de superposiciones y guardado
    const superpuestos = verificarSuperposicion(form.hora_inicio, horaFin, form.fecha)

    if (superpuestos.length > 0) {
      const horariosLibres = obtenerHorariosDisponibles(duracionTotal, form.fecha)
      setAlertaSuperposicion({
        mostrar: true,
        turnosSuperpuestos: superpuestos,
        datosParaGuardar: turnoData,
        horariosDisponibles: horariosLibres
      })
      return
    }

    // Verificar si falta dirección
    const clienteTieneDireccion = form.cliente?.direccion && form.cliente?.localidad && form.cliente?.provincia
    const direccionTemporalCompleta = direccionTemporal.direccion && direccionTemporal.localidad && direccionTemporal.provincia
    const faltaDireccionDomicilio = form.modalidad === 'domicilio' && !clienteTieneDireccion && !direccionTemporalCompleta

    if (faltaDireccionDomicilio) {
      setAlertaFaltaDireccion({
        mostrar: true,
        datosParaGuardar: turnoData
      })
      return
    }

    // Guardar directamente
    await guardarTurno(turnoData)
  }

  // Cancelar modal de propagación
  const handleCancelarPropagacion = () => {
    setModalPropagacion({
      mostrar: false,
      datosParaGuardar: null,
      cantidadFuturos: 0,
      cambioFecha: false,
      fechaOriginal: null
    })
  }

  // Cancelar el turno (cambiar estado a cancelado)
  const handleCancelarTurno = async () => {
    if (!turno) return

    setCancelando(true)
    setError(null)

    try {
      // Solo pasar el estado, el servicio maneja cancelado_at automáticamente
      await onGuardar({ estado: 'cancelado' })
      onClose()
    } catch (err) {
      console.error('Error cancelando turno:', err)
      setError('Error al cancelar el turno')
    } finally {
      setCancelando(false)
    }
  }

  // Horarios disponibles para el día (filtrar según restricción de 2 horas antes si es hoy)
  const horariosDisponibles = (() => {
    const todos = generarSlotsTiempo('08:00', '21:00', 30)
    const hoy = getFechaHoyArgentina()

    // Si no es hoy, mostrar todos los horarios
    if (form.fecha !== hoy) return todos

    // Si es hoy, filtrar horarios anteriores a 2 horas antes de ahora
    const ahora = new Date()
    // Convertir a hora Argentina (UTC-3)
    const horaArgentina = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000) + (-3 * 3600000))
    const horaActual = horaArgentina.getHours()
    const minutosActuales = horaArgentina.getMinutes()
    const minutosLimite = (horaActual * 60 + minutosActuales) - 120 // 2 horas antes

    return todos.filter(hora => {
      const [h, m] = hora.split(':').map(Number)
      const minutosHora = h * 60 + m
      // Permitir horarios desde 2 horas antes de la hora actual
      return minutosHora >= minutosLimite
    })
  })()

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">
                    {turno ? 'Editar Turno' : 'Nuevo Turno'}
                  </h3>
                  <p className="text-blue-100 text-sm">{formatFechaLarga(form.fecha)}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hora
                  </label>
                  <select
                    value={form.hora_inicio}
                    onChange={(e) => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {horariosDisponibles.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    <User className="w-4 h-4 inline mr-1" />
                    Cliente
                  </label>
                  {!form.cliente && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onNuevoCliente) {
                          onNuevoCliente()
                        } else {
                          setMostrarNuevoCliente(true)
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nuevo cliente
                    </button>
                  )}
                </div>

                {form.cliente ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium">
                        {form.cliente.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {form.cliente.nombre} {form.cliente.apellido || ''}
                        </p>
                        {form.cliente.whatsapp && (
                          <p className="text-xs text-gray-500">{form.cliente.whatsapp}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleQuitarCliente}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={busquedaCliente}
                      onChange={(e) => setBusquedaCliente(e.target.value)}
                      placeholder="Buscar por nombre o teléfono..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    {(busquedaCliente.length >= 2 || clientesBuscados.length > 0) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {buscandoClientes ? (
                          <div className="p-3 text-center text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                            Buscando...
                          </div>
                        ) : clientesBuscados.length > 0 ? (
                          clientesBuscados.map(cliente => (
                            <button
                              key={cliente.id}
                              onClick={() => handleSelectCliente(cliente)}
                              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                                {cliente.nombre?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {cliente.nombre} {cliente.apellido || ''}
                                </p>
                                {cliente.whatsapp && (
                                  <p className="text-xs text-gray-500">{cliente.whatsapp}</p>
                                )}
                              </div>
                            </button>
                          ))
                        ) : busquedaCliente.length >= 2 ? (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            No se encontraron clientes
                          </div>
                        ) : null}

                        <button
                          onClick={() => {
                            if (onNuevoCliente) {
                              onNuevoCliente()
                            } else {
                              setMostrarNuevoCliente(true)
                            }
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2 text-blue-600 hover:bg-blue-50 border-t"
                        >
                          <Plus className="w-4 h-4" />
                          Crear nuevo cliente
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Banner de seña disponible de turno cancelado */}
                {!turno && senaDisponible && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-emerald-800">
                          Seña disponible: {formatearMonto(senaDisponible.montoSena)}
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          De turno cancelado ({senaDisponible.servicioNombre})
                        </p>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={usarSenaExistente}
                            onChange={(e) => setUsarSenaExistente(e.target.checked)}
                            className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-emerald-700">Usar esta seña para el nuevo turno</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de espacio (solo si hay espacios configurados) */}
              {espacios && espacios.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DoorOpen className="w-4 h-4 inline mr-1" />
                    Espacio / Salón
                  </label>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                    {espacios.filter(e => e.activo).map(espacio => (
                      <button
                        key={espacio.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, espacio_id: espacio.id }))}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                          form.espacio_id === espacio.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: espacio.color || '#6366F1' }}
                        />
                        <span className={`text-sm font-medium truncate ${
                          form.espacio_id === espacio.id ? 'text-indigo-700' : 'text-gray-600'
                        }`}>
                          {espacio.nombre}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modalidad de atención (solo si hay múltiples modalidades configuradas) */}
              {requiereSeleccionModalidad && modalidades && modalidades.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modalidad de atención
                  </label>
                  <div className={`grid gap-2 ${modalidades.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {modalidades.includes('local') && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, modalidad: 'local' }))}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          form.modalidad === 'local'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Store className={`w-5 h-5 ${form.modalidad === 'local' ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${form.modalidad === 'local' ? 'text-blue-700' : 'text-gray-600'}`}>
                          En local
                        </span>
                      </button>
                    )}
                    {modalidades.includes('domicilio') && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, modalidad: 'domicilio' }))}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          form.modalidad === 'domicilio'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Car className={`w-5 h-5 ${form.modalidad === 'domicilio' ? 'text-orange-600' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${form.modalidad === 'domicilio' ? 'text-orange-700' : 'text-gray-600'}`}>
                          A domicilio
                        </span>
                      </button>
                    )}
                    {modalidades.includes('videollamada') && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, modalidad: 'videollamada' }))}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          form.modalidad === 'videollamada'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Video className={`w-5 h-5 ${form.modalidad === 'videollamada' ? 'text-purple-600' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${form.modalidad === 'videollamada' ? 'text-purple-700' : 'text-gray-600'}`}>
                          Videollamada
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Dirección del cliente (solo si es domicilio y hay cliente seleccionado) */}
              {form.modalidad === 'domicilio' && form.cliente && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl overflow-hidden">
                  {/* Header clickeable para expandir/colapsar */}
                  <button
                    type="button"
                    onClick={() => setDireccionExpanded(!direccionExpanded)}
                    className="w-full px-3 py-3 flex items-center justify-between hover:bg-orange-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-orange-800 text-sm">Dirección</p>
                        {form.cliente.direccion || direccionTemporal.direccion ? (
                          <p className="text-xs text-orange-600 truncate max-w-[200px]">
                            {form.cliente.direccion || direccionTemporal.direccion}
                            {(form.cliente.localidad || direccionTemporal.localidad) &&
                              `, ${form.cliente.localidad || direccionTemporal.localidad}`
                            }
                          </p>
                        ) : (
                          <p className="text-xs text-orange-500">Sin dirección cargada</p>
                        )}
                      </div>
                    </div>
                    {direccionExpanded ? (
                      <ChevronUp className="w-5 h-5 text-orange-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-orange-500" />
                    )}
                  </button>

                  {/* Contenido expandible */}
                  {direccionExpanded && (
                    <div className="px-3 pb-3 border-t border-orange-200">
                      {form.cliente.direccion ? (
                        /* Cliente tiene dirección guardada */
                        <div className="pt-3">
                          <p className="text-sm text-orange-700">
                            {form.cliente.direccion}
                            {form.cliente.piso && `, Piso ${form.cliente.piso}`}
                            {form.cliente.departamento && ` ${form.cliente.departamento}`}
                          </p>
                          {form.cliente.localidad && (
                            <p className="text-xs text-orange-600 mt-0.5">
                              {form.cliente.localidad}
                              {form.cliente.provincia && `, ${form.cliente.provincia}`}
                            </p>
                          )}
                          {form.cliente.indicaciones_ubicacion && (
                            <p className="text-xs text-orange-600 mt-1 italic">
                              "{form.cliente.indicaciones_ubicacion}"
                            </p>
                          )}

                          {/* Botón Ver en mapa */}
                          {form.cliente.localidad && form.cliente.provincia && (
                            <div className="mt-3 space-y-2">
                              <button
                                type="button"
                                onClick={() => setMostrarMapaCliente(!mostrarMapaCliente)}
                                className="inline-flex items-center gap-1 text-xs text-orange-700 hover:text-orange-800 font-medium"
                              >
                                <MapPin className="w-3 h-3" />
                                {mostrarMapaCliente ? 'Ocultar mapa' : 'Ver en mapa'}
                              </button>

                              {mostrarMapaCliente && (
                                <div className="rounded-lg overflow-hidden border border-orange-300">
                                  <iframe
                                    title="Mapa de ubicación del cliente"
                                    width="100%"
                                    height="150"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                                      `${form.cliente.direccion}, ${form.cliente.localidad}, ${form.cliente.provincia}, Argentina`
                                    )}&output=embed`}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Cliente NO tiene dirección - formulario para ingresar */
                        <div className="pt-3 space-y-3">
                          <p className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Este cliente no tiene dirección. Podés ingresarla para este turno:
                          </p>

                          <div>
                            <input
                              type="text"
                              value={direccionTemporal.direccion}
                              onChange={(e) => setDireccionTemporal(d => ({ ...d, direccion: e.target.value }))}
                              placeholder="Calle y número *"
                              className="w-full px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={direccionTemporal.piso}
                              onChange={(e) => setDireccionTemporal(d => ({ ...d, piso: e.target.value }))}
                              placeholder="Piso"
                              className="px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <input
                              type="text"
                              value={direccionTemporal.departamento}
                              onChange={(e) => setDireccionTemporal(d => ({ ...d, departamento: e.target.value }))}
                              placeholder="Depto"
                              className="px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={direccionTemporal.localidad}
                              onChange={(e) => setDireccionTemporal(d => ({ ...d, localidad: e.target.value }))}
                              placeholder="Localidad *"
                              className="px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <select
                              value={direccionTemporal.provincia}
                              onChange={(e) => setDireccionTemporal(d => ({ ...d, provincia: e.target.value }))}
                              className="px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              {PROVINCIAS_ARGENTINA.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          </div>

                          <input
                            type="text"
                            value={direccionTemporal.indicaciones_ubicacion}
                            onChange={(e) => setDireccionTemporal(d => ({ ...d, indicaciones_ubicacion: e.target.value }))}
                            placeholder="Indicaciones (ej: timbre no funciona, casa verde)"
                            className="w-full px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />

                          {/* Botón Ver en mapa (si hay datos suficientes) */}
                          {direccionTemporal.direccion && direccionTemporal.localidad && direccionTemporal.provincia && (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => setMostrarMapaCliente(!mostrarMapaCliente)}
                                className="inline-flex items-center gap-1 text-xs text-orange-700 hover:text-orange-800 font-medium"
                              >
                                <MapPin className="w-3 h-3" />
                                {mostrarMapaCliente ? 'Ocultar mapa' : 'Validar en mapa'}
                              </button>

                              {mostrarMapaCliente && (
                                <div className="rounded-lg overflow-hidden border border-orange-300">
                                  <iframe
                                    title="Mapa de ubicación"
                                    width="100%"
                                    height="150"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                                      `${direccionTemporal.direccion}, ${direccionTemporal.localidad}, ${direccionTemporal.provincia}, Argentina`
                                    )}&output=embed`}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Link de videollamada (solo si es videollamada) */}
              {form.modalidad === 'videollamada' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Video className="w-4 h-4 inline mr-1" />
                    Link de la videollamada (opcional)
                  </label>
                  <input
                    type="url"
                    value={form.link_videollamada}
                    onChange={(e) => setForm(f => ({ ...f, link_videollamada: e.target.value }))}
                    placeholder="https://meet.google.com/xxx o https://zoom.us/j/xxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Zoom, Google Meet, u otra plataforma
                  </p>
                </div>
              )}

              {/* Servicios con precio editable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scissors className="w-4 h-4 inline mr-1" />
                  Servicios *
                </label>

                {loadingServicios ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                  </div>
                ) : servicios.length === 0 ? (
                  /* No hay ningún servicio dado de alta */
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <Scissors className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-800">
                          No tenés servicios creados
                        </p>
                        <p className="text-sm text-amber-600 mt-1">
                          Para comenzar a programar turnos, primero debés dar de alta al menos un servicio.
                        </p>
                      </div>
                      {onIrAServicios && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onIrAServicios()
                          }}
                          className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Ir a crear servicios
                        </button>
                      )}
                    </div>
                  </div>
                ) : serviciosFiltrados.length === 0 ? (
                  /* Hay servicios pero no disponibles para la modalidad seleccionada */
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hay servicios disponibles para {form.modalidad === 'local' ? 'atención en local' : form.modalidad === 'domicilio' ? 'atención a domicilio' : 'videollamada'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {serviciosFiltrados.map(servicio => {
                      const seleccionado = form.servicios_seleccionados.find(s => s.servicio_id === servicio.id)
                      // Precio según la modalidad actual
                      const precioModalidad = getPrecioServicio(servicio, form.modalidad)
                      return (
                        <div
                          key={servicio.id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            seleccionado
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleServicio(servicio)}
                              className="flex items-center gap-3 flex-1 text-left"
                            >
                              <div
                                className="w-3 h-10 rounded-full flex-shrink-0"
                                style={{ backgroundColor: servicio.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-gray-900">{servicio.nombre}</p>
                                  {servicio.precio_variable && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded">
                                      Variable
                                    </span>
                                  )}
                                  {servicio.requiere_sena && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                                      Seña {servicio.porcentaje_sena}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {formatDuracion(servicio.duracion_minutos)}
                                </p>
                              </div>
                              {seleccionado && (
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              )}
                            </button>

                            {/* Precio editable cuando está seleccionado */}
                            {seleccionado ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400 text-sm">$</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={seleccionado.precio || ''}
                                    onChange={(e) => handlePrecioChange(servicio.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="0"
                                    className="w-20 px-2 py-1 text-right font-semibold text-gray-900 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                {servicio.precio_variable && (
                                  <span className="text-[10px] text-violet-600">Ajustá según extras</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-gray-600">
                                {servicio.precio_variable ? 'desde ' : ''}{formatearMonto(precioModalidad)}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sección de Seña (solo si hay servicios seleccionados) */}
              {form.servicios_seleccionados.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sena.pedir}
                        onChange={(e) => setSena(prev => ({
                          ...prev,
                          pedir: e.target.checked,
                          monto: e.target.checked ? (prev.monto || senaSugerida) : 0
                        }))}
                        className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                      />
                      <span className="font-medium text-amber-800">Pedir seña</span>
                    </label>

                    {algunServicioRequiereSena && !sena.pedir && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Sugerido: {formatearMonto(senaSugerida)}
                      </span>
                    )}
                  </div>

                  {sena.pedir && (
                    <>
                      {/* Monto de seña editable */}
                      <div>
                        <label className="block text-xs font-medium text-amber-700 mb-1">
                          Monto de seña
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={sena.monto || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '')
                                setSena(prev => ({ ...prev, monto: val === '' ? 0 : parseInt(val, 10) }))
                              }}
                              placeholder="0"
                              className="w-full pl-8 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                            />
                          </div>
                          {senaSugerida > 0 && sena.monto !== senaSugerida && (
                            <button
                              type="button"
                              onClick={() => setSena(prev => ({ ...prev, monto: senaSugerida }))}
                              className="text-xs text-amber-600 hover:text-amber-700 underline whitespace-nowrap"
                            >
                              Usar sugerido ({formatearMonto(senaSugerida)})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ¿Ya se cobró? */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sena.cobrada}
                            onChange={(e) => setSena(prev => ({
                              ...prev,
                              cobrada: e.target.checked,
                              metodo_pago: e.target.checked ? prev.metodo_pago : null
                            }))}
                            className="w-5 h-5 text-emerald-600 border-amber-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-amber-800">Ya se cobró la seña</span>
                        </label>
                      </div>

                      {/* Método de pago (si se cobró) */}
                      {sena.cobrada && (
                        <div>
                          <label className="block text-xs font-medium text-amber-700 mb-2">
                            ¿Cómo pagó?
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {METODOS_PAGO_SENA.map(metodo => (
                              <button
                                key={metodo.id}
                                type="button"
                                onClick={() => setSena(prev => ({ ...prev, metodo_pago: metodo.id }))}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                                  sena.metodo_pago === metodo.id
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <metodo.icono className={`w-5 h-5 ${
                                  sena.metodo_pago === metodo.id ? 'text-emerald-600' : 'text-gray-500'
                                }`} />
                                <span className={`text-xs font-medium ${
                                  sena.metodo_pago === metodo.id ? 'text-emerald-700' : 'text-gray-600'
                                }`}>
                                  {metodo.nombre}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Observaciones para este turno..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Recurrencia (solo para nuevos turnos) */}
              {!turno && (
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esRecurrente}
                      onChange={(e) => setEsRecurrente(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Repeat className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Turno recurrente</span>
                  </label>

                  {esRecurrente && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Repetir
                          </label>
                          <select
                            value={recurrencia.tipo}
                            onChange={(e) => setRecurrencia(r => ({ ...r, tipo: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            {TIPOS_RECURRENCIA.map(tipo => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Cantidad de turnos
                          </label>
                          <select
                            value={recurrencia.cantidad}
                            onChange={(e) => {
                              const val = e.target.value
                              setRecurrencia(r => ({
                                ...r,
                                cantidad: val === 'indeterminado' ? 'indeterminado' : parseInt(val)
                              }))
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                              <option key={n} value={n}>
                                {n} turnos
                              </option>
                            ))}
                            <option value="indeterminado">Sin fecha fin</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-xs text-purple-700">
                        <p className="font-medium mb-1">
                          {recurrencia.cantidad === 'indeterminado'
                            ? 'Primeros turnos (serie sin fecha fin):'
                            : 'Fechas:'
                          }
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {generarFechasRecurrentes({
                            fechaInicio: form.fecha,
                            tipo: recurrencia.tipo,
                            cantidad: recurrencia.cantidad
                          }).slice(0, 6).map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-200 rounded">
                              {new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                            </span>
                          ))}
                          {recurrencia.cantidad === 'indeterminado' ? (
                            <span className="px-2 py-0.5 text-purple-600 font-medium">
                              +{TURNOS_INDETERMINADO - 6} más (se extiende automáticamente)
                            </span>
                          ) : recurrencia.cantidad > 6 && (
                            <span className="px-2 py-0.5 text-purple-600">
                              +{recurrencia.cantidad - 6} más
                            </span>
                          )}
                        </div>
                        {recurrencia.cantidad === 'indeterminado' && (
                          <p className="mt-2 text-purple-600 italic">
                            Se crearán ~6 meses de turnos. La serie se extiende automáticamente.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Resumen */}
              {form.servicios_seleccionados.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-blue-700">Duración total</span>
                    <span className="font-medium text-blue-800">
                      {formatDuracion(duracionTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-blue-700">Horario</span>
                    <span className="font-medium text-blue-800">
                      {form.hora_inicio} - {horaFin}
                    </span>
                  </div>
                  {sena.pedir && sena.monto > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-blue-700">
                        Seña {sena.cobrada ? '(cobrada)' : '(pendiente)'}
                      </span>
                      <span className={`font-medium ${sena.cobrada ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {formatearMonto(sena.monto)}
                      </span>
                    </div>
                  )}
                  {senaDisponible && usarSenaExistente && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-emerald-700 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" />
                        Seña a transferir
                      </span>
                      <span className="font-medium text-emerald-600">
                        {formatearMonto(senaDisponible.montoSena)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="font-medium text-blue-700">Total</span>
                    <span className="text-xl font-bold text-blue-800">
                      {formatearMonto(precioTotal)}
                    </span>
                  </div>
                  {((sena.pedir && sena.cobrada && sena.monto > 0) || (senaDisponible && usarSenaExistente)) && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">Restante a cobrar</span>
                      <span className="font-medium text-gray-700">
                        {formatearMonto(precioTotal - (sena.cobrada ? sena.monto : 0) - (senaDisponible && usarSenaExistente ? senaDisponible.montoSena : 0))}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-4 flex flex-col gap-3 flex-shrink-0">
              {/* Botón cancelar turno - solo si es edición y el turno no está cancelado */}
              {turno && turno.estado !== 'cancelado' && (
                <button
                  type="button"
                  onClick={handleCancelarTurno}
                  disabled={loading || cancelando}
                  className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Cancelar turno
                    </>
                  )}
                </button>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading || cancelando}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || cancelando || form.servicios_seleccionados.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    turno ? 'Guardar cambios' : 'Crear turno'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal nuevo cliente */}
      {!onNuevoCliente && (
        <ModalCliente
          isOpen={mostrarNuevoCliente}
          onClose={() => setMostrarNuevoCliente(false)}
          onGuardar={handleNuevoCliente}
        />
      )}

      {/* Modal alerta de superposición */}
      {alertaSuperposicion.mostrar && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelarSuperposicion} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              {/* Header con icono de alerta */}
              <div className="bg-amber-50 px-5 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900">
                    Turno Superpuesto
                  </h3>
                  <p className="text-sm text-amber-700">
                    Ya existe {alertaSuperposicion.turnosSuperpuestos.length === 1 ? 'un turno' : 'turnos'} en este horario
                  </p>
                </div>
              </div>

              {/* Lista de turnos superpuestos */}
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-3">
                  El turno que querés crear se superpone con:
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alertaSuperposicion.turnosSuperpuestos.map((t) => {
                    const clienteNombre = t.cliente
                      ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim()
                      : 'Sin cliente'
                    const servicio = t.servicios?.[0]?.servicio?.nombre || 'Sin servicio'
                    const colorServicio = t.servicios?.[0]?.servicio?.color || '#6B7280'

                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div
                          className="w-1 h-10 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colorServicio }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-semibold text-gray-800 text-sm">
                              {formatearHora(t.hora_inicio)} - {formatearHora(t.hora_fin)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {clienteNombre} • {servicio}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Sugerencias de horarios disponibles */}
                {alertaSuperposicion.horariosDisponibles.length > 0 && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horarios disponibles:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alertaSuperposicion.horariosDisponibles.map((hora) => {
                        const horaFinSugerida = sumarMinutosAHora(hora, duracionTotal)
                        return (
                          <button
                            key={hora}
                            type="button"
                            onClick={() => handleSeleccionarHorarioSugerido(hora)}
                            className="px-3 py-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 transition-colors flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {hora} - {horaFinSugerida}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {alertaSuperposicion.horariosDisponibles.length === 0 && (
                  <p className="text-sm text-gray-500 mt-4">
                    No hay horarios disponibles para la duración requerida.
                  </p>
                )}

                <p className="text-sm text-gray-500 mt-3">
                  ¿Querés agendar el turno de todas formas?
                </p>
              </div>

              {/* Footer con botones */}
              <div className="border-t border-gray-200 px-5 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelarSuperposicion}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarSuperposicion}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Agendar igual'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de propagación para turnos recurrentes */}
      <ModalEditarRecurrente
        isOpen={modalPropagacion.mostrar}
        onClose={handleCancelarPropagacion}
        onConfirmar={handleConfirmarPropagacion}
        turno={turno}
        cantidadFuturos={modalPropagacion.cantidadFuturos}
        loading={loading}
        cambiosFecha={modalPropagacion.cambioFecha}
      />

      {/* Modal alerta de falta de dirección */}
      {alertaFaltaDireccion.mostrar && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelarFaltaDireccion} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              {/* Header con icono de alerta */}
              <div className="bg-orange-50 px-5 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900">
                    Falta la dirección
                  </h3>
                  <p className="text-sm text-orange-700">
                    Este turno es a domicilio pero no tiene dirección
                  </p>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-orange-800 font-medium">
                        El cliente no tiene dirección cargada
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Al ser un turno a domicilio, es importante tener la dirección para poder llegar al lugar.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  ¿Querés crear el turno de todas formas? Vas a poder agregar la dirección después desde la ficha del cliente.
                </p>
              </div>

              {/* Footer con botones */}
              <div className="border-t border-gray-200 px-5 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelarFaltaDireccion}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Completar datos
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarSinDireccion}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Crear sin dirección'
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
