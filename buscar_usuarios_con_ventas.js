// Script para encontrar usuarios con movimientos de ventas
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function buscarUsuarios() {
  console.log('='.repeat(80))
  console.log('BUSCANDO USUARIOS CON MOVIMIENTOS DE VENTAS')
  console.log('='.repeat(80))

  // 1. Buscar todas las categorías que contengan "venta"
  const { data: categoriasVenta } = await supabase
    .from('caja_categorias')
    .select('*')
    .or('nombre.ilike.%venta%,nombre.ilike.%ventas%')

  console.log('\n1. CATEGORÍAS DE VENTAS ENCONTRADAS:')
  if (categoriasVenta && categoriasVenta.length > 0) {
    categoriasVenta.forEach(cat => {
      console.log(`   - ${cat.nombre} (ID: ${cat.id}, User: ${cat.user_id || 'sistema'})`)
    })
  } else {
    console.log('   (Ninguna)')
  }

  // 2. Si encontró categorías, buscar movimientos en esas categorías
  if (categoriasVenta && categoriasVenta.length > 0) {
    const catIds = categoriasVenta.map(c => c.id)

    console.log('\n2. USUARIOS CON MOVIMIENTOS EN ESTAS CATEGORÍAS:')

    const { data: movimientos } = await supabase
      .from('caja_movimientos')
      .select('user_id, categoria_id, tipo, monto_total, fecha, caja_categorias(nombre)')
      .in('categoria_id', catIds)
      .order('fecha', { ascending: false })
      .limit(100)

    if (movimientos && movimientos.length > 0) {
      // Agrupar por usuario
      const porUsuario = {}

      for (const mov of movimientos) {
        if (!porUsuario[mov.user_id]) {
          porUsuario[mov.user_id] = {
            movimientos: [],
            total: 0,
            categorias: new Set()
          }
        }
        porUsuario[mov.user_id].movimientos.push(mov)
        porUsuario[mov.user_id].total += parseFloat(mov.monto_total)
        porUsuario[mov.user_id].categorias.add(mov.caja_categorias?.nombre || 'Sin nombre')
      }

      // Obtener info de perfiles
      const userIds = Object.keys(porUsuario)
      const { data: perfiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, email')
        .in('id', userIds)

      console.log('')
      for (const userId of userIds) {
        const perfil = perfiles?.find(p => p.id === userId)
        const datos = porUsuario[userId]

        console.log(`\n   Usuario ID: ${userId}`)
        if (perfil) {
          console.log(`   Nombre: ${perfil.nombre} ${perfil.apellido || ''}`)
          console.log(`   Email: ${perfil.email}`)
        }
        console.log(`   Movimientos: ${datos.movimientos.length}`)
        console.log(`   Total: $${datos.total.toFixed(2)}`)
        console.log(`   Categorías usadas:`)
        datos.categorias.forEach(cat => {
          const count = datos.movimientos.filter(m => m.caja_categorias?.nombre === cat).length
          console.log(`     - ${cat}: ${count} operaciones`)
        })
        console.log(`   Último movimiento: ${datos.movimientos[0].fecha}`)
        console.log('   ' + '-'.repeat(70))
      }
    } else {
      console.log('   (Ningún movimiento encontrado)')
    }
  }

  console.log('\n' + '='.repeat(80))
}

buscarUsuarios().catch(console.error)
