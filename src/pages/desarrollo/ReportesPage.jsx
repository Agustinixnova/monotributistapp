import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bug, Lock } from 'lucide-react'
import { Layout } from '../../components/layout'
import { ListaReportes } from '../../modules/desarrollo/components/reportes/ListaReportes'
import { ChatReporte } from '../../modules/desarrollo/components/reportes/ChatReporte'
import { useReportes } from '../../modules/desarrollo/hooks/useReportes'
import { useSocios } from '../../modules/desarrollo/hooks/useSocios'
import { reportesService } from '../../modules/desarrollo/services/reportesService'
import { useAuth } from '../../auth/hooks/useAuth'

/**
 * Página de reportes de bugs/errores
 */
export function ReportesPage() {
  const navigate = useNavigate()
  const { id: reporteId } = useParams()
  const { user } = useAuth()
  const { miRol, esSocio, loading: loadingSocio } = useSocios()
  const { reportes, loading: loadingReportes, refetch, crear, cambiarEstado } = useReportes()

  // Estado para reporte seleccionado
  const [reporteActual, setReporteActual] = useState(null)
  const [loadingReporte, setLoadingReporte] = useState(false)

  // Redirigir si no es socio
  useEffect(() => {
    if (!loadingSocio && !esSocio) {
      navigate('/')
    }
  }, [loadingSocio, esSocio, navigate])

  // Cargar reporte si hay ID en URL
  useEffect(() => {
    async function cargarReporte() {
      if (!reporteId) {
        setReporteActual(null)
        return
      }

      setLoadingReporte(true)
      const { data } = await reportesService.getById(reporteId)
      setReporteActual(data)
      setLoadingReporte(false)
    }
    cargarReporte()
  }, [reporteId])

  // Mientras verifica permisos
  if (loadingSocio) {
    return (
      <Layout title="Reportes">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  // No autorizado
  if (!esSocio) {
    return (
      <Layout title="Reportes">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Lock className="w-12 h-12 mb-3" />
          <p>No tenés acceso a esta sección</p>
        </div>
      </Layout>
    )
  }

  const handleSelectReporte = (reporte) => {
    navigate(`/desarrollo/reportes/${reporte.id}`)
  }

  const handleBackToList = () => {
    navigate('/desarrollo/reportes')
  }

  const handleEnviarMensaje = async (contenido) => {
    if (!reporteActual) return

    const { data } = await reportesService.agregarMensaje(reporteActual.id, user.id, contenido)
    if (data) {
      setReporteActual(prev => ({
        ...prev,
        mensajes: [...(prev.mensajes || []), data]
      }))
    }
  }

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!reporteActual) return

    await cambiarEstado(reporteActual.id, nuevoEstado)
    setReporteActual(prev => ({ ...prev, estado: nuevoEstado }))
  }

  // Vista de chat si hay reporte seleccionado
  if (reporteId) {
    return (
      <Layout title="Reportes">
        <ChatReporte
          reporte={reporteActual}
          loading={loadingReporte}
          onBack={handleBackToList}
          onEnviarMensaje={handleEnviarMensaje}
          onCambiarEstado={handleCambiarEstado}
          miRol={miRol}
        />
      </Layout>
    )
  }

  // Vista de lista
  return (
    <Layout title="Reportes">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Bug className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
            <p className="text-sm text-gray-500">Bugs, errores y sugerencias</p>
          </div>
        </div>
      </div>

      {/* Lista */}
      <ListaReportes
        reportes={reportes}
        loading={loadingReportes}
        onRefresh={refetch}
        onCrear={crear}
        onSelectReporte={handleSelectReporte}
        miRol={miRol}
      />
    </Layout>
  )
}

export default ReportesPage
