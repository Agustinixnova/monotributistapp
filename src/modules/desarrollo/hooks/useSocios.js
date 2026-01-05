import { useState, useEffect } from 'react'
import { sociosService } from '../services/sociosService'
import { useAuth } from '../../../auth/hooks/useAuth'

export function useSocios() {
  const [miRol, setMiRol] = useState(null)  // 'dev', 'contadora', 'comunicadora' o null
  const [esSocio, setEsSocio] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function cargar() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      const { rol } = await sociosService.getMiRol(user.id)
      setMiRol(rol)
      setEsSocio(!!rol)
      setLoading(false)
    }
    cargar()
  }, [user?.id])

  // Helpers útiles
  const esDev = miRol === 'dev'
  const esContadora = miRol === 'contadora'
  const esComunicadora = miRol === 'comunicadora'

  return { miRol, esSocio, esDev, esContadora, esComunicadora, loading, userId: user?.id }
}
