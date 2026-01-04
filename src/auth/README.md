# Módulo de Autenticación

Módulo de autenticación para la aplicación Monotributist usando Supabase Auth.

## Estructura

```
auth/
├── components/
│   └── LoginForm.jsx      # Formulario de login con validación
├── hooks/
│   └── useAuth.js         # Hook para acceder al estado de auth
├── services/
│   └── authService.js     # Llamadas a Supabase Auth
├── utils/
│   └── validators.js      # Validación de email y password
└── README.md
```

## Uso

### Hook useAuth

```jsx
import { useAuth } from './auth/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, loading, signIn, signOut } = useAuth()

  if (loading) return <p>Cargando...</p>

  if (!isAuthenticated) {
    return <button onClick={() => signIn('email@test.com', 'password')}>Login</button>
  }

  return (
    <div>
      <p>Bienvenido {user.email}</p>
      <button onClick={signOut}>Cerrar sesión</button>
    </div>
  )
}
```

### Proteger rutas

```jsx
import { ProtectedRoute } from './components/ProtectedRoute'

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Validadores

```jsx
import { validateEmail, validatePassword, validateLoginForm } from './auth/utils/validators'

// Validar email
const { isValid, error } = validateEmail('test@email.com')

// Validar password
const { isValid, error } = validatePassword('123456')

// Validar formulario completo
const { isValid, errors } = validateLoginForm(email, password)
// errors = { email: string|null, password: string|null }
```

## Componentes

### LoginForm

Formulario de login con:
- Inputs de email y password con iconos
- Toggle para mostrar/ocultar password
- Validación client-side
- Estado de loading
- Mensajes de error

Props:
- `onSuccess`: Callback ejecutado tras login exitoso

```jsx
<LoginForm onSuccess={() => navigate('/dashboard')} />
```

## Servicios

### authService

| Método | Descripción |
|--------|-------------|
| `signIn(email, password)` | Inicia sesión |
| `signOut()` | Cierra sesión |
| `getSession()` | Obtiene sesión actual |
| `getCurrentUser()` | Obtiene usuario actual |
| `onAuthStateChange(callback)` | Suscribe a cambios de auth |

## Flujo de autenticación

1. Usuario accede a ruta protegida
2. `ProtectedRoute` verifica `isAuthenticated`
3. Si no está autenticado → redirect a `/login`
4. Usuario ingresa credenciales
5. `LoginForm` valida y llama `signIn()`
6. Supabase Auth verifica credenciales
7. `AuthContext` actualiza estado
8. Redirect a dashboard

## Dependencias

- `@supabase/supabase-js` - Cliente de Supabase
- `react-router-dom` - Navegación

## Variables de entorno

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```
