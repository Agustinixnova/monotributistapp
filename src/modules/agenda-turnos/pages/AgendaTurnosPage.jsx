/**
 * Página principal del módulo Agenda & Turnos
 * Fase 2: Vistas semana/mes, turno rápido, múltiples servicios
 */

import { useState, useCallback } from 'react'
import { Calendar, Scissors, Users, Plus, Loader2, CalendarDays, CalendarRange, LayoutGrid, Settings, BarChart3 } from 'lucide-react'
import { Layout } from '../../../components/layout'
import { getFechaHoyArgentina, getPrimerDiaSemana } from '../utils/dateUtils'
import { useTurnosDia, useTurnosSemana } from '../hooks/useTurnos'
import { useServicios } from '../hooks/useServicios'
import { useClientes } from '../hooks/useClientes'
import CalendarioDia from '../components/calendario/CalendarioDia'
import CalendarioSemana from '../components/calendario/CalendarioSemana'
import CalendarioMes from '../components/calendario/CalendarioMes'
import ModalTurno from '../components/turnos/ModalTurno'
import ModalTurnoRapido from '../components/turnos/ModalTurnoRapido'
import ModalDetalleTurno from '../components/turnos/ModalDetalleTurno'
import ModalServicio from '../components/servicios/ModalServicio'
import ModalCliente from '../components/clientes/ModalCliente'
import ConfigDisponibilidad from '../components/disponibilidad/ConfigDisponibilidad'
import SelectorProfesional from '../components/disponibilidad/SelectorProfesional'
import EstadisticasAgenda from '../components/estadisticas/EstadisticasAgenda'
import HistorialCliente from '../components/clientes/HistorialCliente'
import { useProfesionales } from '../hooks/useDisponibilidad'
import { formatearMonto } from '../utils/formatters'
import { formatDuracion } from '../utils/dateUtils'
import { supabase } from '../../../lib/supabase'

// Tabs disponibles
const TABS = {
  calendario: { id: 'calendario', label: 'Calendario', icon: Calendar },
  servicios: { id: 'servicios', label: 'Servicios', icon: Scissors },
  clientes: { id: 'clientes', label: 'Clientes', icon: Users },
  estadisticas: { id: 'estadisticas', label: 'Stats', icon: BarChart3 },
  config: { id: 'config', label: 'Horarios', icon: Settings },
}

// Vistas de calendario
const VISTAS_CALENDARIO = {
  semana: { id: 'semana', label: 'Semana', icon: CalendarRange },
  dia: { id: 'dia', label: 'Día', icon: CalendarDays },
  mes: { id: 'mes', label: 'Mes', icon: LayoutGrid },
}

