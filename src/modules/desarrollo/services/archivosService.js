import { supabase } from '../../../lib/supabase'

const BUCKET = 'dev-archivos'

export const archivosService = {
  // Subir archivo
  async upload(file, { ideaId, reporteId, mensajeId, userId }) {
    const prefix = ideaId ? `ideas/${ideaId}` : reporteId ? `reportes/${reporteId}` : 'otros'
    const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
    const ruta = `${prefix}/${nombreArchivo}`

    // Subir
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, file)

    if (uploadError) return { data: null, error: uploadError }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(ruta)

    // Registrar
    const { data, error } = await supabase
      .from('dev_archivos')
      .insert([{
        idea_id: ideaId || null,
        reporte_id: reporteId || null,
        mensaje_id: mensajeId || null,
        nombre: file.name,
        tipo_mime: file.type,
        tamanio: file.size,
        ruta_storage: ruta,
        url_publica: urlData?.publicUrl,
        subido_por: userId
      }])
      .select()
      .single()

    return { data, error }
  },

  // Obtener archivos de una idea
  async getByIdea(ideaId) {
    const { data, error } = await supabase
      .from('dev_archivos')
      .select('*')
      .eq('idea_id', ideaId)
      .order('fecha', { ascending: false })

    return { data: data || [], error }
  },

  // Obtener archivos de un reporte
  async getByReporte(reporteId) {
    const { data, error } = await supabase
      .from('dev_archivos')
      .select('*')
      .eq('reporte_id', reporteId)
      .order('fecha', { ascending: false })

    return { data: data || [], error }
  },

  // Obtener URL pública
  getUrl(ruta) {
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(ruta)

    return data?.publicUrl
  },

  // Eliminar
  async delete(id, ruta) {
    await supabase.storage.from(BUCKET).remove([ruta])
    return supabase.from('dev_archivos').delete().eq('id', id)
  }
}
