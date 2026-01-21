/**
 * Página principal de Caja Diaria
 */

import { useState } from 'react'
import { Wallet, Calendar, Lock, RefreshCw, AlertCircle, Settings, Edit2, LockOpen, FileDown, Calculator, QrCode, FileText, Banknote, BarChart3 } from 'lucide-react'
import { Layout } from '../../../components/layout'
import { useCajaDiaria } from '../hooks/useCajaDiaria'
import { usePermisosCaja } from '../hooks/usePermisosCaja'
import { useDiasSinCerrar } from '../hooks/useDiasSinCerrar'
import { formatearFechaLarga, getFechaHoy } from '../utils/formatters'
import { descargarPDFCierreCaja } from '../utils/pdfCierreCaja'
import ResumenEfectivo from './ResumenEfectivo'
import ResumenDia from './ResumenDia'
import BotonesAccion from './BotonesAccion'
import ListaMovimientos from './ListaMovimientos'
import ListaArqueos from './ListaArqueos'
import ModalMovimiento from './ModalMovimiento'
import ModalCierreCaja from './ModalCierreCaja'
import ModalArqueo from './ModalArqueo'
import ModalConfiguracion from './ModalConfiguracion'
import ModalConfirmacion from './ModalConfirmacion'
import ModalVisualizadorQR from './ModalVisualizadorQR'
import ModalComentario from './ModalComentario'
import ModalCalculadora from './ModalCalculadora'
import ModalDetalleResumen from './ModalDetalleResumen'
import ModalReportes from './ModalReportes'
import ModalEstadisticas from './ModalEstadisticas'
import ModalRegistrarFiado from './ModalRegistrarFiado'
import ModalCobranzas from './ModalCobranzas'
import AlertaDiasSinCerrar from './AlertaDiasSinCerrar'
import { useAliasPago } from '../hooks/useAliasPago'
import { useClientesConDeuda } from '../hooks/useClientesFiado'
import { actualizarComentario } from '../services/movimientosService'

