import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { join } from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * Vite plugin that replaces __PLACEHOLDER__ tokens in public config files
 * served during dev with values from environment variables / .env files.
 */
function injectSecretsPlugin(): import('vite').Plugin {
  const SECRETS: Record<string, string> = {
    __WU_API_KEY__: 'wu_api_key',
  }

  const CONFIG_FILES = ['config.js', 'config.json', 'config_jsonp.js']

  return {
    name: 'inject-secrets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        const fileName = url?.replace(/^\//, '')
        if (!fileName || !CONFIG_FILES.includes(fileName)) {
          return next()
        }

        const filePath = join(server.config.publicDir, fileName)
        try {
          let content = readFileSync(filePath, 'utf-8')
          for (const [placeholder, envVar] of Object.entries(SECRETS)) {
            const value = process.env[envVar]
            if (value) {
              content = content.replaceAll(placeholder, value)
            }
          }
          const isJson = fileName.endsWith('.json')
          res.setHeader(
            'Content-Type',
            isJson ? 'application/json' : 'application/javascript'
          )
          res.end(content)
        } catch {
          next()
        }
      })
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), injectSecretsPlugin(), cloudflare()],
})