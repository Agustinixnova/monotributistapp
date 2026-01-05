import { supabase } from '../../../lib/supabase'

const STORAGE_BUCKET = 'dev-archivos'

export const reportesService = {
  // Subir archivo a Storage
  async uploadFile(file, reporteId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${reporteId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) return { data: null, error }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    return {
      data: {
        path: data.path,
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size
      },
      error: null
    }
  },

  // Guardar referencia de archivo en la tabla
  async saveFileReference(reporteId, fileData) {
    const { data, error } = await supabase
      .from('dev_archivos')
      .insert([{
        reporte_id: reporteId,
        nombre: fileData.name,
        tipo_mime: fileData.type,
        tamanio: fileData.size,
        ruta_storage: fileData.path,
        url_publica: fileData.url
      }])
      .select()
      .single()

    return { data, error }
  },

  // Obtener todos los reportes
  async getAll(filtros = {}) {
    let query = supabase
      .from('dev_reportes')
      .select(`
        *,
        modulo:modulo_id(id, name),
        reportador:reportado_por(id, nombre, apellido, avatar_url)
      `)
      .order('fecha_creacion', { ascending: false })

    if (filtros.estado && filtros.estado !== 'todos') {
      query = query.eq('estado', filtros.estado)
    }
    if (filtros.tipo && filtros.tipo !== 'todos') {
      query = query.eq('tipo', filtros.tipo)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Obtener reporte con mensajes
  async getById(id) {
    const { data, error } = await supabase
      .from('dev_reportes')
      .select(`
        *,
        modulo:modulo_id(id, name),
        reportador:reportado_por(id, nombre, apellido, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) return { data: null, error }

    // Obtener mensajes por separado
    const { data: mensajes } = await supabase
      .from('dev_reportes_mensajes')
      .select(`
        id, contenido, fecha,
        autor:autor_id(id, nombre, apellido, avatar_url)
      `)
      .eq('reporte_id', id)
      .order('fecha', { ascending: true })

    // Obtener archivos por separado
    const { data: archivos } = await supabase
      .from('dev_archivos')
      .select('id, nombre, tipo_mime, tamanio, ruta_storage, url_publica')
      .eq('reporte_id', id)

    return {
      data: {
        ...data,
        mensajes: mensajes || [],
        archivos: archivos || []
      },
      error: null
    }
  },

  // Crear reporte con archivos
  async create(reporte) {
    // 1. Crear el reporte
    const { data, error } = await supabase
      .from('dev_reportes')
      .insert([{
        submodulo: reporte.submodulo,
        tipo: reporte.tipo,
        descripcion: reporte.descripcion,
        reportado_por: reporte.reportado_por
      }])
      .select(`
        *,
        reportador:reportado_por(id, nombre, apellido, avatar_url)
      `)
      .single()

    if (error) return { data: null, error }

    // 2. Subir archivos si hay
    const archivosSubidos = []
    if (reporte.archivos && reporte.archivos.length > 0) {
      for (const file of reporte.archivos) {
        const uploadResult = await this.uploadFile(file, data.id)
        if (uploadResult.data) {
          const saveResult = await this.saveFileReference(data.id, uploadResult.data)
          if (saveResult.data) {
            archivosSubidos.push(saveResult.data)
          }
        }
      }
    }

    return {
      data: { ...data, archivos: archivosSubidos },
      error: null
    }
  },

  // Cambiar estado
  async cambiarEstado(id, nuevoEstado) {
    const campos = { estado: nuevoEstado }
    if (nuevoEstado === 'resuelto') {
      campos.fecha_resolucion = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('dev_reportes')
      .update(campos)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  // Agregar mensaje
  async agregarMensaje(reporteId, userId, contenido) {
    const { data, error } = await supabase
      .from('dev_reportes_mensajes')
      .insert([{ reporte_id: reporteId, autor_id: userId, contenido }])
      .select(`*, autor:autor_id(id, nombre, apellido, avatar_url)`)
      .single()

    return { data, error }
  },

  // Eliminar reporte
  async delete(id) {
    const { error } = await supabase
      .from('dev_reportes')
      .delete()
      .eq('id', id)

    return { error }
  }
}
