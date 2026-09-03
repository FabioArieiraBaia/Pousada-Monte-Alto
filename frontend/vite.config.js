import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to redirect root / and /montealto (without slash) to /montealto/ in dev mode
const autoRedirectRoot = () => ({
  name: 'auto-redirect-root',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const rawUrl = req.url || '/'
      const [path, query] = rawUrl.split('?')
      const queryString = query ? `?${query}` : ''
      
      if (path === '/' || path === '' || path === '/montealto') {
        res.writeHead(302, { Location: `/montealto/${queryString}` })
        res.end()
        return
      }
      next()
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), autoRedirectRoot()],
  base: '/montealto/',
  server: {
    port: 5173,
    proxy: {
      '/montealto/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/montealto\/api/, ''),
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
