/**
 * Página principal del módulo Agenda & Turnos
 * Fase 2: Vistas semana/mes, turno rápido, múltiples servicios
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar, Scissors, Users, Plus, Loader2, CalendarDays, CalendarRange, LayoutGrid, Settings, BarChart3, DollarSign, Search, X, Link2, AlertCircle, Store, Clock, MessageCircle, Car, Video, Filter, DoorOpen, ChevronDown } from 'lucide-react'
import { Layout } from '../../../components/layout'
import { getFechaHoyArgentina, getPrimerDiaSemana } from '../utils/dateUtils'
import { useTurnosDia, useTurnosSemana, useTurnosMes } from '../hooks/useTurnos'
import { useServicios } from '../hooks/useServicios'
import { useClientes } from '../hooks/useClientes'
import CalendarioDia from '../components/calendario/CalendarioDia'
import CalendarioSemana from '../components/calendario/CalendarioSemana'
import CalendarioMes from '../components/calendario/CalendarioMes'
import CalendarioEspacios from '../components/calendario/CalendarioEspacios'
import ModalFiltros, { BotonFiltros } from '../components/calendario/ModalFiltros'
import ModalTurno from '../components/turnos/ModalTurno'
import ModalTurnoRapido from '../components/turnos/ModalTurnoRapido'
import ModalDetalleTurno from '../components/turnos/ModalDetalleTurno'
import ModalConfirmarPendientes from '../components/turnos/ModalConfirmarPendientes'
import ModalServicio from '../components/servicios/ModalServicio'
import ModalCliente from '../components/clientes/ModalCliente'
import ModalFichaCliente from '../components/clientes/ModalFichaCliente'
import ConfigDisponibilidad from '../components/disponibilidad/ConfigDisponibilidad'
import ConfigNegocio from '../components/config/ConfigNegocio'
import ConfigWhatsApp from '../components/config/ConfigWhatsApp'
import SelectorProfesional from '../components/disponibilidad/SelectorProfesional'
import SelectorEspacio from '../components/disponibilidad/SelectorEspacio'
import EstadisticasAgenda from '../components/estadisticas/EstadisticasAgenda'
import CobrosAgenda from '../components/cobros/CobrosAgenda'
import HistorialCliente from '../components/clientes/HistorialCliente'
import ListaReservaLinks from '../components/reservas/ListaReservaLinks'
import ModalGenerarLink from '../components/reservas/ModalGenerarLink'
import ConfigEspacios from '../components/config/ConfigEspacios'
import { useProfesionales, useDisponibilidad } from '../hooks/useDisponibilidad'
import { useEspaciosActivos } from '../hooks/useEspacios'
import { useNegocio } from '../hooks/useNegocio'
import { formatearMonto } from '../utils/formatters'
import { formatDuracion } from '../utils/dateUtils'
import { supabase } from '../../../lib/supabase'

// Tabs disponibles
const TABS = {
  calendario: { id: 'calendario', label: 'Calendario', icon: Calendar },
  cobros: { id: 'cobros', label: 'Cobros', icon: DollarSign },
  reservas: { id: 'reservas', label: 'Reservas', icon: Link2 },
  servicios: { id: 'servicios', label: 'Servicios', icon: Scissors },
  clientes: { id: 'clientes', label: 'Clientes', icon: Users },
  estadisticas: { id: 'estadisticas', label: 'Stats', icon: BarChart3 },
  config: { id: 'config', label: 'Config', icon: Settings },
}

// Vistas de calendario
const VISTAS_CALENDARIO = {
  semana: { id: 'semana', label: 'Semana', icon: CalendarRange },
  dia: { id: 'dia', label: 'Día', icon: CalendarDays },
  mes: { id: 'mes', label: 'Mes', icon: LayoutGrid },
}

export default function AgendaTurnosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tabActiva, setTabActiva] = useState('calendario')
  const [vistaCalendario, setVistaCalendario] = useState('semana') // semana es la vista principal
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFechaHoyArgentina())

  // Modales
  const [modalTurno, setModalTurno] = useState({ abierto: false, turno: null, fecha: null, hora: null, espacioId: null })
  const [modalTurnoRapido, setModalTurnoRapido] = useState({ abierto: false, fecha: null, hora: null })
  const [modalDetalle, setModalDetalle] = useState({ abierto: false, turno: null })
  const [modalServicio, setModalServicio] = useState({ abierto: false, servicio: null })
  const [modalCliente, setModalCliente] = useState({ abierto: false, cliente: null })
  const [modalFichaCliente, setModalFichaCliente] = useState({ abierto: false, clienteId: null })
  const [modalHistorial, setModalHistorial] = useState({ abierto: false, clienteId: null })
  const [modalGenerarLink, setModalGenerarLink] = useState(false)
  const [modalConfirmarPendientes, setModalConfirmarPendientes] = useState(false)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [configSubTab, setConfigSubTab] = useState('negocio') // 'negocio' | 'disponibilidad'
  const [filtroModalidad, setFiltroModalidad] = useState('todos') // 'todos' | 'local' | 'domicilio' | 'videollamada'
  const [bottomSheetFiltros, setBottomSheetFiltros] = useState(false)

  // Efecto para abrir turno desde URL (ej: ?turno=uuid)
  useEffect(() => {
    const turnoId = searchParams.get('turno')
    if (turnoId) {
      // Cargar el turno y abrir el modal
      const cargarTurno = async () => {
        const { data } = await supabase
          .from('agenda_turnos')
          .select(`
            *,
            cliente:agenda_clientes(*),
            servicios:agenda_turno_servicios(
              *,
              servicio:agenda_servicios(*)
            )
          `)
          .eq('id', turnoId)
          .single()

        if (data) {
          setModalDetalle({ abierto: true, turno: data })
          // Limpiar el param de la URL
          setSearchParams({})
        }
      }
      cargarTurno()
    }
  }, [searchParams, setSearchParams])

  // Hook de profesionales (debe ir antes de los hooks de turnos para tener profesionalActivo)
  const {
    profesionales,
    profesionalActivo,
    setProfesionalActivo,
    tieneMuchos: tieneMuchosProfesionales
  } = useProfesionales()

  // Hook de negocio para obtener modalidades de trabajo y modo configurado
  const {
    tieneLocal,
    tieneDomicilio,
    tieneVideollamada,
    modalidades: modalidadesConfiguradas,
    modoAgenda,
    esModoPersonal,
    esModoEquipo,
    esModoEspacios,
    recargar: recargarNegocio
  } = useNegocio()

  // Hook de espacios (solo se usa en modo espacios)
  const {
    espacios,
    espacioActivo,
    setEspacioActivo,
    tieneMuchos: tieneMuchosEspacios
  } = useEspaciosActivos()

  // Hook de disponibilidad horaria (para obtener horarios configurados)
  const { disponibilidad } = useDisponibilidad()

  // Calcular horarios del día seleccionado basado en la configuración
  const horariosDelDia = useMemo(() => {
    if (!disponibilidad || disponibilidad.length === 0) {
      return { horaInicio: '08:00', horaFin: '21:00' }
    }

    // Obtener día de la semana de la fecha seleccionada (0=Dom, 1=Lun, etc)
    const date = new Date(fechaSeleccionada + 'T12:00:00')
    const diaSemana = date.getDay()

    // Buscar configuración para este día
    const configDia = disponibilidad.find(d => d.dia_semana === diaSemana && d.activo)

    if (configDia) {
      // Normalizar formato de hora (de '08:00:00' a '08:00')
      const horaInicio = configDia.hora_inicio?.substring(0, 5) || '08:00'
      const horaFin = configDia.hora_fin?.substring(0, 5) || '21:00'
      return { horaInicio, horaFin }
    }

    // Si el día no está activo, usar valores por defecto
    return { horaInicio: '08:00', horaFin: '21:00' }
  }, [disponibilidad, fechaSeleccionada])

  // Solo mostrar filtro si tiene más de una modalidad configurada
  const mostrarFiltroModalidad = (modalidadesConfiguradas?.length || 0) > 1

  // Contar filtros activos para el badge
  const filtrosActivos = useMemo(() => {
    let count = 0
    if (filtroModalidad !== 'todos') count++
    if (profesionalActivo && profesionalActivo !== 'todos') count++
    if (espacioActivo && espacioActivo !== 'todos') count++
    return count
  }, [filtroModalidad, profesionalActivo, espacioActivo])

  // Determinar si mostrar selector de recursos (profesional o espacio)
  const mostrarSelectorProfesional = esModoEquipo && tieneMuchosProfesionales
  const mostrarSelectorEspacio = esModoEspacios && tieneMuchosEspacios

  // Opciones de filtro por profesional
  const filtrosProfesional = profesionalActivo && profesionalActivo !== 'todos'
    ? { profesionalId: profesionalActivo }
    : {}

  // Opciones de filtro por espacio (modo espacios)
  const filtrosEspacio = esModoEspacios && espacioActivo && espacioActivo !== 'todos'
    ? { espacioId: espacioActivo }
    : {}

  // Combinar filtros
  const filtrosCombinados = { ...filtrosProfesional, ...filtrosEspacio }

  // Hooks de datos - día
  const {
    turnos: turnosDia,
    loading: loadingTurnosDia,
    agregar: agregarTurno,
    actualizar: actualizarTurno,
    cambiarEstado,
    recargar: recargarTurnosDia
  } = useTurnosDia(fechaSeleccionada, filtrosCombinados)

  // Hooks de datos - semana
  const inicioSemana = getPrimerDiaSemana(fechaSeleccionada)
  const {
    turnos: turnosSemana,
    turnosPorDia,
    diasSemana,
    loading: loadingTurnosSemana,
    recargar: recargarTurnosSemana
  } = useTurnosSemana(inicioSemana, filtrosCombinados)

  // Hooks de datos - mes (solo carga cuando está en vista mes)
  const {
    turnos: turnosMes,
    loading: loadingTurnosMes,
    recargar: recargarTurnosMes
  } = useTurnosMes(vistaCalendario === 'mes' ? fechaSeleccionada : null, filtrosCombinados)

  const {
    servicios,
    loading: loadingServicios,
    agregar: agregarServicio,
    actualizar: actualizarServicio,
    eliminar: eliminarServicio
  } = useServicios()

  const {
    clientes,
    loading: loadingClientes,
    agregar: agregarCliente,
    actualizar: actualizarCliente,
    recargar: recargarClientes
  } = useClientes({ autoLoad: tabActiva === 'clientes' || modalTurno.abierto || modalTurnoRapido.abierto })

  // Calcular turnos pendientes según la vista actual
  const turnosPendientes = (() => {
    let turnos = []
    if (vistaCalendario === 'dia') {
      turnos = turnosDia || []
    } else if (vistaCalendario === 'semana') {
      turnos = turnosSemana || []
    } else if (vistaCalendario === 'mes') {
      turnos = turnosMes || []
    }
    return turnos.filter(t => t.estado === 'pendiente')
  })()

  // Recargar datos según vista
  const recargarTurnos = useCallback(() => {
    if (vistaCalendario === 'dia') {
      recargarTurnosDia()
    } else {
      recargarTurnosSemana()
    }
  }, [vistaCalendario, recargarTurnosDia, recargarTurnosSemana])

  // Handler cuando se guarda configuración - recarga datos y vuelve al calendario
  const handleConfigGuardada = useCallback(() => {
    // Recargar datos del negocio (modalidades, etc.)
    recargarNegocio()
    // Recargar turnos para reflejar cambios
    recargarTurnosDia()
    recargarTurnosSemana()
    recargarTurnosMes()
  }, [recargarNegocio, recargarTurnosDia, recargarTurnosSemana, recargarTurnosMes])

  // Handlers de turnos
  const handleNuevoTurno = (fecha, hora = null, espacioId = null) => {
    const fechaTurno = fecha || fechaSeleccionada
    const hoy = getFechaHoyArgentina()

    // No permitir crear turnos en fechas pasadas
    if (fechaTurno < hoy) {
      return
    }

    // Si es hoy y se pasó una hora, verificar que no sea más de 2 horas antes
    if (fechaTurno === hoy && hora) {
      // Obtener hora actual en Argentina (UTC-3)
      const ahora = new Date()
      let horasArgentina = ahora.getUTCHours() - 3
      if (horasArgentina < 0) horasArgentina += 24
      const minutosActuales = horasArgentina * 60 + ahora.getUTCMinutes()

      const [h, m] = hora.split(':').map(Number)
      const minutosTurno = h * 60 + m
      const minutosLimite = minutosActuales - 120 // 2 horas antes

      if (minutosTurno < minutosLimite) {
        return
      }
    }

    setModalTurno({
      abierto: true,
      turno: null,
      fecha: fechaTurno,
      hora,
      espacioId // Para modo espacios
    })
  }

  const handleTurnoRapido = (fecha, hora = null) => {
    const fechaTurno = fecha || fechaSeleccionada
    const hoy = getFechaHoyArgentina()

    // No permitir crear turnos en fechas pasadas
    if (fechaTurno < hoy) {
      return
    }

    // Si es hoy y se pasó una hora, verificar que no sea más de 2 horas antes
    if (fechaTurno === hoy && hora) {
      // Obtener hora actual en Argentina (UTC-3)
      const ahora = new Date()
      let horasArgentina = ahora.getUTCHours() - 3
      if (horasArgentina < 0) horasArgentina += 24
      const minutosActuales = horasArgentina * 60 + ahora.getUTCMinutes()

      const [h, m] = hora.split(':').map(Number)
      const minutosTurno = h * 60 + m
      const minutosLimite = minutosActuales - 120 // 2 horas antes

      if (minutosTurno < minutosLimite) {
        return
      }
    }

    setModalTurnoRapido({
      abierto: true,
      fecha: fechaTurno,
      hora
    })
  }

  // Ver detalle del turno (click en calendario)
  const handleVerTurno = (turno) => {
    setModalDetalle({ abierto: true, turno })
  }

  // Editar turno (desde modal detalle)
  const handleEditarTurno = (turno) => {
    setModalDetalle({ abierto: false, turno: null })
    setModalTurno({
      abierto: true,
      turno,
      fecha: turno.fecha,
      hora: null
    })
  }

  const handleGuardarTurno = async (turnoData) => {
    if (modalTurno.turno) {
      await actualizarTurno(modalTurno.turno.id, turnoData)
    } else {
      await agregarTurno(turnoData)
    }
    recargarTurnos()
  }

  const handleGuardarTurnoRapido = async (turnoData) => {
    await agregarTurno(turnoData)
    recargarTurnos()
  }

  const handleCambiarEstado = async (turnoId, nuevoEstado) => {
    try {
      await cambiarEstado(turnoId, nuevoEstado)
      recargarTurnos()
    } catch (err) {
      console.error('Error cambiando estado:', err)
    }
  }

  // Handler para mover turno (drag & drop)
  const handleMoverTurno = async (turnoId, nuevosDatos) => {
    try {
      await actualizarTurno(turnoId, nuevosDatos)
      recargarTurnos()
    } catch (err) {
      console.error('Error moviendo turno:', err)
    }
  }

  // Al cambiar fecha desde calendario día, ir a esa fecha
  const handleFechaChange = (nuevaFecha) => {
    setFechaSeleccionada(nuevaFecha)
  }

  // Al hacer click en un día desde vista semana/mes
  const handleDiaClick = (fecha) => {
    setFechaSeleccionada(fecha)
    setVistaCalendario('dia')
  }

  // Handlers de servicios
  const handleNuevoServicio = () => {
    setModalServicio({ abierto: true, servicio: null })
  }

  const handleEditarServicio = (servicio) => {
    setModalServicio({ abierto: true, servicio })
  }

  const handleGuardarServicio = async (servicioData) => {
    if (modalServicio.servicio) {
      await actualizarServicio(modalServicio.servicio.id, servicioData)
    } else {
      await agregarServicio(servicioData)
    }
  }

  const handleEliminarServicio = async (id) => {
    if (window.confirm('¿Desactivar este servicio?')) {
      await eliminarServicio(id)
    }
  }

  // Handlers de clientes
  const handleNuevoCliente = () => {
    setModalCliente({ abierto: true, cliente: null })
  }

  const handleEditarCliente = (cliente) => {
    setModalCliente({ abierto: true, cliente })
  }

  const handleVerFichaCliente = (clienteId) => {
    setModalFichaCliente({ abierto: true, clienteId })
  }

  const handleGuardarCliente = async (clienteData) => {
    if (modalCliente.cliente) {
      await actualizarCliente(modalCliente.cliente.id, clienteData)
    } else {
      await agregarCliente(clienteData)
    }
  }

  // Handler para ver historial de cliente
  const handleVerHistorial = (clienteId) => {
    setModalHistorial({ abierto: true, clienteId })
  }

  // Handler para marcar recordatorio enviado
  const handleMarcarRecordatorio = async (turnoId) => {
    try {
      await supabase
        .from('agenda_turnos')
        .update({
          recordatorio_enviado: true,
          fecha_recordatorio: new Date().toISOString()
        })
        .eq('id', turnoId)

      // Recargar turno en modal
      if (modalDetalle.turno?.id === turnoId) {
        setModalDetalle(prev => ({
          ...prev,
          turno: { ...prev.turno, recordatorio_enviado: true }
        }))
      }
    } catch (err) {
      console.error('Error marcando recordatorio:', err)
    }
  }

  // Función para filtrar turnos por modalidad
  const filtrarPorModalidad = useCallback((turnos) => {
    if (!turnos || filtroModalidad === 'todos') return turnos
    return turnos.filter(t => t.modalidad === filtroModalidad)
  }, [filtroModalidad])

  // Turnos filtrados por modalidad
  const turnosDiaFiltrados = filtrarPorModalidad(turnosDia)
  const turnosSemanaFiltrados = filtrarPorModalidad(turnosSemana)
  const turnosMesFiltrados = filtrarPorModalidad(turnosMes)

  // Turnos por día filtrados (para vista semanal)
  const turnosPorDiaFiltrados = {}
  if (turnosPorDia) {
    Object.keys(turnosPorDia).forEach(fecha => {
      turnosPorDiaFiltrados[fecha] = filtrarPorModalidad(turnosPorDia[fecha])
    })
  }

  // Turnos a mostrar según vista
  const turnosActuales = vistaCalendario === 'dia' ? turnosDiaFiltrados : turnosSemanaFiltrados
  const loadingTurnos = vistaCalendario === 'dia' ? loadingTurnosDia : loadingTurnosSemana

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            {/* Título y tabs - en mobile vertical, en desktop horizontal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 py-3 sm:py-0 sm:h-16">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-lg sm:text-xl text-gray-900">Agenda & Turnos</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Gestión de citas y servicios</p>
                </div>
              </div>

              {/* Tabs principales - scrollable en mobile */}
              <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-max sm:w-auto">
                  {Object.values(TABS).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setTabActiva(tab.id)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        tabActiva === tab.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subtabs de vistas de calendario - MOBILE: compacto con filtros en bottom sheet */}
            {tabActiva === 'calendario' && (
              <div className="flex items-center justify-between gap-2 pb-3 -mt-1">
                {/* Izquierda: Selector de vista + Filtros */}
                <div className="flex items-center gap-2">
                  {/* Vista: Dropdown en mobile, botones en desktop */}
                  <div className="relative sm:hidden">
                    <select
                      value={vistaCalendario}
                      onChange={(e) => setVistaCalendario(e.target.value)}
                      className="appearance-none bg-blue-100 text-blue-700 font-medium text-sm pl-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {Object.values(VISTAS_CALENDARIO).map(vista => (
                        <option key={vista.id} value={vista.id}>{vista.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
                  </div>

                  {/* Vistas de calendario - Desktop */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Object.values(VISTAS_CALENDARIO).map(vista => (
                      <button
                        key={vista.id}
                        onClick={() => setVistaCalendario(vista.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          vistaCalendario === vista.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <vista.icon className="w-3.5 h-3.5" />
                        {vista.label}
                      </button>
                    ))}
                  </div>

                  {/* Botón filtros - Mobile: siempre visible, Desktop: solo si hay filtros */}
                  {(mostrarFiltroModalidad || mostrarSelectorProfesional || (mostrarSelectorEspacio && vistaCalendario !== 'dia')) && (
                    <>
                      {/* Mobile: botón que abre bottom sheet */}
                      <div className="sm:hidden">
                        <BotonFiltros
                          onClick={() => setBottomSheetFiltros(true)}
                          filtrosActivos={filtrosActivos}
                        />
                      </div>

                      {/* Desktop: filtros inline */}
                      <div className="hidden sm:flex items-center gap-2">
                        {mostrarFiltroModalidad && (
                          <>
                            <div className="h-5 w-px bg-gray-300 mx-1" />
                            <button
                              onClick={() => setFiltroModalidad('todos')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filtroModalidad === 'todos'
                                  ? 'bg-gray-200 text-gray-800'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Filter className="w-3.5 h-3.5" />
                              Todos
                            </button>

                            {tieneLocal && (
                              <button
                                onClick={() => setFiltroModalidad('local')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  filtroModalidad === 'local'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <Store className="w-3.5 h-3.5" />
                                Local
                              </button>
                            )}

                            {tieneDomicilio && (
                              <button
                                onClick={() => setFiltroModalidad('domicilio')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  filtroModalidad === 'domicilio'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <Car className="w-3.5 h-3.5" />
                                Domicilio
                              </button>
                            )}

                            {tieneVideollamada && (
                              <button
                                onClick={() => setFiltroModalidad('videollamada')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  filtroModalidad === 'videollamada'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <Video className="w-3.5 h-3.5" />
                                Video
                              </button>
                            )}
                          </>
                        )}

                        {/* Selector de profesional (modo equipo) - Desktop */}
                        {mostrarSelectorProfesional && (
                          <SelectorProfesional
                            profesionales={profesionales}
                            profesionalActivo={profesionalActivo}
                            onChange={setProfesionalActivo}
                          />
                        )}

                        {/* Selector de espacio (modo espacios) - solo en vista semana/mes */}
                        {esModoEspacios && espacios.length > 0 && vistaCalendario !== 'dia' && (
                          <SelectorEspacio
                            espacios={espacios}
                            espacioActivo={espacioActivo}
                            onChange={setEspacioActivo}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Derecha: Botón confirmar pendientes */}
                <div className="flex items-center gap-2">
                  {turnosPendientes.length > 0 && (
                    <button
                      onClick={() => setModalConfirmarPendientes(true)}
                      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Confirmar pendientes</span>
                      <span className="sm:hidden">{turnosPendientes.length}</span>
                      <span className="hidden sm:inline">({turnosPendientes.length})</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Tab Calendario */}
          {tabActiva === 'calendario' && (
            <>
              {/* Vista especial para modo espacios */}
              {esModoEspacios && vistaCalendario === 'dia' && (
                <CalendarioEspacios
                  fecha={fechaSeleccionada}
                  onFechaChange={handleFechaChange}
                  espacios={espacios}
                  turnos={turnosDiaFiltrados}
                  loading={loadingTurnosDia}
                  onTurnoClick={handleVerTurno}
                  onNuevoTurno={handleNuevoTurno}
                  onTurnoRapido={handleTurnoRapido}
                  horaInicio={horariosDelDia.horaInicio}
                  horaFin={horariosDelDia.horaFin}
                />
              )}

              {/* Vista día normal (modo personal/equipo) */}
              {!esModoEspacios && vistaCalendario === 'dia' && (
                <CalendarioDia
                  fecha={fechaSeleccionada}
                  onFechaChange={handleFechaChange}
                  turnos={turnosDiaFiltrados}
                  loading={loadingTurnosDia}
                  onTurnoClick={handleVerTurno}
                  onNuevoTurno={handleNuevoTurno}
                  onTurnoRapido={handleTurnoRapido}
                  onCambiarEstado={handleCambiarEstado}
                />
              )}

              {vistaCalendario === 'semana' && (
                <CalendarioSemana
                  fechaInicio={inicioSemana}
                  fechaSeleccionada={fechaSeleccionada}
                  onFechaChange={handleFechaChange}
                  turnosPorDia={turnosPorDiaFiltrados}
                  diasSemana={diasSemana}
                  loading={loadingTurnosSemana}
                  onTurnoClick={handleVerTurno}
                  onNuevoTurno={handleNuevoTurno}
                  onTurnoRapido={handleTurnoRapido}
                  onDiaClick={handleDiaClick}
                  onCambiarEstado={handleCambiarEstado}
                  onMoverTurno={handleMoverTurno}
                />
              )}

              {vistaCalendario === 'mes' && (
                <CalendarioMes
                  fecha={fechaSeleccionada}
                  onFechaChange={handleFechaChange}
                  turnos={turnosMesFiltrados}
                  loading={loadingTurnosMes}
                  onDiaClick={handleDiaClick}
                  onNuevoTurno={handleNuevoTurno}
                />
              )}
            </>
          )}

          {/* Tab Cobros */}
          {tabActiva === 'cobros' && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <CobrosAgenda />
            </div>
          )}

          {/* Tab Servicios */}
          {tabActiva === 'servicios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-lg text-gray-900">
                    Catálogo de Servicios
                  </h2>
                  <p className="text-sm text-gray-500">
                    {servicios.length} servicio{servicios.length !== 1 ? 's' : ''} activo{servicios.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleNuevoServicio}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo servicio
                </button>
              </div>

              {loadingServicios ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
                </div>
              ) : servicios.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                  <Scissors className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No hay servicios creados</p>
                  <button
                    onClick={handleNuevoServicio}
                    className="text-violet-600 hover:text-violet-700 font-medium"
                  >
                    + Crear primer servicio
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {servicios.map(servicio => {
                    // Calcular precios por modalidad
                    const preciosModalidad = []
                    if (tieneLocal && servicio.disponible_local !== false) {
                      preciosModalidad.push({
                        key: 'local',
                        icon: Store,
                        label: 'Local',
                        precio: servicio.precio_local ?? servicio.precio,
                        color: 'text-blue-600'
                      })
                    }
                    if (tieneDomicilio && servicio.disponible_domicilio !== false) {
                      preciosModalidad.push({
                        key: 'domicilio',
                        icon: Car,
                        label: 'Domicilio',
                        precio: servicio.precio_domicilio ?? servicio.precio,
                        color: 'text-orange-600'
                      })
                    }
                    if (tieneVideollamada && servicio.disponible_videollamada !== false) {
                      preciosModalidad.push({
                        key: 'videollamada',
                        icon: Video,
                        label: 'Video',
                        precio: servicio.precio_videollamada ?? servicio.precio,
                        color: 'text-purple-600'
                      })
                    }

                    // Verificar si todos los precios son iguales (para mostrar simple o detallado)
                    const todosIguales = preciosModalidad.every(p => p.precio === preciosModalidad[0]?.precio)
                    const mostrarDetalle = modalidadesConfiguradas.length > 1 && !todosIguales

                    return (
                      <div
                        key={servicio.id}
                        onClick={() => handleEditarServicio(servicio)}
                        className="bg-white rounded-xl border hover:shadow-md transition-all cursor-pointer p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-3 h-12 rounded-full flex-shrink-0"
                            style={{ backgroundColor: servicio.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900">{servicio.nombre}</h3>
                            <p className="text-sm text-gray-500">
                              {formatDuracion(servicio.duracion_minutos)}
                            </p>

                            {/* Precios */}
                            {mostrarDetalle ? (
                              <div className="mt-1.5 space-y-0.5">
                                {preciosModalidad.map(pm => {
                                  const IconComp = pm.icon
                                  return (
                                    <div key={pm.key} className="flex items-center gap-1.5 text-sm">
                                      <IconComp className={`w-3.5 h-3.5 ${pm.color}`} />
                                      <span className="font-semibold text-gray-900">
                                        {formatearMonto(pm.precio)}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-lg font-semibold text-gray-900 mt-1">
                                {formatearMonto(servicio.precio)}
                              </p>
                            )}

                            {servicio.requiere_sena && (
                              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                Seña {servicio.porcentaje_sena}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Clientes */}
          {tabActiva === 'clientes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-lg text-gray-900">
                    Clientes
                  </h2>
                  <p className="text-sm text-gray-500">
                    {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleNuevoCliente}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo cliente
                </button>
              </div>

              {/* Buscador */}
              {clientes.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={busquedaCliente}
                    onChange={(e) => setBusquedaCliente(e.target.value)}
                    placeholder="Buscar por nombre, apellido o teléfono..."
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {busquedaCliente && (
                    <button
                      onClick={() => setBusquedaCliente('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              )}

              {loadingClientes ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No hay clientes registrados</p>
                  <button
                    onClick={handleNuevoCliente}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    + Registrar primer cliente
                  </button>
                </div>
              ) : (() => {
                // Filtrar clientes por búsqueda
                const clientesFiltrados = clientes.filter(cliente => {
                  if (!busquedaCliente.trim()) return true
                  const busqueda = busquedaCliente.toLowerCase().trim()
                  const nombre = (cliente.nombre || '').toLowerCase()
                  const apellido = (cliente.apellido || '').toLowerCase()
                  const whatsapp = (cliente.whatsapp || '').toLowerCase()
                  const telefono = (cliente.telefono || '').toLowerCase()
                  return nombre.includes(busqueda) ||
                         apellido.includes(busqueda) ||
                         `${nombre} ${apellido}`.includes(busqueda) ||
                         whatsapp.includes(busqueda) ||
                         telefono.includes(busqueda)
                })

                if (clientesFiltrados.length === 0) {
                  return (
                    <div className="text-center py-12 bg-white rounded-xl border">
                      <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500">No se encontraron clientes con "{busquedaCliente}"</p>
                    </div>
                  )
                }

                return (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {clientesFiltrados.map(cliente => {
                      // Verificar si la ficha está incompleta
                      const fichaIncompleta = !cliente.whatsapp || !cliente.apellido

                      return (
                        <div
                          key={cliente.id}
                          onClick={() => handleVerFichaCliente(cliente.id)}
                          className="bg-white rounded-xl border hover:shadow-md transition-all cursor-pointer p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium relative">
                              {cliente.nombre?.charAt(0)?.toUpperCase()}
                              {cliente.apellido?.charAt(0)?.toUpperCase() || ''}
                              {fichaIncompleta && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                                  <AlertCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {cliente.nombre} {cliente.apellido || ''}
                                </h3>
                              </div>
                              {cliente.whatsapp && (
                                <p className="text-sm text-gray-500 truncate">{cliente.whatsapp}</p>
                              )}
                              {!cliente.whatsapp && (
                                <p className="text-sm text-amber-600 truncate">Sin teléfono</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Tab Reservas */}
          {tabActiva === 'reservas' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-heading font-semibold text-lg text-gray-900">
                  Links de Reserva
                </h2>
                <p className="text-sm text-gray-500">
                  Generá links para que tus clientes reserven turnos
                </p>
              </div>

              <ListaReservaLinks
                onNuevoLink={() => setModalGenerarLink(true)}
              />
            </div>
          )}

          {/* Tab Estadísticas */}
          {tabActiva === 'estadisticas' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-heading font-semibold text-lg text-gray-900">
                  Estadísticas
                </h2>
                <p className="text-sm text-gray-500">
                  Análisis de turnos e ingresos
                </p>
              </div>

              <EstadisticasAgenda profesionalId={profesionalActivo} />
            </div>
          )}

          {/* Tab Configuración */}
          {tabActiva === 'config' && (
            <div className="space-y-4">
              {/* Sub-tabs de configuración */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setConfigSubTab('negocio')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    configSubTab === 'negocio'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Mi Negocio
                </button>

                {/* Tab Espacios - solo en modo espacios */}
                {esModoEspacios && (
                  <button
                    onClick={() => setConfigSubTab('espacios')}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      configSubTab === 'espacios'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <DoorOpen className="w-4 h-4" />
                    Espacios
                  </button>
                )}

                <button
                  onClick={() => setConfigSubTab('disponibilidad')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    configSubTab === 'disponibilidad'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Horarios
                </button>
                <button
                  onClick={() => setConfigSubTab('whatsapp')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    configSubTab === 'whatsapp'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>

              {/* Contenido de Mi Negocio */}
              {configSubTab === 'negocio' && (
                <ConfigNegocio onGuardar={handleConfigGuardada} />
              )}

              {/* Contenido de Espacios (solo modo espacios) */}
              {configSubTab === 'espacios' && esModoEspacios && (
                <ConfigEspacios />
              )}

              {/* Contenido de Disponibilidad Horaria */}
              {configSubTab === 'disponibilidad' && (
                <div className="space-y-4">
                  {/* Selector de profesional si hay varios (solo modo equipo, no espacios) */}
                  {mostrarSelectorProfesional && !esModoEspacios && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                      <span className="text-sm text-blue-700">Configurar horario de:</span>
                      <SelectorProfesional
                        profesionales={profesionales}
                        profesionalActivo={profesionalActivo}
                        onChange={setProfesionalActivo}
                        mostrarTodos={false}
                      />
                    </div>
                  )}

                  {/* En modo espacios, mostrar mensaje de que es horario del local */}
                  {esModoEspacios && (
                    <div className="p-3 bg-indigo-50 rounded-xl">
                      <p className="text-sm text-indigo-700">
                        Horario de operación del local (aplica a todos los espacios)
                      </p>
                    </div>
                  )}

                  <ConfigDisponibilidad
                    profesionalId={esModoEspacios ? null : profesionalActivo}
                    profesionalNombre={esModoEspacios ? 'Horario del local' : profesionales.find(p => p.id === profesionalActivo)?.nombre}
                  />
                </div>
              )}

              {/* Contenido de WhatsApp */}
              {configSubTab === 'whatsapp' && (
                <ConfigWhatsApp onGuardar={handleConfigGuardada} />
              )}
            </div>
          )}
        </div>

        {/* Modales */}
        <ModalTurno
          isOpen={modalTurno.abierto}
          onClose={() => setModalTurno({ abierto: false, turno: null, fecha: null, hora: null, espacioId: null })}
          onGuardar={handleGuardarTurno}
          turno={modalTurno.turno}
          fechaInicial={modalTurno.fecha}
          horaInicial={modalTurno.hora}
          espacioIdInicial={modalTurno.espacioId}
          espacios={esModoEspacios ? espacios : []}
          servicios={servicios}
          clientes={clientes}
          onNuevoCliente={() => setModalCliente({ abierto: true, cliente: null })}
          turnosExistentes={Object.values(turnosPorDia).flat()}
          onIrAServicios={() => setTabActiva('servicios')}
        />

        <ModalTurnoRapido
          isOpen={modalTurnoRapido.abierto}
          onClose={() => setModalTurnoRapido({ abierto: false, fecha: null, hora: null })}
          onGuardar={handleGuardarTurnoRapido}
          fecha={modalTurnoRapido.fecha}
          hora={modalTurnoRapido.hora}
          servicios={servicios}
          clientes={clientes}
          turnosExistentes={turnosPorDia[modalTurnoRapido.fecha] || []}
        />

        <ModalDetalleTurno
          isOpen={modalDetalle.abierto}
          onClose={() => setModalDetalle({ abierto: false, turno: null })}
          turno={modalDetalle.turno}
          onEditar={handleEditarTurno}
          onCambiarEstado={handleCambiarEstado}
          onVerHistorial={handleVerHistorial}
          onMarcarRecordatorio={handleMarcarRecordatorio}
        />

        <ModalServicio
          isOpen={modalServicio.abierto}
          onClose={() => setModalServicio({ abierto: false, servicio: null })}
          onGuardar={handleGuardarServicio}
          servicio={modalServicio.servicio}
        />

        <ModalCliente
          isOpen={modalCliente.abierto}
          onClose={() => setModalCliente({ abierto: false, cliente: null })}
          onGuardar={handleGuardarCliente}
          cliente={modalCliente.cliente}
        />

        <ModalFichaCliente
          isOpen={modalFichaCliente.abierto}
          clienteId={modalFichaCliente.clienteId}
          onClose={() => setModalFichaCliente({ abierto: false, clienteId: null })}
          onClienteActualizado={() => recargarClientes()}
        />

        {/* Modal Historial Cliente */}
        {modalHistorial.abierto && (
          <HistorialCliente
            clienteId={modalHistorial.clienteId}
            onClose={() => setModalHistorial({ abierto: false, clienteId: null })}
          />
        )}

        {/* Modal Generar Link de Reserva */}
        <ModalGenerarLink
          isOpen={modalGenerarLink}
          onClose={() => setModalGenerarLink(false)}
        />

        {/* Modal Confirmar Pendientes */}
        <ModalConfirmarPendientes
          isOpen={modalConfirmarPendientes}
          onClose={() => setModalConfirmarPendientes(false)}
          turnosPendientes={turnosPendientes}
          onVerTurno={(turno) => {
            setModalConfirmarPendientes(false)
            setModalDetalle({ abierto: true, turno })
          }}
        />

        {/* Modal de Filtros - Mobile */}
        <ModalFiltros
          isOpen={bottomSheetFiltros}
          onClose={() => setBottomSheetFiltros(false)}
          // Filtro modalidad
          filtroModalidad={filtroModalidad}
          onFiltroModalidadChange={setFiltroModalidad}
          tieneLocal={tieneLocal}
          tieneDomicilio={tieneDomicilio}
          tieneVideollamada={tieneVideollamada}
          mostrarFiltroModalidad={mostrarFiltroModalidad}
          // Selector profesional
          mostrarSelectorProfesional={mostrarSelectorProfesional}
          profesionales={profesionales}
          profesionalActivo={profesionalActivo}
          onProfesionalChange={setProfesionalActivo}
          // Selector espacio (solo si no está en vista día)
          mostrarSelectorEspacio={mostrarSelectorEspacio && vistaCalendario !== 'dia'}
          espacios={espacios}
          espacioActivo={espacioActivo}
          onEspacioChange={setEspacioActivo}
        />
      </div>
    </Layout>
  )
}
