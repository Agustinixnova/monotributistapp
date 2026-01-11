import { useParams } from 'react-router-dom'
import { Layout } from '../../../components/layout'
import { FichaCliente } from '../components/FichaCliente'

export function ClienteDetallePage() {
  const { clientId } = useParams()

  return (
    <Layout>
      <FichaCliente clientId={clientId} />
    </Layout>
  )
}
