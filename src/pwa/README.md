# Módulo PWA

Componentes para Progressive Web App (instalación y actualizaciones).

## Estructura

```
src/pwa/
├── components/
│   ├── PWAInstallPrompt.jsx  # Prompt de instalación
│   └── PWAUpdatePrompt.jsx   # Notificación de actualizaciones
├── hooks/
│   └── (vacío por ahora)
├── services/
│   └── (vacío por ahora)
├── utils/
│   └── (vacío por ahora)
├── index.js
└── README.md
```

## Uso

Los componentes se agregan en App.jsx o Layout.jsx:

```jsx
import { PWAInstallPrompt, PWAUpdatePrompt } from './pwa'

function App() {
  return (
    <>
      <PWAUpdatePrompt />
      <PWAInstallPrompt />
      {/* resto de la app */}
    </>
  )
}
```

## Configuración

La configuración del Service Worker está en `vite.config.js` usando `vite-plugin-pwa`.

### Estrategias de cache:
- **NetworkOnly**: Supabase API (NUNCA se cachea)
- **CacheFirst**: Assets estáticos, fuentes
- **NetworkFirst**: Páginas HTML

### Importante:
- El SW NO cachea nada de Supabase para evitar problemas con autenticación
- registerType es 'prompt' para que el usuario decida cuándo actualizar
- En desarrollo el PWA está desactivado

## Testing

1. Hacer build: `npm run build`
2. Preview: `npm run preview`
3. Abrir en Chrome > DevTools > Application > Service Workers
4. Verificar que el SW esté registrado
5. En "Manifest" verificar que se detecte como instalable
