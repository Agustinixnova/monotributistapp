import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getNotificaciones, marcarLeida, marcarTodasLeidas, suscribirseNotificaciones } from '../services/notificacionesService'

export function useNotificaciones(limit = 50, soloNoLeidas = false) {
  const { user } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotificaciones = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getNotificaciones(limit, 0, soloNoLeidas)
      setNotificaciones(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit, soloNoLeidas])

  useEffect(() => {
    fetchNotificaciones()
  }, [fetchNotificaciones])

  useEffect(() => {
    if (!user?.id) return
    const unsubscribe = suscribirseNotificaciones(user.id, (nueva) => {
      setNotificaciones(prev => [nueva, ...prev])
    })
    return unsubscribe
  }, [user?.id])

  const marcarComoLeida = async (id) => {
    await marcarLeida(id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const marcarTodasComoLeidas = async () => {
    await marcarTodasLeidas()
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  return { notificaciones, loading, error, refetch: fetchNotificaciones, marcarComoLeida, marcarTodasComoLeidas }
}
