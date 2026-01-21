// Listar TODAS las categorías
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listar() {
  const { data } = await supabase
    .from('caja_categorias')
    .select('*')
    .order('nombre')

  console.log(`Total categorías: ${data?.length || 0}\n`)

  if (data && data.length > 0) {
    data.forEach(c => {
      console.log(`[${c.tipo}] ${c.nombre} (ID: ${c.id.substring(0, 8)}..., User: ${c.user_id ? c.user_id.substring(0, 8) + '...' : 'sistema'})`)
    })
  }
}

listar().catch(console.error)
