import { useLocation } from 'react-router-dom'
import { Layout } from '../components/layout'

// Mapeo de rutas a información
const pageInfo = {
  '/usuarios': { title: 'Gestión de Usuarios', description: 'Administra usuarios, roles y permisos del sistema.' },
  '/clientes': { title: 'Clientes', description: 'Gestiona tus clientes monotributistas.' },
  '/facturacion': { title: 'Facturación', description: 'Crea y administra facturas.' },
  '/gastos': { title: 'Gastos', description: 'Registra y categoriza gastos.' },
  '/mensajes': { title: 'Mensajes', description: 'Comunicación con clientes.' },
  '/notificaciones': { title: 'Notificaciones', description: 'Alertas y recordatorios.' },
  '/biblioteca': { title: 'Biblioteca', description: 'Documentos y recursos.' },
  '/herramientas': { title: 'Herramientas', description: 'Calculadoras y utilidades.' },
  '/configuracion': { title: 'Configuración', description: 'Ajustes de la aplicación.' },
}

export function PlaceholderPage() {
  const location = useLocation()
  const info = pageInfo[location.pathname] || { title: 'Página', description: '' }

  return (
    <Layout>
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-primary-500/5 border border-white/50 p-6 sm:p-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{info.title}</h1>
          <p className="text-gray-600 mb-6">{info.description}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Próximamente
          </div>
        </div>
      </div>
    </Layout>
  )
}
