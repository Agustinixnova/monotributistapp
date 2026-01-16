# Configuración de Variables de Entorno en Vercel

## Variables Requeridas

Para que la aplicación funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno:

```
VITE_SUPABASE_URL=https://nhwiezngaprzoqcvutbx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A
```

## Pasos para Configurar en Vercel

### Opción 1: Desde el Dashboard Web

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto `monotributistapp`
3. Ve a la pestaña **Settings**
4. En el menú lateral, selecciona **Environment Variables**
5. Agrega cada variable:
   - Click en **Add New**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://nhwiezngaprzoqcvutbx.supabase.co`
   - Environments: Selecciona **Production**, **Preview** y **Development**
   - Click **Save**
6. Repite el paso 5 para `VITE_SUPABASE_ANON_KEY`
7. Una vez agregadas, haz un **Redeploy** del proyecto:
   - Ve a la pestaña **Deployments**
   - Click en los tres puntos del deployment más reciente
   - Selecciona **Redeploy**

### Opción 2: Usando Vercel CLI (más rápido)

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login a Vercel
vercel login

# Agregar variables de entorno
vercel env add VITE_SUPABASE_URL production
# Pega: https://nhwiezngaprzoqcvutbx.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Pega la anon key

# Agregar para preview y development
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_ANON_KEY preview

vercel env add VITE_SUPABASE_URL development
vercel env add VITE_SUPABASE_ANON_KEY development

# Redeploy
vercel --prod
```

## Verificar que funciona

Después de configurar y hacer redeploy:

1. Abre tu sitio en Vercel
2. Abre DevTools (F12)
3. Ve a la pestaña Console
4. Ejecuta: `console.log(import.meta.env.VITE_SUPABASE_URL)`
5. Debería mostrar la URL de Supabase, no `undefined`

## Nota Importante

- ⚠️ **NUNCA** subas el archivo `.env` a Git (ya está en `.gitignore`)
- ✅ Las variables que empiezan con `VITE_` son accesibles en el cliente
- 🔐 La `ANON_KEY` es pública, la seguridad está en las RLS policies de Supabase
