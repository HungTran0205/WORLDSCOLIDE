import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SPRITES_ROOT = path.resolve(__dirname, '../../public/sprites')
const CHARACTERS_DIR = path.join(SPRITES_ROOT, 'characters')
const ENEMIES_DIR = path.join(SPRITES_ROOT, 'enemies')

interface ManifestAnim {
  name: string
  directions: Record<string, string[]>
}
interface ManifestChar {
  id: string
  animations: ManifestAnim[]
}

function scanSpriteDir(baseDir: string, urlPrefix: string): ManifestChar[] {
  const entries: ManifestChar[] = []
  if (!fs.existsSync(baseDir)) return entries

  for (const id of fs.readdirSync(baseDir).sort()) {
    const entityDir = path.join(baseDir, id)
    if (!fs.statSync(entityDir).isDirectory()) continue
    const animsDir = path.join(entityDir, 'animations')
    if (!fs.existsSync(animsDir)) continue

    const animations: ManifestAnim[] = []
    for (const animName of fs.readdirSync(animsDir).sort()) {
      const animDir = path.join(animsDir, animName)
      if (!fs.statSync(animDir).isDirectory()) continue
      const directions: Record<string, string[]> = {}
      let hasFrames = false
      for (const dir of fs.readdirSync(animDir).sort()) {
        const dirPath = path.join(animDir, dir)
        if (!fs.statSync(dirPath).isDirectory()) continue
        const frames = fs.readdirSync(dirPath)
          .filter(f => /\.png$/i.test(f))
          .sort()
          .map(f => `/game-sprites/${urlPrefix}/${id}/animations/${animName}/${dir}/${f}`)
        if (frames.length > 0) {
          directions[dir] = frames
          hasFrames = true
        }
      }
      if (hasFrames) animations.push({ name: animName, directions })
    }
    if (animations.length > 0) entries.push({ id, animations })
  }
  return entries
}

function buildManifest() {
  return {
    characters: scanSpriteDir(CHARACTERS_DIR, 'characters'),
    enemies: scanSpriteDir(ENEMIES_DIR, 'enemies'),
  }
}

function gameSpritesPlugin(): Plugin {
  return {
    name: 'vfx-playground:game-sprites',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        if (url === '/api/sprite-manifest') {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(JSON.stringify(buildManifest()))
          return
        }
        if (url.startsWith('/game-sprites/')) {
          const rel = decodeURIComponent(url.slice('/game-sprites/'.length).split('?')[0])
          const full = path.normalize(path.join(SPRITES_ROOT, rel))
          if (!full.startsWith(SPRITES_ROOT)) {
            res.statusCode = 403
            res.end('forbidden')
            return
          }
          if (fs.existsSync(full) && fs.statSync(full).isFile()) {
            const ext = path.extname(full).toLowerCase()
            const ct = ext === '.png' ? 'image/png'
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
  plugins: [react(), gameSpritesPlugin()],
  server: {
    port: 5174,
    fs: {
      allow: ['..', '../..'],
    },
  },
})
