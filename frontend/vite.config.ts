import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on the network too, so phones on the same Wi-Fi can join a game during development.
    host: true,
    proxy: {
      // ws: the game's WebSocket lives at /api/socket.io too.
      '/api': { target: 'http://localhost:3000', ws: true },
    },
  },
})
