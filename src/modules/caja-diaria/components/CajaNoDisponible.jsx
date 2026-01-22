/**
 * Componente que se muestra cuando el empleado está fuera del horario de acceso
 */

import { Clock, Calendar } from 'lucide-react'
import { Layout } from '../../../components/layout'

export default function CajaNoDisponible({ proximoHorario }) {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {/* Ícono */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>

          {/* Título */}
          <h1 className="font-heading text-2xl font-bold text-gray-900 mb-3">
            Caja no disponible
          </h1>

          {/* Mensaje */}
          <p className="text-gray-600 mb-6">
            No tenés acceso a la caja en este momento.
          </p>

          {/* Próximo horario */}
          {proximoHorario && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Próximo acceso</span>
              </div>
              <p className="text-lg font-semibold text-amber-800">
                {proximoHorario}
              </p>
            </div>
          )}

          {/* Info adicional */}
          <p className="text-sm text-gray-500">
            Si creés que esto es un error, contactá al dueño de la caja para verificar tus horarios de acceso.
          </p>
        </div>
      </div>
    </Layout>
  )
}
