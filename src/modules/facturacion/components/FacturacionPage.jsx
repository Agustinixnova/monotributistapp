import { useState, useEffect } from 'react'
import { Layout } from '../../../components/layout/Layout'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { ResumenClientes } from './ResumenClientes'
import { MiFacturacion } from './MiFacturacion'

const ROLES_CONTADORA = ['admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario']

export function FacturacionPage() {
  const { user } = useAuth()
  const [roleName, setRoleName] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) return

      const { data } = await supabase
        .from('profiles')
        .select('roles(name)')
        .eq('id', user.id)
        .single()

      setRoleName(data?.roles?.name || null)
      setLoading(false)
    }

    fetchRole()
  }, [user?.id])

  const esContadora = ROLES_CONTADORA.includes(roleName)

  if (loading) {
    return (
      <Layout title="Facturación">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Facturación">
      {esContadora ? <ResumenClientes /> : <MiFacturacion />}
    </Layout>
  )
}