export default function AgendaTurnosPage() {
  const [tabActiva, setTabActiva] = useState('calendario')
  const [vistaCalendario, setVistaCalendario] = useState('semana') // semana es la vista principal
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFechaHoyArgentina())

  // Modales
  const [modalTurno, setModalTurno] = useState({ abierto: false, turno: null, fecha: null, hora: null })
  const [modalTurnoRapido, setModalTurnoRapido] = useState({ abierto: false, fecha: null, hora: null })
  const [modalDetalle, setModalDetalle] = useState({ abierto: false, turno: null })
  const [modalServicio, setModalServicio] = useState({ abierto: false, servicio: null })
  const [modalCliente, setModalCliente] = useState({ abierto: false, cliente: null })
  const [modalHistorial, setModalHistorial] = useState({ abierto: false, clienteId: null })

  // Hooks de datos - día
  const {
    turnos: turnosDia,
    loading: loadingTurnosDia,
    agregar: agregarTurno,
    actualizar: actualizarTurno,
    cambiarEstado,
    recargar: recargarTurnosDia
  } = useTurnosDia(fechaSeleccionada)

  // Hooks de datos - semana
  const inicioSemana = getPrimerDiaSemana(fechaSeleccionada)
  const {
    turnos: turnosSemana,
    turnosPorDia,
    diasSemana,
    loading: loadingTurnosSemana,
    recargar: recargarTurnosSemana
  } = useTurnosSemana(inicioSemana)

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

  // Hook de profesionales
  const {
    profesionales,
    profesionalActivo,
    setProfesionalActivo,
    tieneMuchos: tieneMuchosProfesionales
  } = useProfesionales()

  // Recargar datos según vista
  const recargarTurnos = useCallback(() => {
    if (vistaCalendario === 'dia') {
      recargarTurnosDia()
    } else {
      recargarTurnosSemana()
    }
  }, [vistaCalendario, recargarTurnosDia, recargarTurnosSemana])

  // Handlers de turnos
  const handleNuevoTurno = (fecha, hora = null) => {
    setModalTurno({
      abierto: true,
      turno: null,
      fecha: fecha || fechaSeleccionada,
      hora
    })
  }

  const handleTurnoRapido = (fecha, hora = null) => {
    setModalTurnoRapido({
      abierto: true,
      fecha: fecha || fechaSeleccionada,
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

  // Turnos a mostrar según vista
  const turnosActuales = vistaCalendario === 'dia' ? turnosDia : turnosSemana
  const loadingTurnos = vistaCalendario === 'dia' ? loadingTurnosDia : loadingTurnosSemana

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-xl text-gray-900">Agenda & Turnos</h1>
                  <p className="text-xs text-gray-500">Gestión de citas y servicios</p>
                </div>
              </div>

              {/* Tabs principales */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                {Object.values(TABS).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

            {/* Subtabs de vistas de calendario */}
            {tabActiva === 'calendario' && (
              <div className="flex items-center justify-between pb-3 -mt-1">
                <div className="flex items-center gap-2">
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

                {/* Selector de profesional */}
                {tieneMuchosProfesionales && (
                  <SelectorProfesional
                    profesionales={profesionales}
                    profesionalActivo={profesionalActivo}
                    onChange={setProfesionalActivo}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Tab Calendario */}
          {tabActiva === 'calendario' && (
            <>
              {vistaCalendario === 'dia' && (
                <CalendarioDia
                  fecha={fechaSeleccionada}
                  onFechaChange={handleFechaChange}
                  turnos={turnosDia}
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
                  turnosPorDia={turnosPorDia}
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
                  turnos={turnosSemana}
                  loading={loadingTurnosSemana}
                  onDiaClick={handleDiaClick}
                  onNuevoTurno={handleNuevoTurno}
                />
              )}
            </>
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
                  {servicios.map(servicio => (
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
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {formatearMonto(servicio.precio)}
                          </p>
                          {servicio.requiere_sena && (
                            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                              Seña {servicio.porcentaje_sena}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Clientes */}
          {tabActiva === 'clientes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
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
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {clientes.map(cliente => (
                    <div
                      key={cliente.id}
                      onClick={() => handleEditarCliente(cliente)}
                      className="bg-white rounded-xl border hover:shadow-md transition-all cursor-pointer p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
                          {cliente.nombre?.charAt(0)?.toUpperCase()}
                          {cliente.apellido?.charAt(0)?.toUpperCase() || ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {cliente.nombre} {cliente.apellido || ''}
                          </h3>
                          {cliente.whatsapp && (
                            <p className="text-sm text-gray-500 truncate">{cliente.whatsapp}</p>
                          )}
                          {cliente.notas && (
                            <p className="text-xs text-gray-400 truncate mt-1">{cliente.notas}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <div>
                <h2 className="font-heading font-semibold text-lg text-gray-900">
                  Disponibilidad Horaria
                </h2>
                <p className="text-sm text-gray-500">
                  Configurá los días y horarios de atención
                </p>
              </div>

              {/* Selector de profesional si hay varios */}
              {tieneMuchosProfesionales && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Configurar horario de:</span>
                  <SelectorProfesional
                    profesionales={profesionales}
                    profesionalActivo={profesionalActivo}
                    onChange={setProfesionalActivo}
                    mostrarTodos={false}
                  />
                </div>
              )}

              <ConfigDisponibilidad
                profesionalId={profesionalActivo}
                profesionalNombre={profesionales.find(p => p.id === profesionalActivo)?.nombre}
              />
            </div>
          )}
        </div>

        {/* Modales */}
        <ModalTurno
          isOpen={modalTurno.abierto}
          onClose={() => setModalTurno({ abierto: false, turno: null, fecha: null, hora: null })}
          onGuardar={handleGuardarTurno}
          turno={modalTurno.turno}
          fechaInicial={modalTurno.fecha}
          horaInicial={modalTurno.hora}
          servicios={servicios}
          clientes={clientes}
          onNuevoCliente={() => setModalCliente({ abierto: true, cliente: null })}
        />

        <ModalTurnoRapido
          isOpen={modalTurnoRapido.abierto}
          onClose={() => setModalTurnoRapido({ abierto: false, fecha: null, hora: null })}
          onGuardar={handleGuardarTurnoRapido}
          fecha={modalTurnoRapido.fecha}
          hora={modalTurnoRapido.hora}
          servicios={servicios}
          clientes={clientes}
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

        {/* Modal Historial Cliente */}
        {modalHistorial.abierto && (
          <HistorialCliente
            clienteId={modalHistorial.clienteId}
            onClose={() => setModalHistorial({ abierto: false, clienteId: null })}
          />
        )}
      </div>
    </Layout>
  )
}
