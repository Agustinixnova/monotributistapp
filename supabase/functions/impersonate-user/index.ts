import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente con service role para operaciones admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que el usuario que hace la request tiene permisos
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar que el usuario tiene rol "desarrollo" - SOLO desarrollo puede impersonar
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', requestingUser.id)
      .single()

    // SOLO el rol desarrollo puede impersonar usuarios
    if (!profile?.role?.name || profile.role.name !== 'desarrollo') {
      return new Response(
        JSON.stringify({ success: false, error: 'Solo el rol desarrollo puede impersonar usuarios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Obtener datos del body
    const body = await req.json()
    const { targetUserId } = body

    // Validar campos requeridos
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Falta el campo targetUserId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verificar que el usuario objetivo existe
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId)

    if (userError || !targetUser?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario objetivo no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Generar un magic link para el usuario objetivo
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email!,
      options: {
        redirectTo: Deno.env.get('SITE_URL') || 'http://localhost:5173'
      }
    })

    if (linkError || !linkData) {
      console.error('Error generando link:', linkError)
      return new Response(
        JSON.stringify({ success: false, error: 'Error al generar sesión de impersonación' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Log de auditoría
    console.log(`[IMPERSONATION] Usuario ${requestingUser.email} (${requestingUser.id}) impersonando a ${targetUser.user.email} (${targetUserId})`)

    // Retornar los datos necesarios para que el frontend complete la autenticación
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          // El hashed_token se usa con verifyOtp en el frontend
          token_hash: linkData.properties?.hashed_token,
          email: targetUser.user.email,
          impersonatedUser: {
            id: targetUser.user.id,
            email: targetUser.user.email
          },
          impersonatedBy: {
            id: requestingUser.id,
            email: requestingUser.email
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error general:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
