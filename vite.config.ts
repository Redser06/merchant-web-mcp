import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  demoRequestPath,
  publishMerchantDemoHtml,
  readMerchantDemoHtml,
} from './scripts/merchantDemoHtml.ts'

function merchantDemoHtmlPlugin(): Plugin {
  let root = ''
  const attachDemo = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use((req, res, next) => {
      if (!demoRequestPath(req.url)) {
        next()
        return
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(readMerchantDemoHtml(root))
    })
  }

  return {
    name: 'merchant-demo-html',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      attachDemo(server)
    },
    configurePreviewServer(server) {
      attachDemo(server)
    },
    writeBundle(options) {
      if (!options.dir) return
      publishMerchantDemoHtml(options.dir, root)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    merchantDemoHtmlPlugin(),
  ],
  server: {
    port: 5178,
    strictPort: false,
    host: true,
  },
})
