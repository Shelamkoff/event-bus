# @shelamkoff/event-bus

Synchronous, dependency-free event dispatch for browser and Node.js libraries. Handlers run in registration order. A thrown error or rejected Promise from one handler is reported to `console.error` and does not stop the remaining handlers.

## Install

```bash
npm install @shelamkoff/event-bus
```

## Usage

```ts
import { EventBus } from '@shelamkoff/event-bus'

interface Events {
  ready: [id: string]
  close: []
}

const events = new EventBus<Events>()
const unsubscribe = events.on('ready', id => console.log(id))
events.once('close', () => console.log('closed'))

events.emit('ready', 'document-1')
unsubscribe()
events.clear()
```

`emit()` uses a stable snapshot: adding or removing listeners during dispatch affects the next emission, not the one already in progress. `once()` removes its listener before invoking it, so recursive emissions remain single-shot.

## API

- `on(event, handler)` and `once(event, handler)` return idempotent unsubscribe functions.
- `off(event, handler)` removes one handler.
- `emit(event, ...args)` dispatches synchronously.
- `clear(event?)` clears one event or the complete bus.
- `has(event)` reports whether an event has listeners.
- `new EventBus({ debug: true })` logs emissions.

The current package version is `1.0.0`. It is distributed as ESM under the MIT License. Its package manifest declares Node.js 20 or newer for Node consumers; browser consumers use the ESM entry through their bundler.
