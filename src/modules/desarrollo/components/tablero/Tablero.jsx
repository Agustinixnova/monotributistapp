import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { ETAPAS } from '../../utils/config'
import { Columna } from './Columna'
import { ModalIdea } from '../ideas/ModalIdea'
import { FormIdea } from '../ideas/FormIdea'

/**
 * Tablero Kanban de ideas
 */
export function Tablero({ ideas, ideasPorEtapa, loading, onRefresh, onCrear, onActualizar, onMover, miRol }) {
  const [ideaSeleccionada, setIdeaSeleccionada] = useState(null)
  const [showFormNueva, setShowFormNueva] = useState(false)

  const handleClickIdea = (idea) => {
    setIdeaSeleccionada(idea)
  }

  const handleCloseModal = () => {
    setIdeaSeleccionada(null)
  }

  const handleCrear = async (datos) => {
    const result = await onCrear(datos)
    if (!result.error) {
      setShowFormNueva(false)
    }
    return result
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">
            {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
          </span>
        </div>

        <button
          onClick={() => setShowFormNueva(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva idea
        </button>
      </div>

      {/* Tablero horizontal */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ETAPAS.map(etapa => (
          <Columna
            key={etapa.id}
            etapa={etapa}
            ideas={ideasPorEtapa[etapa.id] || []}
            onClickIdea={handleClickIdea}
          />
        ))}
      </div>

      {/* Modal de idea */}
      {ideaSeleccionada && (
        <ModalIdea
          ideaId={ideaSeleccionada.id}
          onClose={handleCloseModal}
          onActualizar={onActualizar}
          onMover={onMover}
          miRol={miRol}
        />
      )}

      {/* Modal nueva idea */}
      {showFormNueva && (
        <FormIdea
          onSubmit={handleCrear}
          onCancel={() => setShowFormNueva(false)}
        />
      )}
    </div>
  )
}

export default Tablero
