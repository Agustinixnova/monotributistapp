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

    // Obtener el token del header
    const authHeader = req.headers.get('Authorization')
    let createdBy = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        if (user) {
          createdBy = user.id
          console.log('Usuario autenticado:', user.id, user.email)
        }
      } catch (e) {
        console.log('No se pudo verificar token, continuando sin created_by')
      }
    }

    // Obtener datos del body
    const body = await req.json()
    const { email, password, nombre, apellido, telefono, whatsapp, dni, roleId, assignedTo, fiscalData } = body

    console.log('Datos recibidos:', { email, nombre, apellido, roleId })

    // Validar campos requeridos
    if (!email || !password || !nombre || !apellido || !roleId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Faltan campos requeridos: email, password, nombre, apellido, roleId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let userId: string

    // 1. Verificar si el usuario ya existe en auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingAuthUser) {
      console.log('Usuario encontrado en auth.users:', existingAuthUser.id)

      // Verificar si tiene perfil en profiles
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, is_active')
        .eq('id', existingAuthUser.id)
        .single()

      if (existingProfile) {
        // El usuario existe completamente
        if (existingProfile.is_active) {
          return new Response(
            JSON.stringify({ success: false, error: 'Ya existe un usuario activo con este email' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        } else {
          // Usuario existe pero está inactivo - preguntar si reactivar
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Este email pertenece a un usuario inactivo. Podés reactivarlo desde la lista de usuarios.',
              code: 'USER_INACTIVE'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
      }

      // Usuario existe en auth pero NO tiene perfil (fue eliminado parcialmente)
      // Reutilizamos el usuario de auth
      console.log('Usuario existe en auth pero sin perfil, recreando perfil...')
      userId = existingAuthUser.id

      // Actualizar la contraseña por si cambió
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          apellido
        }
      })

      if (updateError) {
        console.error('Error actualizando usuario en auth:', updateError)
        return new Response(
          JSON.stringify({ success: false, error: `Error actualizando usuario: ${updateError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

    } else {
      // Usuario no existe, crear nuevo en auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          apellido
        }
      })

      if (authError) {
        console.error('Error creando usuario en auth:', authError)
        return new Response(
          JSON.stringify({ success: false, error: `Error creando usuario: ${authError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      userId = authData.user.id
      console.log('Usuario creado en auth:', userId)
    }

    // 2. Crear perfil (usando upsert por si acaso)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        nombre,
        apellido,
        telefono: telefono || null,
        whatsapp: whatsapp || null,
        dni: dni || null,
        role_id: roleId,
        assigned_to: assignedTo || null,
        is_active: true,
        created_by: createdBy
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Error creando perfil:', profileError)
      // Solo hacer rollback si creamos un usuario nuevo
      if (!existingAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      return new Response(
        JSON.stringify({ success: false, error: `Error creando perfil: ${profileError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Perfil creado exitosamente')

    // 3. Si hay datos fiscales, crearlos
    console.log('fiscalData recibido:', fiscalData)

    if (fiscalData && fiscalData.cuit) {
      console.log('Creando datos fiscales para CUIT:', fiscalData.cuit)

      // Usar upsert para datos fiscales también
      const { error: fiscalError } = await supabaseAdmin
        .from('client_fiscal_data')
        .upsert({
          user_id: userId,
          cuit: fiscalData.cuit,
          razon_social: fiscalData.razonSocial || null,
          tipo_contribuyente: fiscalData.tipoContribuyente || null,
          categoria_monotributo: fiscalData.categoriaMonotributo || null,
          tipo_actividad: fiscalData.tipoActividad || null,
          domicilio_fiscal: fiscalData.domicilioFiscal || null,
          codigo_postal: fiscalData.codigoPostal || null,
          localidad: fiscalData.localidad || null,
          provincia: fiscalData.provincia || null,
          regimen_iibb: fiscalData.regimenIibb || null,
          facturador_electronico: fiscalData.facturadorElectronico || null
        }, {
          onConflict: 'user_id'
        })

      if (fiscalError) {
        console.error('Error creando datos fiscales:', fiscalError)
        // No hacemos rollback pero avisamos en la respuesta
      } else {
        console.log('Datos fiscales creados exitosamente')
      }
    } else {
      console.log('No se recibieron datos fiscales o CUIT vacío')
    }

    // 4. Limpiar módulos anteriores si existían
    await supabaseAdmin
      .from('user_module_access')
      .delete()
      .eq('user_id', userId)

    // 5. Asignar módulos por defecto según el rol
    const { data: defaultModules } = await supabaseAdmin
      .from('role_default_modules')
      .select('module_id')
      .eq('role_id', roleId)

    if (defaultModules && defaultModules.length > 0) {
      const moduleAccess = defaultModules.map(dm => ({
        user_id: userId,
        module_id: dm.module_id
      }))

      await supabaseAdmin
        .from('user_module_access')
        .insert(moduleAccess)
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: existingAuthUser ? 'Usuario recuperado y perfil recreado exitosamente' : 'Usuario creado exitosamente'
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
