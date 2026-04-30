import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Tiny .env.local loader for non-VITE_ vars (so the dev /api/comms handler
// can read ANTHROPIC_API_KEY without a separate dotenv dep).
function loadServerEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), 'utf8')
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (!m) continue
        const [, k, v] = m
        if (process.env[k]) continue
        process.env[k] = v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
      }
    } catch { /* file may not exist; that's fine */ }
  }
}

// Vite dev plugin: serves /api/comms by importing the Vercel-style handler.
function apiCommsDev() {
  return {
    name: 'moad-api-comms-dev',
    configureServer(server) {
      server.middlewares.use('/api/comms', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        let raw = ''
        for await (const chunk of req) raw += chunk
        let body = {}
        try { body = JSON.parse(raw || '{}') } catch {}
        const reqLike = { method: 'POST', body, headers: req.headers }
        const resLike = {
          statusCode: 200,
          setHeader(k, v) { res.setHeader(k, v) },
          end(s) { res.statusCode = this.statusCode; res.end(s) },
        }
        try {
          const mod = await server.ssrLoadModule('/api/comms.js')
          await mod.default(reqLike, resLike)
        } catch (err) {
          console.error('[dev /api/comms] failed', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

loadServerEnv()

export default defineConfig({
  plugins: [react(), apiCommsDev()],
  server: { host: true },
})
