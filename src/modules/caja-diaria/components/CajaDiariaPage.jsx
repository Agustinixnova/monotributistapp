/**
 * Página principal de Caja Diaria
 */

import { useState } from 'react'
import { Wallet, Calendar, Lock, RefreshCw, AlertCircle, Settings, Edit2, LockOpen, FileDown } from 'lucide-react'
import { Layout } from '../../../components/layout'
import { useCajaDiaria } from '../hooks/useCajaDiaria'
import { formatearFechaLarga, getFechaHoy } from '../utils/formatters'
import { descargarPDFCierreCaja } from '../utils/pdfCierreCaja'
import ResumenEfectivo from './ResumenEfectivo'
import ResumenDia from './ResumenDia'
import BotonesAccion from './BotonesAccion'
import ListaMovimientos from './ListaMovimientos'
import ModalMovimiento from './ModalMovimiento'
import ModalCierreCaja from './ModalCierreCaja'
import ModalConfiguracion from './ModalConfiguracion'

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
    loading,
    error,
    refreshAll
  } = useCajaDiaria()

  const [modalMovimiento, setModalMovimiento] = useState({ isOpen: false, tipo: null })
  const [modalCierre, setModalCierre] = useState(false)
  const [modalConfiguracion, setModalConfiguracion] = useState(false)

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

  const handleAnularMovimiento = async (id) => {
    if (!confirm('¿Estás seguro que querés anular este movimiento?')) return

    const result = await movimientos.anular(id, 'Anulado por el usuario')
    if (result.success) {
      await refreshAll()
    }
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

  const handleReabrirDia = async () => {
    if (!confirm('¿Estás seguro que querés reabrir este día? Podrás volver a agregar movimientos.')) return

    const result = await cierre.reabrirDia()
    if (result.success) {
      await refreshAll()
    }
  }

  const handleDescargarPDF = () => {
    descargarPDFCierreCaja({
      fecha,
      saldoInicial: cierre.saldoInicial,
      resumen: resumen.resumen,
      cierre: cierre.cierre,
      totalesPorMetodo: resumen.totalesPorMetodo
    })
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
          onEditarSaldoInicial={handleEditarSaldoInicial}
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

      {/* Lista de movimientos */}
      <div className="mb-6">
        <ListaMovimientos
          movimientos={movimientos.movimientos}
          loading={movimientos.loading}
          onAnular={estaCerrado ? null : handleAnularMovimiento}
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
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleEditarCierre}
                className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5" />
                Editar Cierre
              </button>
              <button
                onClick={handleReabrirDia}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                <LockOpen className="w-5 h-5" />
                Reabrir Día
              </button>
            </div>
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
      />

      {/* Modal Configuración */}
      <ModalConfiguracion
        isOpen={modalConfiguracion}
        onClose={() => setModalConfiguracion(false)}
      />
      </div>
    </Layout>
  )
}
