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
    const { email, password, nombre, apellido, telefono, whatsapp, dni, notasInternas, roleId, assignedTo, fiscalData, historicalBilling } = body

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
        notas_internas: notasInternas || null,
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
      const { data: fiscalResult, error: fiscalError } = await supabaseAdmin
        .from('client_fiscal_data')
        .upsert({
          user_id: userId,
          cuit: fiscalData.cuit,
          razon_social: fiscalData.razonSocial || null,
          tipo_contribuyente: fiscalData.tipoContribuyente || null,
          categoria_monotributo: fiscalData.categoriaMonotributo || null,
          tipo_actividad: fiscalData.tipoActividad || null,
          gestion_facturacion: fiscalData.gestionFacturacion || 'contadora',
          domicilio_fiscal: fiscalData.domicilioFiscal || null,
          codigo_postal: fiscalData.codigoPostal || null,
          localidad: fiscalData.localidad || null,
          provincia: fiscalData.provincia || null,
          regimen_iibb: fiscalData.regimenIibb || null,
          numero_iibb: fiscalData.numeroIibb || null,
          facturador_electronico: fiscalData.facturadorElectronico || null,
          fecha_alta_monotributo: fiscalData.fechaAltaMonotributo || null,
          fecha_ultima_recategorizacion: fiscalData.fechaUltimaRecategorizacion || null,
          codigo_actividad_afip: fiscalData.codigoActividadAfip || null,
          descripcion_actividad_afip: fiscalData.descripcionActividadAfip || null,
          punto_venta_afip: fiscalData.puntoVentaAfip || null,
          notas_internas_fiscales: fiscalData.notasInternasFiscales || null,
          // Situacion especial
          trabaja_relacion_dependencia: fiscalData.trabajaRelacionDependencia || false,
          empleador_cuit: fiscalData.empleadorCuit || null,
          empleador_razon_social: fiscalData.empleadorRazonSocial || null,
          sueldo_bruto: fiscalData.sueldoBruto || null,
          tiene_local: fiscalData.tieneLocal || false,
          // Empleados
          tiene_empleados: fiscalData.tieneEmpleados || false,
          cantidad_empleados: fiscalData.cantidadEmpleados || 0,
          obra_social: fiscalData.obraSocial || null,
          obra_social_tipo_cobertura: fiscalData.obraSocialTipoCobertura || 'titular',
          obra_social_adicional: fiscalData.obraSocialAdicional || false,
          obra_social_adicional_nombre: fiscalData.obraSocialAdicionalNombre || null,
          // Pago monotributo
          metodo_pago_monotributo: fiscalData.metodoPagoMonotributo || null,
          estado_pago_monotributo: fiscalData.estadoPagoMonotributo || 'al_dia',
          cbu_debito: fiscalData.cbuDebito || null,
          monto_deuda_monotributo: fiscalData.montoDeudaMonotributo || null,
          cuotas_adeudadas_monotributo: fiscalData.cuotasAdeudadasMonotributo || null,
          // Accesos ARCA
          nivel_clave_fiscal: fiscalData.nivelClaveFiscal || null,
          servicios_delegados: fiscalData.serviciosDelegados || false,
          fecha_delegacion: fiscalData.fechaDelegacion || null,
          factura_electronica_habilitada: fiscalData.facturaElectronicaHabilitada || false,
          // Historial categoria simple
          categoria_anterior: fiscalData.categoriaAnterior || null,
          fecha_cambio_categoria: fiscalData.fechaCambioCategoria || null,
          motivo_cambio_categoria: fiscalData.motivoCambioCategoria || null
        }, {
          onConflict: 'user_id'
        })
        .select('id')
        .single()

      if (fiscalError) {
        console.error('Error creando datos fiscales:', fiscalError)
      } else {
        console.log('Datos fiscales creados exitosamente')

        // Crear entrada inicial en historial de categorias si tiene categoria
        if (fiscalResult?.id && fiscalData.categoriaMonotributo) {
          const fechaDesde = fiscalData.fechaAltaMonotributo || new Date().toISOString().split('T')[0]
          const motivo = fiscalData.esAltaCliente ? 'alta_inicial' : 'migracion_sistema'

          try {
            // Usar la funcion RPC para agregar al historial
            const { error: historialError } = await supabaseAdmin.rpc('agregar_historial_categoria', {
              p_client_id: fiscalResult.id,
              p_categoria: fiscalData.categoriaMonotributo,
              p_fecha_desde: fechaDesde,
              p_fecha_hasta: null,
              p_motivo: motivo,
              p_notas: fiscalData.esAltaCliente ? 'Alta inicial del cliente' : 'Migrado al sistema',
              p_user_id: createdBy
            })

            if (historialError) {
              console.error('Error creando historial categoria:', historialError)
            } else {
              console.log('Historial de categoria inicial creado')
            }
          } catch (histErr) {
            console.error('Error en RPC historial:', histErr)
          }
        }

        // Guardar locales si existen
        if (fiscalResult?.id && fiscalData.locales && fiscalData.locales.length > 0) {
          const localesData = fiscalData.locales.map((local: any) => ({
            client_id: fiscalResult.id,
            descripcion: local.descripcion || null,
            alquiler_mensual: local.alquiler || null,
            superficie_m2: local.superficie || null,
            es_propio: local.esPropio || false
          }))

          const { error: localesError } = await supabaseAdmin
            .from('client_locales')
            .insert(localesData)

          if (localesError) {
            console.error('Error guardando locales:', localesError)
          } else {
            console.log(`${localesData.length} locales guardados`)
          }
        }

        // Guardar grupo familiar si existe
        if (fiscalResult?.id && fiscalData.grupoFamiliar && fiscalData.grupoFamiliar.length > 0) {
          const grupoData = fiscalData.grupoFamiliar.filter((g: any) => g.nombre).map((integrante: any) => ({
            client_id: fiscalResult.id,
            nombre: integrante.nombre,
            dni: integrante.dni || null,
            parentesco: integrante.parentesco || 'otro'
          }))

          if (grupoData.length > 0) {
            const { error: grupoError } = await supabaseAdmin
              .from('client_grupo_familiar')
              .insert(grupoData)

            if (grupoError) {
              console.error('Error guardando grupo familiar:', grupoError)
            } else {
              console.log(`${grupoData.length} integrantes del grupo familiar guardados`)
            }
          }
        }

        // Procesar facturacion historica si existe y no se omite
        if (historicalBilling && !historicalBilling.omitirHistorico && fiscalResult?.id) {
          const clientId = fiscalResult.id

          if (historicalBilling.modoHistorico === 'total' && historicalBilling.totalAcumulado12Meses) {
            // Modo total: guardar en client_fiscal_data
            await supabaseAdmin
              .from('client_fiscal_data')
              .update({
                facturacion_historica_total: historicalBilling.totalAcumulado12Meses,
                facturacion_historica_fecha_corte: historicalBilling.fechaCorte || null,
                facturacion_historica_nota: historicalBilling.notaHistorico || null
              })
              .eq('id', clientId)

            console.log('Facturacion historica (total) guardada')

          } else if (historicalBilling.modoHistorico === 'mensual' && historicalBilling.facturacionMensual) {
            // Modo mensual: crear cargas historicas
            const cargasHistoricas = []

            for (const [key, monto] of Object.entries(historicalBilling.facturacionMensual)) {
              if (monto && monto > 0) {
                const [anio, mes] = key.split('-').map(Number)
                cargasHistoricas.push({
                  client_id: clientId,
                  anio,
                  mes,
                  tipo_comprobante: 'factura',
                  monto_total: monto,
                  es_historico: true,
                  created_by: createdBy
                })
              }
            }

            if (cargasHistoricas.length > 0) {
              const { error: cargasError } = await supabaseAdmin
                .from('client_facturacion_cargas')
                .insert(cargasHistoricas)

              if (cargasError) {
                console.error('Error creando cargas historicas:', cargasError)
              } else {
                console.log(`${cargasHistoricas.length} cargas historicas creadas`)
              }
            }
          }
        }
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
