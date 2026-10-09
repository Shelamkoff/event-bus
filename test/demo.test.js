import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

// The demo must be runnable from a standalone checkout, with no parent workspace.
test('demo serves its own HTML and ESM sources without exposing other files', { timeout: 10000 }, async t => {
  const server = spawn(process.execPath, ['scripts/demo-server.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(() => server.kill())

  const origin = await new Promise((resolve, reject) => {
    let output = ''
    const timeout = setTimeout(() => reject(new Error('Demo did not start')), 5000)
    const cleanup = () => clearTimeout(timeout)
    server.once('error', error => { cleanup(); reject(error) })
    server.once('exit', code => { cleanup(); reject(new Error(`Demo exited early: ${code}`)) })
    server.stdout.on('data', chunk => {
      output += chunk.toString()
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//)
      if (match) { cleanup(); resolve(match[0]) }
    })
  })

  for (const [path, expected] of [
    ['/', '<title>EventBus demo</title>'],
    ['/index.html', '<title>EventBus demo</title>'],
    ['/index.js', 'export { EventBus }'],
    ['/src/EventBus.js', 'export class EventBus'],
  ]) {
    const response = await fetch(new URL(path, origin))
    assert.equal(response.status, 200, path)
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.match(await response.text(), new RegExp(expected.replace(/[{}]/g, '\\$&')))
  }

  for (const path of ['/demo.html', '/package.json', '/src/EventBus.d.ts', '/.git/config']) {
    const response = await fetch(new URL(path, origin))
    assert.equal(response.status, 404, path)
  }
})
