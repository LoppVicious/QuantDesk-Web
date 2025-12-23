// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // Necesario para Docker
    strictPort: true,
    port: 5173,
    watch: {
      usePolling: true, // CRÍTICO: Fuerza a Vite a detectar cambios en sistemas de archivos dockerizados
    }
  }
})