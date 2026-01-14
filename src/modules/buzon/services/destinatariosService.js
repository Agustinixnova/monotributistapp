import { supabase } from '../../../lib/supabase'

/**
 * Obtiene usuarios monotributistas
 */
export async function getMonotributistas() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre,
      apellido,
      email,
      role:roles!role_id(name)
    `)
    .eq('is_active', true)
    .eq('roles.name', 'monotributista')
    .order('nombre')

  if (error) throw error

  return data.map(u => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    fullName: `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email
  }))
}

/**
 * Obtiene usuarios responsables inscriptos
 */
export async function getResponsablesInscriptos() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre,
      apellido,
      email,
      role:roles!role_id(name)
    `)
    .eq('is_active', true)
    .eq('roles.name', 'responsable_inscripto')
    .order('nombre')

  if (error) throw error

  return data.map(u => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    fullName: `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email
  }))
}

/**
 * Obtiene operadores de gastos
 */
export async function getOperadoresGastos() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre,
      apellido,
      email,
      role:roles!role_id(name)
    `)
    .eq('is_active', true)
    .eq('roles.name', 'operador_gastos')
    .order('nombre')

  if (error) throw error

  return data.map(u => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    fullName: `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email
  }))
}

/**
 * Obtiene clientes asignados a un contador secundario
 */
export async function getClientesAsignados(contadorId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre,
      apellido,
      email,
      assigned_to,
      role:roles!role_id(name)
    `)
    .eq('is_active', true)
    .eq('assigned_to', contadorId)
    .in('roles.name', ['monotributista', 'responsable_inscripto'])
    .order('nombre')

  if (error) throw error

  return data.map(u => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    fullName: `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email,
    rol: u.role?.name
  }))
}

/**
 * Obtiene todos los usuarios clientes
 */
export async function getTodosLosClientes() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre,
      apellido,
      email,
      role:roles!role_id(name)
    `)
    .eq('is_active', true)
    .in('roles.name', ['monotributista', 'responsable_inscripto', 'operador_gastos'])
    .order('nombre')

  if (error) throw error

  return data.map(u => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    fullName: `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email,
    rol: u.role?.name
  }))
}

/**
 * Busca usuarios por texto (nombre, apellido o email)
 */
export async function buscarUsuarios(texto, soloAsignados = null) {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      nombre,
      apellido,
      email,
      assigned_to,
      role:roles!role_id(name)
    `)
    .eq('is_active', true)
    .in('roles.name', ['monotributista', 'responsable_inscripto', 'operador_gastos'])

  if (soloAsignados) {
    query = query.eq('assigned_to', soloAsignados)
  }

  const { data, error } = await query

  if (error) throw error

  // Filtrar por texto en cliente (case insensitive)
  const textoLower = texto.toLowerCase()
  const filtrados = data.filter(u => {
    const nombre = (u.nombre || '').toLowerCase()
    const apellido = (u.apellido || '').toLowerCase()
    const email = (u.email || '').toLowerCase()
    const fullName = `${nombre} ${apellido}`.trim()

    return nombre.includes(textoLower) ||
           apellido.includes(textoLower) ||
           email.includes(textoLower) ||
           fullName.includes(textoLower)
  })

  return filtrados.map(u => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    fullName: `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email,
    rol: u.role?.name
  }))
}