export default function CajaDiariaPage() {
  const {
    fecha,
    cambiarFecha,
    irAHoy,
    movimientos,
    resumen,
    cierre,
    metodosPago,
    categorias,
    arqueos,
    configuracion,
    loading,
    error,
    refreshAll
  } = useCajaDiaria()

  // Permisos del usuario (empleado o dueño)
  const { puede, esDuenio } = usePermisosCaja()

  // Alias de pago para el visualizador QR
  const { alias: aliasPago } = useAliasPago()

  // Clientes con deuda (para mostrar botón de cobranzas)
  const { clientes: clientesConDeuda, refresh: refreshClientesConDeuda } = useClientesConDeuda()

  // Días anteriores sin cerrar
  const { diasSinCerrar, refresh: refreshDiasSinCerrar } = useDiasSinCerrar()

  const [modalMovimiento, setModalMovimiento] = useState({ isOpen: false, tipo: null, montoInicial: 0 })
  const [modalCierre, setModalCierre] = useState(false)
  const [modalArqueo, setModalArqueo] = useState(false)
  const [modalConfiguracion, setModalConfiguracion] = useState(false)
  const [modalQR, setModalQR] = useState(false)
  const [modalCalculadora, setModalCalculadora] = useState(false)
  const [modalDetalleResumen, setModalDetalleResumen] = useState(false)
  const [modalReportes, setModalReportes] = useState(false)
  const [modalEstadisticas, setModalEstadisticas] = useState(false)
  const [modalFiado, setModalFiado] = useState({ isOpen: false, montoInicial: 0 })
  const [modalCobranzas, setModalCobranzas] = useState(false)

  // Estados para modales de confirmación
  const [confirmAnular, setConfirmAnular] = useState({ isOpen: false, id: null })
  const [confirmEliminarArqueo, setConfirmEliminarArqueo] = useState({ isOpen: false, id: null })
  const [confirmReabrir, setConfirmReabrir] = useState(false)
  const [procesando, setProcesando] = useState(false)

  // Estado para modal de comentario
  const [modalComentario, setModalComentario] = useState({ isOpen: false, movimiento: null })

  // Verificar si es el día actual
  const esHoy = fecha === getFechaHoy()

  // Verificar si está cerrado
  const estaCerrado = cierre.estaCerrado()

  // Handlers
  const handleNuevaEntrada = () => {
    if (estaCerrado) return
    setModalMovimiento({ isOpen: true, tipo: 'entrada', montoInicial: 0 })
  }

  const handleNuevaSalida = () => {
    if (estaCerrado) return
    setModalMovimiento({ isOpen: true, tipo: 'salida', montoInicial: 0 })
  }

  // Handler para cobrar desde calculadora
  const handleCobrar = (total) => {
    setModalMovimiento({ isOpen: true, tipo: 'entrada', montoInicial: total })
  }

  // Handler cuando se selecciona categoría "Cuenta Corriente" en ModalMovimiento
  const handleFiado = (monto) => {
    setModalFiado({ isOpen: true, montoInicial: monto })
  }

  // Refresh rápido después de crear/anular movimiento (solo lo necesario)
  const refreshAfterMovimiento = async () => {
    await Promise.all([
      resumen.refresh(),
      cierre.refresh()
    ])
  }

  // Handler cuando se registra una cuenta corriente o pago (incluye refresh de movimientos)
  const handleFiadoGuardado = async () => {
    await movimientos.refresh() // Refrescar tabla de movimientos del día
    await refreshAfterMovimiento()
    await refreshClientesConDeuda()
  }

  const handleGuardarMovimiento = async (movimientoData) => {
    const result = await movimientos.crear(movimientoData)
    if (result.success) {
      // Solo refrescamos resumen y cierre
      // Los movimientos ya se refrescaron en movimientos.crear()
      await refreshAfterMovimiento()
    }
    return result
  }

  const handleAnularMovimiento = (id) => {
    setConfirmAnular({ isOpen: true, id })
  }

  const confirmarAnularMovimiento = async () => {
    if (!confirmAnular.id) return
    setProcesando(true)
    const result = await movimientos.anular(confirmAnular.id, 'Anulado por el usuario')
    if (result.success) {
      // Solo refrescamos resumen y cierre
      // Los movimientos ya se refrescaron en movimientos.anular()
      await refreshAfterMovimiento()
    }
    setProcesando(false)
    setConfirmAnular({ isOpen: false, id: null })
  }

  const handleCerrarCaja = async (cierreData) => {
    const metodoEfectivo = metodosPago.metodos?.find(m => m.es_efectivo)

    // 1. Si hay diferencia de arqueo, crear movimiento de ajuste
    if (cierreData.diferencia && cierreData.diferencia !== 0) {
      const esFaltante = cierreData.diferencia < 0
      const montoAjuste = Math.abs(cierreData.diferencia)

      // Buscar categoría correspondiente
      const nombreCategoria = esFaltante ? 'faltante de caja' : 'sobrante de caja'
      const tipoCategoria = esFaltante ? 'salida' : 'entrada'
      const categoriaAjuste = categorias.categorias?.find(c =>
        c.nombre?.toLowerCase() === nombreCategoria && c.tipo === tipoCategoria
      )

      if (!categoriaAjuste || !metodoEfectivo) {
        return {
          success: false,
          error: { message: `No se encontró la categoría "${esFaltante ? 'Faltante de caja' : 'Sobrante de caja'}" o el método "Efectivo"` }
        }
      }

      // Crear movimiento de ajuste
      const resultAjuste = await movimientos.crear({
        tipo: tipoCategoria,
        categoria_id: categoriaAjuste.id,
        descripcion: `Ajuste por diferencia de arqueo (${esFaltante ? 'faltante' : 'sobrante'})`,
        pagos: [{
          metodo_pago_id: metodoEfectivo.id,
          monto: montoAjuste
        }]
      })

      if (!resultAjuste.success) {
        return resultAjuste
      }

      // Después del ajuste, el efectivo esperado coincide con el real
      cierreData.efectivo_esperado = cierreData.efectivo_real
      cierreData.diferencia = 0
    }

    // 2. Si hay retiro automático, crear el movimiento
    if (cierreData.retiro_automatico) {
      const { monto, saldo_para_maniana } = cierreData.retiro_automatico

      // Buscar categoría "Retiro de caja"
      const categoriaRetiro = categorias.categorias?.find(c =>
        c.nombre?.toLowerCase() === 'retiro de caja' && c.tipo === 'salida'
      )

      if (!categoriaRetiro || !metodoEfectivo) {
        return {
          success: false,
          error: { message: 'No se encontró la categoría "Retiro de caja" o el método "Efectivo"' }
        }
      }

      // Crear movimiento de retiro
      const resultRetiro = await movimientos.crear({
        tipo: 'salida',
        categoria_id: categoriaRetiro.id,
        descripcion: 'Retiro automático al cerrar caja',
        pagos: [{
          metodo_pago_id: metodoEfectivo.id,
          monto: monto
        }]
      })

      if (!resultRetiro.success) {
        return resultRetiro
      }

      // Ajustar valores del cierre después del retiro
      cierreData.efectivo_esperado = cierreData.efectivo_esperado - monto
      cierreData.efectivo_real = saldo_para_maniana
    }

    // 3. Guardar el cierre
    const result = await cierre.guardarCierre(cierreData)
    if (result.success) {
      await refreshAll()
      // Actualizar lista de días sin cerrar
      await refreshDiasSinCerrar()
    }
    return result
  }

  const handleEditarSaldoInicial = async (nuevoSaldo) => {
    const result = await cierre.actualizarSaldoInicial(nuevoSaldo)
    if (result.success) {
      await refreshAll()
    }
    return result
  }

  const handleEditarCierre = () => {
    setModalCierre(true)
  }

  const handleReabrirDia = () => {
    setConfirmReabrir(true)
  }

  const confirmarReabrirDia = async () => {
    setProcesando(true)
    const result = await cierre.reabrirDia()
    if (result.success) {
      await refreshAll()
    }
    setProcesando(false)
    setConfirmReabrir(false)
  }

  const handleDescargarPDF = () => {
    descargarPDFCierreCaja({
      fecha,
      saldoInicial: cierre.saldoInicial,
      resumen: resumen.resumen,
      cierre: cierre.cierre,
      totalesPorMetodo: resumen.totalesPorMetodo,
      movimientos: movimientos.movimientos,
      nombreNegocio: configuracion.nombreNegocio
    })
  }

  const handleGuardarArqueo = async (arqueoData) => {
    const result = await arqueos.crear(arqueoData)
    if (result.success) {
      await refreshAll()
    }
    return result
  }

  const handleEliminarArqueo = (id) => {
    setConfirmEliminarArqueo({ isOpen: true, id })
  }

  const handleEditarComentario = (movimiento) => {
    setModalComentario({ isOpen: true, movimiento })
  }

  const handleGuardarComentario = async (comentario) => {
    if (!modalComentario.movimiento) return
    const { error } = await actualizarComentario(modalComentario.movimiento.id, comentario)
    if (!error) {
      await refreshAll()
    }
  }

  const confirmarEliminarArqueo = async () => {
    if (!confirmEliminarArqueo.id) return
    setProcesando(true)
    const result = await arqueos.eliminar(confirmEliminarArqueo.id)
    if (result.success) {
      await refreshAll()
    }
    setProcesando(false)
    setConfirmEliminarArqueo({ isOpen: false, id: null })
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Título y acciones principales */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-violet-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Caja Diaria</h1>
          </div>

          {/* Botones de acción superiores */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setModalEstadisticas(true)}
              className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
              title="Estadísticas"
            >
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </button>

            <button
              onClick={() => setModalReportes(true)}
              className="p-2 bg-violet-100 hover:bg-violet-200 rounded-lg transition-colors"
              title="Reportes"
            >
              <FileText className="w-5 h-5 text-violet-600" />
            </button>

            <button
              onClick={() => setModalConfiguracion(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Configuración"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Selector de fecha con calculadora y cobranzas */}
        <div className="flex items-center gap-2 justify-between">
          {/* Calculadora y Cobranzas a la izquierda */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalCalculadora(true)}
              className="p-2 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
              title="Calculadora"
            >
              <Calculator className="w-5 h-5 text-amber-600" />
            </button>

            <button
              onClick={() => setModalCobranzas(true)}
              className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors relative"
              title="Cobranzas"
            >
              <Banknote className="w-5 h-5 text-emerald-600" />
              {clientesConDeuda.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {clientesConDeuda.length > 9 ? '9+' : clientesConDeuda.length}
                </span>
              )}
            </button>
          </div>

          {/* Selector de fecha y controles a la derecha */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fecha}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />

            {!esHoy && (
              <button
                onClick={irAHoy}
                className="px-3 py-2 bg-violet-50 text-violet-600 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors"
              >
                Hoy
              </button>
            )}

            <button
              onClick={refreshAll}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Badge día cerrado */}
        {estaCerrado && (
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-medium">
            <Lock className="w-4 h-4" />
            <span>Día cerrado</span>
          </div>
        )}
      </div>

      {/* Error general */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Hubo un error cargando los datos</span>
          </div>
        </div>
      )}

      {/* Alerta de días sin cerrar */}
      <AlertaDiasSinCerrar
        diasSinCerrar={diasSinCerrar}
        onIrAFecha={cambiarFecha}
      />

      {/* Resúmenes */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <ResumenEfectivo
          resumen={resumen.resumen}
          saldoInicial={cierre.saldoInicial}
          onEditarSaldoInicial={puede.editarSaldoInicial ? handleEditarSaldoInicial : null}
          estaCerrado={estaCerrado}
        />
        <ResumenDia
          resumen={resumen.resumen}
          onClick={() => setModalDetalleResumen(true)}
        />
      </div>

      {/* Botones de acción */}
      <div className="mb-6">
        <BotonesAccion
          onEntrada={handleNuevaEntrada}
          onSalida={handleNuevaSalida}
          disabled={estaCerrado}
        />
      </div>

      {/* Botón QR/Alias - Acceso rápido para clientes */}
      {(configuracion.qrUrl || aliasPago.length > 0) && (
        <div className="mb-6">
          <button
            onClick={() => setModalQR(true)}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-all hover:shadow-xl"
          >
            <QrCode className="w-6 h-6" />
            <span className="text-lg">Mostrar QR/Alias al Cliente</span>
          </button>
        </div>
      )}

      {/* Botón de arqueo rápido */}
      {!estaCerrado && (
        <div className="mb-6">
          <button
            onClick={() => setModalArqueo(true)}
            className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium py-3 rounded-lg border border-amber-200 transition-colors"
          >
            <Calculator className="w-5 h-5" />
            Arqueo Rápido
          </button>
        </div>
      )}

      {/* Lista de arqueos del día */}
      {arqueos.arqueos.length > 0 && (
        <div className="mb-6">
          <ListaArqueos
            arqueos={arqueos.arqueos}
            loading={arqueos.loading}
            onEliminar={estaCerrado || !puede.eliminarArqueos ? null : handleEliminarArqueo}
          />
        </div>
      )}

      {/* Lista de movimientos */}
      <div className="mb-6">
        <ListaMovimientos
          movimientos={movimientos.movimientos}
          loading={movimientos.loading}
          onAnular={estaCerrado || !puede.anularMovimientos ? null : handleAnularMovimiento}
          onEditarComentario={handleEditarComentario}
          fecha={fecha}
        />
      </div>

      {/* Botones de cierre/edición */}
      <div className="mb-6">
        {!estaCerrado && (
          <button
            onClick={() => setModalCierre(true)}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            <Lock className="w-5 h-5" />
            Cerrar Caja
          </button>
        )}

        {estaCerrado && (
          <div className="space-y-3">
            {/* Botón de PDF */}
            <button
              onClick={handleDescargarPDF}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
            >
              <FileDown className="w-5 h-5" />
              Descargar PDF del Cierre
            </button>

            {/* Botones de edición */}
            {(puede.editarCierre || puede.reabrirDia) && (
              <div className={`grid gap-3 ${puede.editarCierre && puede.reabrirDia ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {puede.editarCierre && (
                  <button
                    onClick={handleEditarCierre}
                    className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                    Editar Cierre
                  </button>
                )}
                {puede.reabrirDia && (
                  <button
                    onClick={handleReabrirDia}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    <LockOpen className="w-5 h-5" />
                    Reabrir Día
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nuevo Movimiento */}
      <ModalMovimiento
        isOpen={modalMovimiento.isOpen}
        onClose={() => setModalMovimiento({ isOpen: false, tipo: null, montoInicial: 0 })}
        tipo={modalMovimiento.tipo}
        categorias={categorias.categorias}
        metodosPago={metodosPago.metodos}
        onGuardar={handleGuardarMovimiento}
        montoInicial={modalMovimiento.montoInicial}
        onFiado={handleFiado}
      />

      {/* Modal Cierre de Caja */}
      <ModalCierreCaja
        isOpen={modalCierre}
        onClose={() => setModalCierre(false)}
        saldoInicial={cierre.saldoInicial}
        resumen={resumen.resumen}
        totalesPorMetodo={resumen.totalesPorMetodo}
        movimientos={movimientos.movimientos}
        onGuardar={handleCerrarCaja}
        cierreExistente={estaCerrado ? cierre.cierre : null}
        fecha={fecha}
        nombreNegocio={configuracion.nombreNegocio}
      />

      {/* Modal Arqueo */}
      <ModalArqueo
        isOpen={modalArqueo}
        onClose={() => setModalArqueo(false)}
        efectivoEsperado={arqueos.efectivoEsperado}
        onGuardar={handleGuardarArqueo}
      />

      {/* Modal Configuración */}
      <ModalConfiguracion
        isOpen={modalConfiguracion}
        onClose={() => {
          setModalConfiguracion(false)
          // Refrescar configuración para ver cambios de QR/Alias
          refreshAll()
        }}
      />

      {/* Modal Confirmación - Anular Movimiento */}
      <ModalConfirmacion
        isOpen={confirmAnular.isOpen}
        onClose={() => setConfirmAnular({ isOpen: false, id: null })}
        onConfirm={confirmarAnularMovimiento}
        titulo="¿Anular movimiento?"
        mensaje="El movimiento quedará marcado como anulado y no afectará los totales del día."
        textoConfirmar="Anular"
        variante="danger"
        loading={procesando}
      />

      {/* Modal Confirmación - Eliminar Arqueo */}
      <ModalConfirmacion
        isOpen={confirmEliminarArqueo.isOpen}
        onClose={() => setConfirmEliminarArqueo({ isOpen: false, id: null })}
        onConfirm={confirmarEliminarArqueo}
        titulo="¿Eliminar arqueo?"
        mensaje="Este arqueo será eliminado permanentemente."
        textoConfirmar="Eliminar"
        variante="danger"
        loading={procesando}
      />

      {/* Modal Confirmación - Reabrir Día */}
      <ModalConfirmacion
        isOpen={confirmReabrir}
        onClose={() => setConfirmReabrir(false)}
        onConfirm={confirmarReabrirDia}
        titulo="¿Reabrir día?"
        mensaje="Podrás volver a agregar movimientos y modificar el cierre."
        textoConfirmar="Reabrir"
        variante="warning"
        loading={procesando}
      />

      {/* Modal Visualizador QR para clientes */}
      <ModalVisualizadorQR
        isOpen={modalQR}
        onClose={() => setModalQR(false)}
        qrUrl={configuracion.qrUrl}
        alias={aliasPago}
        nombreNegocio={configuracion.nombreNegocio}
      />

      {/* Modal Comentario */}
      <ModalComentario
        isOpen={modalComentario.isOpen}
        onClose={() => setModalComentario({ isOpen: false, movimiento: null })}
        comentarioActual={modalComentario.movimiento?.descripcion || ''}
        onGuardar={handleGuardarComentario}
      />

      {/* Modal Calculadora */}
      <ModalCalculadora
        isOpen={modalCalculadora}
        onClose={() => setModalCalculadora(false)}
        onCobrar={handleCobrar}
      />

      {/* Modal Detalle Resumen */}
      <ModalDetalleResumen
        isOpen={modalDetalleResumen}
        onClose={() => setModalDetalleResumen(false)}
        totalesPorMetodo={resumen.totalesPorMetodo}
        fecha={fecha}
      />

      {/* Modal Reportes */}
      <ModalReportes
        isOpen={modalReportes}
        onClose={() => setModalReportes(false)}
        nombreNegocio={configuracion.nombreNegocio}
      />

      {/* Modal Estadísticas */}
      <ModalEstadisticas
        isOpen={modalEstadisticas}
        onClose={() => setModalEstadisticas(false)}
        nombreNegocio={configuracion.nombreNegocio}
      />

      {/* Modal Cuenta Corriente */}
      <ModalRegistrarFiado
        isOpen={modalFiado.isOpen}
        onClose={() => setModalFiado({ isOpen: false, montoInicial: 0 })}
        onGuardado={handleFiadoGuardado}
        montoInicial={modalFiado.montoInicial}
      />

      {/* Modal Cobranzas */}
      <ModalCobranzas
        isOpen={modalCobranzas}
        onClose={() => setModalCobranzas(false)}
        metodosPago={metodosPago.metodos}
        onPagoRegistrado={handleFiadoGuardado}
      />
      </div>
    </Layout>
  )
}
