/**
 * Tab de Facturación - Vista principal
 * Muestra los turnos completados para facturar por categoría
 */

import { useState } from 'react'
import {
  Receipt, Search, Calendar, CreditCard, Banknote, Gift,
  CheckCircle, AlertCircle, FileText, Loader2, ChevronDown, Filter, FileSpreadsheet
} from 'lucide-react'
import { useFacturacionTurnos } from './useFacturacionTurnos'
import { useFacturacion } from '../../hooks/useFacturacion'
import { useFacturasPendientes } from '../../hooks/useFacturasPendientes'
import SeccionPagos from './SeccionPagos'
import ModalFacturarLote from './ModalFacturarLote'
import ModalFacturaEmitida from './ModalFacturaEmitida'
import ModalPrevisualizarFactura from './ModalPrevisualizarFactura'
import ModalNotaCredito from './ModalNotaCredito'
import ModalHistorialFacturacion from './ModalHistorialFacturacion'
import ModalReporteFacturacion from './ModalReporteFacturacion'
import ModalFiltrosFacturacion from './ModalFiltrosFacturacion'
import ModalFacturasPendientes from './ModalFacturasPendientes'
import BannerFacturasPendientes from './BannerFacturasPendientes'
import { formatearMonto } from '../../utils/formatters'
import { generarReporteFacturacion } from '../../services/reporteFacturacionService'
import { emitirNotaCreditoC, TIPOS_COMPROBANTE } from '../../services/afipService'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'
import {
  esErrorDeConexion,
  guardarFacturaPendiente,
  TIPOS_COMPROBANTE as TIPOS_PENDIENTE
} from '../../services/facturasPendientesService'

