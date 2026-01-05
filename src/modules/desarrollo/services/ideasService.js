import { supabase } from '../../../lib/supabase'
import { archivosService } from './archivosService'

export const ideasService = {
  // Obtener todas las ideas
  async getAll() {
    const { data, error } = await supabase
      .from('dev_ideas')
      .select(`
        *,
        creador:creado_por(id, nombre, apellido, avatar_url)
      `)
      .order('prioridad', { ascending: true })
      .order('creado_fecha', { ascending: false })

    return { data, error }
  },

  // Obtener una idea
  async getById(id) {
    const { data, error } = await supabase
      .from('dev_ideas')
      .select(`
        *,
        creador:creado_por(id, nombre, apellido, avatar_url),
        fiscal_por:fiscal_completado_por(id, nombre, apellido),
        ux_por:ux_completado_por(id, nombre, apellido)
      `)
      .eq('id', id)
      .single()

    if (error) return { data: null, error }

    // Obtener comentarios por separado
    const { data: comentarios } = await supabase
      .from('dev_ideas_comentarios')
      .select(`
        id, contenido, fecha,
        autor:autor_id(id, nombre, apellido, avatar_url)
      `)
      .eq('idea_id', id)
      .order('fecha', { ascending: true })

    // Obtener archivos por separado
    const { data: archivos } = await supabase
      .from('dev_archivos')
      .select('id, nombre, tipo_mime, tamanio, ruta_storage, url_publica')
      .eq('idea_id', id)

    return {
      data: {
        ...data,
        comentarios: comentarios || [],
        archivos: archivos || []
      },
      error: null
    }
  },

  // Crear idea
  async create(idea) {
    const { data, error } = await supabase
      .from('dev_ideas')
      .insert([{
        titulo: idea.titulo,
        que_queremos_hacer: idea.que_queremos_hacer,
        para_quien: idea.para_quien,
        por_que_importa: idea.por_que_importa,
        prioridad: idea.prioridad || 'normal',
        creado_por: idea.creado_por
      }])
      .select(`
        *,
        creador:creado_por(id, nombre, apellido, avatar_url)
      `)
      .single()

    if (error) return { data: null, error }

    // Subir archivos si hay
    if (idea.archivos && idea.archivos.length > 0) {
      for (const file of idea.archivos) {
        await archivosService.upload(file, {
          ideaId: data.id,
          userId: idea.creado_por
        })
      }
    }

    return { data, error: null }
  },

  // Actualizar idea (campos específicos)
  async update(id, campos) {
    const { data, error } = await supabase
      .from('dev_ideas')
      .update(campos)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Marcar fiscal como listo
  async marcarFiscalListo(id, userId) {
    return this.update(id, {
      fiscal_listo: true,
      fiscal_completado_por: userId,
      fiscal_completado_fecha: new Date().toISOString()
    })
  },

  // Marcar UX como listo
  async marcarUxListo(id, userId) {
    return this.update(id, {
      ux_listo: true,
      ux_completado_por: userId,
      ux_completado_fecha: new Date().toISOString()
    })
  },

  // Mover de etapa
  async moverEtapa(id, nuevaEtapa) {
    const campos = { etapa: nuevaEtapa }
    if (nuevaEtapa === 'publicado') {
      campos.publicado_fecha = new Date().toISOString()
    }
    return this.update(id, campos)
  },

  // Agregar comentario
  async agregarComentario(ideaId, userId, contenido) {
    const { data, error } = await supabase
      .from('dev_ideas_comentarios')
      .insert([{ idea_id: ideaId, autor_id: userId, contenido }])
      .select(`*, autor:autor_id(id, nombre, apellido, avatar_url)`)
      .single()

    return { data, error }
  },

  // Eliminar idea
  async delete(id) {
    const { error } = await supabase
      .from('dev_ideas')
      .delete()
      .eq('id', id)

    return { error }
  }
}
