import { useState } from 'react'
import {
  StickyNote,
  Plus,
  AlertTriangle,
  Calendar,
  FileText,
  Trash2,
  Check,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useNotasInternas } from '../hooks/useNotasInternas'
import { FormNota } from './FormNota'

export function PanelNotasInternas({ clientId, mesActivo = null }) {
  const { user } = useAuth()
  const {
    notas,
    notasUrgentes,
    recordatorios,
    loading,
    agregar,
    archivar,
    completar
  } = useNotasInternas(clientId)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandido, setExpandido] = useState(true)

  const handleAgregar = async (data) => {
    await agregar({
      ...data,
      userId: user.id,
      anio: mesActivo?.anio,
      mes: mesActivo?.mes
    })
    setMostrarForm(false)
  }

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'urgente':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'facturacion':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'recordatorio':
        return <Calendar className="w-4 h-4 text-purple-500" />
      default:
        return <StickyNote className="w-4 h-4 text-yellow-500" />
    }
  }

  const getTipoBadge = (tipo) => {
    const estilos = {
      urgente: 'bg-red-100 text-red-700',
      facturacion: 'bg-blue-100 text-blue-700',
      recordatorio: 'bg-purple-100 text-purple-700',
      general: 'bg-yellow-100 text-yellow-700'
    }
    const labels = {
      urgente: 'Urgente',
      facturacion: 'Facturacion',
      recordatorio: 'Recordatorio',
      general: 'General'
    }
    return (
      <span className={`px-1.5 py-0.5 text-xs rounded ${estilos[tipo]}`}>
        {labels[tipo]}
      </span>
    )
  }

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-200 rounded" />
          <div className="h-4 bg-yellow-200 rounded w-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-yellow-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            Notas internas
          </span>
          {notas.length > 0 && (
            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs">
              {notas.length}
            </span>
          )}
          {notasUrgentes.length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
              {notasUrgentes.length} urgente{notasUrgentes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {expandido ? (
          <ChevronUp className="w-5 h-5 text-yellow-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-yellow-600" />
        )}
      </button>

      {/* Contenido */}
      {expandido && (
        <div className="border-t border-yellow-200">
          {/* Recordatorios pendientes */}
          {recordatorios.length > 0 && (
            <div className="p-3 bg-purple-50 border-b border-yellow-200">
              <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Recordatorios pendientes</span>
              </div>
              {recordatorios.map(nota => (
                <div
                  key={nota.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg mb-1 last:mb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{nota.contenido}</p>
                    <p className="text-xs text-purple-600">
                      {formatFecha(nota.fecha_recordatorio)}
                    </p>
                  </div>
                  <button
                    onClick={() => completar(nota.id)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Marcar completado"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Lista de notas */}
          {notas.length > 0 ? (
            <div className="divide-y divide-yellow-200">
              {notas.map(nota => (
                <div key={nota.id} className="p-3 hover:bg-yellow-100/50 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {getTipoIcon(nota.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getTipoBadge(nota.tipo)}
                        {nota.anio && nota.mes && (
                          <span className="text-xs text-gray-500">
                            {nota.mes}/{nota.anio}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{nota.contenido}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{formatFecha(nota.created_at)}</span>
                        {nota.created_by_nombre && (
                          <>
                            <span>•</span>
                            <span>{nota.created_by_nombre}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('¿Archivar esta nota?')) {
                          archivar(nota.id)
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Archivar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-yellow-700 text-sm">
              No hay notas para este cliente
            </div>
          )}

          {/* Boton agregar */}
          {!mostrarForm ? (
            <div className="p-3 border-t border-yellow-200">
              <button
                onClick={() => setMostrarForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar nota
              </button>
            </div>
          ) : (
            <div className="p-3 border-t border-yellow-200 bg-white">
              <FormNota
                onSave={handleAgregar}
                onCancel={() => setMostrarForm(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
