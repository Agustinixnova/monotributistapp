import { useState, useEffect } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'

export function useMensajesBuzon() {
  const { user } = useAuth()
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchMensajesNoLeidos = async () => {
      try {
        const { data, error } = await supabase
          .from('buzon_participantes')
          .select(`
            conversacion_id,
            leido,
            buzon_conversaciones (
              id,
              asunto,
              ultimo_mensaje_at,
              iniciado_por
            )
          `)
          .eq('user_id', user.id)
          .eq('leido', false)
          .order('buzon_conversaciones(ultimo_mensaje_at)', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Error cargando mensajes no leídos:', error)
          return
        }

        // Transformar datos - distinguir entre mensaje nuevo y respuesta
        const mensajes = data
          .filter(p => p.buzon_conversaciones)
          .map(p => ({
            id: p.buzon_conversaciones.id,
            asunto: p.buzon_conversaciones.asunto,
            ultimoMensaje: p.buzon_conversaciones.ultimo_mensaje_at,
            esRespuesta: p.buzon_conversaciones.iniciado_por === user.id
          }))

        setMensajesNoLeidos(mensajes)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMensajesNoLeidos()

    // Polling cada minuto
    const interval = setInterval(fetchMensajesNoLeidos, 60000)

    return () => clearInterval(interval)
  }, [user?.id])

  return { mensajesNoLeidos, loading }
}
