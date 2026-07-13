import { cp, mkdir, rm } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const dist = new URL('../dist/', import.meta.url)

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })
await cp(new URL('index.js', root), new URL('index.js', dist))
await cp(new URL('index.d.ts', root), new URL('index.d.ts', dist))
await cp(new URL('src/', root), new URL('src/', dist), { recursive: true })
