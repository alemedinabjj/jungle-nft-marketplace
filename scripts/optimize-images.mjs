// Generates responsive AVIF + WebP variants of the NFT artworks exported from Figma.
// Usage: node scripts/optimize-images.mjs
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SOURCE = 'design/art'
const OUTPUT = 'public/images/nfts'
const WIDTHS = [320, 640, 800]

await mkdir(OUTPUT, { recursive: true })
for (const file of await readdir(SOURCE)) {
  if (!file.endsWith('.png')) continue
  const key = path.basename(file, '.png')
  for (const width of WIDTHS) {
    const image = sharp(path.join(SOURCE, file)).resize(width, width)
    await image
      .clone()
      .avif({ quality: 50, effort: 6 })
      .toFile(path.join(OUTPUT, `${key}-${width}.avif`))
    await image
      .clone()
      .webp({ quality: 72 })
      .toFile(path.join(OUTPUT, `${key}-${width}.webp`))
  }
  console.log(`✓ ${key}`)
}
