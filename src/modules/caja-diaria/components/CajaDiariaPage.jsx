/**
 * Página principal de Caja Diaria
 */

import { useState } from 'react'
import { Wallet, Calendar, Lock, RefreshCw, AlertCircle, Settings, Edit2, LockOpen, FileDown, Calculator } from 'lucide-react'
import { Layout } from '../../../components/layout'
import { useCajaDiaria } from '../hooks/useCajaDiaria'
import { usePermisosCaja } from '../hooks/usePermisosCaja'
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

  const [modalMovimiento, setModalMovimiento] = useState({ isOpen: false, tipo: null })
  const [modalCierre, setModalCierre] = useState(false)
  const [modalArqueo, setModalArqueo] = useState(false)
  const [modalConfiguracion, setModalConfiguracion] = useState(false)

  // Estados para modales de confirmación
  const [confirmAnular, setConfirmAnular] = useState({ isOpen: false, id: null })
  const [confirmEliminarArqueo, setConfirmEliminarArqueo] = useState({ isOpen: false, id: null })
  const [confirmReabrir, setConfirmReabrir] = useState(false)
  const [procesando, setProcesando] = useState(false)

  // Verificar si es el día actual
  const esHoy = fecha === getFechaHoy()

  // Verificar si está cerrado
  const estaCerrado = cierre.estaCerrado()

  // Handlers
  const handleNuevaEntrada = () => {
    if (estaCerrado) return
    setModalMovimiento({ isOpen: true, tipo: 'entrada' })
  }

  const handleNuevaSalida = () => {
    if (estaCerrado) return
    setModalMovimiento({ isOpen: true, tipo: 'salida' })
  }

  const handleGuardarMovimiento = async (movimientoData) => {
    const result = await movimientos.crear(movimientoData)
    if (result.success) {
      await refreshAll()
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
      await refreshAll()
    }
    setProcesando(false)
    setConfirmAnular({ isOpen: false, id: null })
  }

  const handleCerrarCaja = async (cierreData) => {
    const result = await cierre.guardarCierre(cierreData)
    if (result.success) {
      await refreshAll()
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
        <div className="flex items-start sm:items-center justify-between gap-4 mb-2 flex-col sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Caja Diaria</h1>
              <p className="text-sm text-gray-600">
                {formatearFechaLarga(fecha)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Configuración */}
            <button
              onClick={() => setModalConfiguracion(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Configuración"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            {/* Selector de fecha */}
            <input
              type="date"
              value={fecha}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />

            {/* Botón Hoy */}
            {!esHoy && (
              <button
                onClick={irAHoy}
                className="px-3 py-2 bg-violet-50 text-violet-600 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors"
              >
                Hoy
              </button>
            )}

            {/* Botón Refresh */}
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

      {/* Resúmenes */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <ResumenEfectivo
          resumen={resumen.resumen}
          saldoInicial={cierre.saldoInicial}
          onEditarSaldoInicial={puede.editarSaldoInicial ? handleEditarSaldoInicial : null}
          estaCerrado={estaCerrado}
        />
        <ResumenDia resumen={resumen.resumen} />
      </div>

      {/* Botones de acción */}
      <div className="mb-6">
        <BotonesAccion
          onEntrada={handleNuevaEntrada}
          onSalida={handleNuevaSalida}
          disabled={estaCerrado}
        />
      </div>

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
        />
      </div>

      {/* Botones de cierre/edición */}
      <div className="mb-6">
        {esHoy && !estaCerrado && (
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
        onClose={() => setModalMovimiento({ isOpen: false, tipo: null })}
        tipo={modalMovimiento.tipo}
        categorias={categorias.categorias}
        metodosPago={metodosPago.metodos}
        onGuardar={handleGuardarMovimiento}
      />

      {/* Modal Cierre de Caja */}
      <ModalCierreCaja
        isOpen={modalCierre}
        onClose={() => setModalCierre(false)}
        saldoInicial={cierre.saldoInicial}
        resumen={resumen.resumen}
        totalesPorMetodo={resumen.totalesPorMetodo}
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
        onClose={() => setModalConfiguracion(false)}
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
      </div>
    </Layout>
  )
}
