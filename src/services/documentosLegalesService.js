/**
 * Servicio para gestionar documentos legales (términos, privacidad)
 */

import { supabase } from '../lib/supabase'

/**
 * Obtener un documento legal por tipo
 * @param {'terminos' | 'privacidad'} tipo
 */
export async function getDocumentoLegal(tipo) {
  try {
    const { data, error } = await supabase
      .from('app_documentos_legales')
      .select('*')
      .eq('tipo', tipo)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error(`Error fetching documento ${tipo}:`, error)
    return { data: null, error }
  }
}

/**
 * Obtener todos los documentos legales
 */
export async function getAllDocumentosLegales() {
  try {
    const { data, error } = await supabase
      .from('app_documentos_legales')
      .select('*')
      .order('tipo')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching documentos legales:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un documento legal
 * @param {'terminos' | 'privacidad'} tipo
 * @param {object} datos - { titulo, contenido, version }
 */
export async function updateDocumentoLegal(tipo, datos) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('app_documentos_legales')
      .update({
        titulo: datos.titulo,
        contenido: datos.contenido,
        version: datos.version,
        updated_by: user?.id
      })
      .eq('tipo', tipo)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error(`Error updating documento ${tipo}:`, error)
    return { data: null, error }
  }
}

/**
 * Crear o actualizar un documento legal (upsert)
 * @param {'terminos' | 'privacidad'} tipo
 * @param {object} datos - { titulo, contenido, version }
 */
export async function upsertDocumentoLegal(tipo, datos) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('app_documentos_legales')
      .upsert({
        tipo,
        titulo: datos.titulo,
        contenido: datos.contenido,
        version: datos.version || '1.0',
        updated_by: user?.id
      }, {
        onConflict: 'tipo'
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error(`Error upserting documento ${tipo}:`, error)
    return { data: null, error }
  }
}
