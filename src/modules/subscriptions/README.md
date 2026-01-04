# Módulo de Suscripciones

Sistema completo de gestión de suscripciones con MercadoPago para MonoGestión.

## Estructura

```
src/modules/subscriptions/
├── components/
│   ├── PlanSelector.jsx         # Pantalla de selección de planes
│   ├── RenewalBanner.jsx        # Banner fijo de alerta de renovación
│   ├── RenewalBadge.jsx         # Badge compacto para header
│   ├── RenewalModal.jsx         # Modal de renovación
│   ├── SubscriptionStatus.jsx   # Widget de estado de suscripción
│   ├── SubscriptionGate.jsx     # Gate que bloquea sin suscripción
│   └── MockPaymentPage.jsx      # Página de pago mock (desarrollo)
├── hooks/
│   ├── useSubscription.js       # Estado de suscripción del usuario
│   ├── usePlans.js              # Lista de planes disponibles
│   ├── useRenewalAlert.js       # Lógica de alertas de renovación
│   └── useSubscriptionAccess.js # Control de acceso simplificado
├── services/
│   └── subscriptionService.js   # API de suscripciones
└── index.js                     # Exportaciones del módulo

src/modules/admin/subscriptions/
├── components/
│   ├── AdminSubscriptionsPage.jsx # Página principal de admin
│   ├── PlanSettings.jsx           # Configuración de planes
│   ├── ExpiringSubscriptions.jsx  # Lista de vencimientos
│   └── SubscriptionMetrics.jsx    # Métricas y KPIs
├── services/
│   └── adminSubscriptionService.js # API admin
└── index.js                        # Exportaciones admin
```

## Flujo de Usuario

### Primera vez (sin suscripción)
1. Usuario inicia sesión
2. SubscriptionGate detecta que no tiene suscripción activa
3. Se muestra PlanSelector a pantalla completa
4. Usuario elige plan y es redirigido a MercadoPago
5. Al confirmar pago, se activa la suscripción
6. Usuario accede a la app

### Renovación
1. X días antes del vencimiento (según plan), se muestra RenewalBanner
2. Usuario puede hacer clic en "Renovar" o en el RenewalBadge
3. Se abre RenewalModal con las opciones de plan
4. Al renovar, la nueva vigencia se calcula desde la fecha de vencimiento actual

### Período de gracia
1. Si el usuario no renueva, entra en período de gracia (3 días)
2. El banner se vuelve más urgente (rojo, animado)
3. Puede seguir usando la app
4. Pasados los 3 días, se bloquea el acceso

## Planes Disponibles

| Plan | Duración | Precio/mes | Alerta |
|------|----------|------------|--------|
| Mensual | 1 mes | $99.900 | 7 días |
| Trimestral | 3 meses | $89.900 | 15 días |
| Semestral | 6 meses | $79.900 | 30 días |
| Anual | 12 meses | $69.900 | 30 días |

## Tablas SQL

- `subscription_plans` - Planes disponibles y precios
- `subscriptions` - Suscripciones de usuarios
- `payments` - Registros de pago
- `app_settings` - Configuración de MercadoPago

Ver `SQL_tables/` para esquemas completos.

## Ejemplos de Uso

### SubscriptionGate en App.jsx
```jsx
import { SubscriptionGate } from '@/modules/subscriptions'

function App() {
  return (
    <SubscriptionGate>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* ... otras rutas */}
        </Routes>
      </Router>
    </SubscriptionGate>
  )
}
```

### RenewalBadge en Header
```jsx
import { RenewalBadgeCompact, useRenewalAlert } from '@/modules/subscriptions'

function Header() {
  const { openRenewalModal, isRenewalModalOpen, closeRenewalModal } = useRenewalAlert()

  return (
    <header>
      <RenewalBadgeCompact onClick={openRenewalModal} />
      <RenewalModal isOpen={isRenewalModalOpen} onClose={closeRenewalModal} />
    </header>
  )
}
```

### SubscriptionStatus en Perfil
```jsx
import { SubscriptionStatus } from '@/modules/subscriptions'

function ProfilePage() {
  return (
    <div>
      <h1>Mi Perfil</h1>
      <SubscriptionStatus />
    </div>
  )
}
```

### Hook useSubscription
```jsx
import { useSubscription } from '@/modules/subscriptions'

function MyComponent() {
  const {
    hasActiveSubscription,
    daysRemaining,
    isInGracePeriod,
    subscription
  } = useSubscription()

  if (!hasActiveSubscription) {
    return <p>No tenés suscripción activa</p>
  }

  return (
    <p>
      Tu plan {subscription.plan_name} vence en {daysRemaining} días
    </p>
  )
}
```

## Rutas Necesarias

```jsx
// En tu router
<Route path="/planes" element={<PlanSelector />} />
<Route path="/pago" element={<MockPaymentPage />} />
<Route path="/admin/suscripciones" element={<AdminSubscriptionsPage />} />
```

## Configuración de MercadoPago (Producción)

### 1. Obtener credenciales
- Ir a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
- Crear aplicación
- Obtener `public_key` y `access_token` de producción

### 2. Configurar en app_settings
```sql
INSERT INTO app_settings (key, value, description)
VALUES (
  'mercadopago',
  '{
    "public_key": "APP_USR-xxxx",
    "access_token": "APP_USR-xxxx",
    "sandbox": false
  }',
  'Configuración de MercadoPago'
);
```

### 3. Crear Edge Function para pagos
Ver `EdgeFunctions/create-payment.md` para implementación.

## TODOs Pendientes

- [ ] Integrar MercadoPago SDK real
- [ ] Implementar webhooks de confirmación de pago
- [ ] Agregar sistema de facturas/comprobantes
- [ ] Emails automáticos de vencimiento
- [ ] Panel de facturas en admin
- [ ] Configuración de MercadoPago desde UI

## Notas Importantes

- **Período de gracia**: 3 días para todos los planes
- **Cálculo de renovaciones**: Se suma desde la fecha de vencimiento, no desde el pago
- **Precios**: Se almacenan en pesos sin decimales
- **Timezone**: America/Argentina/Buenos_Aires (UTC-3)
- **Mock Payment**: Usar solo en desarrollo, no conecta con MercadoPago real

## Última actualización

2025-01-04 - Creación completa del módulo con componentes de usuario y admin
