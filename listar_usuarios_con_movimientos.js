// Listar usuarios con movimientos para identificar el correcto
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listarUsuarios() {
  console.log('='.repeat(80))
  console.log('USUARIOS CON MOVIMIENTOS DE VENTAS')
  console.log('='.repeat(80))

  // 1. Buscar categorías de ventas
  const { data: cats } = await supabase
    .from('caja_categorias')
    .select('*')
    .or('nombre.eq.Venta online,nombre.eq.Venta offline,nombre.ilike.%venta%')

  console.log('\nCategorías de ventas encontradas:')
  if (cats && cats.length > 0) {
    cats.forEach(c => console.log(`  - ${c.nombre} (${c.id})`))
  }

  if (!cats || cats.length === 0) {
    console.log('  (ninguna)')
    return
  }

  const catIds = cats.map(c => c.id)

  // 2. Buscar movimientos
  const { data: movimientos } = await supabase
    .from('caja_movimientos')
    .select('user_id, categoria_id, monto_total, fecha, caja_categorias(nombre)')
    .in('categoria_id', catIds)
    .order('fecha', { ascending: false })
    .limit(500)

  if (!movimientos || movimientos.length === 0) {
    console.log('\n(No hay movimientos)')
    return
  }

  // Agrupar por usuario
  const porUsuario = {}
  movimientos.forEach(m => {
    if (!porUsuario[m.user_id]) {
      porUsuario[m.user_id] = { movimientos: [], categorias: {} }
    }
    porUsuario[m.user_id].movimientos.push(m)

    const cat = m.caja_categorias?.nombre || 'Sin categoría'
    if (!porUsuario[m.user_id].categorias[cat]) {
      porUsuario[m.user_id].categorias[cat] = 0
    }
    porUsuario[m.user_id].categorias[cat]++
  })

  // Obtener info de usuarios
  const userIds = Object.keys(porUsuario)
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email')
    .in('id', userIds)

  console.log(`\n\nEncontrados ${userIds.length} usuarios:\n`)

  for (const userId of userIds) {
    const perfil = perfiles?.find(p => p.id === userId)
    const datos = porUsuario[userId]

    console.log('━'.repeat(80))
    console.log(`\nUsuario ID: ${userId}`)

    if (perfil) {
      console.log(`Nombre: ${perfil.nombre || '(sin nombre)'} ${perfil.apellido || ''}`)
      console.log(`Email: ${perfil.email || '(sin email)'}`)
    } else {
      console.log('(Sin perfil)')
    }

    console.log(`\nMovimientos: ${datos.movimientos.length}`)
    console.log('Categorías usadas:')
    Object.entries(datos.categorias)
      .sort((a, b) => b[1] - a[1])
      .forEach(([nombre, cantidad]) => {
        console.log(`  • ${nombre}: ${cantidad} operaciones`)
      })
  }

  console.log('\n' + '='.repeat(80))
}

listarUsuarios().catch(console.error)
