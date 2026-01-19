import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente admin con SERVICE_ROLE_KEY (seguro en Edge Function)
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

    // Obtener datos del body
    const { email, password, nombre, apellido, whatsapp, origen, origenDetalle } = await req.json()

    // Validaciones básicas
    if (!email || !password || !nombre || !apellido) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Crear usuario con Admin API - YA CONFIRMADO
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ← Usuario confirmado al instante
      user_metadata: {
        nombre,
        apellido,
        whatsapp: whatsapp || '',
        origen: origen || 'otros',
        origen_detalle: origenDetalle || null,
        tipo_usuario: 'free'
      }
    })

    if (createError) {
      console.error('Error creando usuario:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // El trigger on_auth_user_created_free creará el perfil en usuarios_free

    // Ahora hacer login del usuario para obtener sesión
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.error('Error iniciando sesión:', signInError)
      return new Response(
        JSON.stringify({
          error: 'Usuario creado pero no se pudo iniciar sesión',
          details: signInError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        user: userData.user,
        session: sessionData.session,
        message: 'Cuenta creada exitosamente'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error general:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
