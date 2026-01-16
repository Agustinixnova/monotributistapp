import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../auth/hooks/useAuth'

/**
 * Hook para obtener la cantidad de mensajes no leídos
 * Se actualiza en tiempo real usando Supabase Realtime
 */
export function useMensajesNoLeidos() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = async () => {
    if (!user?.id) {
      setCount(0)
      setLoading(false)
      return
    }

    try {
      const { count: noLeidos, error } = await supabase
        .from('buzon_participantes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('leido', false)

      if (error) throw error
      setCount(noLeidos || 0)
    } catch (err) {
      console.error('Error obteniendo mensajes no leídos:', err)
      setCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCount()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('mensajes-no-leidos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buzon_participantes',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchCount()
        }
      )
      .subscribe()

    // Polling cada 2 minutos como fallback
    const pollInterval = setInterval(() => {
      fetchCount()
    }, 2 * 60 * 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [user?.id])

  return { count, loading, refresh: fetchCount }
}
