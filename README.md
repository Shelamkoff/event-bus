# EventBus

Lightweight, zero-dependency event bus for JavaScript and TypeScript.

## Installation

```bash
npm install event-bus
```

## Usage

```js
import { EventBus } from 'event-bus'

const bus = new EventBus()

// Subscribe
const unsubscribe = bus.on('user:login', (user) => {
    console.log(`${user.name} logged in`)
})

// Emit (supports multiple arguments)
bus.emit('user:login', { name: 'Martin' })

// Unsubscribe
unsubscribe()
```

### One-time listener

```js
bus.once('init', (config) => {
    console.log('Runs once, then auto-removes')
})
```

### Debug mode

```js
const bus = new EventBus({ debug: true })

bus.emit('test', 42)
// [EventBus] emit: test 42
```

## TypeScript

The bus accepts an optional generic for typed events:

```ts
type Events = {
    'user:login': [id: string, role: string]
    'user:logout': []
    'error': [error: Error]
}

const bus = new EventBus<Events>()

bus.on('user:login', (id, role) => {
    // id: string, role: string
})

bus.emit('user:login', '42', 'admin') // ✓
bus.emit('user:login', 42)            // ✗ type error
```

Without a generic, all events and arguments are untyped (`any`).

## API

| Method | Description |
|---|---|
| `on(event, handler)` | Subscribe. Returns an unsubscribe function. |
| `off(event, handler)` | Unsubscribe a specific handler. |
| `once(event, handler)` | Subscribe once. Auto-removes after first call. |
| `emit(event, ...args)` | Emit an event with optional arguments. |
| `clear(event?)` | Remove all listeners, or only for a specific event. |
| `has(event)` | Check if an event has any listeners. |

### Error handling

Handler exceptions are caught and logged via `console.error`. They do not break other handlers or the emit loop.

```js
bus.on('test', () => { throw new Error('boom') })
bus.on('test', () => console.log('still runs'))

bus.emit('test')
// [EventBus] Error in handler for "test": Error: boom
// still runs
```

## Tests

```bash
node --test
```

## License

[MIT](LICENSE)
