import { supabase } from '../../../lib/supabase'

export const sociosService = {
  // Obtener mi rol de socio (dev, contadora, comunicadora o null)
  async getMiRol(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('socios_rol')
      .eq('id', userId)
      .single()

    return { rol: data?.socios_rol || null, error }
  },

  // Verificar si soy socio
  async esSocio(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('socios_rol')
      .eq('id', userId)
      .not('socios_rol', 'is', null)
      .single()

    return !!data
  },

  // Obtener todos los socios
  async getSocios() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, email, avatar_url, socios_rol')
      .not('socios_rol', 'is', null)

    return { data, error }
  }
}
