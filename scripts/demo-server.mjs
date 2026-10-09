import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'

const files = new Map([
  ['/', ['../index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['../index.html', 'text/html; charset=utf-8']],
  ['/index.js', ['../index.js', 'text/javascript; charset=utf-8']],
  ['/src/EventBus.js', ['../src/EventBus.js', 'text/javascript; charset=utf-8']],
])

const host = '127.0.0.1'
const port = Number(process.env.PORT ?? 4173)
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new TypeError('PORT must be a valid TCP port')
}

const server = createServer(async (request, response) => {
  const path = new URL(request.url ?? '/', `http://${host}`).pathname
  const file = files.get(path)
  if (!file) {
    response.writeHead(404)
    response.end('Not found')
    return
  }

  try {
    const content = await readFile(new URL(file[0], import.meta.url))
    response.writeHead(200, {
      'Content-Type': file[1],
      'X-Content-Type-Options': 'nosniff',
    })
    response.end(content)
  } catch (error) {
    console.error('[EventBus] Failed to serve demo asset:', error)
    response.writeHead(500)
    response.end('Internal server error')
  }
})

server.listen(port, host, () => {
  const address = server.address()
  console.log(`EventBus demo: http://${host}:${address.port}/`)
})
