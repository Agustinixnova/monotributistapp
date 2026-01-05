# Mobile Readiness - Preparación para Capacitor

> Última actualización: Enero 2026
> Estado: En preparación para conversión a app nativa (2-3 meses)

---

## Checklist de Preparación

### Meta Tags y HTML
| Item | Estado | Notas |
|------|--------|-------|
| `viewport` con `viewport-fit=cover` | OK | Configurado en index.html |
| `apple-mobile-web-app-capable` | OK | Configurado |
| `apple-mobile-web-app-status-bar-style` | OK | Usando `default` |
| `theme-color` | OK | #7C3AED (violet-600) |
| `format-detection` telephone=no | OK | Evita autodetección de números |
| `lang="es"` en html | OK | Cambiado de "en" a "es" |

### Manifest (PWA)
| Item | Estado | Notas |
|------|--------|-------|
| manifest.json existe | OK | Creado en public/ |
| Nombre y short_name | OK | "Mimonotributo" |
| Icons declarados | OK | 8 tamaños (72-512px) |
| display: standalone | OK | |
| orientation: portrait | OK | |
| theme_color y background_color | OK | |

### Safe Areas (Notch/Home Indicator)
| Item | Estado | Notas |
|------|--------|-------|
| CSS con env(safe-area-inset-*) | OK | Agregado en index.css |
| Tailwind config con safe areas | OK | Clases pt-safe-top, pb-safe-bottom, etc. |
| Clases utilitarias .safe-area-* | OK | 7 clases disponibles |
| Layout principal usa safe areas | PENDIENTE | Revisar Layout.jsx, Sidebar.jsx, Header.jsx |

### Configuración Vite
| Item | Estado | Notas |
|------|--------|-------|
| server.host: true | OK | Para testing en red local |
| build.target: es2020 | OK | Compatibilidad móvil |
| sourcemap condicional | OK | Solo en desarrollo |
| base: './' comentado | OK | Descomentar para Capacitor build |

### Storage y APIs de Browser
| Item | Estado | Notas |
|------|--------|-------|
| localStorage/sessionStorage | OK | No se usa directamente (Supabase lo maneja) |
| window.location.reload() | REVISAR | Usado en SubscriptionGate.jsx |
| window.location.href | REVISAR | Usado en PlanSelector.jsx |
| window.open() | REVISAR | Usado para descargas de facturas |
| document.body.style | OK | Solo para overflow en modales |

### URLs y Variables de Entorno
| Item | Estado | Notas |
|------|--------|-------|
| Supabase URL en .env | OK | VITE_SUPABASE_URL |
| Supabase Key en .env | OK | VITE_SUPABASE_ANON_KEY |
| URL WhatsApp hardcodeada | REVISAR | `https://wa.me/` en ExpiringSubscriptions.jsx |
| No otras URLs hardcodeadas | OK | |

### Touch y UX Mobile
| Item | Estado | Notas |
|------|--------|-------|
| Touch targets 44px mínimo | REVISAR | Algunos botones podrían ser pequeños |
| Tailwind min-h-touch, min-w-touch | OK | Disponible para usar |
| No hover-only interactions | REVISAR | Verificar tooltips y dropdowns |
| -webkit-tap-highlight-color | OK | Configurado en index.css |
| overscroll-behavior: none | OK | Evita bounce en iOS |

### Navegación
| Item | Estado | Notas |
|------|--------|-------|
| React Router DOM | OK | Navegación SPA compatible |
| No history.pushState directo | OK | Usa useNavigate() |
| Sidebar responsive | OK | Drawer en mobile, fijo en desktop |

---

## Assets Gráficos Necesarios

### App Icons (Requeridos antes de Capacitor)

Crear archivo fuente de **1024x1024px** y generar estos tamaños:

#### Android (en `public/icons/`)
| Tamaño | Archivo | Uso |
|--------|---------|-----|
| 72x72 | icon-72x72.png | mdpi |
| 96x96 | icon-96x96.png | hdpi |
| 128x128 | icon-128x128.png | Play Store requirement |
| 144x144 | icon-144x144.png | xhdpi |
| 152x152 | icon-152x152.png | iPad |
| 192x192 | icon-192x192.png | xxhdpi, PWA |
| 384x384 | icon-384x384.png | xxxhdpi |
| 512x512 | icon-512x512.png | Play Store, PWA |

