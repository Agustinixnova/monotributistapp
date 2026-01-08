import { useParams } from 'react-router-dom'
import { Layout } from '../../../components/layout'
import { FichaCliente } from '../components/FichaCliente'

export function ClienteDetallePage() {
  const { clientId } = useParams()

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <FichaCliente clientId={clientId} />
      </div>
    </Layout>
  )
}
