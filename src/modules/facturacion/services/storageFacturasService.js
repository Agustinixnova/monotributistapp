import { supabase } from '../../../lib/supabase'

const BUCKET_NAME = 'facturas'

/**
 * Sube un archivo al storage
 * Path: facturas/<userId>/<anio>/<mes>/<filename>
 */
export async function uploadFactura(file, userId, anio, mes) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
  const filePath = `${userId}/${anio}/${mes}/${fileName}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Obtener URL pública (o signed URL si es privado)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return {
    path: data.path,
    url: urlData.publicUrl,
    fileName: file.name,
    size: file.size,
    type: file.type
  }
}

/**
 * Sube múltiples archivos
 */
export async function uploadMultipleFacturas(files, userId, anio, mes) {
  const results = []

  for (const file of files) {
    try {
      const result = await uploadFactura(file, userId, anio, mes)
      results.push(result)
    } catch (error) {
      console.error(`Error subiendo ${file.name}:`, error)
      results.push({ error: error.message, fileName: file.name })
    }
  }

  return results
}

/**
 * Elimina un archivo del storage
 */
export async function deleteFactura(filePath) {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (error) throw error
  return true
}

/**
 * Obtiene URL firmada para descargar (si el bucket es privado)
 */
export async function getSignedUrl(filePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn)

  if (error) throw error
  return data.signedUrl
}
