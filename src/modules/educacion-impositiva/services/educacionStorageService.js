import { supabase } from '../../../lib/supabase'

const BUCKET_NAME = 'educacion-impositiva'

/**
 * Subir imagen para articulo
 */
export async function subirImagen(file, articuloId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `articulos/${articuloId}/${fileName}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Obtener URL publica
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return {
    path: data.path,
    url: publicUrl,
    nombre: fileName,
    nombreOriginal: file.name,
    tipo: 'imagen',
    mimeType: file.type,
    tamanio: file.size
  }
}

/**
 * Subir archivo adjunto
 */
export async function subirAdjunto(file, articuloId, userId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `articulos/${articuloId}/${fileName}`

  // Determinar tipo de archivo
  let tipo = 'otro'
  if (file.type.startsWith('image/')) {
    tipo = 'imagen'
  } else if (file.type === 'application/pdf') {
    tipo = 'pdf'
  } else if (file.type.startsWith('video/')) {
    tipo = 'video'
  }

  // Subir archivo
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Obtener URL publica
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  // Guardar registro en tabla adjuntos
  const { data: adjunto, error: dbError } = await supabase
    .from('educacion_adjuntos')
    .insert({
      articulo_id: articuloId,
      nombre: fileName,
      nombre_original: file.name,
      url: publicUrl,
      path: uploadData.path,
      tipo,
      mime_type: file.type,
      tamanio: file.size,
      subido_por: userId
    })
    .select()
    .single()

  if (dbError) throw dbError

  return adjunto
}

/**
 * Eliminar archivo de storage
 */
export async function eliminarArchivo(path) {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) throw error
  return true
}

/**
 * Eliminar adjunto (storage + db)
 */
export async function eliminarAdjunto(adjuntoId) {
  // Primero obtener el path
  const { data: adjunto, error: getError } = await supabase
    .from('educacion_adjuntos')
    .select('path')
    .eq('id', adjuntoId)
    .single()

  if (getError) throw getError

  // Eliminar de storage
  if (adjunto?.path) {
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([adjunto.path])
  }

  // Eliminar de db
  const { error: deleteError } = await supabase
    .from('educacion_adjuntos')
    .delete()
    .eq('id', adjuntoId)

  if (deleteError) throw deleteError
  return true
}

/**
 * Obtener adjuntos de un articulo
 */
export async function getAdjuntosArticulo(articuloId) {
  const { data, error } = await supabase
    .from('educacion_adjuntos')
    .select('*')
    .eq('articulo_id', articuloId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Actualizar titulo de adjunto
 */
export async function actualizarTituloAdjunto(adjuntoId, titulo) {
  const { data, error } = await supabase
    .from('educacion_adjuntos')
    .update({ titulo })
    .eq('id', adjuntoId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Formatear tamanio de archivo
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Obtener icono segun tipo de archivo
 */
export function getFileIcon(mimeType) {
  if (!mimeType) return 'File'
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType === 'application/pdf') return 'FileText'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'FileSpreadsheet'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'FileText'
  return 'File'
}
