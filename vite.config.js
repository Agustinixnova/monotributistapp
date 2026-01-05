import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Configuración para Capacitor
  build: {
    // Genera sourcemaps para debugging en dispositivos
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimizaciones para mobile
    target: 'es2020',
    // Chunk size warnings (mobile networks)
    chunkSizeWarningLimit: 500,
  },

  // Base URL - Capacitor necesita rutas relativas
  // En producción para Capacitor, cambiar a './'
  // base: './',

  server: {
    // Para desarrollo con dispositivos físicos en la misma red
    host: true,
    port: 5173,
  },

  // Resolve aliases para imports más limpios
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
