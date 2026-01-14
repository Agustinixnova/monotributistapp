import { supabase } from '../../../lib/supabase'

/**
 * Sube un archivo adjunto al buzón
 * @param {File} file - Archivo a subir
 * @param {string} conversacionId - ID de la conversación
 * @returns {Object} - { name, size, type, path }
 */
export async function subirAdjunto(file, conversacionId) {
  const fileExt = file.name.split('.').pop().toLowerCase()
  const timestamp = Date.now()
  const fileName = `${conversacionId}/${timestamp}_${file.name}`

  // Subir archivo
  const { error: uploadError } = await supabase.storage
    .from('buzon-adjuntos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

  if (uploadError) throw uploadError

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    path: fileName
  }
}

/**
 * Obtiene URL firmada de un adjunto
 * @param {string} path - Ruta del archivo
 * @param {number} expiresIn - Segundos de expiración (default 3600)
 * @returns {string} - URL firmada
 */
export async function getAdjuntoUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('buzon-adjuntos')
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

/**
 * Descarga un adjunto
 * @param {string} path - Ruta del archivo
 * @param {string} fileName - Nombre del archivo para descarga
 */
export async function descargarAdjunto(path, fileName) {
  try {
    const url = await getAdjuntoUrl(path, 60)

    // Crear elemento <a> temporal para descargar
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error descargando archivo:', err)
    throw err
  }
}

/**
 * Valida un archivo antes de subirlo
 * @param {File} file - Archivo a validar
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validarArchivo(file) {
  const MAX_SIZE = 100 * 1024 * 1024 // 100MB (para permitir videos)
  const ALLOWED_TYPES = [
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Imágenes
    'image/jpeg',
    'image/jpg',
    'image/png',
    // Excel
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    // Videos
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska'
  ]
  const ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx',
    'jpeg', 'jpg', 'png',
    'xlsx', 'xls',
    'mp4', 'mov', 'avi', 'webm', 'mkv'
  ]

  // Validar tamaño
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'El archivo no puede superar los 100MB' }
  }

  // Validar tipo
  const extension = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Solo se permiten archivos PDF, Word, imágenes, Excel y videos (MP4, MOV, AVI, WEBM, MKV)' }
  }

  return { valid: true }
}
