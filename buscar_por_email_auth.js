// Script para buscar usuario por email en auth.users
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.1y0p_TQvqJL3xCvY4EJ5d0_nVTqGQqTUwGzXVk3Zj6Y' // Necesitamos service_role para auth.users
const userEmail = 'elizabeth3612@hotmail.com'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function buscarUsuario() {
  console.log('Buscando usuario:', userEmail)

  // Buscar en auth.users mediante Admin API
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.log('Error:', error.message)
    return
  }

  const usuario = data.users.find(u => u.email === userEmail)

  if (usuario) {
    console.log('\n✓ Usuario encontrado:')
    console.log('  ID:', usuario.id)
    console.log('  Email:', usuario.email)
    console.log('  Created:', usuario.created_at)
  } else {
    console.log('\n❌ No se encontró el usuario')
  }
}

buscarUsuario().catch(console.error)
