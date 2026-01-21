// Script para listar todas las categorías
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'
const userId = 'c671f12e-d88c-45e2-86c7-a37a8040492d'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listarCategorias() {
  console.log('='.repeat(80))
  console.log('LISTADO DE CATEGORÍAS')
  console.log('='.repeat(80))

  // 1. Categorías del sistema
  console.log('\n1. CATEGORÍAS DEL SISTEMA (user_id = null):')
  const { data: catSistema } = await supabase
    .from('caja_categorias')
    .select('*')
    .is('user_id', null)
    .order('tipo', { ascending: true })
    .order('orden', { ascending: true })

  if (catSistema && catSistema.length > 0) {
    catSistema.forEach(cat => {
      console.log(`   [${cat.tipo.toUpperCase()}] ${cat.nombre} (ID: ${cat.id})`)
    })
  }

  // 2. Categorías del usuario específico
  console.log(`\n2. CATEGORÍAS PROPIAS DEL USUARIO ${userId}:`)
  const { data: catUsuario } = await supabase
    .from('caja_categorias')
    .select('*')
    .eq('user_id', userId)
    .order('tipo', { ascending: true })
    .order('orden', { ascending: true })

  if (catUsuario && catUsuario.length > 0) {
    catUsuario.forEach(cat => {
      console.log(`   [${cat.tipo.toUpperCase()}] ${cat.nombre} (ID: ${cat.id})`)
    })
  } else {
    console.log('   (Ninguna)')
  }

  // 3. Ver movimientos por categoría de este usuario
  console.log(`\n3. MOVIMIENTOS POR CATEGORÍA (Usuario ${userId}):`)
  const { data: movimientos } = await supabase
    .from('caja_movimientos')
    .select('categoria_id, tipo, monto_total, anulado, caja_categorias(nombre)')
    .eq('user_id', userId)

  if (movimientos && movimientos.length > 0) {
    const resumen = {}
    movimientos.forEach(mov => {
      const catNombre = mov.caja_categorias?.nombre || 'Sin categoría'
      const key = `${catNombre} (${mov.tipo})`
      if (!resumen[key]) {
        resumen[key] = { cantidad: 0, total: 0, anulados: 0 }
      }
      resumen[key].cantidad++
      if (!mov.anulado) {
        resumen[key].total += parseFloat(mov.monto_total)
      } else {
        resumen[key].anulados++
      }
    })

    Object.entries(resumen)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([nombre, datos]) => {
        console.log(`   ${nombre}: ${datos.cantidad} ops (${datos.anulados} anulados) - $${datos.total.toFixed(2)}`)
      })
  } else {
    console.log('   (Ningún movimiento)')
  }

  console.log('\n' + '='.repeat(80))
}

listarCategorias().catch(console.error)
