import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fijo en 5174 para que coincida siempre con el CORS de Backend/app/main.py,
    // sin depender de que V1 (puerto 5173) esté corriendo primero.
    port: 5174,
    strictPort: true,
  },
})