#### iOS (en `public/icons/`)
| Tamaño | Archivo | Uso |
|--------|---------|-----|
| 180x180 | apple-touch-icon-180x180.png | iPhone retina |
| 167x167 | apple-touch-icon-167x167.png | iPad Pro |
| 152x152 | apple-touch-icon-152x152.png | iPad retina |
| 120x120 | apple-touch-icon-120x120.png | iPhone |
| 1024x1024 | icon-1024x1024.png | App Store |

### Splash Screens (Requeridos para iOS)

Crear en `public/splash/`:

| Dispositivo | Tamaño | Archivo |
|-------------|--------|---------|
| iPhone 14 Pro Max | 1290x2796 | splash-1290x2796.png |
| iPhone 14 Pro | 1179x2556 | splash-1179x2556.png |
| iPhone 14, 13, 12 | 1170x2532 | splash-1170x2532.png |
| iPhone 14 Plus, 13/12 Pro Max | 1284x2778 | splash-1284x2778.png |
| iPhone SE 3rd gen, 8, 7 | 750x1334 | splash-750x1334.png |
| iPhone 8 Plus, 7 Plus | 1242x2208 | splash-1242x2208.png |
| iPad Pro 12.9" | 2048x2732 | splash-2048x2732.png |
| iPad Pro 11" | 1668x2388 | splash-1668x2388.png |
| iPad 10.2" | 1620x2160 | splash-1620x2160.png |

**Recomendación:** Usar herramienta como [capacitor-assets](https://github.com/ionic-team/capacitor-assets) para generar automáticamente.

### Android Adaptive Icons

Para Android 8+, crear:
- `icon-foreground.png` (1024x1024) - Icono sin fondo
- `icon-background.png` (1024x1024) - Fondo sólido o gradiente

---

## Pendientes Antes de Capacitor

### Críticos (Bloquean instalación)
1. [ ] Crear carpeta `public/icons/` con todos los iconos
2. [ ] Crear carpeta `public/splash/` con splash screens
3. [ ] Reemplazar `vite.svg` por icono real de la app

### Importantes (Afectan UX)
4. [ ] Revisar `window.open()` - usar Capacitor Browser plugin
5. [ ] Revisar `window.location` - puede necesitar manejo especial
6. [ ] Auditar touch targets en botones pequeños (especialmente iconos)
7. [ ] Verificar que tooltips/dropdowns funcionen con touch

### Recomendados (Mejoran experiencia)
8. [ ] Agregar `pt-safe-top` al Header.jsx
9. [ ] Agregar `pb-safe-bottom` al Sidebar.jsx (sección usuario)
10. [ ] Considerar haptic feedback con Capacitor Haptics
11. [ ] Implementar deep linking si se necesita

---

## Comandos Capacitor (Futuro)

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init Mimonotributo com.tudominio.mimonotributo

# Agregar plataformas
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Build y sincronizar
npm run build
npx cap sync

# Abrir en IDE nativo
npx cap open android  # Android Studio
npx cap open ios      # Xcode

# Plugins útiles
npm install @capacitor/browser      # Para window.open
npm install @capacitor/haptics      # Vibraciones
npm install @capacitor/status-bar   # Control de status bar
npm install @capacitor/splash-screen # Control de splash
npm install @capacitor/keyboard     # Manejo de teclado
```

---

## Notas Adicionales

### Supabase en Capacitor
- El cliente de Supabase funciona en Capacitor sin cambios
- La autenticación persiste usando el storage interno
- No se necesitan cambios en la configuración actual

### Testing en Dispositivos
1. `npm run dev` con `--host` (ya configurado)
2. Conectar dispositivo a la misma red WiFi
3. Abrir `http://[IP-LOCAL]:5173` en el dispositivo
4. Usar Chrome DevTools remote debugging para Android

### Consideraciones de Performance
- El bundle actual (~689KB) debería dividirse con code splitting
- Considerar lazy loading de rutas/módulos
- Las imágenes deberían optimizarse para mobile
