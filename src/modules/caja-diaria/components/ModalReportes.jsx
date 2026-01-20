/**
 * Modal principal de Reportes - Contenedor para diferentes tipos de reportes
 */

import { useState } from 'react'
import { X, FileText, Calendar, ChevronRight } from 'lucide-react'
import ModalReportePeriodo from './ModalReportePeriodo'

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
    }
    // Aquí se agregarán más reportes en el futuro
    // {
    //   id: 'categorias',
    //   nombre: 'Reporte por Categorías',
    //   descripcion: 'Análisis de gastos e ingresos por categoría',
    //   icono: PieChart,
    //   color: 'violet'
    // },
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
                      '--hover-border': reporte.color === 'indigo' ? '#a5b4fc' : '#c4b5fd',
                      '--hover-bg': reporte.color === 'indigo' ? '#eef2ff' : '#f5f3ff'
                    }}
                  >
                    {/* Icono */}
                    <div className={`w-12 h-12 rounded-xl bg-${reporte.color}-100 flex items-center justify-center flex-shrink-0`}
                         style={{ backgroundColor: reporte.color === 'indigo' ? '#e0e7ff' : '#ede9fe' }}>
                      <Icon className={`w-6 h-6 text-${reporte.color}-600`}
                            style={{ color: reporte.color === 'indigo' ? '#4f46e5' : '#7c3aed' }} />
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

              {/* Placeholder para próximos reportes */}
              <div className="text-center py-4 text-sm text-gray-400">
                Próximamente más reportes disponibles
              </div>
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
    </>
  )
}
