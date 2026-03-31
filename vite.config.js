import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** Dev / preview: GET /s/... → SPA (giống vercel.json rewrite). */
function sharePathSpaFallback() {
  const rewrite = (req, _res, next) => {
    const url = req.url ?? ''
    const pathname = url.split('?')[0] ?? ''
    if (pathname.startsWith('/s/') && pathname.length > 3) {
      req.url = '/' + (url.includes('?') ? `?${url.split('?').slice(1).join('?')}` : '')
    }
    next()
  }
  return {
    name: 'share-path-spa-fallback',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), sharePathSpaFallback()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
  },
})