export default function TabFacturacion() {
  const { facturacionHabilitada, config } = useFacturacion()
  const { count: pendientesCount, recargar: recargarPendientes } = useFacturasPendientes()
  const {
    loading,
    error,
    mes,
    filtroPeriodo,
    fechaDesde,
    fechaHasta,
    busqueda,
    filtroEstado,
    filtroTipoPago,
    turnosConPagos,
    seleccionados,
    totales,
    setMes,
    setFiltroPeriodo,
    setFechaDesde,
    setFechaHasta,
    setBusqueda,
    setFiltroEstado,
    setFiltroTipoPago,
    recargar,
    toggleSeleccion,
    seleccionarTodos,
    deseleccionarTodos,
    facturarTurno,
    facturarLote,
    getTurnosPorCategoria,
    todosSeleccionados
  } = useFacturacionTurnos()

  // Modales
  const [modalLote, setModalLote] = useState(false)
  const [modalResultado, setModalResultado] = useState(null)
  const [modalPreview, setModalPreview] = useState(null)
  const [modalNotaCredito, setModalNotaCredito] = useState(null)
  const [modalHistorial, setModalHistorial] = useState(null)
  const [modalReporte, setModalReporte] = useState(false)
  const [modalFiltros, setModalFiltros] = useState(false)
  const [modalPendientes, setModalPendientes] = useState(false)
  const [facturando, setFacturando] = useState(false)
  const [generandoReporte, setGenerandoReporte] = useState(false)

  // Ver historial de facturación del turno
  const handleVerFactura = (turno) => {
    setModalHistorial(turno)
  }

  // Generar opciones de meses (últimos 12 meses)
  const opcionesMeses = []
  const hoy = new Date()
  for (let i = 0; i < 12; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const valor = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const label = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    opcionesMeses.push({ valor, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }

  // Facturar turno individual
  const handleFacturarIndividual = async (turno) => {
    setFacturando(true)
    try {
      const resultado = await facturarTurno(turno)
      setModalResultado({
        tipo: 'individual',
        resultados: [{
          tipo: 'individual',
          cliente: turno.nombreCliente,
          turnos: 1,
          total: turno.totalPagos,
          factura: resultado.factura,
          servicio_nombre: turno.serviciosNombres // Incluir nombre del servicio
        }],
        errores: []
      })
    } catch (err) {
      setModalResultado({
        tipo: 'error',
        resultados: [],
        errores: [{ cliente: turno.nombreCliente, error: err.message }]
      })
    } finally {
      setFacturando(false)
    }
  }

  // Facturar seleccionados
  const handleFacturarSeleccionados = async () => {
    setFacturando(true)
    setModalLote(false)

    try {
      const resultado = await facturarLote(seleccionados)
      setModalResultado({
        tipo: 'lote',
        ...resultado
      })
    } catch (err) {
      setModalResultado({
        tipo: 'error',
        resultados: [],
        errores: [{ cliente: 'General', error: err.message }]
      })
    } finally {
      setFacturando(false)
    }
  }

  // Abrir modal para emitir Nota de Crédito
  const handleOpenNotaCredito = (turno) => {
    if (!turno.facturaInfo) return
    setModalNotaCredito(turno)
  }

  // Confirmar y emitir Nota de Crédito
  const handleEmitirNotaCredito = async (turno) => {
    setFacturando(true)
    try {
      const { userId } = await getEffectiveUserId()
      const factura = turno.facturaInfo

      const datosNotaCredito = {
        turnoId: turno.id,
        puntoVenta: config.puntoVenta,
        importeTotal: factura.importe_total || turno.totalPagos,
        descripcion: `Anulación de Factura C ${factura.punto_venta?.toString().padStart(4, '0')}-${factura.numero_comprobante?.toString().padStart(8, '0')}`,
        comprobanteAsociado: {
          tipo: TIPOS_COMPROBANTE.FACTURA_C,
          puntoVenta: factura.punto_venta,
          numero: factura.numero_comprobante
        }
      }

      // Emitir N/C espejo
      const resultado = await emitirNotaCreditoC(userId, datosNotaCredito)

      setModalNotaCredito(null)
      setModalResultado({
        tipo: 'nota_credito',
        resultados: [{
          tipo: 'nota_credito',
          tipoComprobante: TIPOS_COMPROBANTE.NOTA_CREDITO_C,
          cliente: turno.nombreCliente,
          total: factura.importe_total || turno.totalPagos,
          factura: resultado.factura,
          facturaAnulada: `${factura.punto_venta?.toString().padStart(4, '0')}-${factura.numero_comprobante?.toString().padStart(8, '0')}`,
          descripcion: `Anulación de Factura C ${factura.punto_venta?.toString().padStart(4, '0')}-${factura.numero_comprobante?.toString().padStart(8, '0')}`
        }],
        errores: []
      })
      recargar()
      recargarPendientes()
    } catch (err) {
      setModalNotaCredito(null)

      // Si es error de conexión, guardar en pendientes
      if (esErrorDeConexion(err)) {
        const { userId } = await getEffectiveUserId()
        await guardarFacturaPendiente({
          userId,
          turnoId: turno.id,
          tipoComprobante: TIPOS_PENDIENTE.NOTA_CREDITO_C,
          datosFactura: {
            puntoVenta: config.puntoVenta,
            importeTotal: turno.facturaInfo.importe_total || turno.totalPagos,
            descripcion: `Anulación de Factura C ${turno.facturaInfo.punto_venta?.toString().padStart(4, '0')}-${turno.facturaInfo.numero_comprobante?.toString().padStart(8, '0')}`,
            comprobanteAsociado: {
              tipo: TIPOS_COMPROBANTE.FACTURA_C,
              puntoVenta: turno.facturaInfo.punto_venta,
              numero: turno.facturaInfo.numero_comprobante
            }
          },
          error: err
        })

        setModalResultado({
          tipo: 'pendiente',
          resultados: [],
          errores: [{
            cliente: turno.nombreCliente,
            error: 'ARCA no disponible. La Nota de Crédito se guardó en pendientes.',
            guardadoEnPendientes: true
          }]
        })
        recargarPendientes()
      } else {
        setModalResultado({
          tipo: 'error',
          resultados: [],
          errores: [{ cliente: turno.nombreCliente, error: err.message }]
        })
      }
    } finally {
      setFacturando(false)
    }
  }

  // Generar reporte Excel
  const handleGenerarReporte = async (opciones) => {
    setGenerandoReporte(true)
    try {
      await generarReporteFacturacion(opciones)
      setModalReporte(false)
    } catch (err) {
      console.error('Error generando reporte:', err)
      alert('Error al generar el reporte: ' + err.message)
    } finally {
      setGenerandoReporte(false)
    }
  }

  // Si no tiene facturación configurada
  if (!facturacionHabilitada) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Facturación no configurada
        </h3>
        <p className="text-gray-500 mb-4 max-w-md mx-auto">
          Para facturar tus turnos, primero necesitás configurar tus datos de AFIP
          en la pestaña <strong>Facturación</strong> de <strong>Mi Cuenta</strong>.
        </p>
        <a
          href="/mi-cuenta"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Ir a Mi Cuenta
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ===================== MOBILE FILTERS ===================== */}
      <div className="sm:hidden space-y-3">
        {/* Barra compacta: Búsqueda + Filtros + Reporte */}
        <div className="flex items-center gap-2">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botón Filtros */}
          <button
            onClick={() => setModalFiltros(true)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border transition-colors ${
              filtroEstado !== 'todos' || filtroTipoPago !== 'todos' || filtroPeriodo !== 'mes'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            {(filtroEstado !== 'todos' || filtroTipoPago !== 'todos' || filtroPeriodo !== 'mes') && (
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>

          {/* Botón Reporte */}
          <button
            onClick={() => setModalReporte(true)}
            className="flex items-center justify-center w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>

        {/* Período actual (chip informativo) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>
              {filtroPeriodo === 'mes' && opcionesMeses.find(o => o.valor === mes)?.label}
              {filtroPeriodo === 'hoy' && 'Hoy'}
              {filtroPeriodo === 'ayer' && 'Ayer'}
              {filtroPeriodo === 'semana' && 'Esta semana'}
              {filtroPeriodo === 'personalizado' && `${fechaDesde} - ${fechaHasta}`}
            </span>
          </div>

          {/* Botón facturar seleccionados */}
          {seleccionados.length > 0 && (
            <button
              onClick={() => setModalLote(true)}
              disabled={facturando}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {facturando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
              Facturar ({seleccionados.length})
            </button>
          )}
        </div>
      </div>

      {/* ===================== DESKTOP FILTERS ===================== */}
      <div className="hidden sm:block space-y-3">
        {/* Fila 1: Filtros de período */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />

          {/* Botones de período rápido */}
          <div className="flex flex-wrap gap-1">
            {[
              { valor: 'mes', label: 'Mes' },
              { valor: 'hoy', label: 'Hoy' },
              { valor: 'ayer', label: 'Ayer' },
              { valor: 'semana', label: 'Esta semana' }
            ].map(periodo => (
              <button
                key={periodo.valor}
                onClick={() => setFiltroPeriodo(periodo.valor)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  filtroPeriodo === periodo.valor
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {periodo.label}
              </button>
            ))}
            <button
              onClick={() => setFiltroPeriodo('personalizado')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                filtroPeriodo === 'personalizado'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Selector de mes (solo si está en modo mes) */}
          {filtroPeriodo === 'mes' && (
            <div className="relative">
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer"
              >
                {opcionesMeses.map(op => (
                  <option key={op.valor} value={op.valor}>{op.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Fechas personalizadas */}
          {filtroPeriodo === 'personalizado' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
              />
              <span className="text-gray-400 text-sm">a</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
              />
            </div>
          )}
        </div>

        {/* Fila 2: Búsqueda + Filtros + Botón facturar */}
        <div className="flex gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtros de estado y tipo de pago */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />

            {/* Filtro por estado */}
            <div className="relative">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className={`pl-3 pr-8 py-2 text-sm border rounded-lg bg-white appearance-none cursor-pointer transition-colors ${
                  filtroEstado !== 'todos'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <option value="todos">Todos los estados</option>
                <option value="sin_facturar">Sin facturar</option>
                <option value="facturado">Facturado</option>
                <option value="anulado">N/C Anulado</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filtro por tipo de pago */}
            <div className="relative">
              <select
                value={filtroTipoPago}
                onChange={(e) => setFiltroTipoPago(e.target.value)}
                className={`pl-3 pr-8 py-2 text-sm border rounded-lg bg-white appearance-none cursor-pointer transition-colors ${
                  filtroTipoPago !== 'todos'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <option value="todos">Todos los pagos</option>
                <option value="electronicos">Electrónicos</option>
                <option value="efectivo">Efectivo</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Botón limpiar filtros */}
            {(filtroEstado !== 'todos' || filtroTipoPago !== 'todos') && (
              <button
                onClick={() => {
                  setFiltroEstado('todos')
                  setFiltroTipoPago('todos')
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Botón descargar reporte */}
          <button
            onClick={() => setModalReporte(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Reporte</span>
          </button>

          {/* Botón facturar seleccionados */}
          {seleccionados.length > 0 && (
            <button
              onClick={() => setModalLote(true)}
              disabled={facturando}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {facturando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
              Facturar ({seleccionados.length})
            </button>
          )}
        </div>
      </div>

      {/* Banner de facturas pendientes */}
      <BannerFacturasPendientes
        count={pendientesCount}
        onClick={() => setModalPendientes(true)}
      />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">Cargando turnos...</p>
        </div>
      ) : turnosConPagos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay turnos completados en este período</p>
        </div>
      ) : (
        <>
          {/* Sección: Pagos Electrónicos */}
          <SeccionPagos
            titulo="Pagos Electrónicos"
            subtitulo="Transferencia, MercadoPago, QR"
            icono={CreditCard}
            colorIcono="text-blue-600"
            bgIcono="bg-blue-100"
            turnos={getTurnosPorCategoria('electronicos')}
            seleccionados={seleccionados}
            onToggleSeleccion={toggleSeleccion}
            onSeleccionarTodos={() => seleccionarTodos('electronicos')}
            onDeseleccionarTodos={() => deseleccionarTodos('electronicos')}
            todosSeleccionados={todosSeleccionados('electronicos')}
            totales={totales.electronicos}
            onFacturar={handleFacturarIndividual}
            onVerFactura={handleVerFactura}
            onEmitirNotaCredito={handleOpenNotaCredito}
            facturando={facturando}
            puedeFacturar={true}
          />

          {/* Sección: Pagos en Efectivo */}
          <SeccionPagos
            titulo="Pagos en Efectivo"
            subtitulo="Efectivo"
            icono={Banknote}
            colorIcono="text-green-600"
            bgIcono="bg-green-100"
            turnos={getTurnosPorCategoria('efectivo')}
            seleccionados={seleccionados}
            onToggleSeleccion={toggleSeleccion}
            onSeleccionarTodos={() => seleccionarTodos('efectivo')}
            onDeseleccionarTodos={() => deseleccionarTodos('efectivo')}
            todosSeleccionados={todosSeleccionados('efectivo')}
            totales={totales.efectivo}
            onFacturar={handleFacturarIndividual}
            onVerFactura={handleVerFactura}
            onEmitirNotaCredito={handleOpenNotaCredito}
            facturando={facturando}
            puedeFacturar={true}
          />

          {/* Sección: Canje / Gratis / Otro (solo informativo) */}
          <SeccionPagos
            titulo="Canje / Gratis / Otro"
            subtitulo="Solo informativo - No se facturan"
            icono={Gift}
            colorIcono="text-purple-600"
            bgIcono="bg-purple-100"
            turnos={getTurnosPorCategoria('otros')}
            seleccionados={[]}
            onToggleSeleccion={() => {}}
            onSeleccionarTodos={() => {}}
            onDeseleccionarTodos={() => {}}
            todosSeleccionados={false}
            totales={totales.otros}
            onFacturar={() => {}}
            onVerFactura={handleVerFactura}
            onEmitirNotaCredito={() => {}}
            facturando={false}
            puedeFacturar={false}
          />
        </>
      )}

      {/* Modal Confirmar Lote */}
      <ModalFacturarLote
        isOpen={modalLote}
        onClose={() => setModalLote(false)}
        onConfirmar={handleFacturarSeleccionados}
        turnos={turnosConPagos.filter(t => seleccionados.includes(t.id))}
        facturando={facturando}
      />

      {/* Modal Resultado */}
      <ModalFacturaEmitida
        isOpen={!!modalResultado}
        onClose={() => setModalResultado(null)}
        resultado={modalResultado}
      />

      {/* Modal Previsualizar Factura */}
      <ModalPrevisualizarFactura
        isOpen={!!modalPreview}
        onClose={() => setModalPreview(null)}
        factura={modalPreview?.factura}
        cliente={modalPreview?.cliente}
        total={modalPreview?.total}
      />

      {/* Modal Nota de Crédito */}
      <ModalNotaCredito
        isOpen={!!modalNotaCredito}
        onClose={() => setModalNotaCredito(null)}
        onConfirmar={handleEmitirNotaCredito}
        turno={modalNotaCredito}
        procesando={facturando}
      />

      {/* Modal Historial de Facturación */}
      <ModalHistorialFacturacion
        isOpen={!!modalHistorial}
        onClose={() => setModalHistorial(null)}
        turno={modalHistorial}
      />

      {/* Modal Reporte de Facturación */}
      <ModalReporteFacturacion
        isOpen={modalReporte}
        onClose={() => setModalReporte(false)}
        onGenerar={handleGenerarReporte}
        generando={generandoReporte}
      />

      {/* Modal Filtros (Mobile) */}
      <ModalFiltrosFacturacion
        isOpen={modalFiltros}
        onClose={() => setModalFiltros(false)}
        filtroPeriodo={filtroPeriodo}
        setFiltroPeriodo={setFiltroPeriodo}
        mes={mes}
        setMes={setMes}
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
        opcionesMeses={opcionesMeses}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        filtroTipoPago={filtroTipoPago}
        setFiltroTipoPago={setFiltroTipoPago}
      />

      {/* Modal Facturas Pendientes */}
      <ModalFacturasPendientes
        isOpen={modalPendientes}
        onClose={() => {
          setModalPendientes(false)
          recargarPendientes()
          recargar() // Recargar lista de turnos por si alguna se emitió
        }}
      />
    </div>
  )
}
