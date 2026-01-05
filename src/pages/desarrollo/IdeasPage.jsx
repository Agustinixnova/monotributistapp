import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, Lock } from 'lucide-react'
import { Layout } from '../../components/layout'
import { Tablero } from '../../modules/desarrollo/components/tablero/Tablero'
import { useIdeas } from '../../modules/desarrollo/hooks/useIdeas'
import { useSocios } from '../../modules/desarrollo/hooks/useSocios'

/**
 * Página del tablero Kanban de ideas
 */
export function IdeasPage() {
  const navigate = useNavigate()
  const { miRol, esSocio, loading: loadingSocio } = useSocios()
  const {
    ideas,
    ideasPorEtapa,
    loading: loadingIdeas,
    refetch,
    crear,
    mover
  } = useIdeas()

  // Redirigir si no es socio
  useEffect(() => {
    if (!loadingSocio && !esSocio) {
      navigate('/')
    }
  }, [loadingSocio, esSocio, navigate])

  // Mientras verifica permisos
  if (loadingSocio) {
    return (
      <Layout title="Ideas">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  // No autorizado
  if (!esSocio) {
    return (
      <Layout title="Ideas">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Lock className="w-12 h-12 mb-3" />
          <p>No tenés acceso a esta sección</p>
        </div>
      </Layout>
    )
  }

  const handleActualizar = async (id, campos) => {
    // El modal maneja esto directamente
    refetch()
  }

  return (
    <Layout title="Ideas">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ideas</h1>
            <p className="text-sm text-gray-500">Tablero de ideas y funcionalidades</p>
          </div>
        </div>
      </div>

      {/* Tablero */}
      <Tablero
        ideas={ideas}
        ideasPorEtapa={ideasPorEtapa}
        loading={loadingIdeas}
        onRefresh={refetch}
        onCrear={crear}
        onActualizar={handleActualizar}
        onMover={mover}
        miRol={miRol}
      />
    </Layout>
  )
}

export default IdeasPage
