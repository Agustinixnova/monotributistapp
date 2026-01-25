/**
 * Página pública de Política de Privacidad
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChartNoAxesCombined, ArrowLeft, Shield } from 'lucide-react'
import { getDocumentoLegal } from '../services/documentosLegalesService'
import { SimpleMarkdown } from '../components/common/SimpleMarkdown'

export function PrivacidadPage() {
  const [documento, setDocumento] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data } = await getDocumentoLegal('privacidad')
      setDocumento(data)
      setLoading(false)
    }
    cargar()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <ChartNoAxesCombined className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-lg font-bold tracking-tight font-heading">
              <span className="text-violet-600">Mi</span><span className="text-gray-900">monotributo</span>
            </span>
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-3 border-violet-600 border-t-transparent rounded-full" />
          </div>
        ) : documento ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{documento.titulo}</h1>
                <p className="text-sm text-gray-500">
                  Versión {documento.version} - Actualizado: {new Date(documento.updated_at).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>

            <div className="max-w-none">
              <SimpleMarkdown>{documento.contenido}</SimpleMarkdown>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Documento no disponible</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          © 2026 Mimonotributo. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}

export default PrivacidadPage
