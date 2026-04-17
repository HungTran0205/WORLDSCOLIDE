import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_ROOT = path.resolve(__dirname, '../../public')

function scanGlbs(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.glb'))
    .map(f => '/' + path.relative(PUBLIC_ROOT, path.join(dir, f)).replace(/\\/g, '/'))
}

function scanImages(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|webp)$/i.test(f))
    .map(f => '/' + path.relative(PUBLIC_ROOT, path.join(dir, f)).replace(/\\/g, '/'))
}

function buildAssetManifest() {
  return {
    props3D: {
      cave: scanGlbs(path.join(PUBLIC_ROOT, 'arena/cave/3dprops/optimized')),
      forest: scanGlbs(path.join(PUBLIC_ROOT, 'arena/forest/3dprops/optimized')),
    },
    tiles: scanGlbs(path.join(PUBLIC_ROOT, 'tiles')),
    bgLayers: {
      cave: scanImages(path.join(PUBLIC_ROOT, 'arena/cave/bg')),
      forest: scanImages(path.join(PUBLIC_ROOT, 'arena/forest/bg')),
    },
    dioramas: [
      ...scanGlbs(path.join(PUBLIC_ROOT, 'arena/cave/3dtiles/optimized')),
      ...scanGlbs(path.join(PUBLIC_ROOT, 'arena/forest/3dtiles/optimized')),
    ],
  }
}

function gameAssetsPlugin(): Plugin {
  return {
    name: 'map-playground:game-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''

        if (url === '/api/asset-manifest') {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(JSON.stringify(buildAssetManifest()))
          return
        }

        if (url.startsWith('/game-assets/')) {
          const rel = decodeURIComponent(url.slice('/game-assets/'.length).split('?')[0])
          const full = path.normalize(path.join(PUBLIC_ROOT, rel))
          // Path traversal guard
          if (!full.startsWith(PUBLIC_ROOT + path.sep) && full !== PUBLIC_ROOT) {
            res.statusCode = 403
            res.end('forbidden')
            return
          }
          if (fs.existsSync(full) && fs.statSync(full).isFile()) {
            const ext = path.extname(full).toLowerCase()
            const ct = ext === '.glb' ? 'model/gltf-binary'
              : ext === '.png' ? 'image/png'
              : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
              : ext === '.webp' ? 'image/webp'
              : 'application/octet-stream'
            res.setHeader('Content-Type', ct)
            res.setHeader('Cache-Control', 'public, max-age=3600')
            fs.createReadStream(full).pipe(res)
            return
          }
          res.statusCode = 404
          res.end('not found')
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), gameAssetsPlugin()],
  publicDir: false,
  server: {
    port: 5175,
    fs: { allow: ['..', '../..'] },
  },
})
