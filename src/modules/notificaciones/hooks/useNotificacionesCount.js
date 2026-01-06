import { useState, useEffect } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getCountNoLeidas, suscribirseNotificaciones } from '../services/notificacionesService'

export function useNotificacionesCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const cantidad = await getCountNoLeidas()
        setCount(cantidad)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const unsubscribe = suscribirseNotificaciones(user.id, () => setCount(prev => prev + 1))
    return unsubscribe
  }, [user?.id])

  return { count, loading, decrementar: () => setCount(p => Math.max(0, p - 1)), resetear: () => setCount(0) }
}
