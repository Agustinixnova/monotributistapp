import { supabase } from '../../../../lib/supabase'

export const escalasService = {
  // ==========================================
  // CATEGORIAS
  // ==========================================

  /**
   * Obtiene las categorias vigentes (vigente_hasta IS NULL)
   */
  async getCategoriasVigentes() {
    const { data, error } = await supabase
      .from('monotributo_categorias')
      .select('*')
      .is('vigente_hasta', null)
      .order('categoria', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Obtiene el historial de escalas (agrupadas por periodo)
   */
  async getHistorialEscalas() {
    const { data, error } = await supabase
      .from('monotributo_categorias')
      .select('*')
      .not('vigente_hasta', 'is', null)
      .order('vigente_hasta', { ascending: false })
      .order('categoria', { ascending: true })

    if (error) throw error

    // Agrupar por periodo (vigente_desde - vigente_hasta)
    const periodos = {}
    data.forEach(cat => {
      const key = `${cat.vigente_desde}_${cat.vigente_hasta}`
      if (!periodos[key]) {
        periodos[key] = {
          vigente_desde: cat.vigente_desde,
          vigente_hasta: cat.vigente_hasta,
          periodo_id: cat.periodo_id,
          categorias: []
        }
      }
      periodos[key].categorias.push(cat)
    })

    return Object.values(periodos)
  },

  /**
   * Actualiza una categoria individual
   */
  async updateCategoria(id, data) {
    const { data: updated, error } = await supabase
      .from('monotributo_categorias')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  },

  /**
   * Carga una nueva escala completa (archiva las anteriores)
   */
  async cargarNuevaEscala(categorias, vigente_desde) {
    const periodo_id = crypto.randomUUID()

    // 1. Archivar categorias vigentes actuales
    const { error: archiveError } = await supabase
      .from('monotributo_categorias')
      .update({ vigente_hasta: vigente_desde })
      .is('vigente_hasta', null)

    if (archiveError) throw archiveError

    // 2. Insertar nuevas categorias
    const nuevasCategorias = categorias.map(cat => ({
      ...cat,
      periodo_id,
      vigente_desde,
      vigente_hasta: null
    }))

    const { data, error } = await supabase
      .from('monotributo_categorias')
      .insert(nuevasCategorias)
      .select()

    if (error) throw error
    return data
  },

  /**
   * Obtiene categorias de un periodo especifico
   */
  async getCategoriasPorPeriodo(vigente_desde, vigente_hasta) {
    const { data, error } = await supabase
      .from('monotributo_categorias')
      .select('*')
      .eq('vigente_desde', vigente_desde)
      .eq('vigente_hasta', vigente_hasta)
      .order('categoria', { ascending: true })

    if (error) throw error
    return data
  },

  // ==========================================
  // ALERTAS CONFIG
  // ==========================================

  /**
   * Obtiene la configuracion de alertas
   */
  async getAlertasConfig() {
    const { data, error } = await supabase
      .from('alertas_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Actualiza la configuracion de alertas
   */
  async updateAlertasConfig(config) {
    // Primero verificamos si existe
    const { data: existing } = await supabase
      .from('alertas_config')
      .select('id')
      .single()

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('alertas_config')
        .update({
          ...config,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert
      const { data, error } = await supabase
        .from('alertas_config')
        .insert({
          ...config,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  }
}

export default escalasService
