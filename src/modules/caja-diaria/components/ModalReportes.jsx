/**
 * Modal principal de Reportes - Contenedor para diferentes tipos de reportes
 */

import { useState } from 'react'
import { X, FileText, Calendar, ChevronRight, Users, Receipt, TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react'
import ModalReportePeriodo from './ModalReportePeriodo'
import ModalReporteDeudores from './ModalReporteDeudores'
import ModalReporteMovimientosCuenta from './ModalReporteMovimientosCuenta'
import ModalReporteIngresosCategorias from './ModalReporteIngresosCategorias'
import ModalReporteEgresosCategorias from './ModalReporteEgresosCategorias'
import ModalReporteCompras from './ModalReporteCompras'

export default function ModalReportes({ isOpen, onClose, nombreNegocio }) {
  const [reporteActivo, setReporteActivo] = useState(null)

  if (!isOpen) return null

  // Lista de reportes disponibles
  const reportes = [
    {
      id: 'periodo',
      nombre: 'Reporte por Período',
      descripcion: 'Resumen de movimientos por método de pago en un rango de fechas',
      icono: Calendar,
      color: 'indigo'
    },
    {
      id: 'ingresos-categorias',
      nombre: 'Ingresos por Categoría',
      descripcion: 'Estadísticas de ventas e ingresos agrupados por categoría',
      icono: TrendingUp,
      color: 'emerald'
    },
    {
      id: 'egresos-categorias',
      nombre: 'Egresos por Categoría',
      descripcion: 'Estadísticas de gastos y salidas agrupados por categoría',
      icono: TrendingDown,
      color: 'red'
    },
    {
      id: 'deudores',
      nombre: 'Reporte de Deudores',
      descripcion: 'Estado actual de cuentas corrientes - quién debe y quién tiene saldo a favor',
      icono: Users,
      color: 'orange'
    },
    {
      id: 'movimientos-cuenta',
      nombre: 'Movimientos de Cuenta',
      descripcion: 'Historial de cuenta corriente con filtros opcionales',
      icono: Receipt,
      color: 'amber'
    },
    {
      id: 'compras-proveedor',
      nombre: 'Compras por Proveedor',
      descripcion: 'Detalle de compras y facturas agrupado por proveedor',
      icono: ShoppingBag,
      color: 'sky'
    }
  ]

  const handleSelectReporte = (reporteId) => {
    setReporteActivo(reporteId)
  }

  const handleCloseReporte = () => {
    setReporteActivo(null)
  }

  const handleClose = () => {
    setReporteActivo(null)
    onClose()
  }

  // Helper para obtener estilos de color
  const getColorStyle = (color, type) => {
    const colors = {
      indigo: { border: '#a5b4fc', bg: '#eef2ff', iconBg: '#e0e7ff', icon: '#4f46e5' },
      violet: { border: '#c4b5fd', bg: '#f5f3ff', iconBg: '#ede9fe', icon: '#7c3aed' },
      red: { border: '#fca5a5', bg: '#fef2f2', iconBg: '#fee2e2', icon: '#dc2626' },
      amber: { border: '#fcd34d', bg: '#fffbeb', iconBg: '#fef3c7', icon: '#d97706' },
      emerald: { border: '#6ee7b7', bg: '#ecfdf5', iconBg: '#d1fae5', icon: '#059669' },
      orange: { border: '#fdba74', bg: '#fff7ed', iconBg: '#ffedd5', icon: '#ea580c' },
      sky: { border: '#7dd3fc', bg: '#f0f9ff', iconBg: '#e0f2fe', icon: '#0284c7' }
    }
    return colors[color]?.[type] || colors.indigo[type]
  }

  return (
    <>
      {/* Modal principal de reportes */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-heading font-semibold text-lg">Reportes</h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de reportes */}
            <div className="p-4 space-y-3">
              {reportes.map((reporte) => {
                const Icon = reporte.icono
                return (
                  <button
                    key={reporte.id}
                    onClick={() => handleSelectReporte(reporte.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-${reporte.color}-300 hover:bg-${reporte.color}-50 transition-all text-left group`}
                    style={{
                      '--hover-border': getColorStyle(reporte.color, 'border'),
                      '--hover-bg': getColorStyle(reporte.color, 'bg')
                    }}
                  >
                    {/* Icono */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}
                         style={{ backgroundColor: getColorStyle(reporte.color, 'iconBg') }}>
                      <Icon className="w-6 h-6"
                            style={{ color: getColorStyle(reporte.color, 'icon') }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{reporte.nombre}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{reporte.descripcion}</p>
                    </div>

                    {/* Flecha */}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  </button>
                )
              })}

            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-4">
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Reporte por Período */}
      <ModalReportePeriodo
        isOpen={reporteActivo === 'periodo'}
        onClose={handleCloseReporte}
        nombreNegocio={nombreNegocio}
      />

      {/* Modal de Reporte de Deudores */}
      <ModalReporteDeudores
        isOpen={reporteActivo === 'deudores'}
        onClose={handleCloseReporte}
        nombreNegocio={nombreNegocio}
      />

      {/* Modal de Movimientos de Cuenta */}
      <ModalReporteMovimientosCuenta
        isOpen={reporteActivo === 'movimientos-cuenta'}
        onClose={handleCloseReporte}
        nombreNegocio={nombreNegocio}
      />

      {/* Modal de Ingresos por Categoría */}
      <ModalReporteIngresosCategorias
        isOpen={reporteActivo === 'ingresos-categorias'}
        onClose={handleCloseReporte}
        nombreNegocio={nombreNegocio}
      />

      {/* Modal de Egresos por Categoría */}
      <ModalReporteEgresosCategorias
        isOpen={reporteActivo === 'egresos-categorias'}
        onClose={handleCloseReporte}
        nombreNegocio={nombreNegocio}
      />

      {/* Modal de Compras por Proveedor */}
      <ModalReporteCompras
        isOpen={reporteActivo === 'compras-proveedor'}
        onClose={handleCloseReporte}
        nombreNegocio={nombreNegocio}
      />
    </>
  )
}
